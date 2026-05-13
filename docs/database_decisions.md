# PourCost Database Decisions

> Source-of-truth document for canonical_products schema, taxonomy, and data architecture decisions.
> Update this whenever a decision changes or a new architectural commitment is made.

**Last updated:** 2026-05-09

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

#### Spirit (49 subcategories)

**Whiskey family** (9):

- Bourbon
- Tennessee Whiskey
- Rye Whiskey
- Scotch
- Irish Whiskey
- Japanese Whisky
- Canadian Whisky
- American Whiskey _(catchall for non-bourbon American whiskeys)_
- Other Whiskey _(world whiskies that don't fit above)_

**Vodka, Gin** (8):

- Vodka: Plain
- Vodka: Flavored _(citrus, vanilla, berry, cucumber, pepper, Zubrowka/bison-grass, etc.)_
- Gin: London Dry
- Gin: Plymouth
- Gin: Old Tom
- Gin: Genever
- Gin: Navy Strength
- Gin: Modern _(covers Hendrick's, Empress 1908, contemporary botanicals; "New Western" style)_

Vodka splits Plain/Flavored because flat Vodka silently mismatches recipes — an orange-vodka recipe shared between bars would match a plain-vodka well in the receiving bar with no warning. The Plain/Flavored split forces a substitution decision at the subcategory layer. Finer flavor granularity (vanilla vs citrus vs berry within Flavored) is handled by `flavor_notes` Gemini tagging + the similarity engine, not by adding more subs.

**Tequila** (5):

- Tequila Blanco
- Tequila Reposado
- Tequila Anejo
- Tequila Extra Anejo
- Tequila Cristalino

**Mezcal** (3):

- Mezcal Joven
- Mezcal Reposado
- Mezcal Anejo

**Other agave-and-adjacent** (2):

- Other Agave _(Raicilla, Bacanora, future agave-derived spirits not yet promoted to their own subcategory)_
- Sotol _(not technically agave; Dasylirion-based, but stocked alongside agave spirits)_

**Rum family** (9):

- White Rum
- Gold Rum
- Aged Rum
- Dark Rum
- Spiced Rum
- Overproof Rum
- Rhum Agricole
- Cachaça
- Other Rum _(catchall for Clairin, Batavia Arrack, Aguardiente, etc.)_

**Brandy family** (5):

- Cognac
- Armagnac
- Calvados
- Pisco
- Brandy _(catchall for Spanish, German, fruit brandies / eau-de-vie)_

**East Asian / Nordic** (4):

- Aquavit
- Soju
- Shochu
- Baijiu

**Anise spirits** (2):

- Absinthe
- Pastis

**Ready-to-drink** (1):

- RTD _(canned cocktails and premixed bottles: High Noon's cocktail line, On The Rocks, Cutwater, Long Drink. NOT hard seltzers — those live under Beer > Hard Seltzer)_

**Catchall** (1):

- Other Spirit _(for niche spirits below the volume threshold for their own subcategory: Korn, Singani, Marc, Slivovitz, and other regional spirits without an obvious home)_

#### Liqueur (20 subcategories)

Liqueurs use **flavor-as-subcategory** because flavor is the filter axis bartenders search by. Brand-level differentiation (Cointreau vs Grand Marnier, Maraschino vs Cherry Heering) is handled at the canonical_product_id and substitution layers, not at the subcategory layer.

- Orange _(Cointreau, Grand Marnier, Triple Sec, Curaçao, Pierre Ferrand Dry Curaçao)_
- Citrus _(Limoncello, Pamplemousse, lemon and grapefruit liqueurs)_
- Cherry _(Cherry Heering, Maraschino, Cherry brandy/liqueur)_
- Berry _(Chambord, Crème de Cassis, Crème de Framboise, Crème de Mûre, Sloe Gin)_
- Stone Fruit _(Peach Schnapps, Apricot Liqueur)_
- Tropical _(Passion fruit, Mango, Banana, Lychee, Coconut, Pineapple)_
- Herbal _(Chartreuse, Bénédictine, Strega, Drambuie, Galliano)_
- Anise _(Sambuca, Ouzo)_
- Coffee _(Kahlúa, Tia Maria, Mr. Black, Mozart Coffee)_
- Cream _(Bailey's, RumChata, Carolan's)_
- Almond _(Disaronno, Lazzaroni, Luxardo Amaretto, Adriatico)_
- Hazelnut _(Frangelico, Capucello)_
- Cacao _(Crème de Cacao white/dark, Mozart Chocolate, Godiva)_
- Floral _(St-Germain, Crème de Violette, Rose, Lavender)_
- Mint _(Crème de Menthe white/green, Branca Menta)_
- Vanilla _(Tuaca, Licor 43)_
- Spiced _(Falernum, Allspice Dram, Tingala, Domaine de Canton ginger, Becherovka)_
- Aperitif Bitter _(Aperol, Campari, Cynar, Suze, Salers)_
- Amaro _(Fernet Branca, Averna, Montenegro, Nonino, Ramazzotti, Jägermeister, Lucano)_
- Other _(catchall)_

**Edge-case placements (locked):**

- Sloe Gin → Berry (it's a liqueur made with sloe berries on a gin base, not actually gin)
- Drambuie → Herbal (Scotch-honey-herbal, herbal botanicals dominate)
- Becherovka → Spiced (cinnamon-anise-herbal; spiced character dominates)
- Cynar → Aperitif Bitter (artichoke-bitter; modal use is aperitif)
- Galliano → Herbal (vanilla-anise-herbal; recipe-specific use captured at canonical_product_id)

**Liqueur chip layer policy:** the Liqueur top-level umbrella does NOT render chip filters by default. Most bars carry low volume per liqueur subcategory, so chip filtering offers little value. Discovery happens via search (name + flavor_tags). Subcategories still drive recipe slot definition, catalog browse, wells (when added), and reporting. UI can flip on conditional chip rendering later if usage signal warrants.

#### Wine (8 subcategories + enrichment fields)

- Red
- White
- Orange _(skin-contact whites, an emerging category in natural-wine bars)_
- Rosé
- Sparkling _(includes Champagne, Prosecco, Cava, Cremant, Pet-Nat — all méthodes ancestrale and traditionelle)_
- Fortified
- Sake _(rice-based fermented beverage; treated as Wine for service/cost similarity even though grain-based)_
- Mead _(fermented honey; follows the Sake precedent — wine-adjacent fermented beverage)_

Wine adds two enrichment fields beyond subcategory:

- `production_region` (existing schema field, free text): Bordeaux, Burgundy, Champagne, Rioja, Chianti, Napa Valley, Walla Walla, Marlborough, Mendoza, Barossa Valley, etc.
- `varietal` (new schema field, constrained list): the dominant grape, used for cross-region varietal filtering and substitution.

Subcategory stays coarse so it serves the chip layer cleanly. Varietal and region cover the cross-cutting filter axes (varietal alone, region alone, or both). Old World wines get the dominant grape filled in (Rioja → Tempranillo, Chianti → Sangiovese, Bordeaux → Bordeaux Blend). Multi-varietal blends use blend designations (Bordeaux Blend, GSM Blend, Champagne Blend).

**Initial varietal vocabulary** (constrained list):

Red (19): Cabernet Sauvignon, Merlot, Pinot Noir, Syrah/Shiraz, Zinfandel, Malbec, Tempranillo, Sangiovese, Nebbiolo, Grenache, Petite Sirah, Carménère, Mourvèdre, Barbera, Aglianico, Bordeaux Blend, GSM Blend, Red Blend, Other Red

White (14): Chardonnay, Sauvignon Blanc, Riesling, Pinot Grigio, Albariño, Gewürztraminer, Viognier, Chenin Blanc, Vermentino, Grüner Veltliner, Sémillon, Moscato, White Blend, Other White

Sparkling (4): Champagne Blend (Chardonnay/Pinot Noir/Pinot Meunier), Glera (Prosecco), Macabeo Blend (Cava), Other Sparkling Blend

Fortified: usually nullable. Port, Sherry, Madeira, Marsala identify by style, not grape; production_region carries the style.

#### Beer (15 subcategories)

- Lager
- Pilsner
- IPA
- Pale Ale
- Amber
- Stout
- Porter
- Wheat
- Sour
- Belgian
- Ale _(catchall for Brown, Scottish, Cream, Barleywine, etc.)_
- Cider
- Hard Seltzer _(White Claw, Truly, High Noon's seltzer line — NOT High Noon's cocktail line which is Spirit > RTD)_
- Hard Kombucha _(fermented tea, sold in the "non-beer beer-format" cooler alongside seltzer and cider)_
- Other

IPA does NOT split further into Hazy / West Coast / Imperial / Session. Cider and Hard Seltzer get their own subcategories (rather than burying in Other) because volume and filter use justify it.

#### Vermouth (4 subcategories)

- Dry
- Sweet
- Bianco
- Aperitif Wine _(Lillet, Cocchi Americano, Bonal, Punt e Mes)_

#### Bitters (4 subcategories)

- Aromatic _(Angostura, Peychaud's; Peychaud's lives here even though it's anise-leaning)_
- Orange
- Chocolate _(Bittermens Xocolatl Mole, Fee Brothers Aztec)_
- Other _(everything else: Floral, Specialty-rebranded, Anise)_

#### Mixer (4 subcategories)

- Soda _(tonic, club soda, ginger beer, ginger ale, cola, lemon-lime, root beer, cream soda, all carbonated mixers)_
- Energy _(Red Bull and similar)_
- Cocktail Mix _(Bloody Mary mix, sweet and sour, transfusion mix)_
- Other

Recipe accuracy for products like Ginger Beer comes from canonical_product_id at the recipe layer, not from subcategory granularity. A Moscow Mule recipe links to the Ginger Beer canonical specifically.

#### Juice (5 subcategories)

- Citrus
- Tropical
- Berry
- Vegetable _(tomato, carrot, beet)_
- Other

#### Syrup (7 subcategories)

- Plain _(simple, demerara, gomme)_
- Sweetener _(honey, agave)_
- Flavored _(raspberry, hibiscus, vanilla, lavender, rose, etc.)_
- Spiced _(Falernum, ginger, allspice, cinnamon)_
- Nut _(orgeat, hazelnut)_
- Grenadine
- Other

#### Garnish (7 subcategories)

- Citrus _(peels, twists, wedges, wheels)_
- Cherry _(Maraschino, brandied)_
- Olive
- Onion
- Herb _(mint sprig, basil leaf, rosemary)_
- Rim _(salt, sugar, Tajín)_
- Other

#### Prepped (7 subcategories)

- Syrup _(homemade syrups distinct from commercial)_
- Infusion _(infused spirits)_
- Oleo Saccharum
- Shrub
- Tincture
- Cordial _(homemade limoncello, lime cordial, falernum, etc.)_
- Other

Note: commercial Limoncello → Liqueur > Citrus. Homemade Limoncello → Prepped > Cordial. Same flavor, different cost models.

#### Dairy / Egg / Spice / Herb (flat, no subcategories)

Per the granularity principle, bartenders don't filter or substitute "egg yolk" vs "egg white" or "cream" vs "plant cream" at the catalog level. Each is a top-level canonical category with no further subdivision.

#### Chip-layer mapping notes

- **Prepped** and **Garnish** are top-level `INGREDIENT_TYPES` at the chip layer, not subtypes of Non-Alc, because they have distinct UI affordances (prep-builder for Prepped, count-based pour sizes for Garnish). Remove from `NA_SUBTYPES` to fix the current double-listing.
- **Cordial** appears in `SPIRIT_SUBTYPES` at the chip layer but is retired at the canonical layer (overlaps too much with Liqueur). Migrate any Cordial-tagged ingredients to Liqueur during the canonical re-seed.
- **Liqueur, Vermouth, Bitters** at the canonical layer are top-level categories (siblings of Spirit). At the chip layer they collapse into Spirit subtypes via `mapCanonicalToType()`. This is intentional and stays.
- **Mixer / Juice / Syrup / Dairy / Egg / Spice / Herb** at the canonical layer are top-level categories. At the chip layer they collapse under the Non-Alc umbrella as subtypes via `mapCanonicalToType()`.

### Why this taxonomy

**Spirits use structural subcategories** because cocktail recipes need them at this granularity. A Daiquiri requires White Rum, not just any rum. A Manhattan benefits from Rye specificity. Bartenders filter by bourbon-vs-rye constantly.

**Liqueurs use flavor subcategories** because liqueurs are most usefully sorted by what they taste like. Searching "cherry" should find Maraschino. The structural axis (sugar + alcohol + flavor) is uniform across the category and not useful for filtering.

**This inconsistency is intentional and correct.** It reflects how bartenders actually think about each category.

### Granularity principle

**Subcategory granularity should match what bartenders filter or substitute by.**

This is the rule that decides when to split a category and when to stop:

- Spirits split deep (Bourbon vs Rye vs Scotch, Tequila Blanco vs Reposado vs Anejo) because bartenders search and filter at this granularity, and recipes care which one fills a slot. A Manhattan made with Bourbon vs Rye is a meaningfully different drink.
- Liqueurs split by flavor (Cherry, Coffee, Orange, Herbal) because flavor is the filter axis. Bartenders search "cherry" expecting Maraschino, Cherry Heering, and Edelkirsch in one list.
- Egg and Dairy stay flat. Nobody types "egg yolk" or "heavy cream" expecting a filtered list, and there's no substitution decision happening at the subcategory level.
- Spice and Herb likely stay flat for the same reason. Re-evaluate when prep-builder usage produces real signal.

The test, when in doubt: **would a bartender filter or substitute at this level?** If yes, split. If no, leave it flat. Adding a subcategory layer that nobody filters or substitutes by is just noise.

### Three layers: filter, identity, substitution

Subcategory is one of three layers that work together. Confusing them produces bad behavior in opposite directions (over-substitution, or no substitution at all). Each layer has one job.

**1. Subcategory = filter axis.** What the user sees in chips and search filters. Coarse enough to navigate, granular enough to be useful. Subcategory is a strong hint for grouping and discovery, not a constraint on recipe matching. Typing "cherry" in search returns Maraschino, Cherry Heering, Edelkirsch in one list. The subcategory tag (`Cherry`) is what makes that work.

**2. canonical_product_id = recipe identity.** Recipes link to specific canonical products via `cocktail_ingredients.canonical_product_id`. This is where recipe authors express specificity:

- A Manhattan recipe links to the **Maraschino** canonical, not the "Cherry liqueur" subcategory. A bar with Cherry Heering and no Maraschino sees Cherry Heering surfaced as a similarity-ranked suggestion (with score) but the system never silently substitutes; the bartender decides whether the swap fits the drink.
- A Daiquiri recipe links to the **White Rum** generic canonical, not a specific brand, because any white rum fills the slot.
- A Negroni recipe might link to the **Sweet Vermouth** generic OR to **Carpano Antica Formula** specifically, depending on what the author cares about.

The granularity of canonical_product_id is per-recipe, not per-category.

**3. Flavor similarity = substitution mechanism.** When a bar lacks the recipe's exact canonical, the system runs a similarity query on `flavor_notes` (controlled-vocabulary tag overlap) across the catalog. Returns ranked alternatives with similarity scores. The bartender sees the score and decides whether to accept the swap, decline, or skip the slot. The system never silently substitutes.

- Existing `SPIRIT_FAMILIES` (Whiskey, Rum, Vermouth) stays as a precompiled hint for the cocktail adoption flow. Coarse subtype equivalence, faster than running a similarity query for the most common cases. NOT a curated override map.
- Liqueur cases (Cherry Heering vs Maraschino vs Edelkirsch, Cointreau vs Grand Marnier) are handled by similarity score plus bartender judgment, not hand-authored exception rules. The bartender sees the similarity score and decides per-cocktail whether the swap is acceptable.

**Why all three matter:** subcategory alone over-substitutes (any cherry liqueur is the same? no). canonical_product_id alone under-substitutes (your bar lacks Cherry Heering, so the recipe just breaks? no, surface ranked alternatives). Flavor similarity scales across thousands of canonicals automatically as soon as `flavor_notes` is populated. The three together give the right behavior with no pair-by-pair authoring required.

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
| `flavor_notes`      | Controlled-vocabulary tag array, drives similarity matching   | JSONB array of strings; 5-10 entries from the locked vocabulary; populated by Flash enrichment |
| `image_url`         | Product image                                                 | Future                              |
| `parent_company`    | Owning company                                                | Optional                            |
| `founded_year`      | Brand founding year                                           | Education content only              |
| `aging_years`       | Age statement in years                                        | Where applicable                    |
| `education_data`    | JSONB for misc educational content                            | Flexible                            |
| `non_alcoholic`     | True for non-alc versions of alcoholic products               | Boolean default false               |
| `varietal`          | Wine varietal or blend designation (Wine category only)       | Constrained list; nullable for Fortified |

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

### Non-alcoholic variants

Non-alcoholic versions of alcoholic products (Almave, Lyre's, Mock One, Empress 1908 NA, Zonin Cuvee Zero, Best Day Brewing IPA-NA, etc.) live in the SAME category and subcategory as their alcoholic counterpart, with `non_alcoholic = true`.

| Product | category | subcategory | non_alcoholic |
|---|---|---|---|
| Almave Blanco | Spirit | Tequila Blanco | true |
| Lyre's Italian Spritz | Liqueur | Aperitif Bitter | true |
| Mock One Whiskey | Spirit | American Whiskey | true |
| Empress 1908 Indigo NA | Spirit | Gin | true |
| Zonin Cuvee Zero | Wine | Sparkling | true |
| Best Day Brewing West Coast IPA | Beer | IPA | true |

Why this works:

- Recipes still resolve correctly. A Daiquiri asking for White Rum can fall back to a White-Rum-tagged non-alc product when a bar runs a non-alc menu, with no architectural gymnastics.
- The top-level **Non-Alc** category stays clean for what it actually is: sodas, kombuchas, juices, syrups (commercial), mixers, garnishes, dairy, spice, herb, egg.
- Future bar-level toggle "show non-alc alternatives for my recipes" filters canonicals to those sharing a slot with the alcoholic option. Free affordance from the boolean.

Backfill the ~20 NA products as `true` during the next canonical re-seed.

### Flavor tags vocabulary

`flavor_notes` stores a controlled-vocabulary array of 5 to 10 tags per canonical product. Tags drive similarity matching for substitution suggestions and cross-cutting flavor search.

**Tag count rule:** Gemini at enrichment time tags each product with **5-10 entries** from the controlled vocabulary, prioritizing the most distinctive notes. 10 is a hard ceiling. Different products land at different counts based on description complexity (a simple Triple Sec might get 5, a complex single malt might get 9).

**Hierarchical tagging:** when both the family AND the specific are evident in the source description, Gemini tags both. "Marzipan-rich finish with delicate marasca cherry pit notes" → `["nutty", "almond", "cherry", "stone-fruit", "rich"]`. When only the family is present in the description ("subtly nutty"), only the family tag goes on. The similarity engine weights specific overlap higher than family-only overlap, so partial matches via family tags still surface candidates without inflating false-positive matches.

**Phrase matching:** tags are exact-element JSONB array matches (`@>` or `?` operators), NOT substring. Searching `"anise"` does not match a product tagged `["star-anise"]`. Cross-tag overlap is not inferred via string similarity. If two tags should partially match (e.g., star-anise sharing partial signal with anise), that's a vocabulary structure decision (e.g., adding both as separate tags on products that span the two), not an inference rule.

**Vocabulary expansion (self-healing):** Gemini also returns an `unmatched_concepts` array per product when the source description references a flavor not in the vocabulary. These feed a `pending_vocab_terms` table aggregating by term across the catalog. When a term hits N occurrences (5 is a reasonable starting threshold), it's promoted to the controlled vocabulary and the affected products get re-enriched to pick up the new tag. The vocabulary grows organically from real catalog content.

**Locked vocabulary (149 terms):**

| Group | Tags |
|---|---|
| **Citrus (8)** | citrus, lemon, lime, orange, grapefruit, bergamot, yuzu, tangerine |
| **Stone fruit (5)** | stone-fruit, cherry, peach, apricot, plum |
| **Pome (3)** | apple, pear, quince |
| **Berry (9)** | berry, strawberry, raspberry, blackberry, blueberry, cranberry, blackcurrant, redcurrant, gooseberry |
| **Tropical (7)** | tropical, pineapple, mango, banana, coconut, passionfruit, lychee |
| **Dried fruit (5)** | dried-fruit, raisin, fig, date, prune |
| **Cooked fruit (3)** | cooked-fruit, jammy, stewed-fruit |
| **Herbal (10)** | herbal, mint, basil, thyme, rosemary, sage, eucalyptus, tarragon, fennel, lemongrass |
| **Spice (14)** | spice, cinnamon, clove, cardamom, allspice, nutmeg, ginger, black-pepper, white-pepper, pink-pepper, juniper, coriander, saffron, star-anise |
| **Floral (9)** | floral, rose, violet, elderflower, lavender, honeysuckle, jasmine, orange-blossom, white-flower |
| **Nutty (5)** | nutty, almond, hazelnut, walnut, pistachio |
| **Vegetal (5)** | vegetal, grass, cucumber, bell-pepper, olive |
| **Earthy (7)** | earthy, mushroom, tobacco, leather, forest-floor, truffle, blood |
| **Smoke / char (7)** | smoky, peat, campfire, charred, ash, iodine, tar |
| **Wood (5)** | wood, oak, cedar, pine, sandalwood |
| **Cocoa / coffee (5)** | cocoa, dark-chocolate, milk-chocolate, coffee, espresso |
| **Dairy (3)** | cream, buttery, caramel |
| **Sweet flavors (4)** | vanilla, honey, molasses, maple |
| **Bread / yeast (3)** | bread, brioche, yeast |
| **Anise (2)** | anise, licorice |
| **Salt / mineral (7)** | salty, briny, mineral, flint, chalky, iron, graphite |
| **Petrol (1)** | petrol |
| **Funky / reductive (3)** | barnyard, funky, struck-match |
| **Character / palate (19)** | sweet, bitter, sour, dry, tannic, acidic, bright, rich, light, crisp, smooth, warming, peppery, astringent, oily, effervescent, silky, round, balanced |

**Excluded by design (do not add):**

- Pure flaws (`TCA`, `oxidation`, `vinegar`, `mercaptan`). These are bottle-level issues, not stable canonical characteristics.
- Body terms (`full-bodied`, `medium-bodied`, `light-bodied`). The character notes "rich" and "light" cover the axis.
- Hyper-specific notes (`pencil-lead`, `wet-wool`, `cat-pee`, `petrichor`). Too narrow to surface meaningful matches.

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

When a bar lacks the specified canonical, the system runs flavor similarity across the catalog and surfaces ranked alternatives. The user has agency to accept or reject each suggestion. No hand-authored brand-pair override rules.

**Resolution priority:**

1. **Exact canonical match.** User has the recipe's `canonical_product_id` directly. No substitution needed.
2. **Subcategory match.** User has another product in the same subcategory. Surface ranked by flavor similarity to the original.
3. **Flavor similarity engine.** Query the catalog by `flavor_notes` overlap, ranked descending. Use Jaccard or weighted Jaccard (specific-tag matches weighted higher than family-tag matches). Optionally filter by category to constrain the result set. Returns a ranked list of viable substitutes with similarity scores.
4. **Manual override.** User can always pick anything from inventory.

The bartender always sees a similarity score and a "substituted" indicator. They decide whether to accept the swap, decline, or skip the slot entirely. The system never silently substitutes.

**Why this works for tricky cases:**

- *Maraschino vs Cherry Heering.* Recipe links to Maraschino canonical specifically. Bar lacks it. System sees Cherry Heering shares cherry / almond / sweet tags, surfaces it with a similarity score. Bartender reads the score and decides. If the drink needs Maraschino's bitter pit character specifically, they decline. No "do not substitute" rule needed.
- *Cointreau vs Grand Marnier.* Both share orange / citrus / sweet tags, but Grand Marnier carries additional brandy / caramel notes. Similarity score reflects the difference. Bartender chooses based on the cocktail context.
- *Cherry Heering vs Edelkirsch.* High flavor overlap → high similarity score → surfaces as a confident match.

The fidelity badge in the UX is derived from the similarity score, not from hand-authored fidelity ratings. High score = "this should work fine." Low score = "tastes different but is in the right neighborhood." No rule list to maintain.

### Substitution architecture (current vs planned)

**What exists today** (in `src/lib/wells.ts`):

- `SPIRIT_FAMILIES` constant: equivalence groups for Whiskey, Rum, Vermouth, plus Agave siblings (NOT auto-substituted). Used during cocktail adoption to resolve recipe slots against user wells.
- `SUBTYPE_ALIASES` constant: bridges canonical `Sweet` to user inventory `Sweet Vermouth`, and similar for Dry.
- `subTypeMatches()` function: priority match (exact → vermouth alias → family fallback).

`SPIRIT_FAMILIES` is a precompiled hint, not a curated override map. It encodes coarse equivalence at the subtype layer (Bourbon, Rye, Scotch are interchangeable for adoption purposes) so the adoption flow can resolve quickly without running a similarity query. Stays as-is.

**What does NOT exist yet:**

- Flavor similarity engine query.
- "Substituted" indicator with similarity score in the actual UX (described as design intent but not shipped).
- Standardized controlled vocabulary on `flavor_notes` (today the column accepts any free-text strings).

**V1.x extension plan:**

- Standardize `flavor_notes` to the locked 149-term vocabulary via Gemini enrichment.
- Build the flavor similarity query (Postgres array overlap with weighted scoring; specific-tag matches weighted higher than family-tag matches).
- Surface similarity score and "substituted" indicator in the recipe adoption UX so bartenders can see the swap and decide.

**V2 extension plan (if needed):**

- Layer vector embeddings on top of controlled-vocab matching for cases where exact-tag overlap misses semantically close concepts (only if matching quality plateaus).

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

- How to handle limited releases / single barrels at the canonical level (probably skip; they're too transient).
- Whether Liqueur chips should ever render conditionally (UI-side decision, post-launch usage signal will tell).

### Decisions resolved 2026-05-09

These were open questions at the start of the session and got resolved during it:

- **Wine subcategory granularity.** Locked at 5 (Red/White/Rosé/Sparkling/Fortified). Region and varietal moved to enrichment fields (`production_region` existing, new `varietal` field).
- **Beer subcategory granularity.** Locked at 14 (no further IPA splitting). Cider and Hard Seltzer added.
- **Mixer / Juice / Syrup / Garnish canonical subcategories.** Locked at 4 / 5 / 7 / 7 respectively.
- **Prepped subcategories.** Locked at 7.
- **Liqueur subcategory list.** Locked at 20 with edge-case placements documented.
- **Spirit subcategory list.** Locked at 47 with all the changes from today's session.
- **Substitution architecture.** Flavor similarity engine + user agency, no curated brand-pair maps.
- **Flavor tags vocabulary.** Locked at 149 terms.

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
| 2026-05-09 | Granularity principle: split where bartenders filter or substitute, stop where they don't | Articulable rule for resolving sub-sub-category questions across categories. Egg/Dairy/Spice/Herb stay flat; Spirits and Liqueurs split deep; Wine/Beer/Mixer canonical granularity remains pending real usage signal. |
| 2026-05-09 | Three layers: subcategory = filter axis, canonical_product_id = recipe identity, flavor similarity = substitution mechanism | Each layer does one job. Subcategory alone over-substitutes; canonical_product_id alone under-substitutes; flavor similarity (across the catalog via flavor_notes overlap) handles substitution at scale with no hand-authored pair maps. |
| 2026-05-09 | Non-alcoholic variants live under their alcoholic category with `non_alcoholic = true` boolean | Keeps Almave under Tequila, Zonin Cuvee Zero under Sparkling, etc. Top-level Non-Alc stays clean for sodas, juices, mixers. Future "show non-alc alternatives" toggle is a free affordance. |
| 2026-05-09 | Egg and Dairy stay flat; no sub-sub-categorization | Per granularity principle. Nobody filters or substitutes "egg yolk" vs "egg white" or "cream" vs "plant cream" at the catalog level. |
| 2026-05-09 | Prepped and Garnish stay top-level INGREDIENT_TYPES; remove from NA_SUBTYPES | Distinct UI affordances (Prep-builder, count-based pour sizes) justify top-level placement. Double-listing in both INGREDIENT_TYPES and NA_SUBTYPES is debt. |
| 2026-05-09 | Cordial likely retires into Liqueur at the canonical re-seed | Term overlaps too much with Liqueur to warrant its own subcategory; chip-layer presence is legacy. |
| 2026-05-09 | Spirit subcategory list locked at 47 entries | Includes new Sotol, Other Agave, Other Rum, Cachaça promoted from World to Rum, Brandy renamed from "American Brandy" as catchall, Soju/Shochu/Baijiu promoted to first-class subcategories alongside Aquavit, Gin split into 6 styles (London Dry / Plymouth / Old Tom / Genever / Navy Strength / Modern), Other Spirit catchall added. |
| 2026-05-09 | Liqueur subcategory list locked at 20 entries | Flavor-as-subcategory taxonomy. Galliano placed in Herbal, Cynar in Aperitif Bitter, Drambuie in Herbal, Becherovka in Spiced, Sloe Gin in Berry. Cordial removed (overlaps with Liqueur). |
| 2026-05-09 | Beer subcategory list locked at 14 entries | IPA does not split further. Cider and Hard Seltzer added as first-class subcategories alongside Amber. |
| 2026-05-09 | Wine subcategories stay at 5 (Red/White/Rosé/Sparkling/Fortified) | Region/varietal granularity moves to enrichment fields, not subcategory. New `varietal` field constrained to a list of common varietals plus Bordeaux Blend / GSM Blend / Red Blend / White Blend / Other Red / Other White options. `production_region` (existing) carries appellation. |
| 2026-05-09 | Vermouth (4), Bitters (4), Mixer (4), Juice (5), Syrup (7), Garnish (7), Prepped (7) all locked | Bitters consolidates Specialty/Floral/Anise into Other; Mixer consolidates carbonated mixers into Soda; recipe accuracy for products like Ginger Beer comes from canonical_product_id, not subcategory. |
| 2026-05-09 | Liqueur chip layer disabled by default | Most bars carry low volume per liqueur subcategory, so chip filter offers little value. Discovery happens via name + flavor search. Subcategories still drive recipe slots, catalog browse, wells, and reporting. UI can flip on conditional chip rendering later if usage signal warrants. |
| 2026-05-09 | Substitution architecture: flavor similarity + user agency. No curated brand-pair overrides | Recipe links to canonical_product_id; when a bar lacks it, system runs flavor similarity across the catalog and surfaces ranked alternatives with similarity scores. Bartender decides whether to accept, decline, or skip. System never silently substitutes. Existing SPIRIT_FAMILIES stays as a precompiled hint for adoption resolution; not a curated override map. Cases like Maraschino vs Cherry Heering or Cointreau vs Grand Marnier are handled by similarity score + bartender judgment, not hand-authored exception rules. |
| 2026-05-09 | flavor_notes repurposed as controlled-vocabulary tag array | No new field. Existing `flavor_notes` JSONB array is constrained to a locked vocabulary of 149 terms organized by family / specific / character. Phrase matching uses exact JSONB element match, not substring. |
| 2026-05-10 | Vodka splits into Plain / Flavored | Flat Vodka silently over-substitutes — an orange-vodka recipe shared between bars matches a plain-vodka well with no warning. Plain/Flavored is the load-bearing guardrail at the subcategory layer; flavor_notes handles within-Flavored refinement (citrus/vanilla/berry) via the similarity engine. Bison Grass (Zubrowka) lives under Flavored — distinct enough that flavor_notes carries the differentiation. |
| 2026-05-11 | Spirit gains RTD subcategory | Canned cocktails (High Noon cocktail line, On The Rocks, Cutwater, Long Drink) and premixed bottles need a home. NOT hard seltzers — those stay under Beer > Hard Seltzer. RTD is the bartender mental model: "ready-to-drink, served straight from the can." |
| 2026-05-11 | Wine gains Orange + Sake + Mead subcategories | Orange wine (skin-contact whites) is a real category in natural-wine bars and doesn't fit Red/White/Rosé. Sake and Mead are fermented beverages adjacent to wine — served in wine-size pours, sold in wine-format bottles. Treating them as Wine subs is more accurate than forcing them into Beer or Spirit. |
| 2026-05-11 | Beer gains Hard Kombucha subcategory | Hard kombucha is sold in the same beer-format cooler as Hard Seltzer and Cider. Distinct enough from Sour ale (it's fermented tea, not beer) to warrant its own sub. Pet-Nat is NOT added because it's just Sparkling wine made by méthode ancestrale — Gemini classifies as Wine > Sparkling. |
| 2026-05-09 | Tag count rule: 5-10 per product, 10 hard ceiling | Gemini enrichment prompt instructs to pick 5-10 most distinctive notes from controlled vocabulary. Hierarchical tagging: include both family AND specific when both are evident in source description. |
| 2026-05-09 | Self-healing vocabulary expansion | Gemini returns `unmatched_concepts` array when source description references a flavor not in the vocabulary. Aggregated into `pending_vocab_terms` table; promoted to controlled vocab when a term hits 5+ occurrences. Affected products re-enriched after promotion. |

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
