Below is a "shopping list" of feature ideas you can cherry-pick from as PourCost matures.

1. Core Inventory & Cost Control
   - [ ] Invoice-to-Inventory OCR (you have)
   - [ ] Dynamic COGS tracking with real-time price deltas (you have)
   - [ ] One-tap variance reports (actual vs. theoretical usage)
   - [ ] Par-level alerts & auto-reorder suggestions
   - [ ] Low-stock SMS / push notifications
   - [ ] Multi-unit inventory transfers & "ghost kitchen" support
   - [ ] Batch / keg yield tracking for draft cocktails & beer
   - [ ] Depletion forecasting (AI looks at events, seasonality)
   - [ ] Waste logging & shrinkage heatmaps (who/when/why)

2. Menu & Recipe Engineering
   - [ ] AI recipe builder from inventory (you have)
   - [ ] Prep-recipe costing & roll-ups (you have)
   - [ ] Batch cost amortization (e.g., house syrups)
   - [ ] Allergen & dietary tags auto-generated
   - [ ] ABV / calorie auto-calc & labeling export
   - [ ] Seasonal menu simulation ("what-if" pricing & margin impact)
   - [ ] Supplier swap recommender (suggest cheaper substitutes)
   - [ ] "Feature cocktail" optimizer (AI proposes high-margin specials)
   - [ ] Menu design export to Canva / Figma template
   - [ ] Ability to fair cocktail recipes
   - [ ] Ability to auto-suggest replacements for ingredients
   - [ ] Ability to auto-suggest replacements for all ingredients in recipes section by iterating through which ones you don't have

3. AI-Driven Insights & Coaching
   - [ ] Gap analysis for menu styles & price points (you have)
   - [ ] AI bar-management Q&A assistant (you have)
   - [ ] Smart upsell prompts for bartenders (via mobile)
   - [ ] Forecasted pour cost vs. goal with action checklist
   - [ ] Regional price benchmarking (compare to peer bars)
   - [ ] Dynamic happy-hour pricing engine
   - [ ] KPI dashboard: labor %, pour cost, prime cost, RevPASH
   - [ ] **Canonical data quality feedback loop**. Aggregate user overrides on `ingredients.{brand,origin,flavor_notes,parent_company,founded_year,production_region,aging_years,education_data}` columns. When N users override the same canonical field with the same value, flag for AI verification (Gemini Flash + grounded search) and auto-update or queue for admin review. Schema already supports it: any non-NULL override column = "user disagreed with canonical here." Build = scheduled aggregation job + Gemini verification pipeline + admin review UI + role gates. Estimated 1-2 weeks of focused work. Best to ship after enough user volume (~hundreds of saved ingredients) makes the signal meaningful.

4. Staff Training & Ops
   - [ ] Study-guide generation & quizzes (you have)
   - [ ] Onboarding workflows & SOP library (you have)
   - [ ] Skill-gap heatmap (who missed quiz sections)
   - [ ] Gamified leaderboards for quiz scores / inventory accuracy
   - [ ] Mobile "shift brief" generator (today's specials, 86'd items)
   - [ ] Certification tracker (TIPS, ServSafe, etc.)
   - [ ] Role-based permissions & audit logs
   - [ ] In app messaging and shift notes

5. Integrations & Automation
   - [ ] Invoice email forwarding (forward to scan@pourcost.com → auto-process → push notification to review). Requires email ingestion (SendGrid Inbound Parse or Mailgun Routes), PDF text extraction, review notification flow. Best after web app build for review UX.
   - [ ] POS deep links for live sales pulls (Toast, Square, Lightspeed)
   - [ ] Payroll export (tips, comps, spillage tracked)
   - [ ] QuickBooks / Xero journal entries for COGS sync
   - [ ] Supplier EDI / API ordering (skip email)
   - [ ] Third-party delivery margin tracking (DoorDash, Uber Eats)
   - [ ] BI API so enterprise groups can plug into Power BI / Tableau

6. Compliance & Governance
   - [ ] State liquor reporting auto-fill (e.g., Texas TABC excel)
   - [ ] Keg deposit reconciliation
   - [ ] Ingredient traceability logs (CBD, low-ABV, allergen)
   - [ ] Shelf-life warnings for fresh juices / batches
   - [ ] Sustainability scorecard (waste, water usage)

7. Mobile & UX Enhancements
   - [ ] Offline "cellar mode" for basements with no signal
   - [ ] Barcode / NFC scanning via phone camera
   - [ ] Voice-driven counts ("two cases Tito's, six bottles Campari…")
   - [ ] Dark-mode & low-light counting interface
   - [ ] Smartwatch "low stock" haptic alerts

