/**
 * Distributor Detection Service
 *
 * Identifies which distributor issued an invoice by scanning the OCR text
 * for known patterns. This determines whether we can use template parsing
 * (Tier 1) or need LLM extraction (Tier 3).
 *
 * Detection strategy (in order):
 *   1. Check detection_patterns from the distributors table (exact/regex matches)
 *   2. Fall back to built-in heuristics for major US distributors
 *   3. If no match, return null — triggers LLM extraction path
 *
 * The heuristics handle the messiness of real invoices:
 *   - Distributor names appear in headers, footers, or watermarks
 *   - Regional branches use variations ("Southern Glazer's of Texas")
 *   - Parent companies and subsidiaries ("Breakthru Beverage" ↔ "Wirtz Beverage")
 *   - OCR errors mangle names ("S0uthern" instead of "Southern")
 */

import { supabase } from '@/src/lib/supabase';
import type { Distributor } from '@/src/types/invoice-models';

// ==========================================
// TYPES
// ==========================================

export interface DetectionResult {
  distributor: Distributor | null;
  /** How the distributor was identified */
  method: 'db_pattern' | 'heuristic' | null;
  /** The text fragment that triggered the match */
  matchedText: string | null;
  /** Confidence 0–1 */
  confidence: number;
}

// ==========================================
// BUILT-IN DISTRIBUTOR PATTERNS
// ==========================================

/**
 * Major US alcohol distributors and their common invoice text patterns.
 * These serve as fallback when no DB patterns are configured.
 *
 * Each entry has:
 *   - canonical name (how we store it in our DB)
 *   - patterns: strings/regex that appear on their invoices
 *   - aliases: subsidiary/regional names
 */
const KNOWN_DISTRIBUTORS: {
  name: string;
  type: string;
  patterns: (string | RegExp)[];
}[] = [
  {
    name: "Southern Glazer's Wine & Spirits",
    type: 'spirits',
    patterns: [
      'southern glazer',
      "southern glazer's",
      'sgws',
      'sg wines',
      'sg spirits',
      'southern wine',
      'southern wine & spirits',
      'southern wine and spirits',
      // OCR-mangled variants
      /s[o0]uthern\s+glaz/i,
      /sgw\s*[&s]/i,
    ],
  },
  {
    name: 'Republic National Distributing Company',
    type: 'spirits',
    patterns: [
      'republic national',
      'rndc',
      'republic distribut',
      'young\'s market',  // subsidiary
      'youngs market',
      /republic\s+nat/i,
    ],
  },
  {
    name: 'Breakthru Beverage',
    type: 'spirits',
    patterns: [
      'breakthru beverage',
      'breakthru bev',
      'wirtz beverage',  // former name
      'charmer sunbelt',  // former name
      /break\s*thru/i,
    ],
  },
  {
    name: 'Sysco',
    type: 'broadline',
    patterns: [
      'sysco',
      'sysco corporation',
      'sysco corp',
      /sysc[o0]\b/i,
    ],
  },
  {
    name: 'US Foods',
    type: 'broadline',
    patterns: [
      'us foods',
      'usfoods',
      'u.s. foods',
      'us foodservice',
    ],
  },
  {
    name: 'Ben E. Keith',
    type: 'broadline',
    patterns: [
      'ben e. keith',
      'ben e keith',
      'ben keith',
      /ben\s+e\.?\s*keith/i,
    ],
  },
  {
    name: 'Johnson Brothers',
    type: 'spirits',
    patterns: [
      'johnson brothers',
      'johnson bros',
      /johnson\s+bro/i,
    ],
  },
  {
    name: 'Heidelberg Distributing',
    type: 'beer',
    patterns: [
      'heidelberg distribut',
      'heidelberg dist',
    ],
  },
  {
    name: 'Reyes Beverage Group',
    type: 'beer',
    patterns: [
      'reyes beverage',
      'reyes beer',
      'reyes holdings',
    ],
  },
  {
    name: 'Andrews Distributing',
    type: 'beer',
    patterns: [
      'andrews distribut',
      'andrews dist',
    ],
  },
];

// ==========================================
// MAIN DETECTION
// ==========================================

/**
 * Detect which distributor issued the invoice from OCR text.
 *
 * Scans the first ~2000 chars (header area) and last ~1000 chars
 * (footer area) where distributor info typically appears.
 */
