# PourCost RN — MVP To-Do

_Last updated 2026-05-04._

Remaining work before the first submission. Delete a line when it's done; if it changes scope to post-MVP, move it to `feature-list.md` instead.

---

## Outstanding

### Pre-launch action items (Joshua)

- [ ] **PostHog production setup**. SDK is wired (autocapture + offline queue), funnel events fire (`onboarding_profile_complete`, `wells_picker_complete`, `onboarding_complete`, `first_ingredient_added`, `first_cocktail_added`, `cocktail_picker_complete`, `onboarding_cocktails_adopted`, `wells_intro_continue|skip`, `cocktails_intro_continue|skip`). Requires `EXPO_PUBLIC_POSTHOG_KEY` in `.env` (and `EXPO_PUBLIC_POSTHOG_HOST` if not US cloud) before launch — capture is a silent no-op without it. Project lives under DigitalNova Studio org, default project (id 315696). Confirm dashboard funnel renders end-to-end after first real install.
- [ ] **App Store screenshots**. Capture against the final dark theme. Requires the design to be frozen.
- [ ] **Final QA pass on the new size-form flow**. Add, edit, delete cycle, multi-size detail dropdown, "Bottle Size" ledger row, delete-in-use blocker, multi-select bulk delete.
- [ ] **App Store Connect closeout**. Paste Terms + Privacy URLs, set app version, screenshot upload.

### Onboarding extras (deferred)

- [ ] **Goal selector + 3-screen app tour** (Phase B from the cocktail picker work). Optional first-run goal question ("What brought you here? Cost out drinks / Set menu prices / Just curious") that drives a 3-screen swipe tour explaining My Inventory, Cocktails, Quick Calculator. Hold until cocktail picker telemetry tells us where users actually drop off — could be unnecessary friction.

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

### Form + pricing UX (2026-05-03 / 04)

- [x] **`SuggestedRetailInput` component**. Single input with two visual states: purple border + "Suggested" pill when displaying a computed value, plain border + "Use Suggested" reset pill once the user types. Replaces the old `AiSuggestionRow` + Apply pattern across cocktail-form, ingredient-form, and invoice-ingredient-setup. Generalized via `pillLabel`/`resetLabel` props so the same component drives "Inherited / Use Canonical" on override fields and "From Invoice / Reset to Invoice" on OCR'd costs. Auto-selects on focus while suggesting.
- [x] **Category cost priors for missing-ingredients pricing**. `src/lib/category-cost-priors.ts` returns a typical wholesale cost per (category, subcategory) anchored at a reference bottle size and scales linearly with the user's selected size. `MissingIngredientsForm` baselines each row with the prior, flips to manual on first keystroke. Lets users hit Save fast on items they don't have strong opinions about.
- [x] **Inherited / Use Canonical override fields on ingredient-form** (Detailed mode). Brand, Origin, Production Region, Parent Company, Founded, Aging, Flavor Notes — show purple "Inherited" pill while displaying the linked canonical's value; flip to manual on first keystroke; reset pill clears the override (saves NULL so the canonical fallback applies on display).
- [x] **Invoice ingredient-setup smart pricing**. Cost / Bottle is now editable with a "From Invoice" pill (was read-only `MetricRow`); Retail Price uses `SuggestedRetailInput` with the suggested-from-cost flow. Downstream math uses `effectiveBottleCost` / `effectiveRetail`.
- [x] **Required-field markers — consistent**. All inline ` *` in label strings replaced with the `TextInput` `required` prop (renders red asterisk via `colors.error`). Added `required` prop to `Dropdown` and `ChipSelector`. Marked Product Size, Cost, and Spirit subtype required on the ingredient form; subType validation enforced when the chosen type defines subtypes. Display Name on onboarding-profile gets the marker. Auth/password forms intentionally unmarked (every field required, marker would be noise).
- [x] **Pricing label/blurb cleanup on ingredient-form**. Removed the "Pricing" label + "Pour cost shown for the default size. View per-size analysis on the ingredient detail page." blurb. Reworded blurb now sits under the Pour Cost Hero: "Based on your default size. Each size has its own pour cost on the detail page."
- [x] **Latched pricing reveal**. `pricingRevealed` flips true once cost crosses zero and never resets. Multi-size hint hides; Other Sizes section + Pricing block stay visible even after the user clears the cost field. No more layout shift on backspace.
- [x] **"Set as default size" affordance for ingredient configurations**. Swap-pattern (option a). `setDefaultConfiguration` action on `ingredients-store` swaps `productSize`/`productCost` between the inline default and the chosen config (no schema change). `ingredient-size-form` exposes a "Set as default size" toggle that applies on save; the default's own page shows "(default size)" under the name instead of the toggle. Delete on the default opens a "Pick New Default" bottom sheet before completing.

