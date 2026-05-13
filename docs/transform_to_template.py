#!/usr/bin/env python3
"""Transform merged_inventory.csv to the CSV import template format.

Output columns: name, type, sub_type, bottle_size, cost, abv, brand

- bottle_size is numeric (ml) for bottles, string (e.g. "Half Barrel") for kegs
- cost is per-unit (per bottle for bottles, per keg for kegs), computed from
  the source price + price_per + bottles_per_case
- abv tries to extract from name (proof, percentage); falls back to type default
- brand extracted via known-brand list, then a first-words heuristic
- sub_type adjusted for today's chip-layer decisions (Cordial -> Liqueur)
- Deduplicated by (lowercase name, bottle_size); keeps lowest cost row
"""
import csv
import os
import re
from collections import defaultdict

INPUT = "/sessions/wizardly-beautiful-fermi/mnt/outputs/merged_inventory.csv"
OUTPUT = "/sessions/wizardly-beautiful-fermi/mnt/outputs/friend_bar_inventory.csv"

# Known multi-word brand list. Add as needed when results show gaps.
KNOWN_BRANDS = [
    # Whiskey
    "Old Forester", "Buffalo Trace", "Eagle Rare", "Wild Turkey", "Maker's Mark",
    "Knob Creek", "Jim Beam", "Jack Daniel's", "Crown Royal", "Canadian Club",
    "Woodford Reserve", "Four Roses", "Booker's", "Basil Hayden", "Bulleit",
    "Old Fitzgerald", "Old Overholt", "Templeton", "Rittenhouse", "Stranahan",
    "Tin Cup", "TinCup", "High West", "Garrison Brothers", "Laws Whiskey House",
    "Heaven Hill", "Evan Williams", "Elijah Craig", "Old Crow", "Very Old Barton",
    "Macallan", "The Macallan", "Glenfiddich", "Glenlivet", "The Glenlivet",
    "Glenmorangie", "Highland Park", "Lagavulin", "Talisker", "Oban", "Ardbeg",
    "Bowmore", "Bruichladdich", "Laphroaig", "Auchentoshan", "Speyburn", "Tomatin",
    "Deanston", "Compass Box", "Isle of Jura", "Cardhu", "Aberlour", "Benriach",
    "Johnnie Walker", "Chivas Regal", "Dewar's", "Famous Grouse", "Monkey Shoulder",
    "Jameson", "Tullamore Dew", "Tullamore D.E.W.", "Bushmills", "Powers", "Redbreast",
    "Kilbeggan", "Hibiki", "Yamazaki", "Hakushu", "Suntory", "Nikka", "Iwai",
    # Vodka
    "Tito's", "Ketel One", "Grey Goose", "Belvedere", "Stolichnaya", "Stoli",
    "Smirnoff", "Absolut", "Skyy", "Three Olives", "Chopin", "Reyka", "Ciroc",
    "Crystal Head", "New Amsterdam", "Western Son", "Deep Eddy", "Hangar 1",
    # Gin
    "Bombay Sapphire", "Bombay", "Tanqueray", "Beefeater", "Hendrick's", "Plymouth",
    "Aviation", "Empress 1908", "Empress", "Roku", "Monkey 47", "Sipsmith",
    "Nolet's", "The Botanist", "Ford's", "St George", "St. George", "Junipero",
    "Old Raj", "Boodles", "Broker's",
    # Tequila / Mezcal
    "Don Julio", "Casamigos", "Patron", "Patrón", "Jose Cuervo", "Cuervo",
    "Volcan", "Volcan De Mi Tierra", "Don Fulano", "Avion", "El Tesoro",
    "Espolon", "Hornitos", "Sauza", "Herradura", "Olmeca", "Milagro", "Cazadores",
    "Fortaleza", "Ocho", "Tapatio", "Siete Leguas", "Clase Azul", "Tres Generaciones",
    "Codigo", "Código", "Del Maguey", "Ilegal", "Montelobos", "Fidencio",
    "Los Amantes", "Bozal", "Banhez", "Dos Hombres",
    # Rum
    "Bacardi", "Captain Morgan", "Mount Gay", "Plantation", "Diplomatico",
    "Ron Zacapa", "Zacapa", "Appleton", "Havana Club", "Flor de Caña",
    "El Dorado", "Smith & Cross", "Cruzan", "Goslings", "Myers's", "Don Q",
    "Brugal", "Matusalem", "Hamilton",
    # Cognac / Brandy
    "Hennessy", "Remy Martin", "Rémy Martin", "Courvoisier", "Martell",
    "Pierre Ferrand", "Hine", "Delamain", "Frapin",
    "E&J", "Christian Brothers",
    # Liqueur / Amaro / Aperitif
    "Cointreau", "Grand Marnier", "Combier", "Triple Sec", "Curaçao",
    "Cherry Heering", "Maraschino Luxardo", "Luxardo",
    "Chambord", "Crème de Cassis", "St-Germain", "Saint Germain", "St Germain",
    "Aperol", "Campari", "Cynar", "Suze", "Salers",
    "Fernet Branca", "Fernet-Branca", "Averna", "Montenegro", "Nonino",
    "Ramazzotti", "Lucano", "Jägermeister", "Jagermeister",
    "Becherovka", "Tuaca", "Licor 43",
    "Kahlúa", "Kahlua", "Tia Maria", "Mr. Black", "Mr Black",
    "Bailey's", "Baileys", "RumChata", "Carolan's", "Frangelico", "Disaronno",
    "Lazzaroni", "Adriatico", "Galliano", "Chartreuse", "Bénédictine",
    "Benedictine", "Strega", "Drambuie", "Sambuca",
    "Rothman & Winter", "Crème de Violette",
    "Domaine de Canton", "Pierre Ferrand Dry Curaçao",
    "Lyre's", "Almave", "Mock One", "Empress Na",
    # Vermouth
    "Carpano Antica", "Carpano", "Dolin", "Cinzano", "Noilly Prat",
    "Punt e Mes", "Lillet", "Cocchi Americano", "Bonal",
    # Bitters
    "Angostura", "Peychaud's", "Fee Brothers", "Bittermens", "Regan's",
    "Bitter Truth", "Scrappy's",
    # Wine producers
    "Kim Crawford", "Caymus", "Silver Oak", "Jordan", "Daou", "Stags' Leap",
    "Stag's Leap", "Cakebread", "Robert Mondavi", "Beringer",
    "Rombauer", "Chateau Ste Michelle",
    "Veuve Clicquot", "Moët & Chandon", "Moet & Chandon", "Dom Pérignon",
    "Dom Perignon", "Ruinart", "Krug", "Bollinger", "Perrier-Jouët",
    "Perrier-Jouet", "Taittinger", "Pol Roger", "Laurent-Perrier",
    "Louis Roederer", "Billecart-Salmon", "Lanson", "Piper-Heidsieck",
    "La Marca", "Mionetto", "Riondo",
    "Llord's", "Pimm's", "French Bloom", "7 Cellars", "10th Mountain",
    "Arette", "Patrón Silver", "Volcán", "Banhez", "Faiveley",
    "Banfi", "Antinori", "Gaja", "Sassicaia", "Tignanello",
    "Marqués de Cáceres", "Marqués de Riscal", "La Rioja Alta",
    "L'Ecole No. 41", "L'Ecole",
    "Donkey & Goat", "Belle Pente", "Quixote", "Lamborn",
    "Chateau d'Esclans", "Whispering Angel",
    "Pieropan",
    # Beer
    "Coors", "Budweiser", "Bud Light", "Miller", "Heineken", "Stella Artois",
    "Stella", "Corona", "Modelo", "Tecate", "Pacifico", "Dos Equis", "Tsingtao",
    "Sapporo", "Asahi", "Kirin", "Carlsberg", "Becks", "Beck's",
    "Guinness", "Murphy's", "Newcastle", "Sierra Nevada", "Pabst", "Yuengling",
    "Sam Adams", "Samuel Adams",
    "Odell", "New Belgium", "Avery", "Boulevard", "Oskar Blues", "Stone",
    "Lagunitas", "Founders", "Bell's", "Dogfish Head", "Allagash",
    "Ska Brewing", "Ska", "Stem Ciders", "High Noon", "Breckenridge Brewery",
    "Best Day Brewing", "Anheuser-Busch",
    # Mixers / NA
    "Red Bull", "Fever-Tree", "Fever Tree", "FeverTree",
    "Q Mixers", "Q ", "Schweppes", "Canada Dry",
    "Rocky Mountain Soda", "Rocky Mountain",
    "Filthy", "Owen's Craft", "Owens Craft", "Hipstirs",
    "Liquid Alchemist", "Mr. and Mrs. T", "Mr & Mrs T", "Mrs. T's",
    "Real Cocktail Ingredients", "Rose's", "Roses",
    "Monin", "Torani", "Liber & Co.", "Liber and Co",
    "Coco Lopez", "Coco López", "FIJI",
]

