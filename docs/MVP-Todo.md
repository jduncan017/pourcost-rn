# PourCost RN — MVP To-Do

_Last updated 2026-04-22._

---

## Pre-submit blockers

1. ~~**Google Sign-In broken**~~ — DONE. Root cause: GoogleSignIn iOS SDK v8 embeds a nonce in the id_token when `serverClientID` (webClientId) is configured; RN wrapper v15 exposes no hook to match it. Fixed by enabling **Skip Nonce Checks** on the Google provider in Supabase dashboard. Security preserved via Google's signed id_token + audience validation.

2. ~~**Apple token revocation on account delete**~~ — DONE. `store-apple-token` edge function captures Apple's `refresh_token` after SIWA; `delete-account` edge function calls `/auth/revoke` before deleting the user. Requires APPLE_TEAM_ID / APPLE_KEY_ID / APPLE_CLIENT_ID / APPLE_PRIVATE_KEY secrets set in Supabase dashboard.

3. **Navigation race-condition guard** — rapid double-tap on nav actions can crash. No throttle/lock found anywhere in `app/`. Add guard on entry points.

4. ~~**`handle_new_user` trigger diagnostic**~~ — FIXED in migration 007. The production DB was missing the `handle_new_user` trigger entirely, which is why new users had no `profiles` row after signup (root cause of phantom-user bug + sample-bar FK failures). Migration 007 installs the trigger and backfills rows for any existing users that lack them. `seedSampleBar` also has a best-effort upsert as a safety net.

---

## UX polish backlog

- Design pass — full visual sweep across all screens.
- Light-mode polish — manual UI sweep needed.
- Onboarding hex-color spot-check.

---

## Account linking — native flow (shipped 2026-04-22)

Both Apple and Google account linking now use native id_tokens (Face ID / Google SDK) instead of Supabase's browser OAuth. Eliminates the web-redirect UX friction, removes dependency on Apple Services IDs, and sidesteps Supabase's redirect-URL matching quirks.

- Edge function `link-identity` verifies the id_token against Apple/Google JWKS, then inserts into `auth.identities` via the `link_user_identity` SECURITY DEFINER RPC
- Migration `006_link_identity_rpc.sql` defines the RPC
- Required secrets in Supabase dashboard: `APPLE_CLIENT_ID` (already set), `GOOGLE_WEB_CLIENT_ID`, `GOOGLE_IOS_CLIENT_ID`
- Deployed with `--no-verify-jwt` (same ES256 gateway issue as other edge functions)

### Post-MVP enhancements

- **Multi-currency with live FX rates** — legacy iOS had a `CurrencyService` with live symbol sync + locale-aware formatting. RN currently only has USD. Plan: connect `profiles.base_currency` to actual rate-applied display, fetch rates from a free API weekly (e.g. `exchangerate.host`), cache in a new `currency_rates` Supabase table, add locale-aware number formatting. ~4-6 hrs. Needed for international expansion.

### Post-MVP account-management features

- **Email app picker on "Open Email"** — iOS has no public API to open the user's default mail app's inbox (the default Mail App setting only affects `mailto:` compose). Current implementation tries Spark → Outlook → Gmail → Apple Mail in a hardcoded order, which is arbitrary for users who don't have those. Better UX: bottom sheet showing installed mail apps (detected via `canOpenURL` against `LSApplicationQueriesSchemes`), let user pick once, persist via AsyncStorage. ~30 min scope.
- **Add password for social-only users** — Apple/Google users can set a password to also sign in with email. Supabase API: `supabase.auth.updateUser({ password })`. UI: new "Set a Password" row in Settings → Account → Sign-in Methods, only visible when `!hasPasswordIdentity`. After set, row flips to the existing "Change Password" flow. ~15 min scope.
- **Change email address** — let users update `auth.users.email` via `supabase.auth.updateUser({ email: newEmail })`. Triggers Supabase's double-confirm flow (old email + new email both confirm). Already have the "Change Email" email template wired. UI: make the Email row in Settings → Account tappable → bottom sheet with new email input. ~30-45 min scope. Weirdness note: Apple/Google identity's `identity_data.email` stays on the provider record — users who sign out then back in via social will still find their account via the provider `sub`, but their "auth email" may diverge from their "provider email" cosmetically.