### Cocktail detail restructure (2026-05-03)

- [x] **Cocktail detail restructure** (mirror of ingredient-detail). Removed the bottom-sheet "View More Details" pattern. New order: Identity hero → Menu Price/Margin StatCards → The Build → Notes → (detailed) PourCostHero → Suggested Price (gated on a real delta) → More Details inline `DetailRow` list. `pourLabel` now renders unitQuantity garnishes as a quantity-only string so we don't get "1 cherry Maraschino Cherry".
- [x] **Inventory filter chips: only show subtypes the user has**. Spirit keeps a curated `ALWAYS_VISIBLE_SPIRIT_SUBTYPES` set so users can pre-filter even with zero stock; the long tail (Mezcal, Brandy, Liqueur, etc.) only appears once the user owns one. Beer / Wine / Non-Alc subtypes derive entirely from current inventory.

### Defaults + settings (2026-05-04)

- [x] **Per-type default pour sizes**. `defaultPourSizes: Record<IngredientType, Volume>` in app-store with sensible per-type values (Spirit 1.5oz, Beer 12oz, Wine 5oz, Non-Alc 1oz, etc.). `IngredientInputs.applyDefaults` snaps to a chip matching the per-type default, falling back to the type's first chip — fixes the "switching to Beer then back to Spirit drops to 1oz" bug. New `settings-pour-sizes` screen with one row per type. Spirit slot mirrors the legacy single `defaultPourSize` for back-compat. Migration v3 (Zustand persist) + Supabase migration 017 (`default_pour_sizes JSONB`).
- [x] **Per-type default retail prices**. Parallel to pour sizes — `defaultRetailPrices: Record<IngredientType, number>` with Beer $6, Wine $10, Spirit $10, Non-Alc $4, Prepped $8, Garnish $2, Other $8. New `settings-retail-prices` screen. ingredient-detail / IngredientListItem fall back to per-type when no override on the ingredient. Migration v4 + same Supabase migration 017.
- [x] **Sort label clarity**. "Most → Least" → "Largest Pour First", "Least → Most" → "Smallest Pour First", "Cost High → Low" → "Most Expensive First". Added missing "Manual (drag to reorder)" option so users can return to manual after picking a sort. Subtitle reworded.
- [x] **Migration 017 — per-type defaults sync**. Adds `default_pour_sizes` + `default_retail_prices` JSONB columns to `profiles`. `loadProfile` merges server values with in-app sensible defaults so partial maps still resolve. `saveProfile` writes both. CLI-only push from this point onward — no more MCP `apply_migration`.

### Copy polish pass (2026-05-04)

- [x] **Em-dashes purged from user-facing copy**. settings-tiers, ingredients header, onboarding-wells-intro, settings-calculations, batch placeholder, invoice-line-edit placeholder, offline-queue toast, recipe-adopter error.
- [x] **Mechanism jargon untangled**. "pour cost performance bar" → "pour cost meter"; "spirit tier ladder" → "Spirit Price Tiers"; "ingredient's per-pour math" → "ingredient's cost per pour"; "Low confidence match" → "We're not sure this is the right match"; "We'll wire each one up" → "We'll match each one"; "Bar finance terms: COGS…" → "Plain-language definitions for pour cost, margin, and the rest."
- [x] **Marketing fluff removed**. "powers everything else" reworded; "with live cost and margin" → "Cost and margin update with your ingredients"; "build out your Bar Inventory" → "start costing cocktails"; both "60 seconds" claims removed; "unlock cross-device sync" → "so your bar syncs across devices".
- [x] **Awkward sentences fixed**. "Changes save when you tap Save" deleted; "Can't verify your current password without an email on your account" → "We need an email on your account to verify your current password"; sub-floor / "good GM" reworded; verbose ice-dilution + delete-default copy tightened.
- [x] **Empty states tightened**. EmptyIngredients / EmptyCocktails / EmptyCalculations now one short sentence each (down from 15+ words).

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