8. Revenue & Marketing Adjacent
   - [ ] Guest-facing digital menu with live pricing & QR order
   - [ ] Bottle-shop mode (track retail bottle sales vs bar usage)
   - [ ] Loyalty integrations to push high-margin cocktails
   - [ ] Promo ROI tracker (happy hour vs. bounce-back coupons)

9. Hardware / IoT (Future-forward)
   - [ ] Bluetooth scale integration for real-time bottle levels
   - [ ] Smart flow-meter API for draft lines
   - [ ] RFID glassware or coaster tracking (anti-theft + pour accuracy)

10. Scheduling & Workforce (Down-the-road, as you noted)
    - [ ] Labor forecasting tied to sales & events
    - [ ] On-call shift swap marketplace for bartenders
    - [ ] Tips distribution calculator with pooling rules

11. Enterprise / Chain Needs
    - [ ] Centralized recipe & price pushes to all locations
    - [ ] Corporate compliance reporting (franchise dashboards)
    - [ ] Multi-currency support & localized tax/VAT
    - [ ] Ability to share entire portfolios with a new account (aka if a bar manager is leaving the restaurant but wants to retain the cocktails)

\_\_

Below is a clean four-tier lineup (Free → Lite → Pro → Enterprise) with 5–6 carefully-chosen features per tier. I optimized for:
• Founder bandwidth (solo dev, low COGS)
• Clear upgrade path (each tier unlocks an obvious “next pain-killer”)
• AI cost control (heavy AI only in Pro/Enterprise)
• Investor story (easy to explain in the deck)

⸻

🌱 Free – "Starter"

Goal Hook them, capture data, prove value in one shift
- [ ] Manual Inventory & Recipe Entry (up to 50 SKUs)
- [ ] Basic Pour-Cost Calculator (single recipe, manual cost inputs)
- [ ] 1-Click Cost Percentage Report (PDF/CSV export)
- [ ] Weekend Reminder Emails ("Time to do your inventory")
- [ ] Community Knowledge Base Access (how-tos, templates)

Why: Zero infra overhead, zero AI spend. Gives bartenders their first "aha!" and seeds upgrade triggers (SKU cap, manual pain).

⸻

💡 Lite – $49/mo

Goal Eliminate data entry + give real-time cost clarity
- [ ] Invoice-to-Inventory OCR (unlimited scans)
- [ ] Dynamic COGS Tracking & Price-Change Alerts
- [ ] Unlimited Recipe Builder with auto-cost roll-ups
- [ ] Prep Recipe Costing & Batch Yield Tracking
- [ ] Single-Location Dashboard (variance, low-stock alerts)
- [ ] Email Support

Why: Biggest early pain is manual data entry + "what'd that drink cost me today?" All of that is solved here without heavy AI load.

⸻

🚀 Pro – $79/mo

Goal Add AI insights, staff efficiency, and POS accuracy
- [ ] AI Menu Gap & Pricing Suggestions
- [ ] Cocktail Audit + Ingredient Swap Recs
- [ ] POS Integration & Auto-Variance Reports
- [ ] Staff Study-Guide & Quiz Generator
- [ ] Multi-User Roles & Audit Log
- [ ] Mobile "Shift Brief" Push Notifications

Why: These features monetize the AI calls (worth paying for) and drive measurable revenue gains (higher margins, faster training). POS sync makes the numbers bullet-proof, which investors love.

⸻

🏢 Enterprise – $199+/mo (custom)

Goal Chain-wide control, deep analytics, white-labeling
- [ ] Multi-Location Command Center (roll-up analytics)
- [ ] Custom API / ERP Integrations (SAP, NetSuite, flow-meters, etc.)
- [ ] SSO & Advanced Permissions (SOC-2 friendly)
- [ ] Corporate Recipe Push & Compliance Reporting
- [ ] Dedicated Account Manager + Priority SLA
- [ ] White-Label Staff App & Reports

Why: Enterprise bars/hotel groups pay for control, integrations, and premium support. High margin, low churn, great logo cred.

⸻

🔑 Upgrade Ladders (briefly mention in the deck)
• Free → Lite: “Tired of typing in costs? Unlock OCR and dynamic COGS.”
• Lite → Pro: “Your recipes are costed—now use AI to optimize them and sync to POS.”
• Pro → Enterprise: “Roll this out chain-wide, integrate with ERP, and get white-label power.”

---

# Deferred from MVP build

