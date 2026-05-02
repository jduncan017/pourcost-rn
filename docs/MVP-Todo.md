# PourCost RN — MVP To-Do

_Last updated 2026-05-02._

Remaining work before the first submission. Delete a line when it's done; if it changes scope to post-MVP, move it to `feature-list.md` instead.

---

## Outstanding

### Pre-launch action items (Joshua)

- [ ] **PostHog production setup**. SDK is wired (autocapture + offline queue), funnel events fire (`onboarding_profile_complete`, `wells_picker_complete`, `onboarding_complete`, `first_ingredient_added`, `first_cocktail_added`, `cocktail_picker_complete`, `onboarding_cocktails_adopted`, `wells_intro_continue|skip`, `cocktails_intro_continue|skip`). Requires `EXPO_PUBLIC_POSTHOG_KEY` in `.env` (and `EXPO_PUBLIC_POSTHOG_HOST` if not US cloud) before launch — capture is a silent no-op without it. Project lives under DigitalNova Studio org, default project (id 315696). Confirm dashboard funnel renders end-to-end after first real install.
- [ ] **App Store screenshots**. Capture against the final dark theme. Requires the design to be frozen.
- [ ] **Final QA pass on the new size-form flow**. Add, edit, delete cycle, multi-size detail dropdown, "Bottle Size" ledger row, delete-in-use blocker, multi-select bulk delete.
- [ ] **App Store Connect closeout**. Paste Terms + Privacy URLs, set app version, screenshot upload.

### Detail page polish

- [ ] **Cocktail detail restructure** (mirror of ingredient-detail). SPECS / NUMBERS toggle (vs INFO / NUMBERS). Hero with icon + 3 lines (eyebrow, name, type subinfo); full-width below. Specs tab = recipe build, description, glass/garnish/technique. Numbers tab = StatCards, PourCostHero, suggested price with Apply, More Details list (replaces bottom drawer). Same primitives as ingredient page (Card, StatCard, ScreenTitle, DetailRow). ~30 min.
- [ ] **"Set as default size" affordance for ingredient configurations**. Schema already supports `is_default` on `ingredient_configurations` but no UI to switch which size is the primary. Two implementation paths proposed: (a) swap pattern — primary inline + configs as alternates, "Make this default" button swaps the values (no migration); (b) pointer pattern — add `default_configuration_id` column on ingredients (more flexible, requires migration). Lean (a) — simpler, fits existing model.

### Onboarding extras (deferred)

- [ ] **Goal selector + 3-screen app tour** (Phase B from the cocktail picker work). Optional first-run goal question ("What brought you here? Cost out drinks / Set menu prices / Just curious") that drives a 3-screen swipe tour explaining My Inventory, Cocktails, Quick Calculator. Hold until cocktail picker telemetry tells us where users actually drop off — could be unnecessary friction.
- [ ] **Inventory page filter chips: only show subtypes the user has**. Currently shows all `SPIRIT_SUBTYPES`/etc. regardless of usage. Should derive from current inventory so empty options don't appear.

### Architecture debt to pay

- [ ] **Canonical re-seed (Joshua)**. Splits `canonical_products` Whiskey rows into Bourbon / Rye / Scotch / Irish / Japanese subcategories, adds proper Vermouth subtypes. Joshua handling the larger seed before launch. After it lands: (1) update `SPIRIT_SUBTYPES` in `appConstants.ts` to expose the new whiskey styles as form chips, (2) retire the `nameKeyword` workaround in the wells picker (filters `subcategory='Whiskey' AND name ILIKE '%bourbon%'`), (3) retire `SUBTYPE_ALIASES` map for vermouth (Sweet ↔ Sweet Vermouth), (4) recheck the 30 library recipe slots: Sazerac → Rye, Daiquiri → White Rum, Manhattan → Rye or Bourbon, etc.
- [ ] **Build canonical enrichment job** (Tier 2 education data). Gemini 2.5 Flash + grounded search, populates `education_data JSONB` and queryable Tier 2 columns per category template (spirits / beer / wine / ingredients each have own structure). Flips `enrichment_status` to 'complete' on success. ~$13 for the 250-row bootstrap pass; pennies/month for ongoing trickle from invoice scans. Can ship after launch since Tier 1 carries the bartender-facing detail and education-mode UI degrades gracefully when Tier 2 fields are null.

