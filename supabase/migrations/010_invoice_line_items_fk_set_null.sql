-- Make invoice_line_items.matched_ingredient_id survive ingredient deletion.
--
-- Original FK (migration 001) used the default NO ACTION, so deleting an
-- ingredient that was ever auto-matched on an invoice raised:
--   "violates foreign key constraint invoice_line_items_matched_ingredient_id_fkey"
--
-- Invoice line items are historical records. When the user later deletes
-- their own ingredient, we want the line item to forget the link (SET NULL)
-- but keep the rest of the row (product_name, price, invoice_id, etc.).

ALTER TABLE invoice_line_items
  DROP CONSTRAINT IF EXISTS invoice_line_items_matched_ingredient_id_fkey;

ALTER TABLE invoice_line_items
  ADD CONSTRAINT invoice_line_items_matched_ingredient_id_fkey
  FOREIGN KEY (matched_ingredient_id)
  REFERENCES ingredients(id)
  ON DELETE SET NULL;
