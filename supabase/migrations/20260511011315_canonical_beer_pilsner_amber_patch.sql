-- Recovered from remote (was applied direct, never committed).
-- Sets subcategory for two generic beer canonicals.

UPDATE canonical_products SET subcategory='Pilsner'
WHERE category='Beer' AND name='Pilsner' AND brand IS NULL;

UPDATE canonical_products SET subcategory='Amber'
WHERE category='Beer' AND name='Amber Ale' AND brand IS NULL;
