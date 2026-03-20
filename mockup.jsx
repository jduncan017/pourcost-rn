import { useState } from "react";

// PourCost actual brand palette — raw tokens
const colors = {
  p1: '#3262C2', p2: '#2C3E63', p3: '#1D273C', p4: '#041021',
  n1: '#FFFFFF', n2: '#FCF9ED', n3: '#ECE7D1', n4: '#CEC59D',
  g1: '#EEEEEE', g2: '#AFAFAF', g3: '#585858', g4: '#111111',
  s11: '#FBE09D', s12: '#DCB962', s13: '#AF8827', s14: '#694920',
  s21: '#51CCAE', s22: '#439883', s23: '#286052', s24: '#062920',
  s31: '#7663E7', s32: '#594DA5', s33: '#382E78', s34: '#251C5F',
  e1: '#D63663', e2: '#B0244B', e3: '#780A29', e4: '#4C0015',
};

/*
 * DESIGN DECISIONS (for Claude Code reference):
 *
 * 1. GOLD SEPARATION: s12 is ONLY for brand/UI chrome (logo, section headers, premium moments).
 *    Warnings use s11 (lighter yellow) so "brand gold" and "caution" are visually distinct.
 *
 * 2. TEXT CONTRAST: Secondary text bumped from n4 → n3 (#ECE7D1) for better readability
 *    on dark navy. n4 is now reserved for truly de-emphasized metadata (timestamps, counts).
 *    n3 on p3 gives ~6.5:1 contrast (comfortably above WCAG AA 4.5:1).
 *
 * 3. PURPLE = AI (SUPPORTIVE ONLY): s31 purple marks AI-generated content, but it is a
 *    SUPPORTIVE color — never used as foreground text on dark navy (poor contrast).
 *    Instead, purple appears as:
 *      - Solid badge backgrounds with white/cream text on top
 *      - Subtle background tints on cards with cream text
 *      - Thin left-border accents on suggestion cards
 *    Text on AI-tinted surfaces always uses n2/n3 (cream), never purple.
 *
 * 4. TAB BAR: Active state uses filled dot indicator below icon (not just color change)
 *    for accessibility with color-blind users.
 *
 * 5. GREEN = GO: Teal/green (s21) is the "positive action" color for CTAs like
 *    Upgrade Plan, Confirm Matches, Save, Proceed. Separates "do this" from
 *    "brand moment" (gold) and "navigate" (blue).
 */

const theme = {
  bg: {
    base: colors.p4,       // #041021 — deepest navy
    surface: colors.p3,    // #1D273C — card backgrounds
    elevated: colors.p2,   // #2C3E63 — modals, sheets, nested elements
    overlay: '#344B74',    // slightly lighter for hover/press states
  },
  text: {
    primary: colors.n2,    // #FCF9ED — warm white (headings, key data)
    secondary: colors.n3,  // #ECE7D1 — readable cream (labels, descriptions) [CHANGED from n4]
    tertiary: colors.g2,   // #AFAFAF — de-emphasized (timestamps, metadata)
    muted: colors.n4,      // #CEC59D — very subtle (placeholder text, disabled) [NEW tier]
    inverse: colors.p4,    // #041021 — text on light backgrounds
  },
  accent: {
    primary: colors.p1,              // #3262C2 — blue CTA buttons
    primaryHover: '#3D72D4',
    gold: colors.s12,                // #DCB962 — brand gold ONLY (not for warnings)
    goldLight: colors.s11,           // #FBE09D
    goldSubtle: 'rgba(220, 185, 98, 0.12)',
    blueSubtle: 'rgba(50, 98, 194, 0.15)',
    ai: colors.s31,                  // #7663E7 — AI badge bg, borders, dots (NEVER as text on dark bg)
    aiSubtle: 'rgba(118, 99, 231, 0.12)', // AI tint for card backgrounds
    go: colors.s21,                  // #51CCAE — positive CTAs: upgrade, confirm, save [NEW]
    goHover: '#5ED9BA',              // [NEW]
    goSubtle: 'rgba(81, 204, 174, 0.12)', // [NEW]
  },
  semantic: {
    success: colors.s21,             // #51CCAE — teal (healthy margins)
    successSubtle: 'rgba(81, 204, 174, 0.10)',
    warning: colors.s11,             // #FBE09D — light yellow [CHANGED from s12]
    warningSubtle: 'rgba(251, 224, 157, 0.10)',
    danger: colors.e1,               // #D63663 — pink/red (losses, errors)
    dangerSubtle: 'rgba(214, 54, 99, 0.10)',
    info: colors.s31,                // #7663E7 — purple (also AI context)
    infoSubtle: 'rgba(118, 99, 231, 0.08)',
  },
  border: {
    subtle: 'rgba(255, 255, 255, 0.06)',
    default: 'rgba(255, 255, 255, 0.10)',
    strong: 'rgba(255, 255, 255, 0.18)',
  },
};

const spacing = { xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, '2xl': 32, '3xl': 40, '4xl': 48 };

// ─── Utility Components ───

