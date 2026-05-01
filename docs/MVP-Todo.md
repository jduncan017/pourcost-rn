# PourCost RN — MVP To-Do

_Last updated 2026-04-25._

Remaining work before the first submission. Delete a line when it's done; if it changes scope to post-MVP, move it to `feature-list.md` instead.

---

## Outstanding

- [ ] **App Store screenshots**. Capture against the final dark theme. Requires the design to be frozen.
- [ ] **Final QA pass on the new size-form flow**. Add, edit, delete cycle, multi-size detail dropdown, "Bottle Size" ledger row, delete-in-use blocker, multi-select bulk delete.
- [ ] **App Store Connect closeout**. Paste Terms + Privacy URLs, set app version, screenshot upload.
- [ ] **Library browse UI**. Read-only list/grid of `received_recipes WHERE source = 'library'`. Filter by spirit type, tap to view full recipe with canonical-level ingredient data. Entry point: drawer item or tab on Cocktails page (TBD). No adopt button yet (ship as preview-only in V1, adopt is V1.1).
- [ ] **Build canonical enrichment job** (Tier 2 education data). Gemini 2.5 Flash + grounded search, populates `education_data JSONB` and queryable Tier 2 columns per category template (spirits / beer / wine / ingredients each have own structure). Flips `enrichment_status` to 'complete' on success. ~$13 for the 250-row bootstrap pass; pennies/month for ongoing trickle from invoice scans. Can ship after launch since Tier 1 carries the bartender-facing detail and education-mode UI degrades gracefully when Tier 2 fields are null.
- [ ] **Adopt flow UI** (likely V1.1). Per-ingredient prompt: "use existing inventory match / substitute from your inventory / add this ingredient to my library / skip". On confirm, creates a `cocktails` row and `cocktail_ingredients` rows using the user's real ingredient IDs. The original `received_recipes` row stays intact as the source reference (`adopted_cocktail_id` gets set). Heaviest remaining item; library can ship preview-only without it.
- [ ] **Page-confusion fix** (deferred until specifics known). Friend testing surfaced confusion between cocktail vs ingredient detail screens. Eyebrow labels ("COCKTAIL" / "INGREDIENT" in distinct colors) added; further fixes pending a clip from another testing session.

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
