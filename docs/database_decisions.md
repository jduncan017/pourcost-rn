# PourCost Database Decisions

> Source-of-truth document for canonical_products schema, taxonomy, and data architecture decisions.
> Update this whenever a decision changes or a new architectural commitment is made.

**Last updated:** 2026-04-30

---

## Table of Contents

1. [Two-Layer Architecture](#two-layer-architecture)
2. [Subcategory Taxonomy](#subcategory-taxonomy)
3. [Schema Field Roles](#schema-field-roles)
4. [Recipe Slot Specificity](#recipe-slot-specificity)
5. [Data Sourcing Strategy](#data-sourcing-strategy)
6. [Validity & Update Strategy](#validity--update-strategy)
7. [User-Added vs System-Curated Products](#user-added-vs-system-curated-products)
8. [Open Questions / Future Work](#open-questions--future-work)

---

## Two-Layer Architecture

The product database operates on a **slot/fill** model:

- **Generics (no brand):** Recipe ingredient slots. "Bourbon," "Lime Juice," "Simple Syrup," "Egg White." These are what cocktail recipes reference.
- **Branded products (has brand):** Specific products bars stock. "Buffalo Trace," "Maker's Mark," "Casamigos Reposado."

When a bar imports a recipe, the system fills generic slots with that bar's configured products. Each bar can have different distributors, brands, or fresh-vs-bottled choices for the same generic ingredient.

**Why this matters:**

- Recipe portability across bars
- Per-bar cost calculation flexibility (a bar's "lime juice" might be fresh-squeezed or Sysco)
- Wells are configured at the bar level (each bar tags one canonical product as their well bourbon, well vodka, etc.)

---

## Subcategory Taxonomy

### Decision: Single-field subcategory, granular and consistent

We use **category** + **subcategory** as the primary structural taxonomy. We do NOT use a separate `spirit_style` field. Regional/style nuance (Islay, Highland, Jamaican rum, etc.) lives in `production_region` instead.

### Locked subcategory list

#### Spirit

- Bourbon
- Tennessee Whiskey
- Rye Whiskey
- Scotch
- Irish Whiskey
- Japanese Whisky
- Canadian Whisky
- American Whiskey _(catch-all for non-bourbon American)_
- Other Whiskey _(world whiskies, etc.)_
- Vodka
- Gin
- Tequila Blanco
- Tequila Reposado
- Tequila Anejo
- Tequila Extra Anejo
- Tequila Cristalino
- Mezcal Joven
- Mezcal Reposado
- Mezcal Anejo
- White Rum
- Gold Rum
- Aged Rum
- Dark Rum
- Spiced Rum
- Overproof Rum
- Rhum Agricole
- Cognac
- Armagnac
- American Brandy
- Pisco
- Calvados
- Aquavit
- Cachaça
- Soju
- Shochu
- Baijiu
- Absinthe
- Pastis

#### Liqueur

Liqueurs use **flavor-as-subcategory** because that's the most useful axis for discovery. Examples:

- Amaro
- Aperitif Bitter (Aperol, Campari)
- Cherry (Maraschino, Cherry Heering)
- Coffee (Kahlua, Mr. Black)
- Orange (Cointreau, Grand Marnier, Triple Sec)
- Hazelnut (Frangelico)
- Herbal (Chartreuse, Bénédictine, Strega)
- Anise (Sambuca, Ouzo)
- Floral (St-Germain, Crème de Violette)
- Berry (Chambord, Crème de Cassis)
- Cacao
- Mint
- Cream
- Almond
- Citrus (Limoncello)
- Vanilla Anise (Galliano)
- Spiced (Falernum, Allspice Dram)

#### Other categories (existing, no major changes)

- Wine: Red, White, Sparkling, Fortified
- Beer: Lager, IPA, Stout, Pale Ale, Wheat, Farmhouse, etc.
- Vermouth: Dry, Sweet, Bianco, Aperitif Wine
- Bitters: Aromatic, Orange, Specialty, Floral, Anise
- Mixer: Carbonated, Tonic, etc.
- Juice: Citrus, Tropical, etc.
- Garnish: Citrus, Herb, Rim, etc.
- Syrup: Plain, Flavored, etc.
- Dairy: Cream, Plant Cream
- Spice
- Egg
- Prepped (oleo saccharum, infusions, etc.)

### Why this taxonomy

**Spirits use structural subcategories** because cocktail recipes need them at this granularity. A Daiquiri requires White Rum, not just any rum. A Manhattan benefits from Rye specificity. Bartenders filter by bourbon-vs-rye constantly.

**Liqueurs use flavor subcategories** because liqueurs are most usefully sorted by what they taste like. Searching "cherry" should find Maraschino. The structural axis (sugar + alcohol + flavor) is uniform across the category and not useful for filtering.

**This inconsistency is intentional and correct.** It reflects how bartenders actually think about each category.

### Rules for the taxonomy

1. Subcategory is **single-value** (not an array)
2. Subcategory is **a strong hint, not a hard constraint** - used for suggestions and substitutions, not blocking
3. The list above is locked for V1. Add new subcategories only when there's a clear need (3+ products that don't fit existing options).
4. Every canonical product MUST have a category and subcategory.

---

## Schema Field Roles

### Required fields

| Field         | Purpose            | Notes                                    |
| ------------- | ------------------ | ---------------------------------------- |
| `name`        | Display name       | Should match how bartenders reference it |
| `category`    | Top-level taxonomy | Spirit, Liqueur, Wine, Beer, etc.        |
| `subcategory` | Granular type      | From locked list above                   |
| `abv`         | Alcohol by volume  | Used for cost calculations               |

### Optional/enrichment fields

| Field               | Purpose                                                       | Source priority                     |
| ------------------- | ------------------------------------------------------------- | ----------------------------------- |
| `brand`             | Brand name                                                    | Null for generics                   |
| `default_sizes`     | Common bottle sizes                                           | JSONB array of `{ml, kind}` objects |
| `origin`            | Country of origin                                             | Flash enrichment                    |
| `production_region` | Regional sub-classification (Islay, Highland, Jamaican, etc.) | Flash enrichment                    |
| `description`       | Prose description for display                                 | Flash enrichment                    |
| `flavor_notes`      | Searchable flavor descriptors (array)                         | Flash enrichment                    |
| `image_url`         | Product image                                                 | Future                              |
| `parent_company`    | Owning company                                                | Optional                            |
| `founded_year`      | Brand founding year                                           | Education content only              |
| `aging_years`       | Age statement in years                                        | Where applicable                    |
| `education_data`    | JSONB for misc educational content                            | Flexible                            |

### Operational fields

| Field               | Purpose                                                   |
| ------------------- | --------------------------------------------------------- |
| `id`                | UUID primary key                                          |
| `enrichment_status` | Tracks Flash enrichment state (pending, complete, failed) |
| `enriched_at`       | When Flash enrichment last ran                            |
| `created_at`        | Row creation                                              |
| `updated_at`        | Last update                                               |
| `owner_type`        | System-curated vs user-added                              |
| `owner_org_id`      | If user-added, which bar created it                       |

### Search behavior

Search must hit:

- `name` (primary, weighted highest)
- `brand`
- `subcategory`
- `flavor_notes` (array)
- `production_region`

Example: typing "cherry" should match:

- Maraschino (subcategory hit)
- Cherry Heering (name hit)
- Anything with "cherry" in flavor_notes

---

## Recipe Slot Specificity

Recipes reference **canonical generics** at the appropriate level of granularity for that drink.

### Examples

| Cocktail          | Slot    | Subcategory required   |
| ----------------- | ------- | ---------------------- |
| Daiquiri          | rum     | White Rum              |
| Jungle Bird       | rum     | Dark Rum               |
| Mai Tai           | rum 1   | Aged Rum               |
| Mai Tai           | rum 2   | Overproof Rum          |
| Manhattan         | whiskey | Rye Whiskey            |
| Old Fashioned     | whiskey | Bourbon OR Rye Whiskey |
| Margarita         | tequila | Tequila Blanco         |
| Tommy's Margarita | tequila | Tequila Reposado       |

### Substitution behavior

When a bar lacks the specified subcategory, the system suggests alternatives in this fallback order:

1. **Same subcategory:** Other products with the same subcategory tag
2. **Related subcategories:** Hand-curated map (e.g., Rye → Bourbon, White Rum → Gold Rum)
3. **Same category:** Any product with same top-level category
4. **Manual override:** User can always pick anything

The system surfaces a "substituted" indicator so the bartender knows the drink will taste different. This is **suggestions, not enforcement.** Users can always override.

### Onboarding adoption matching (current implementation)

The onboarding cocktail picker uses the same logic when adopting library recipes into the user's bar (`src/lib/library-recipes.ts` → `resolveIngredient` + `src/lib/wells.ts` → `subTypeMatches`):

1. **Exact canonical match** — user has the exact `canonical_product_id` the recipe references
2. **Subcategory match via `subTypeMatches`** — runs even when canonical_product_id is set, so brand-specific recipes still resolve to the user's same-subcategory product (e.g., Manhattan referencing Carpano Antica matches the user's Sweet Vermouth well)
3. **Family fallback** — Whiskey family ([Whiskey, Bourbon, Rye, Scotch, Irish, Japanese, Canadian]) and Rum family ([Rum, White Rum, ..., Overproof Rum]) are interchangeable for adoption purposes. Tequila and Mezcal are siblings but NOT auto-substituted.
4. **Vermouth aliases** — `subTypeMatches` bridges canonical `subcategory='Sweet'` to user `sub_type='Sweet Vermouth'` (and `'Vermouth'` generic). Same for Dry. This is a **temporary alias map** — should disappear when SPIRIT_SUBTYPES + wells.ts subTypes align with the locked taxonomy below.
5. **Staple fallback** — items in `STAPLE_NAMES` (lime juice, simple syrup, angostura, club soda, etc.) auto-add at $0
6. **needsPrice** — anything else surfaces in the missing-ingredients screen for the user to price

### Wells

Wells are configured at the bar level, not stored as a flag on canonical_products. Each bar has:

- well_vodka → points to one canonical_products row
- well_gin → points to one canonical_products row
- well_bourbon → points to one canonical_products row
- (etc.)

If a bar wants to use Pappy as their well, that's their call. The system does not gatekeep what counts as well-eligible.

**Current implementation:** wells are stored as `ingredients.is_well = true` rows (migration 012). Each row's `sub_type` declares what category that well fills (`Vodka`, `Whiskey`, etc.). Family fallbacks (above) decide which recipe slots a given well can satisfy.

**Default well categories shown in onboarding** (the 5 universal ones — Vodka, Gin, Rum, Tequila, Whiskey). Bourbon, Rye, Scotch, Irish, Japanese, and the rum subtypes live behind the "Add more wells" expander for bars that differentiate. **Whiskey covers bourbon for default-only bars** via the family fallback — they don't need a separate Bourbon well unless they actually stock one.

---

## Data Sourcing Strategy

### Initial seed (V1.1)

| Source                      | Coverage                                                | Status                           |
| --------------------------- | ------------------------------------------------------- | -------------------------------- |
| Hand-built canonical seed   | 301 products (133 generics + 168 branded)               | Complete                         |
| NC ABC quarterly price book | ~2,130 unique branded spirits/liqueurs                  | Cleanup complete, awaiting merge |
| Manual gap-fill             | Beer, bitters, vermouth/aperitif wines NC doesn't carry | TODO                             |

NC ABC was chosen over PLCB (Pennsylvania) because:

- NC publishes structured data (CSV-equivalent), PLCB only publishes PDFs
- NC's coverage is sufficient for V1.1 launch (~2,000 products)
- We can layer PLCB or other sources later if specific gaps emerge

### Categories not in NC ABC

NC ABC does not carry:

- Beer (Modelo, Corona, Heineken, Stella, Pacifico, Tecate, Sierra Nevada, Guinness, etc.)
- Bitters (Angostura, Peychaud's, Fee Brothers, Bittermens, Regan's, Scrappy's)
- Most vermouth and aperitif wines (Lillet, Dolin, Cinzano, Carpano, Cocchi, Bonal, Punt e Mes)
- Some specific brands (Stolichnaya, Hangar One, St. George Absinthe, Plantation, Smith and Cross)

These need separate sourcing or hand-curation.

### Future updates (post-launch)

Primary update mechanism: **invoice scans from users.**

Each invoice upload provides:

- New SKUs not yet in canonical_products
- Confirmation that existing SKUs are still in market
- Real wholesale pricing per region (stored at ingredient_configurations level, not canonical_products)
- Velocity signals (which products bars actually buy)

Secondary mechanism: **user-flagged corrections.**

Per-field flagging on canonical_products. Flags go to a moderation queue, not direct edits. Multiple flags on the same field on the same product is a strong signal vs single-user error.

---

## Validity & Update Strategy

### What changes vs what doesn't

| Field                  | Change frequency                            | Update mechanism                                         |
| ---------------------- | ------------------------------------------- | -------------------------------------------------------- |
| ABV                    | Rarely (only for relaunches/reformulations) | User flag → review                                       |
| Origin / Region        | Never                                       | Static                                                   |
| Brand / Parent company | Rare (acquisitions)                         | Manual update                                            |
| Description            | Rare                                        | Manual update                                            |
| Flavor notes           | Rare                                        | Manual update                                            |
| Default sizes          | Occasional (new sizes added)                | Invoice scan signal                                      |
| Pricing                | Constant                                    | NOT in canonical_products - lives at configuration layer |
| Distributor            | Constant                                    | NOT in canonical_products - lives at configuration layer |
| Availability           | Constant                                    | NOT in canonical_products - lives at configuration layer |

### Provenance tracking

Each enrichment field should track:

- `enrichment_source` (e.g., "nc_abc_2026q2", "flash_2026q2", "manual_edit", "user_flag")
- `enriched_at` timestamp

This lets us track data quality over time and prioritize what gets re-enriched.

### Re-enrichment cadence

- Static fields (origin, ABV, brand): only on user flag
- Dynamic-ish fields (default_sizes, regional availability): quarterly via invoice signal aggregation
- Description/flavor_notes: only when explicitly improved

---

## User-Added vs System-Curated Products

### Required fields differ by ownership

**System-curated rows** (the ~2,400+ from initial seed):

- All enrichment fields populated where possible
- Higher trust level for displaying tasting notes, regions, etc.

**User-added rows** (a bar adds something obscure not in our DB):

- Required: name, category, subcategory, ABV
- Everything else optional/nullable
- Flagged in `owner_type` so we can identify them
- Eligible for promotion to system-curated if validated by multiple bars

### User-added review pipeline

When a user adds a custom product:

1. Stored with their `owner_org_id` and `owner_type='user'`
2. If multiple bars create similar products (fuzzy match), surface for moderation
3. Validated user products can be merged into system-curated catalog
4. Original users keep their reference; canonical version supersedes future references

This is post-V1 work but worth designing the schema for.

---

## Open Questions / Future Work

### Likely additions for V2

- **`spirit_style` field** for Scotch regions, gin styles, etc. Skipped for V1 because `production_region` covers it adequately. Add when filtering at this granularity becomes a real user request.
- **Tags array** for orthogonal classifications (cocktail role, season, occasion). Skipped for V1 because subcategory + flavor_notes covers most use cases.
- **Cocktail associations** - which canonical products appear in which classic cocktails. Useful for discovery but expensive to maintain. Probably belongs in a separate join table.
- **Image URLs** - product images. Need a sourcing strategy and storage plan.

### Decisions still pending

- Wine subcategory granularity: do we need region/varietal subcategories, or is "Red/White/Sparkling/Fortified" enough?
- Beer subcategory: how granular? IPAs alone could split into 6+ styles.
- How to handle limited releases / single barrels at the canonical level (probably skip - they're too transient)

### Things to watch for after launch

- Does the substitution suggestion logic feel right to bartenders, or is it too aggressive / not aggressive enough?
- Are there subcategories that get crowded and need splitting (e.g., "Herbal" liqueurs)?
- Are there subcategories that are too granular and rarely used?
- How often do users add custom products? High volume = signal we have catalog gaps.

---

## Decision Log

| Date       | Decision                                                | Rationale                                                                         |
| ---------- | ------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 2026-04-30 | Single subcategory field, no spirit_style               | Simpler, consistent across categories, regional nuance lives in production_region |
| 2026-04-30 | Liqueurs use flavor as subcategory                      | Matches how bartenders search; structural axis isn't useful for liqueurs          |
| 2026-04-30 | Wells configured at bar level, not flagged on canonical | Bar autonomy; no gatekeeping what counts as well-eligible                         |
| 2026-04-30 | NC ABC chosen as primary external source                | Clean structured data; PLCB is PDF-only                                           |
| 2026-04-30 | Subcategory is suggestion, not constraint               | Substitution should help, not block                                               |
| 2026-04-30 | Mezcal separate from Tequila (with own subcategories)   | Different product class; bartenders treat them differently                        |
| 2026-04-30 | Bourbon NOT a default well — Whiskey covers it          | Most bars don't differentiate at the well level; family fallback handles bourbon recipes from a Whiskey well. Bourbon stays available behind "Add more wells" for bars that do differentiate. |
| 2026-04-30 | Family fallback enabled for adoption (not strict mode)  | Onboarding shouldn't ask the user to add a Bourbon when they already have a Whiskey well. Substitutions surface a "substituted" indicator post-V1.1. |
| 2026-04-30 | Library recipes prefer generic canonicals               | Manhattan asks for "Sweet Vermouth" not "Carpano Antica Formula"; brand specifics only when the brand IS the recipe (Sazerac requires Peychaud's). Seed 006 patches existing recipes. |
| 2026-04-30 | Bloody Mary deferred until prep builder ships          | Bloody Mary cost depends on whether bar mixes from scratch or buys mix; can't price honestly without the prep builder. Hidden from picker via `HIDDEN_RECIPE_NAMES` + removed in seed 006. |
| 2026-04-30 | TEMPORARY: vermouth subType aliases                    | Wells use sub_type='Sweet Vermouth'/'Dry Vermouth'; canonical uses subcategory='Sweet'/'Dry'. `SUBTYPE_ALIASES` map bridges them. Should disappear when SPIRIT_SUBTYPES + wells.ts align with the locked taxonomy below. |
| 2026-04-30 | TEMPORARY: nameKeyword filter for wells search         | Wells rows for Bourbon/Rye/Scotch/Irish/Japanese filter `subcategory='Whiskey' AND name ILIKE '%bourbon%'` (etc.) until canonical re-seed splits Whiskey into the locked taxonomy subcategories. Same for rum subtypes. |
| 2026-05-02 | Recipe pour-size names use singular `dash`            | Display layer doesn't pluralize. "2 dash" not "2 dashes". See "Recipe pour-size naming conventions" section below. |
| 2026-05-02 | Garnish unitQuantity displays count only on detail    | Volume.name stores `'1 cherry'` for fallback (pour picker, batch screen) but cocktail-detail's Build column renders just the quantity, with the ingredient name in col 2. Prevents "1 cherry Maraschino Cherry" duplication. |

---

## Recipe pour-size naming conventions

The `cocktail_ingredients.pour_size` JSONB stores a `Volume`. The `name` field on `namedOunces` and `unitQuantity` variants is a free string today (no schema-level enum), but it surfaces directly in the cocktail-detail "Build" column. Stick to these conventions when authoring seed library recipes (`005_library_recipes.sql` or future expansions) or any programmatic recipe creation.

### Bitters / barspoon / rinse — `kind: 'namedOunces'`

| Pour | Use this name | Avoid |
|---|---|---|
| 1 dash | `'dash'` | `'1 dashes'`, `'1 dash'` |
| 2 dash | `'2 dash'` | `'2 dashes'` |
| 3 dash | `'3 dash'` | `'3 dashes'` |
| 1 barspoon | `'bspn'` | `'1 bspn'`, `'barspoon'` |
| 2 barspoon | `'2 bspn'` | `'2 barspoons'` |
| Rinse (e.g. absinthe) | `'Rinse'` | `'Wash'`, `'splash'` |

Always **singular `dash`** — even for counts > 1 ("2 dash" not "2 dashes"). The detail-page renderer doesn't pluralize; the ingredient name in column 2 carries the full identity.

### Garnishes — `kind: 'unitQuantity'`, `unitType: 'oneThing'`

| Pour | Use this name | Why |
|---|---|---|
| 1 cherry | `name: '1 cherry'`, `quantity: 1` | The detail page renders only the quantity (`'1'`); the noun comes from the ingredient name (`'Maraschino Cherry'`). Avoid duplicating the noun in the volume name. |
| 1 peel | `name: '1 peel'`, `quantity: 1` | Display reads "1 Orange Peel". |
| 1 twist | `name: '1 twist'`, `quantity: 1` | Display reads "1 Lemon Twist". |
| 1 wedge | `name: '1 wedge'`, `quantity: 1` | Display reads "1 Lime Wedge". |

Rule: the volume's `name` stores the descriptive form for fallback contexts (cocktail-form pour picker, batch screen), but the cocktail-detail Build column ignores the noun and shows just `quantity`.

### Cans / packs — `kind: 'unitQuantity'`, `unitType: 'oneCanOrBottle'`

`name` stays descriptive (`'6 pack'`, `'12 pack'`) since it conveys size, not just count. Detail page renders the full name.

### Validation

The data model accepts arbitrary strings on the `name` field. User-facing pickers (`QUICK_POUR_SIZES`, `OTHER_POUR_SIZES` in `appConstants.ts`) provide a controlled set, so user-built cocktails can't introduce bad strings. **Risk surface = seed data + future programmatic recipe creation** (library expansion, AI-generated recipes, imports).

If quirky names start appearing post-launch, options to lock down:
- Add a `VALID_NAMED_OUNCES_NAMES` constant and validate at insert time in `recipe-adopter.ts` / the seed helper.
- Migrate to a typed enum union on the `name` field for `namedOunces`. Ship-blockable; do post-launch when seed authoring patterns are clear.