function ColorSwatch({ color, name, value, annotation }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: color, border: `1px solid ${theme.border.default}`, flexShrink: 0 }} />
      <div>
        <div style={{ color: theme.text.primary, fontSize: 14, fontWeight: 600 }}>{name}</div>
        <div style={{ color: theme.text.tertiary, fontSize: 12, fontFamily: 'monospace' }}>{value}</div>
        {annotation && <div style={{ color: theme.accent.gold, fontSize: 11, fontWeight: 500, marginTop: 2 }}>{annotation}</div>}
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: theme.accent.gold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16, marginTop: 32 }}>
      {children}
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      backgroundColor: theme.bg.surface,
      borderRadius: 16,
      padding: spacing.xl,
      border: `1px solid ${theme.border.subtle}`,
      boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
      ...style,
    }}>
      {children}
    </div>
  );
}

function DesignNote({ children }) {
  return (
    <div style={{
      backgroundColor: theme.accent.aiSubtle,
      borderLeft: `3px solid ${theme.accent.ai}`,
      borderRadius: '0 10px 10px 0',
      padding: '12px 16px',
      marginBottom: 16,
      fontSize: 13,
      color: theme.text.secondary,
      lineHeight: 1.5,
    }}>
      <span style={{ color: theme.text.primary, fontWeight: 600, marginRight: 6 }}>Design note:</span>
      {children}
    </div>
  );
}

function Button({ variant = 'primary', children, style = {} }) {
  const [hovered, setHovered] = useState(false);
  const styles = {
    primary: {
      backgroundColor: hovered ? theme.accent.primaryHover : theme.accent.primary,
      color: colors.n1,
      border: 'none',
    },
    gold: {
      backgroundColor: hovered ? theme.accent.goldLight : theme.accent.gold,
      color: theme.text.inverse,
      border: 'none',
    },
    secondary: {
      backgroundColor: 'transparent',
      color: theme.text.primary,
      border: `1.5px solid ${theme.border.strong}`,
    },
    destructive: {
      backgroundColor: theme.semantic.dangerSubtle,
      color: theme.semantic.danger,
      border: 'none',
    },
    ghost: {
      backgroundColor: hovered ? theme.bg.overlay : 'transparent',
      color: theme.text.secondary,
      border: 'none',
    },
    ai: {
      backgroundColor: hovered ? 'rgba(118, 99, 231, 0.20)' : theme.accent.aiSubtle,
      color: theme.text.primary,
      border: `1.5px solid rgba(118, 99, 231, 0.4)`,
    },
    go: {
      backgroundColor: hovered ? theme.accent.goHover : theme.accent.go,
      color: theme.text.inverse,
      border: 'none',
    },
  };
  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 12,
        padding: '14px 24px',
        fontSize: 15,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        ...styles[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function PourCostBadge({ value, label }) {
  const pct = parseFloat(value);
  const color = pct < 20 ? theme.semantic.success : pct < 28 ? theme.semantic.warning : theme.semantic.danger;
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: theme.text.tertiary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}%</div>
    </div>
  );
}

function IngredientRow({ name, category, cost, size, isLast }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '14px 0',
      borderBottom: isLast ? 'none' : `1px solid ${theme.border.subtle}`,
    }}>
      <div>
        <div style={{ color: theme.text.primary, fontSize: 16, fontWeight: 600 }}>{name}</div>
        <div style={{ color: theme.text.tertiary, fontSize: 13, marginTop: 2 }}>{category}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ color: theme.text.primary, fontSize: 16, fontWeight: 700 }}>${cost}</div>
        <div style={{ color: theme.text.tertiary, fontSize: 13, marginTop: 2 }}>{size}</div>
      </div>
    </div>
  );
}

function RecipeIngredient({ name, pourSize, costPerOz, total, pct }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${theme.border.subtle}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ color: theme.text.primary, fontSize: 14, fontWeight: 500 }}>{name}</div>
      </div>
      <div style={{ color: theme.text.secondary, fontSize: 13, width: 50, textAlign: 'right' }}>{pourSize}</div>
      <div style={{ color: theme.text.secondary, fontSize: 13, width: 65, textAlign: 'right' }}>${costPerOz}/oz</div>
      <div style={{ color: theme.text.primary, fontSize: 14, fontWeight: 600, width: 55, textAlign: 'right' }}>${total}</div>
      <div style={{
        backgroundColor: theme.accent.blueSubtle,
        borderRadius: 6,
        padding: '2px 8px',
        fontSize: 12,
        fontWeight: 600,
        color: theme.accent.primary,
        width: 45,
        textAlign: 'center',
      }}>{pct}%</div>
    </div>
  );
}