KNOWN_BRANDS_SORTED = sorted(KNOWN_BRANDS, key=len, reverse=True)
KNOWN_BRANDS_LC = {b.lower(): b for b in KNOWN_BRANDS_SORTED}

# Stop words used by fallback brand extraction. When found, brand is everything
# before the stop word.
DESCRIPTOR_STOPWORDS = {
    "vodka", "gin", "tequila", "rum", "whisky", "whiskey", "bourbon", "scotch",
    "rye", "cognac", "brandy", "mezcal", "absinthe", "liqueur", "cordial",
    "vermouth", "amaro", "amari", "bitters", "schnapps", "champagne", "wine",
    "ale", "ipa", "lager", "stout", "porter", "pilsner", "saison", "weiss",
    "wheat", "sour", "belgian", "tripel", "dubbel",
    "cabernet", "chardonnay", "merlot", "sauvignon", "pinot", "syrah",
    "shiraz", "zinfandel", "riesling", "rosé", "rose", "sparkling", "prosecco",
    "tonic", "soda", "syrup", "juice", "mixer", "garnish",
    "bitter", "extra", "single", "double", "premium", "reserve", "estate",
    "limited", "small", "batch", "year", "years", "old", "proof",
    "blanco", "reposado", "anejo", "añejo", "cristalino", "joven",
    "white", "gold", "dark", "spiced", "overproof", "aged",
    "irish", "japanese", "canadian", "tennessee",
    "kentucky", "highland", "islay", "speyside", "lowland",
    "kosher", "organic", "infused",
}