## Onboarding

- ✅ **Pre-seeded sample bar** (2026-04-22) — first-sign-in users can opt into a starter bar with 14 ingredients + 5 classic cocktails. Rows tagged `is_sample = true`; one-tap clear in Settings → Calculations once user has their own data. Migration `005_sample_data_flag.sql`, seed defs in `src/lib/sample-bar.ts`, service in `src/lib/seed-sample-bar.ts`.

### Post-MVP

- **Coachmark tour** — interactive tooltips pointing at real UI elements on first visit per screen (Calculator, Ingredients, Cocktails, cocktail detail, ingredient detail). 5-step guided tour with "Skip Tour" always visible. Fires once per tab lifetime. Planned library: `react-native-copilot` (supports Expo, theme-able overlay, arrow positioning). Rough scope: 1-2 days. Ship after MVP launch once we've observed real first-session drop-off metrics via PostHog.
- **Empty-state inline hints** — for users who opted out of the sample bar, short one-line prompts on empty Cocktails/Ingredients lists ("Tap + to add your first ingredient"). Low-lift complement to the coachmark tour.

---

## At submission time (no code)

- App Store screenshots (requires design pass first)
- Paste Terms/Privacy URLs into App Store Connect

---

## Invoice scanning — remaining work

### Round 2.5: Product Normalization & Configurations

- [ ] Product name normalization — strip proof numbers, expand abbreviations (TEQ→Tequila, etc.)
- [ ] Extract bottle size from BPC into `Volume` type (e.g. `"6 - 1.0L"` → `Volume{ml:1000}`, `pack_size:6`)
- [ ] Wire `ingredient_configurations` into price update flow (create/update configs per size/pack)
- [ ] Handle "same product, different size" matching — 750ml / 1.0L / 1.75L map to one ingredient
- [ ] Deposit fee / non-product line filtering
- [ ] Review screen: show bottle size and pack info clearly

**Schema prerequisite**: `ingredient_configurations` table not yet migrated.

### Round 3: Intelligence & Polish

**Opus-tier:**
- Template auto-generation from accumulated LLM extractions
- Verification anti-spam logic
- Multi-pack-size resolution

**Sonnet-tier:**
- Prepped ingredient recipe builder UI
- Price change alerts UI ("Tito's went up 12% this month")
- Settings additions (labor rate toggle, etc.)
- `ingredient_configurations` CRUD
- Ingredient detail — configurations tab

### Prepped ingredients

1. New ingredient with `type = 'Prepped'`
2. Template picker (Simple Syrup 1:1, Fresh Lime Juice, Grenadine, etc.)
3. Recipe builder: components, quantity, yield
4. System computes `cost_per_oz` from components
5. Invoice scan of component → prepped cost auto-recalculates → cocktails auto-recalculate

Schema (`prepped_ingredient_recipes`, `prepped_ingredient_templates`) not yet applied. Ship 20+ templates at launch.

### Labor cost in prep

- `profiles.prep_labor_rate NUMERIC(10,2)` (org-level hourly rate)
- `prep_time_minutes` on prepped ingredient recipes (JSONB)
- `labor_cost = (prep_time_minutes / 60) × prep_labor_rate`
- Toggle, default OFF for Free tier, available Lite+

---

## DB migrations — pending

- `ingredient_configurations` table
- `prepped_ingredient_recipes` + `prepped_ingredient_templates`
- `profiles.prep_labor_rate`
- Optional: `ingredients.canonical_product_id` FK to canonical catalog

---

## Architecture reference — invoice scanning

### Processing pipeline

```
Photo → Gemini Vision Extraction → Distributor Detection → Pack Size Resolution → Product Matching → User Review → Price Update
```

### Matching cascade (per line item)

```
1. Exact SKU lookup in distributor_skus                      → auto-match (confidence 1.0)
2. Org-level custom mapping (org_product_mappings)           → auto-match (confidence 1.0)
3. Fuzzy name match against canonical_products (pg_trgm)
   - similarity > 0.85 → auto-match, save SKU mapping
   - 0.6–0.85         → suggest to user
4. Fuzzy match against user's own ingredients
5. Unmatched                                                 → queue for user review
```

### `ingredient_configurations` schema

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