### Onboarding & cocktail flow polish

- [ ] **Perfect onboarding + cocktail addition flow**. Open-ended punch list — turn into specifics as friction surfaces during QA. Likely items: copy polish on intro screens, double-check skip paths, verify the library browse → adoption flow lands correctly outside onboarding (just shipped as `cocktails-browse` / `cocktails-browse-prices` / `cocktails-browse-adopting`), audit haptics + animation timings, ensure `Bar Inventory` rename is consistent across all surfaces. ~2-4h once specifics are known.
- [ ] **Tutorial section in Learn tab** (cut from full multi-screen plan). Single "Getting Started" tutorial — 2-3 minute optional walkthrough of the 5 core screens (Cocktails, Bar Inventory, Calculator, Search, Settings). Highlighted as a green tab in Learn (matches the gold-tab pattern used elsewhere). Optional + dismissible. Skip the per-feature tutorials for V1.1 — once telemetry shows where users drop off, build tutorials targeted at those specific screens. ~3-4h.

### Library + adoption (V1.1 carryovers — most landed in MVP)

- [x] **Library browse UI** (post-onboarding). Shipped as the `cocktails-browse` flow reachable from the Cocktails Add chooser + empty-state CTA. Reuses the onboarding `CocktailPicker` + `MissingIngredientsForm` + adopting loader.
- [x] **Adopt flow UI**. Adopt flow shipped as part of the post-onboarding browse. User picks recipes → `analyzeRecipe` + `collectMissing` against current inventory → priced via `MissingIngredientsForm` → `adoptLibraryRecipes` writes the cocktails + missing ingredients.
- [ ] **Page-confusion fix** (deferred until specifics known). Friend testing surfaced confusion between cocktail vs ingredient detail screens. Eyebrow labels ("COCKTAIL" / "INGREDIENT" in distinct colors) added; further fixes pending a clip from another testing session.

### Polish ideas (defer to feature-list when ready)

- [ ] **Std-dev pour cost bar zones**. Replace the current ratio-distance color zones with proper std-dev-based bands so the bar's color zones reflect statistical distance from target instead of arbitrary buckets. Strong UX improvement; post-MVP per Joshua.

## Completed

### Schema + data foundation