def extract_brand(name: str) -> str:
    """Extract brand from product name. Returns empty string if no match."""
    if not name:
        return ""
    n_lower = name.lower()

    # Phase 1: known brands (longest first)
    for brand_lc in KNOWN_BRANDS_LC:
        # Word-boundary check so 'patron' doesn't match 'matron'
        if re.search(r"\b" + re.escape(brand_lc) + r"\b", n_lower):
            return KNOWN_BRANDS_LC[brand_lc]

    # Phase 2: fallback heuristic
    # Handle "TYPE, BRAND ..." format -> use the part after comma
    if "," in name and re.match(r"^[A-Za-z]+\s*,", name):
        first_word = name.split(",")[0].strip().lower()
        if first_word in DESCRIPTOR_STOPWORDS:
            name_for_extract = name.split(",", 1)[1].strip()
        else:
            name_for_extract = name
    else:
        name_for_extract = name

    # Take first 1-3 words before a stopword or digit.
    words = name_for_extract.split()

    # Strip leading size/quantity descriptors: vintage years, fractions like
    # "1/2", keg type tokens like "BBL", and bare numbers.
    SIZE_LEADERS = {"bbl", "keg", "case", "cs", "btl", "ml", "oz", "l", "gal"}
    while words:
        first = words[0].strip(",.!:;\"'").lower()
        if (re.match(r"^(19|20)\d{2}$", first)              # vintage year
                or re.match(r"^\d+(/\d+)?$", first)         # bare digit or fraction
                or first in SIZE_LEADERS):
            words = words[1:]
            continue
        break

    brand_words = []
    for i, word in enumerate(words):
        clean = word.strip(",.!:;\"'").lower()
        if not clean:
            continue
        if clean in ("the", "a", "an"):
            continue
        # Skip stopword check for first word: brands can BE color words
        # ("White Dog", "Gold Spot") and stopwords like "gold" apply only as
        # rum-style descriptors mid-name.
        if i > 0 and clean in DESCRIPTOR_STOPWORDS:
            break
        if any(c.isdigit() for c in clean):
            break
        brand_words.append(word.strip(",.!:;\"'"))
        if len(brand_words) >= 3:
            break

    if brand_words:
        # Title case first letter of each, preserve original interior caps
        return " ".join(w[0].upper() + w[1:] if w else w for w in brand_words)

    return ""