function CostBar({ segments }) {
  return (
    <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
      {segments.map((seg, i) => (
        <div key={i} style={{ flex: seg.pct, backgroundColor: seg.color, borderRadius: 4 }} />
      ))}
    </div>
  );
}

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{
      backgroundColor: theme.bg.surface,
      borderRadius: 14,
      padding: '18px 20px',
      border: `1px solid ${theme.border.subtle}`,
      flex: 1,
      minWidth: 120,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: theme.text.tertiary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: color || theme.text.primary }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: theme.text.tertiary, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function AlertRow({ icon, text, type }) {
  const alertColors = {
    warning: { fg: theme.semantic.warning, bg: theme.semantic.warningSubtle },
    danger: { fg: theme.semantic.danger, bg: theme.semantic.dangerSubtle },
    info: { fg: theme.semantic.info, bg: theme.semantic.infoSubtle },
    ai: { fg: theme.accent.ai, bg: theme.accent.aiSubtle },
  };
  const c = alertColors[type];
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 16px',
      borderRadius: 12,
      backgroundColor: c.bg,
      marginBottom: 8,
    }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ color: type === 'ai' ? theme.text.secondary : c.fg, fontSize: 14, fontWeight: 500, flex: 1 }}>{text}</span>
      <span style={{ color: theme.text.tertiary, fontSize: 18 }}>›</span>
    </div>
  );
}

function AiBadge({ label }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.accent.ai,
      color: colors.n1,
      fontSize: 10,
      fontWeight: 700,
      padding: '3px 8px',
      borderRadius: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    }}>
      <span style={{ fontSize: 11 }}>✦</span> {label || 'AI'}
    </span>
  );
}