Items that were scoped out of the MVP but have concrete implementation notes from the build. Prioritize over the higher-level "shopping list" above — these are closer to ready.

## Multi-size ingredient polish

- **Cocktail picker config selection** — when adding a library ingredient to a recipe, let the user pick which configuration the recipe is costed against. Today the recipe always copies the ingredient's default size. Schema change: add `configuration_id` (nullable) to `cocktail_ingredients`.
- **Promote alternate to default** — "Set as Default" action in `ingredient-size-form` that swaps the alternate's size+price into the inline ingredient row and demotes the old primary into a configuration.
- **Pack-size UI** — `pack_size` and `pack_cost` columns exist in `ingredient_configurations` but the size-form doesn't surface them yet. Wire them in once invoice import populates them.

## Delete-ingredient reassign flow

- Replace the MVP-lite `IngredientInUseSheet` blocker with a full reassign-via-search: alert → search picker → pick a replacement → bulk-update all affected `cocktail_ingredients` rows → delete original.
- Belongs under a future "Bulk Ingredient Management" section in Settings or as a contextual action on the ingredient detail page.
- Schema: cascading update on `cocktail_ingredients.ingredient_id` + denormalized `ingredient_name` / `product_size` / `product_cost` / recomputed `cost`. Reuse `cascadeIngredientUpdate` logic.

## Invoice scanning — Round 2.5

Depends on multi-size cocktail wiring.

- Product name normalization (strip proof, expand TEQ→Tequila, etc.)
- Extract bottle size from BPC into `Volume` (`"6 - 1.0L"` → `Volume{ml:1000}, pack_size:6`)
- Wire `ingredient_configurations` into invoice price update flow (match against existing configs by size, create when new)
- Match "same product, different size" (750ml / 1.0L / 1.75L → one ingredient, many configurations)
- Deposit fee / non-product line filtering
- Review screen: show bottle size + pack info

## Invoice scanning — Round 3 (intelligence + polish)

- Template auto-generation from accumulated LLM extractions (Opus)
- Verification anti-spam logic (Opus)
- Multi-pack-size resolution (Opus)
- Price change alerts UI ("Tito's went up 12% this month")
- Settings: labor rate toggle
- `ingredient_configurations` CRUD UI

## Prepped ingredients

1. New ingredient with `type = 'Prepped'`
2. Template picker (Simple Syrup 1:1, Fresh Lime, Grenadine, …)
3. Recipe builder: components, quantity, yield
4. System computes `cost_per_oz` from components
5. Invoice scan of component → prepped cost auto-recalc → cocktails auto-recalc

Schema (`prepped_ingredient_recipes`, `prepped_ingredient_templates`) not yet applied. Ship 20+ templates at launch.

## Labor cost in prep

- `profiles.prep_labor_rate NUMERIC(10,2)`
- `prep_time_minutes` on prepped recipes (JSONB)
- `labor_cost = (prep_time_minutes / 60) × prep_labor_rate`
- Toggle, default OFF for Free, available Lite+

## Miscellaneous deferred features

