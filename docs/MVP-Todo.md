# PourCost RN — MVP To-Do

_Last updated 2026-04-21._

---

## Pre-submit blockers

### Auth

1. **Google Sign-In broken** — persistent "nonces mismatch" from Supabase despite multiple approaches. Root issue: `@react-native-google-signin/google-signin` v15 doesn't expose nonce control in `signIn()`. Google may be embedding a nonce in the ID token that we can't intercept cleanly. Needs a fresh approach — likely switch to `GoogleOneTapSignIn` (supports custom nonce) or decode the JWT and forward whatever nonce Google embedded.

2. **Sign in with Apple — Apple Developer Portal** (required before device build works end-to-end):
   - [ ] Enable "Sign In with Apple" capability on App ID `com.joshuaduncan.pourcostdev`
   - [ ] Create a Services ID with Return URL `https://<project-ref>.supabase.co/auth/v1/callback`
   - [ ] Create a private key (`.p8`) — download it, note Key ID + Team ID

3. **Sign in with Apple — Supabase Dashboard**:
   - [ ] Auth → Providers → Apple → enable
   - [ ] Paste bundle IDs as allowed audiences
   - [ ] Generate JWT client secret from `.p8` + Key ID + Team ID; paste into Secret Key field
   - [ ] Calendar reminder to rotate secret every 6 months

4. **Apple token revocation on account delete** (App Store Guideline 5.1.1(v)):
   - Capture and persist Apple's `refresh_token` at sign-in
   - Update `supabase/functions/delete-account/index.ts` to POST to `https://appleid.apple.com/auth/revoke` before deleting user
   - Skip silently for non-Apple users

5. **Deploy delete-account Edge Function** — `supabase functions deploy delete-account`, then smoke test against a throwaway account.

### Submission mechanics

6. **Verify Supabase Auth providers** configured in dashboard:
   - Facebook App ID `1522826757747836` with Supabase redirect URI in Facebook app settings
   - Google OAuth client ID
   - Apple provider (see above)

7. **Verify #18 cascade behavior** — ingredient edits may leave `cocktail_ingredients.cost` stale. Trace the edit-save path in `src/lib/supabase-writes.ts`; fix if snapshot stays stale.

8. **App Store screenshots** — capture at submission time using real RN app.

9. **Paste policy URLs into App Store Connect** at submission time:
   - Terms: `https://www.pourcost.app/terms`
   - Privacy: `https://www.pourcost.app/privacy`

### App transfer

The original iOS app was rejected in 2023 and never resubmitted — likely not in "Ready for Sale" status, which blocks transfer.

- **Path A — transfer first**: Donald (Account Holder) initiates. May require resubmitting the Obj-C/Swift app first. High friction.
- **Path B — new listing**: Ship RN rebuild as fresh listing under `com.pourcost.app` from Joshua's account. Lose 2017 ratings, gain speed. Pursue transfer later.

Path B is the pragmatic launch path given competitive pressure.

---

## UX polish backlog

- Network error states / retry UI — `useNetworkStatus` exists but no retry UX on failed loads/saves.
- Navigation race condition guard — rapid double-tap on nav actions can crash. Add throttle/lock on entry points.
- Animations pass — `react-native-reanimated` installed but 0 imports in `app/` or `src/`. Transitions still stock.
- Light-mode polish — manual UI sweep needed.
- Onboarding hex-color spot-check — not exhaustively verified.

---

## Invoice scanning — remaining work

### Round 2.5: Product Normalization & Configurations

- [ ] Product name normalization — strip proof numbers, expand abbreviations (TEQ→Tequila, etc.)
- [ ] Extract bottle size from BPC into `Volume` type (e.g. `"6 - 1.0L"` → `Volume{ml:1000}`, `pack_size:6`)
- [ ] Wire `ingredient_configurations` into price update flow (create/update configs per size/pack)
- [ ] Handle "same product, different size" matching — 750ml / 1.0L / 1.75L map to one ingredient
- [ ] Deposit fee / non-product line filtering
- [ ] Review screen: show bottle size and pack info clearly

**Schema prerequisite**: `ingredient_configurations` table not yet migrated. New migration needed before wiring.

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

Not yet applied (needed for Round 2.5 and prepped ingredients):
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

Migration path: current `product_size`/`product_cost` on `ingredients` become the initial default configuration.