function InvoiceItem({ name, qty, size, price, match, confidence }) {
  const confMap = {
    high: { color: theme.semantic.success, bg: theme.semantic.successSubtle, label: 'HIGH' },
    medium: { color: theme.semantic.warning, bg: theme.semantic.warningSubtle, label: 'MEDIUM' },
    low: { color: theme.semantic.danger, bg: theme.semantic.dangerSubtle, label: 'LOW' },
  };
  const c = confMap[confidence];
  return (
    <div style={{
      backgroundColor: theme.bg.elevated,
      borderRadius: 14,
      padding: 16,
      marginBottom: 10,
      border: `1px solid ${theme.border.subtle}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ color: theme.text.primary, fontSize: 15, fontWeight: 600 }}>{name}</div>
        <div style={{ color: theme.text.primary, fontSize: 15, fontWeight: 700 }}>${price}</div>
      </div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
        <span style={{ color: theme.text.tertiary, fontSize: 13 }}>Qty: {qty}</span>
        <span style={{ color: theme.text.tertiary, fontSize: 13 }}>{size}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AiBadge label="Match" />
          <span style={{ fontSize: 13, fontWeight: 600, color: match === 'No match' ? theme.text.tertiary : theme.text.primary }}>{match}</span>
        </div>
        <div style={{
          backgroundColor: c.bg,
          color: c.color,
          fontSize: 11,
          fontWeight: 700,
          padding: '4px 10px',
          borderRadius: 8,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>
          {c.label}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, description, cta }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: theme.text.primary, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 14, color: theme.text.secondary, marginBottom: 24, maxWidth: 280, margin: '0 auto 24px' }}>{description}</div>
      <Button>{cta}</Button>
    </div>
  );
}

function TabBar({ active, setActive }) {
  const tabs = [
    { id: 'dashboard', icon: '◫', label: 'Dashboard' },
    { id: 'inventory', icon: '☰', label: 'Inventory' },
    { id: 'recipes', icon: '◉', label: 'Recipes' },
    { id: 'scanner', icon: '⎔', label: 'Scanner' },
    { id: 'more', icon: '⋯', label: 'More' },
  ];
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-around',
      padding: '8px 0 18px',
      background: `linear-gradient(180deg, rgba(29,39,60,0.85) 0%, rgba(4,16,33,0.95) 100%)`,
      backdropFilter: 'blur(20px)',
      borderTop: `1px solid ${theme.border.subtle}`,
    }}>
      {tabs.map(tab => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '4px 12px',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: 20, color: isActive ? theme.accent.primary : theme.text.tertiary }}>{tab.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: isActive ? theme.accent.primary : theme.text.tertiary }}>{tab.label}</span>
            {/* Active indicator dot — accessible state beyond color */}
            <div style={{
              width: 5,
              height: 5,
              borderRadius: 3,
              backgroundColor: isActive ? theme.accent.primary : 'transparent',
              marginTop: 1,
              transition: 'all 0.2s',
            }} />
          </button>
        );
      })}
    </div>
  );
}

function PhoneFrame({ children, title }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {title && <div style={{ fontSize: 13, fontWeight: 600, color: theme.accent.gold, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</div>}
      <div style={{
        width: 375,
        height: 740,
        borderRadius: 40,
        border: `2px solid ${theme.border.default}`,
        backgroundColor: theme.bg.base,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        position: 'relative',
      }}>
        <div style={{
          height: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}>
          <div style={{ width: 120, height: 28, borderRadius: 14, backgroundColor: theme.bg.base, position: 'absolute', top: 0 }} />
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function PaletteGroup({ title, swatches }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: theme.text.primary, marginBottom: 10 }}>{title}</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {swatches.map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              backgroundColor: s.color,
              border: `1px solid ${theme.border.default}`,
              marginBottom: 6,
            }} />
            <div style={{ fontSize: 10, color: theme.text.tertiary, fontFamily: 'monospace' }}>{s.label}</div>
            <div style={{ fontSize: 9, color: theme.text.tertiary, fontFamily: 'monospace', opacity: 0.7 }}>{s.color}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AI Feature Preview Components ───

function AiSuggestionCard({ title, description, action }) {
  return (
    <div style={{
      backgroundColor: theme.accent.aiSubtle,
      borderRadius: 14,
      padding: 16,
      borderLeft: `3px solid ${theme.accent.ai}`,
      marginBottom: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <AiBadge label="Suggestion" />
        <span style={{ fontSize: 14, fontWeight: 600, color: theme.text.primary }}>{title}</span>
      </div>
      <div style={{ fontSize: 13, color: theme.text.secondary, marginBottom: 12, lineHeight: 1.4 }}>{description}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="ai" style={{ padding: '8px 14px', fontSize: 12 }}>{action}</Button>
        <Button variant="ghost" style={{ padding: '8px 14px', fontSize: 12 }}>Dismiss</Button>
      </div>
    </div>
  );
}

function AiMenuReviewCard() {
  return (
    <div style={{
      backgroundColor: theme.accent.aiSubtle,
      borderRadius: 16,
      padding: 20,
      borderLeft: `3px solid ${theme.accent.ai}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <AiBadge label="AI Review" />
        <span style={{ fontSize: 16, fontWeight: 600, color: theme.text.primary }}>Menu Analysis Complete</span>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: theme.text.secondary }}>Average Menu Pour Cost</span>
          <span style={{ fontSize: 12, color: theme.semantic.success, fontWeight: 600 }}>19.5% / 18% target</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, backgroundColor: theme.bg.elevated, overflow: 'hidden' }}>
          <div style={{ width: '72%', height: '100%', borderRadius: 4, background: `linear-gradient(90deg, ${theme.semantic.success}, ${colors.s22})` }} />
        </div>
      </div>

      {[
        { text: '3 cocktails exceed target pour cost', color: theme.semantic.danger },
        { text: 'No gin cocktails offered', color: theme.semantic.warning },
        { text: 'Whiskey accounts for 40% of cocktails', color: theme.semantic.warning },
        { text: 'Missing: zero-proof cocktails', color: theme.accent.ai },
        { text: 'Missing: low-ABV cocktails', color: theme.accent.ai },
      ].map((item, i) => (
        <div key={i} style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 0',
          borderBottom: i < 4 ? `1px solid ${theme.border.subtle}` : 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: item.color }} />
            <span style={{ fontSize: 13, color: theme.text.secondary }}>{item.text}</span>
          </div>
          <span style={{ fontSize: 12, color: theme.accent.primary, fontWeight: 600, cursor: 'pointer' }}>Review</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main App ───

export default function PourCostDesignSystem() {
  const [activeView, setActiveView] = useState('system');

  const navItems = [
    { id: 'system', label: 'Design Tokens' },
    { id: 'components', label: 'Components' },
    { id: 'screens', label: 'Screen Mockups' },
  ];

  return (
    <div style={{
      backgroundColor: theme.bg.base,
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
      color: theme.text.primary,
    }}>
      {/* Header */}
      <div style={{
        padding: '32px 40px 24px',
        borderBottom: `1px solid ${theme.border.subtle}`,
        background: `linear-gradient(180deg, ${theme.bg.elevated} 0%, ${theme.bg.base} 100%)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: theme.text.primary, letterSpacing: -0.5 }}>POUR</span>
          <span style={{ fontSize: 24, color: theme.accent.gold }}>⚡</span>
          <span style={{ fontSize: 28, fontWeight: 800, color: theme.text.primary, letterSpacing: -0.5 }}>COST</span>
        </div>
        <div style={{ fontSize: 14, color: theme.text.secondary }}>Design System & Component Library — v2 (Refined)</div>

        <div style={{ display: 'flex', gap: 4, marginTop: 24 }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'inherit',
                transition: 'all 0.2s',
                backgroundColor: activeView === item.id ? theme.accent.blueSubtle : 'transparent',
                color: activeView === item.id ? theme.accent.primary : theme.text.secondary,
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 40px 60px', maxWidth: 1200, margin: '0 auto' }}>

        {/* ===== DESIGN TOKENS ===== */}
        {activeView === 'system' && (
          <div>
            <SectionTitle>Full Color Palette</SectionTitle>
            <Card>
              <PaletteGroup title="Primary (Blues)" swatches={[
                { label: 'p1', color: colors.p1 }, { label: 'p2', color: colors.p2 },
                { label: 'p3', color: colors.p3 }, { label: 'p4', color: colors.p4 },
              ]} />
              <PaletteGroup title="Neutrals (Creams)" swatches={[
                { label: 'n1', color: colors.n1 }, { label: 'n2', color: colors.n2 },
                { label: 'n3', color: colors.n3 }, { label: 'n4', color: colors.n4 },
              ]} />
              <PaletteGroup title="Greys" swatches={[
                { label: 'g1', color: colors.g1 }, { label: 'g2', color: colors.g2 },
                { label: 'g3', color: colors.g3 }, { label: 'g4', color: colors.g4 },
              ]} />
              <PaletteGroup title="Secondary — Yellow/Gold" swatches={[
                { label: 's11', color: colors.s11 }, { label: 's12', color: colors.s12 },
                { label: 's13', color: colors.s13 }, { label: 's14', color: colors.s14 },
              ]} />
              <PaletteGroup title="Secondary — Teal" swatches={[
                { label: 's21', color: colors.s21 }, { label: 's22', color: colors.s22 },
                { label: 's23', color: colors.s23 }, { label: 's24', color: colors.s24 },
              ]} />
              <PaletteGroup title="Secondary — Purple" swatches={[
                { label: 's31', color: colors.s31 }, { label: 's32', color: colors.s32 },
                { label: 's33', color: colors.s33 }, { label: 's34', color: colors.s34 },
              ]} />
              <PaletteGroup title="Error / Danger" swatches={[
                { label: 'e1', color: colors.e1 }, { label: 'e2', color: colors.e2 },
                { label: 'e3', color: colors.e3 }, { label: 'e4', color: colors.e4 },
              ]} />
            </Card>

            <SectionTitle>Semantic Mapping (Refined)</SectionTitle>

            <DesignNote>
              Key changes: secondary text bumped to n3 for better contrast. Warnings use s11 (light yellow) not s12, freeing gold for brand. Purple (s31) marks AI but only as badges/tints/borders — never as text on dark bg. Green (s21) is for positive CTAs.
            </DesignNote>

            <Card>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
                <div>
                  <div style={{ fontSize: 12, color: theme.text.tertiary, marginBottom: 8 }}>Backgrounds</div>
                  <ColorSwatch color={theme.bg.base} name="Base" value="p4 #041021" />
                  <ColorSwatch color={theme.bg.surface} name="Surface" value="p3 #1D273C" />
                  <ColorSwatch color={theme.bg.elevated} name="Elevated" value="p2 #2C3E63" />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: theme.text.tertiary, marginBottom: 8 }}>Text Hierarchy</div>
                  <ColorSwatch color={theme.text.primary} name="Primary" value="n2 #FCF9ED" annotation="~10:1 on p3" />
                  <ColorSwatch color={theme.text.secondary} name="Secondary" value="n3 #ECE7D1" annotation="~6.5:1 on p3 ✓" />
                  <ColorSwatch color={theme.text.tertiary} name="Tertiary" value="g2 #AFAFAF" />
                  <ColorSwatch color={theme.text.muted} name="Muted" value="n4 #CEC59D" annotation="Timestamps only" />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: theme.text.tertiary, marginBottom: 8 }}>Actions & Brand</div>
                  <ColorSwatch color={theme.accent.primary} name="CTA Blue" value="p1 #3262C2" />
                  <ColorSwatch color={theme.accent.gold} name="Brand Gold" value="s12 #DCB962" annotation="Brand only — NOT warnings" />
                  <ColorSwatch color={theme.accent.go} name="Go Green" value="s21 #51CCAE" annotation="Positive CTAs" />
                  <ColorSwatch color={theme.accent.ai} name="AI Purple" value="s31 #7663E7" annotation="Badges/tints only" />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: theme.text.tertiary, marginBottom: 8 }}>Semantic States</div>
                  <ColorSwatch color={theme.semantic.success} name="Success" value="s21 #51CCAE" annotation="Healthy margins" />
                  <ColorSwatch color={theme.semantic.warning} name="Warning" value="s11 #FBE09D" annotation="Caution (not s12)" />
                  <ColorSwatch color={theme.semantic.danger} name="Danger" value="e1 #D63663" annotation="Losses, errors" />
                  <ColorSwatch color={theme.semantic.info} name="Info/AI" value="s31 #7663E7" annotation="Tints & borders only" />
                </div>
              </div>
            </Card>

            <SectionTitle>Typography Scale</SectionTitle>
            <Card>
              {[
                { size: 34, weight: 700, label: '3xl / 34px — Page Titles', sample: 'Dashboard' },
                { size: 28, weight: 700, label: '2xl / 28px — Key Data', sample: '$2.94' },
                { size: 24, weight: 700, label: 'xl / 24px — Section Headers', sample: 'Ingredients' },
                { size: 20, weight: 600, label: 'lg / 20px — Card Titles', sample: 'Sidecar' },
                { size: 17, weight: 600, label: 'md / 17px — Item Names', sample: 'Remy Martin V.S.O.P.' },
                { size: 15, weight: 400, label: 'base / 15px — Body Text', sample: 'Scan invoices to build your inventory', color: theme.text.secondary },
                { size: 13, weight: 400, label: 'sm / 13px — Labels', sample: 'Last updated 3 hours ago', color: theme.text.tertiary },
                { size: 11, weight: 600, label: 'xs / 11px — Overlines', sample: 'POUR COST', overline: true },
              ].map((t, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: i < 7 ? `1px solid ${theme.border.subtle}` : 'none',
                }}>
                  <span style={{
                    fontSize: t.size,
                    fontWeight: t.weight,
                    color: t.color || theme.text.primary,
                    letterSpacing: t.overline ? 1.5 : t.size >= 28 ? -0.5 : 0,
                    textTransform: t.overline ? 'uppercase' : 'none',
                  }}>
                    {t.sample}
                  </span>
                  <span style={{ fontSize: 12, color: theme.text.tertiary, fontFamily: 'monospace', flexShrink: 0, marginLeft: 20 }}>{t.label}</span>
                </div>
              ))}
            </Card>

            <SectionTitle>Pour Cost Threshold Colors</SectionTitle>
            <DesignNote>
              Thresholds use teal → light yellow → pink-red. Notice warning is now clearly yellow-toned (s11), distinct from brand gold (s12).
            </DesignNote>
            <Card>
              <div style={{ display: 'flex', gap: 32, justifyContent: 'center', padding: '8px 0' }}>
                <PourCostBadge value="16.2" label="Healthy" />
                <PourCostBadge value="24.8" label="Watch" />
                <PourCostBadge value="33.1" label="Over" />
              </div>
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', maxWidth: 300, margin: '0 auto' }}>
                  <div style={{ flex: 20, backgroundColor: theme.semantic.success, borderRadius: 3 }} />
                  <div style={{ width: 4 }} />
                  <div style={{ flex: 8, backgroundColor: theme.semantic.warning, borderRadius: 3 }} />
                  <div style={{ width: 4 }} />
                  <div style={{ flex: 12, backgroundColor: theme.semantic.danger, borderRadius: 3 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 300, margin: '6px auto 0', fontSize: 11, color: theme.text.tertiary }}>
                  <span>0%</span><span>20%</span><span>28%</span><span>40%+</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ===== COMPONENTS ===== */}
        {activeView === 'components' && (
          <div>
            <SectionTitle>Buttons</SectionTitle>
            <Card>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <Button variant="primary">Add Ingredient</Button>
                <Button variant="go">Upgrade Plan</Button>
                <Button variant="ai">✦ AI Review</Button>
                <Button variant="gold">Premium</Button>
                <Button variant="secondary">Cancel</Button>
                <Button variant="destructive">Delete</Button>
                <Button variant="ghost">Skip</Button>
              </div>
              <DesignNote>
                Green "go" variant for positive CTAs (upgrade, confirm, save). AI variant uses subtle purple tint with cream text — purple stays supportive, never as foreground text on dark bg. Gold reserved for brand chrome only.
              </DesignNote>
            </Card>

            <SectionTitle>AI Feature Components</SectionTitle>
            <DesignNote>
              Purple = AI, but supportive. It appears as small solid badges (white text on purple), subtle background tints, and thin borders — never as text color on dark backgrounds. All readable text on AI surfaces stays cream/white.
            </DesignNote>
            <AiSuggestionCard
              title="Add a gin cocktail"
              description="Your menu has no gin-based cocktails. 23% of bar menus include at least 2 gin options. Consider adding a classic G&T or Negroni."
              action="View Suggestions"
            />
            <AiSuggestionCard
              title="Price increase detected"
              description="Espolon Reposado went from $22.49 to $24.99 (+11%). This affects 4 cocktails. Recommend reviewing Margarita pricing."
              action="Review Cocktails"
            />
            <div style={{ marginTop: 16 }}>
              <AiMenuReviewCard />
            </div>

            <SectionTitle>Stat Cards</SectionTitle>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <StatCard label="Total Ingredients" value="47" sub="+3 this week" />
              <StatCard label="Avg Pour Cost" value="18.2%" color={theme.semantic.success} sub="Target: < 20%" />
              <StatCard label="Recipes" value="23" sub="5 need review" />
              <StatCard label="Revenue Impact" value="$2.4K" color={theme.accent.gold} sub="Monthly savings" />
            </div>

            <SectionTitle>Ingredient List</SectionTitle>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 18, fontWeight: 600 }}>Ingredients</div>
                <Button variant="primary" style={{ padding: '8px 16px', fontSize: 13 }}>+ Add</Button>
              </div>
              <IngredientRow name="Remy Martin V.S.O.P." category="Cognac" cost="54.99" size="750mL" />
              <IngredientRow name="Cointreau" category="Liqueur" cost="36.99" size="750mL" />
              <IngredientRow name="Espolon Reposado" category="Tequila" cost="24.99" size="750mL" />
              <IngredientRow name="Luxardo Maraschino" category="Liqueur" cost="32.99" size="750mL" />
              <IngredientRow name="Fresh Lemon Juice" category="Juice" cost="3.99" size="500mL" isLast />
            </Card>

            <SectionTitle>Recipe Detail Card</SectionTitle>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>Sidecar</div>
                  <div style={{ fontSize: 13, color: theme.text.tertiary, marginTop: 4 }}>Classic cocktail</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: theme.text.tertiary, textTransform: 'uppercase', letterSpacing: 1 }}>Menu Price</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: theme.text.primary }}>$14.00</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
                <div style={{ flex: 1, backgroundColor: theme.bg.elevated, borderRadius: 12, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: theme.text.tertiary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Pour Cost</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: theme.semantic.success }}>$2.94</div>
                </div>
                <div style={{ flex: 1, backgroundColor: theme.bg.elevated, borderRadius: 12, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: theme.text.tertiary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Margin</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: theme.semantic.success }}>$11.06</div>
                </div>
                <div style={{ flex: 1, backgroundColor: theme.bg.elevated, borderRadius: 12, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: theme.text.tertiary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Cost %</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: theme.semantic.success }}>21%</div>
                </div>
              </div>
              <CostBar segments={[
                { pct: 59, color: colors.s31 },
                { pct: 32, color: colors.s12 },
                { pct: 9, color: colors.s21 },
              ]} />
              <div style={{ display: 'flex', gap: 16, marginTop: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 11, color: colors.s31 }}>● Cognac 59%</span>
                <span style={{ fontSize: 11, color: colors.s12 }}>● Cointreau 32%</span>
                <span style={{ fontSize: 11, color: colors.s21 }}>● Lemon 9%</span>
              </div>
              <RecipeIngredient name="Remy Martin V.S.O.P." pourSize="1.5oz" costPerOz="1.16" total="1.74" pct="59" />
              <RecipeIngredient name="Cointreau" pourSize="0.75oz" costPerOz="1.24" total="0.93" pct="32" />
              <RecipeIngredient name="Lemon Juice" pourSize="0.75oz" costPerOz="0.35" total="0.27" pct="9" />
            </Card>

            <SectionTitle>Alerts (Revised)</SectionTitle>
            <DesignNote>
              Warning alerts use s11 (light yellow), distinct from brand gold. AI alerts use purple background tint but cream text — readable on any surface.
            </DesignNote>
            <Card>
              <AlertRow icon="⚠" text="3 cocktails exceed 28% pour cost target" type="danger" />
              <AlertRow icon="△" text="Espolon Reposado price increased 12%" type="warning" />
              <AlertRow icon="✦" text="AI found 2 menu gaps — review suggestions" type="ai" />
              <AlertRow icon="ℹ" text="Invoice scan ready for review (8 items)" type="info" />
            </Card>

            <SectionTitle>Invoice Scan Results (with AI badges)</SectionTitle>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 18, fontWeight: 600 }}>Invoice Detected Items</span>
                <AiBadge />
              </div>
              <div style={{ fontSize: 13, color: theme.text.tertiary, marginBottom: 16 }}>3 items found — review matches below</div>
              <InvoiceItem name="ESPOLON RESPOSADO 750ML" qty="2" size="750mL" price="49.98" match="Espolon Reposado" confidence="high" />
              <InvoiceItem name="JIM BEAM WHITE LBL 1L" qty="1" size="1L" price="19.99" match="Jim Beam White Label" confidence="medium" />
              <InvoiceItem name="LUXARDO MRSCHO 750" qty="1" size="750mL" price="32.99" match="No match" confidence="low" />
              <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                <Button variant="go" style={{ flex: 1 }}>Confirm All Matches</Button>
                <Button variant="secondary">Edit</Button>
              </div>
            </Card>

            <SectionTitle>Empty State</SectionTitle>
            <Card>
              <EmptyState
                icon="🍸"
                title="No recipes yet"
                description="Add your first recipe to start tracking pour costs and margins."
                cta="Create Recipe"
              />
            </Card>
          </div>
        )}

        {/* ===== SCREEN MOCKUPS ===== */}
        {activeView === 'screens' && (
          <div>
            <SectionTitle>App Screen Mockups (Refined)</SectionTitle>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center', paddingTop: 16 }}>
              {/* Dashboard */}
              <PhoneFrame title="Dashboard">
                <div style={{ padding: '16px 20px', flex: 1 }}>
                  <div style={{ fontSize: 13, color: theme.text.tertiary }}>Good evening, Josh</div>
                  <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4, marginBottom: 20 }}>Dashboard</div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                    <div style={{ backgroundColor: theme.bg.surface, borderRadius: 14, padding: 14, border: `1px solid ${theme.border.subtle}` }}>
                      <div style={{ fontSize: 10, color: theme.text.tertiary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Ingredients</div>
                      <div style={{ fontSize: 22, fontWeight: 700 }}>47</div>
                    </div>
                    <div style={{ backgroundColor: theme.bg.surface, borderRadius: 14, padding: 14, border: `1px solid ${theme.border.subtle}` }}>
                      <div style={{ fontSize: 10, color: theme.text.tertiary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Recipes</div>
                      <div style={{ fontSize: 22, fontWeight: 700 }}>23</div>
                    </div>
                    <div style={{ backgroundColor: theme.bg.surface, borderRadius: 14, padding: 14, border: `1px solid ${theme.border.subtle}` }}>
                      <div style={{ fontSize: 10, color: theme.text.tertiary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Avg Pour Cost</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: theme.semantic.success }}>18.2%</div>
                    </div>
                    <div style={{ backgroundColor: theme.bg.surface, borderRadius: 14, padding: 14, border: `1px solid ${theme.border.subtle}` }}>
                      <div style={{ fontSize: 10, color: theme.text.tertiary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Savings</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: theme.accent.gold }}>$2.4K</div>
                    </div>
                  </div>

                  <div style={{ fontSize: 11, fontWeight: 600, color: theme.accent.gold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Alerts</div>
                  <AlertRow icon="⚠" text="3 cocktails exceed target" type="danger" />
                  <AlertRow icon="△" text="Price change: Espolon +12%" type="warning" />
                  <AlertRow icon="✦" text="Menu gaps found — 2 suggestions" type="ai" />

                  <div style={{ fontSize: 11, fontWeight: 600, color: theme.accent.gold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginTop: 16 }}>Recent Activity</div>
                  <div style={{ backgroundColor: theme.bg.surface, borderRadius: 14, padding: 14, border: `1px solid ${theme.border.subtle}`, marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: theme.text.primary }}>Sidecar updated</span>
                      <span style={{ fontSize: 12, color: theme.text.muted }}>2h ago</span>
                    </div>
                  </div>
                  <div style={{ backgroundColor: theme.bg.surface, borderRadius: 14, padding: 14, border: `1px solid ${theme.border.subtle}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: theme.text.primary }}>3 ingredients added</span>
                      <span style={{ fontSize: 12, color: theme.text.muted }}>1d ago</span>
                    </div>
                  </div>
                </div>
                <TabBar active="dashboard" setActive={() => {}} />
              </PhoneFrame>

              {/* Inventory */}
              <PhoneFrame title="Inventory">
                <div style={{ padding: '16px 20px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>Inventory</div>
                    <div style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.accent.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: colors.n1, fontWeight: 700 }}>+</div>
                  </div>

                  <div style={{
                    backgroundColor: theme.bg.surface,
                    borderRadius: 12,
                    padding: '10px 14px',
                    border: `1px solid ${theme.border.default}`,
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    <span style={{ color: theme.text.tertiary }}>🔍</span>
                    <span style={{ color: theme.text.muted, fontSize: 15 }}>Search ingredients...</span>
                  </div>

                  <div style={{ fontSize: 11, fontWeight: 600, color: theme.accent.gold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Spirits (12)</div>
                  <IngredientRow name="Remy Martin V.S.O.P." category="Cognac" cost="54.99" size="750mL" />
                  <IngredientRow name="Espolon Reposado" category="Tequila" cost="24.99" size="750mL" />
                  <IngredientRow name="Jim Beam White Label" category="Whiskey" cost="19.99" size="1L" />

                  <div style={{ fontSize: 11, fontWeight: 600, color: theme.accent.gold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 }}>Liqueurs (8)</div>
                  <IngredientRow name="Cointreau" category="Orange Liqueur" cost="36.99" size="750mL" />
                  <IngredientRow name="Luxardo Maraschino" category="Cherry Liqueur" cost="32.99" size="750mL" isLast />
                </div>
                <TabBar active="inventory" setActive={() => {}} />
              </PhoneFrame>

              {/* Scanner */}
              <PhoneFrame title="Invoice Scanner">
                <div style={{ padding: '16px 20px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <span style={{ fontSize: 24, fontWeight: 700 }}>Invoice Scan</span>
                    <AiBadge />
                  </div>

                  <div style={{
                    backgroundColor: theme.bg.elevated,
                    borderRadius: 16,
                    height: 140,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                    border: `1px dashed ${theme.border.strong}`,
                    flexDirection: 'column',
                    gap: 8,
                  }}>
                    <span style={{ fontSize: 32, opacity: 0.4 }}>📄</span>
                    <span style={{ fontSize: 13, color: theme.text.secondary }}>Invoice image captured</span>
                    <span style={{ fontSize: 11, color: theme.semantic.success, fontWeight: 600 }}>✓ 3 items detected</span>
                  </div>

                  <div style={{ fontSize: 11, fontWeight: 600, color: theme.accent.gold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Detected Items</div>

                  <InvoiceItem name="ESPOLON REPO 750" qty="2" size="750mL" price="49.98" match="Espolon Reposado" confidence="high" />
                  <InvoiceItem name="JIM BEAM WH 1L" qty="1" size="1L" price="19.99" match="Jim Beam White Label" confidence="medium" />
                  <InvoiceItem name="LUX MRSCHO 750" qty="1" size="750mL" price="32.99" match="No match" confidence="low" />

                  <div style={{ marginTop: 12 }}>
                    <Button variant="go" style={{ width: '100%' }}>Confirm Matches</Button>
                  </div>
                </div>
                <TabBar active="scanner" setActive={() => {}} />
              </PhoneFrame>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}