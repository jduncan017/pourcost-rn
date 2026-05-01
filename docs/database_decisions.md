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

### Wells

Wells are configured at the bar level, not stored as a flag on canonical_products. Each bar has:

- well_vodka → points to one canonical_products row
- well_gin → points to one canonical_products row
- well_bourbon → points to one canonical_products row
- (etc.)

If a bar wants to use Pappy as their well, that's their call. The system does not gatekeep what counts as well-eligible.

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