export async function detectDistributor(
  ocrText: string,
): Promise<DetectionResult> {
  // Focus on header and footer regions where distributor info lives
  const headerText = ocrText.slice(0, 2000);
  const footerText = ocrText.slice(-1000);
  const searchText = `${headerText}\n${footerText}`.toLowerCase();

  // Step 1: Check DB patterns first (user/admin-configured)
  const dbResult = await matchDbPatterns(searchText);
  if (dbResult) return dbResult;

  // Step 2: Built-in heuristics
  const heuristicResult = await matchHeuristics(searchText);
  if (heuristicResult) return heuristicResult;

  // Step 3: No match
  return {
    distributor: null,
    method: null,
    matchedText: null,
    confidence: 0,
  };
}

// ==========================================
// DB PATTERN MATCHING
// ==========================================

async function matchDbPatterns(
  searchText: string,
): Promise<DetectionResult | null> {
  const { data: distributors } = await supabase
    .from('distributors')
    .select('id, name, type, regions, detection_patterns, created_at');

  if (!distributors) return null;

  for (const dist of distributors) {
    const patterns = dist.detection_patterns as string[] | null;
    if (!patterns || patterns.length === 0) continue;

    for (const pattern of patterns) {
      // Try as regex first (patterns stored as "/pattern/flags")
      if (pattern.startsWith('/')) {
        const match = parseRegexPattern(pattern);
        if (match) {
          const regexResult = searchText.match(match);
          if (regexResult) {
            return {
              distributor: rowToDistributor(dist),
              method: 'db_pattern',
              matchedText: regexResult[0],
              confidence: 0.95,
            };
          }
        }
      }

      // Plain string match
      if (searchText.includes(pattern.toLowerCase())) {
        return {
          distributor: rowToDistributor(dist),
          method: 'db_pattern',
          matchedText: pattern,
          confidence: 0.95,
        };
      }
    }
  }

  return null;
}

// ==========================================
// HEURISTIC MATCHING
// ==========================================

async function matchHeuristics(
  searchText: string,
): Promise<DetectionResult | null> {
  for (const known of KNOWN_DISTRIBUTORS) {
    for (const pattern of known.patterns) {
      let matched: string | null = null;

      if (typeof pattern === 'string') {
        if (searchText.includes(pattern.toLowerCase())) {
          matched = pattern;
        }
      } else {
        // RegExp pattern
        const result = searchText.match(pattern);
        if (result) {
          matched = result[0];
        }
      }

      if (matched) {
        // Found a heuristic match — look up or create in DB
        const distributor = await findOrCreateDistributor(known.name, known.type);
        return {
          distributor,
          method: 'heuristic',
          matchedText: matched,
          confidence: 0.85,
        };
      }
    }
  }

  return null;
}

// ==========================================
// HELPERS
// ==========================================

/**
 * Find an existing distributor by name, or create a new one.
 * This ensures heuristic matches get persisted for future DB-pattern lookups.
 */
async function findOrCreateDistributor(
  name: string,
  type: string,
): Promise<Distributor> {
  // Case-insensitive search
  const { data: existing } = await supabase
    .from('distributors')
    .select('id, name, type, regions, detection_patterns, created_at')
    .ilike('name', name)
    .maybeSingle();

  if (existing) return rowToDistributor(existing);

  // Create new distributor entry
  const { data: created, error } = await supabase
    .from('distributors')
    .insert({ name, type })
    .select('id, name, type, regions, detection_patterns, created_at')
    .single();

  if (error) {
    // RLS may block insert (global table). Return a partial object.
    return {
      id: '',
      name,
      type,
      createdAt: new Date(),
    };
  }

  return rowToDistributor(created);
}

function rowToDistributor(row: any): Distributor {
  return {
    id: row.id,
    name: row.name,
    type: row.type ?? undefined,
    regions: row.regions ?? undefined,
    detectionPatterns: row.detection_patterns ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Parse a stored regex string like "/pattern/i" into a RegExp.
 */
function parseRegexPattern(str: string): RegExp | null {
  const match = str.match(/^\/(.+)\/([gimsuy]*)$/);
  if (!match) return null;
  try {
    return new RegExp(match[1], match[2]);
  } catch {
    return null;
  }
}