- [x] **Migration 011 — Canonical Library Foundation**. Single migration covers `cocktail_ingredients` canonical refs (additive nullable FKs + CHECK + drop NOT NULL on `ingredient_id`), `canonical_products` ownership + Tier 2 education columns (`owner_type`, `owner_org_id`, `parent_company`, `founded_year`, `production_region`, `aging_years`, `education_data JSONB`), and new `received_recipes` + `received_recipe_ingredients` tables with RLS (user_id NULL = library, readable by all authenticated users; personal rows owner-only).
- [x] **Pre-seed canonical products** (~250 rows, Tier 1 fields). Four batched seed files: `001_canonical_ingredients.sql`, `002_canonical_spirits.sql`, `003_canonical_modifiers.sql`, `004_canonical_beer_wine.sql`. All rows `enrichment_status = 'pending'`.
- [x] **Seed library recipes** (30 classics). `005_library_recipes.sql`. Whiskey (Old Fashioned, Manhattan, Sazerac, Whiskey Sour, Boulevardier, Paper Plane, Penicillin, Mint Julep), gin (Negroni, Aviation, Tom Collins, French 75, Last Word, Bee's Knees, Gimlet, Bramble), vodka (Vesper, Espresso Martini, Cosmopolitan, Moscow Mule, White Russian, Bloody Mary), rum (Daiquiri, Mojito, Mai Tai, Pina Colada, Dark and Stormy, Painkiller), tequila (Margarita), other (Sidecar). Uses a `seed_library_recipe(...)` PL/pgSQL helper.

### Catalog UX

- [x] **Catalog-first ingredient creation**. New `app/ingredient-create.tsx` picker screen. All "Add Ingredient" entry points route here. Catalog search at top + "Create From Scratch" CTA below. Tapping a result prefills name, type, subtype, ABV, description, product size, and persists `canonical_product_id` on the saved ingredient.
- [x] **Education panel on ingredient detail**. New `EducationPanel` reads the linked canonical and renders Tier 1 fields (description, brand, origin, flavor notes) plus Tier 2 fields (production, mash bill, aging, master distiller, history, signature serves, food pairings) as they become available.
- [x] **Cocktail picker catalog CTA**. `ingredient-selector.tsx` empty-search and bottom-of-list nudge users toward the catalog ("Don't See It? Search Catalog"). Routes to `/ingredient-create`; new ingredients auto-select for the recipe on return.

### Detail screen polish

- [x] **"The Numbers" footer + bottom sheet on cocktail and ingredient detail**. Tappable footer ("THE NUMBERS / View more details" + chevron) opens the modal `BottomSheet` with full stat rows. Replaces previous inline Ledger sections.
- [x] **Eyebrow labels for page distinction**. Cocktail-detail shows "COCKTAIL" in gold; ingredient-detail shows "INGREDIENT" in blue. Reinforces the existing visual differences (Playfair italic vs default font, hero image vs typed icon tile).
- [x] **Pour Cost hero + Stats + Suggested Price reordering** (`cocktail-detail.tsx`). PourCostHero now sits above the StatCards (financial story first); recipe build below. Suggested Price row is hidden when pour cost is on target (uses shared `getPerformance` helper). Same on-target gate applied to ingredient-detail's Suggested Retail row.
- [x] **Simple mode pricing hidden**. Cocktail-detail simple mode hides Margin StatCard, per-ingredient cost in the Build column, and Suggested Price (already detailed-only). Ingredient-detail simple mode hides Margin (for-sale), Suggested Retail, the entire Purchase Price + Cost/Pour stats group (not-for-sale), Pour Cost hero, Price History, and The Numbers footer. Detailed mode unchanged.
- [x] **Ingredient detail stats moved to top** (no `marginTop: 'auto'`) to match cocktail-detail's information hierarchy.

### Form polish

- [x] **Catalog autocomplete persistence**. `SavedIngredient.canonicalProductId` wired through `IngredientRow`, `rowToIngredient`, `insertIngredient`, `updateIngredientById`.
- [x] **Pour size override pattern in ingredient form**. Pour size collapses to a "Using your default" summary with a "Customize" CTA when `pourSizeOverride` is set. On expand, label reads "Serving Pour Size" with helper "How much you sell per drink. Used for cost-per-pour math." Calculator behavior unchanged.
- [x] **Removed redundant bottom save button** on ingredient form (header pill is the only save action).

### List screen polish

- [x] **Add button text consistent**. Both cocktails and ingredients lists use "Add" (was "Create" / "Add").
- [x] **Dynamic list titles**. Cocktails: "Whiskey Cocktails by Cost (5)" reflecting active category + sort. Ingredients: "Vodka by Cost (4)" reflecting type + subtype + sort. Defaults to "Your Cocktails" / "Your Ingredients" when nothing is filtered or sorted.
- [x] **Multi-select button visibility fix**. Cancel button now persists when in selection mode even if a filter empties the list.

### Cross-cutting polish

- [x] **Subtype consistency with canonical seeds**. `BEER_SUBTYPES` switched from service-mode (Draft/Packaged) to beer styles (Lager, Pilsner, IPA, Pale Ale, Stout, Porter, Wheat, Sour, Belgian, Ale, Other). `WINE_SUBTYPES` added Fortified, dropped Orange. `NA_SUBTYPES` switched from delivery-mode to canonical-category set (Juice, Syrup, Mixer, Garnish, Dairy, Egg, Spice, Herb, Prepped, Other). Added Vermouth to `SPIRIT_SUBTYPES`. `mapCanonicalToType` updated to match.
- [x] **Fractions → decimals**. `volumeLabel` renders fractional ounces as decimal (`1.5 oz`, `0.75 oz`). `pourLabel` simplified to decimal output. `QUICK_POUR_SIZES` chip labels swapped from unicode fractions (`¼ ½ ¾`) to decimals (`0.25 0.5 0.75`). Conversions reference table left untouched (different context).