def compute_cost_per_unit(price_str: str, price_per: str, ipc_str: str) -> str:
    """Convert source price + price_per + items_per_case to per-unit cost."""
    if not price_str:
        return ""
    try:
        price = float(price_str)
    except ValueError:
        return ""

    price_per = (price_per or "").lower().strip()
    try:
        ipc = float(ipc_str) if ipc_str else 1
    except ValueError:
        ipc = 1

    if price_per == "case":
        if ipc and ipc > 0:
            return f"{price / ipc:.2f}"

    # Per-unit (bottle, keg, jar, etc.) returns price as-is
    return f"{price:.2f}"


def extract_abv(name: str, type_: str) -> str:
    """Extract ABV from name, fall back to type defaults."""
    n = (name or "").lower()

    # 'X Proof' pattern (US bourbon convention)
    m = re.search(r"\b(\d{2,3}(?:\.\d+)?)\s*proof\b", n)
    if m:
        proof = float(m.group(1))
        return f"{proof / 2:g}"

    # Bare proof number at end of name (e.g. "Bombay Sapphire Gin 94")
    m = re.search(r"\s(\d{2,3})\s*$", n)
    if m and type_ == "Spirit":
        proof = float(m.group(1))
        # Common proof values: 80, 86, 90, 94, 100, 101, 110, 114, 120, 151
        if 60 <= proof <= 200:
            return f"{proof / 2:g}"

    # Beer ABV in name (e.g. "6.8%")
    if type_ == "Beer":
        m = re.search(r"\b(\d{1,2}\.\d)\s*%?\b", n)
        if m:
            v = float(m.group(1))
            if 2 <= v <= 15:
                return f"{v:g}"

    # Type defaults
    defaults = {
        "Spirit": "40",
        "Beer": "5",
        "Wine": "12",
        "Non-Alc": "",
    }
    return defaults.get(type_, "")