- **Multi-currency with live FX rates** — connect `profiles.base_currency` to display, weekly fetch from `exchangerate.host`, cache in `currency_rates` table. ~4-6 hrs.
- **Email app picker on "Open Email"** — bottom sheet of installed mail apps via `canOpenURL` + `LSApplicationQueriesSchemes`. ~30 min.
- **Add password for social-only users** — `supabase.auth.updateUser({ password })`. New row visible when `!hasPasswordIdentity`. ~15 min.
- **Change email address** — `updateUser({ email })` + double-confirm flow. ~30-45 min.
- **Coachmark tour** — `react-native-copilot`, 5-step guided tour, once per tab. ~1-2 days. Ship after observing PostHog drop-off.
- **Empty-state inline hints** — for users who opted out of sample bar.
- **Real Tutorials tab in Learn** — per-feature deep dives (separate from the existing "Getting Started" orientation carousel which only describes what's where). Candidate topics: how to read the Pour Cost meter, when to use tiered targets vs flat, what the spirit price tiers mean, how Suggested Price floors work, how invoice scanning matches to inventory, batching workflows. Format TBD post-launch — could be cards, short videos, GIF demos, or a hybrid. Most successful indie apps build these targeted at where telemetry shows users get stuck, not upfront. Drives a separate Learn entry alongside Getting Started.

## Canonical library expansion

Builds on the canonical foundation shipped in MVP (see `MVP-Todo.md` — "Canonical library foundation"). All additive, no schema rewrites required.

### Organizations + multi-user accounts

- `organizations` table (id, name, type='restaurant'|'distributor'|'brand', metadata)
- `memberships` table (user_id, org_id, role)
- Backfill single-user accounts to single-member orgs of one
- `ingredients.org_id` nullable FK; null = personal inventory, set = shared org inventory
- `cocktails.org_id` same pattern
- RLS policies updated to include org membership alongside user ownership
- Wire `canonical_products.owner_org_id` to `organizations.id` (FK already staged)

### Brand / distributor-owned canonicals

- Distributor or brand org accounts can create and edit `canonical_products` they own (`owner_type = 'distributor' | 'brand'`, `owner_org_id` set)
- Admin review queue for new canonicals to prevent spam / naming conflicts
- PourCost retains override rights on any canonical for moderation
- Brand-owned canonicals tagged visibly in library to disclose promotional content (FTC consideration)

### Rep sharing workflow

- Rep builds a recipe inside their distributor org account using canonical ingredients from their portfolio
- "Share to bar manager" action: creates a `received_recipes` row targeting the recipient user, `source = 'rep'`, `source_metadata` includes rep identity and brand attribution
- In-app inbox for received recipes
- Deep link / QR / email delivery for off-platform recipient (auto-creates an account for them on adoption)

### Shareable recipe image cards

- Server-side (or client-side) renderer that turns a `received_recipes` row into a standalone cocktail card image
- Brand-attribution variant (logo, rep contact) vs. clean variant
- Export to Instagram, iMessage, email

### User ingredient to canonical promotion

- User creates a custom ingredient (e.g. a small-batch product). Review flow proposes it for promotion to canonical.
- LLM similarity check against existing canonicals to avoid duplicates
- PourCost moderator approves / merges / rejects
- On promotion, `ingredients.canonical_product_id` backfills for all users who already had a matching custom ingredient

### Locale-aware canonical pricing stats

Separate derived-data layer. Canonicals themselves stay price-free. Pricing context is aggregated from real invoice scans and surfaced as a "regional market rate" reference, never used for the user's own costing.

- `canonical_pricing_stats` table (canonical_product_id, region, distributor_id nullable, median_price, p25, p75, sample_count, last_updated_at)
- Region = state code at minimum; city-level if sample counts support it
- Populated by a scheduled job that rolls up `invoice_line_items` by canonical + region
- Confidence thresholds: hide stats with sample_count < N to avoid misleading early numbers
- Searchable pricing guide UI: "what does Tito's 750ml typically cost in Colorado?"
- "Your price vs regional median" indicator on ingredient detail
- Potential standalone monetizable product (API for distributors, subscription tier for bar groups)
- Does NOT replace user ingredient pricing. Account ingredient remains the source of truth for COGS.

### Prebuilt library growth

- Ongoing curation of canonical catalog as invoice data identifies new SKUs
- Seasonal / trending recipe additions to library
- Category-specific collections (tiki, low-ABV, classics, brunch)
- User submissions pipeline (opt-in to contribute their recipes to public library, moderation queue)

---

## DB migrations pending

- `prepped_ingredient_recipes` + `prepped_ingredient_templates`
- `profiles.prep_labor_rate`
- Optional: `ingredients.canonical_product_id` FK to canonical catalog
- (`ingredient_configurations` shipped in `001_invoice_scanning.sql`)

---

# Architecture reference — invoice scanning

## Processing pipeline

```
Photo → Gemini Vision Extraction → Distributor Detection → Pack Size Resolution → Product Matching → User Review → Price Update
```

## Matching cascade (per line item)

```
1. Exact SKU lookup in distributor_skus                      → auto-match (confidence 1.0)
2. Org-level custom mapping (org_product_mappings)           → auto-match (confidence 1.0)
3. Fuzzy name match against canonical_products (pg_trgm)
   - similarity > 0.85 → auto-match, save SKU mapping
   - 0.6–0.85         → suggest to user
4. Fuzzy match against user's own ingredients
5. Unmatched                                                 → queue for user review
```

## `ingredient_configurations` schema (shipped)

```sql
ingredient_configurations (
  id UUID PK,
  ingredient_id UUID FK → ingredients ON DELETE CASCADE,
  product_size JSONB NOT NULL,
  product_cost NUMERIC(10,2) NOT NULL,
  pack_size INTEGER DEFAULT 1,
  pack_cost NUMERIC(10,2),
  is_default BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'manual',          -- manual, invoice, barcode
  last_invoice_id UUID FK → invoices,
  last_updated_price_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ingredient_id, product_size, pack_size)
)
```