def determine_bottle_size(bottle_size_ml: str, type_: str, sub_type: str, price_per: str, name: str) -> str:
    """Determine bottle_size in template format (numeric ml or keg string)."""
    bs = (bottle_size_ml or "").strip()
    type_ = (type_ or "").strip()
    sub_type = (sub_type or "").strip()
    pp = (price_per or "").lower().strip()
    n_lower = (name or "").lower()

    # Direct ml
    if bs and bs.replace(".", "", 1).isdigit():
        return bs

    # Keg sizes
    if pp == "keg" or "1/2 bbl" in n_lower or "half barrel" in n_lower or "1/2 barrel" in n_lower:
        if "1/6" in n_lower or "sixtel" in n_lower or "sixth barrel" in n_lower:
            return "Sixth Barrel"
        if "1/4" in n_lower or "quarter barrel" in n_lower or "pony" in n_lower:
            return "Quarter Barrel"
        m = re.search(r"(\d{1,3})\s*l(?:\b|iter)", n_lower)
        if m:
            return f"{m.group(1)}L Keg"
        return "Half Barrel"

    # Type and sub-type defaults
    if type_ in ("Spirit", "Wine"):
        return "750"
    if type_ == "Beer":
        return "355"  # 12oz can default
    if type_ == "Non-Alc":
        if sub_type == "Syrup":
            return "1000"  # 1L bottle, common Monin/Torani size
        if sub_type == "Mixer":
            # Red Bull = 250, Fever-Tree = 200, varies a lot. Leave blank.
            if "red bull" in n_lower:
                return "250"
            if "fever" in n_lower or "fever-tree" in n_lower:
                return "200"
            return ""
        if sub_type == "Other":
            # Non-alc spirits/beer derived products
            if "ipa" in n_lower or "lager" in n_lower or "beer" in n_lower or "brewing" in n_lower:
                return "355"
            return "750"
    return ""


def main():
    rows_in = []
    with open(INPUT, encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            rows_in.append(row)

    transformed = []
    for r in rows_in:
        name = (r.get("name") or "").strip()
        if not name:
            continue

        # Skip non-product rows
        if "coravin" in name.lower() and "capsule" in name.lower():
            continue

        type_ = (r.get("type") or "").strip()
        sub_type = (r.get("sub_type") or "").strip()

        # Apply chip-layer taxonomy adjustments per today's decisions
        if sub_type == "Cordial":
            sub_type = "Liqueur"

        bottle_size = determine_bottle_size(
            r.get("bottle_size_ml", ""), type_, sub_type, r.get("price_per", ""), name
        )
        cost = compute_cost_per_unit(
            r.get("price", ""), r.get("price_per", ""), r.get("bottles_per_case", "")
        )
        abv = extract_abv(name, type_)
        brand = extract_brand(name)

        transformed.append({
            "name": name,
            "type": type_,
            "sub_type": sub_type,
            "bottle_size": bottle_size,
            "cost": cost,
            "abv": abv,
            "brand": brand,
            "_dist": r.get("distributor", ""),
        })

    # Dedupe by (lowercase name, bottle_size); keep lowest cost row
    by_key = defaultdict(list)
    for row in transformed:
        key = (row["name"].lower(), row["bottle_size"])
        by_key[key].append(row)

    deduped = []
    for key, rows in by_key.items():
        if len(rows) == 1:
            deduped.append(rows[0])
        else:
            try:
                cheapest = min(rows, key=lambda r: float(r["cost"]) if r["cost"] else float("inf"))
            except ValueError:
                cheapest = rows[0]
            deduped.append(cheapest)

    # Final output: drop the temporary _dist column
    out_rows = [{k: v for k, v in r.items() if not k.startswith("_")} for r in deduped]

    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=["name", "type", "sub_type", "bottle_size", "cost", "abv", "brand"])
        w.writeheader()
        w.writerows(out_rows)

    print(f"Read {len(rows_in)} rows from merged_inventory.csv")
    print(f"Transformed to {len(transformed)} rows (after non-product filter)")
    print(f"Deduplicated to {len(out_rows)} unique products")
    print(f"Wrote to {OUTPUT}")

    # Quick stats
    from collections import Counter
    type_counts = Counter(r["type"] for r in out_rows)
    print("\nType distribution:")
    for k, v in type_counts.most_common():
        print(f"  {k or '(empty)'}: {v}")

    blank_brand = sum(1 for r in out_rows if not r["brand"])
    blank_size = sum(1 for r in out_rows if not r["bottle_size"])
    blank_cost = sum(1 for r in out_rows if not r["cost"])
    print(f"\nBlanks: brand={blank_brand}, bottle_size={blank_size}, cost={blank_cost}")


if __name__ == "__main__":
    main()
