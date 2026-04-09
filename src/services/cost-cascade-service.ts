/**
 * Cost Cascade Service
 *
 * When an invoice scan updates an ingredient's price, the change must
 * ripple through the entire costing graph:
 *
 *   Invoice line item (new price)
 *     → Ingredient (update productCost)
 *       → Prepped ingredients that use it as a component (recalc cost_per_oz)
 *         → Cocktails that use any affected ingredient or prepped ingredient
 *
 * Key design decisions:
 *   - Circular dependency protection: a prepped ingredient cannot (transitively)
 *     contain itself. We track a visited set to break cycles.
 *   - Price history is recorded before the update so we have old→new delta.
 *   - Batch updates: all cocktail_ingredients rows for a given ingredient are
 *     updated in a single pass, not per-cocktail.
 *   - The cascade is idempotent: running it twice with the same input produces
 *     the same result.
 */

import { supabase } from '@/src/lib/supabase';
import { calculateCostPerPour } from '@/src/services/calculation-service';
import { recordPriceChange } from '@/src/lib/invoice-data';
import { type Volume, volumeToOunces } from '@/src/types/models';

// ==========================================
// TYPES
// ==========================================

export interface PriceUpdateInput {
  /** The ingredient whose price changed */
  ingredientId: string;
  /** New cost for the default product configuration */
  newProductCost: number;
  /** New product size (if pack size changed), otherwise existing is kept */
  newProductSize?: Volume;
  /** Invoice line item ID that triggered the update (for price history) */
  invoiceLineItemId?: string;
  /** Invoice ID (for linking ingredient_configurations) */
  invoiceId?: string;
}

export interface CascadeResult {
  /** Ingredients directly updated by the invoice */
  ingredientsUpdated: string[];
  /** Prepped ingredients whose cost_per_oz was recalculated */
  preppedRecalculated: string[];
  /** Cocktail ingredient rows re-costed */
  cocktailIngredientsUpdated: number;
  /** Price changes that exceeded the significant change threshold */
  significantChanges: SignificantChange[];
}

export interface SignificantChange {
  ingredientId: string;
  ingredientName: string;
  oldPrice: number;
  newPrice: number;
  changePct: number;
}

/** Price changes exceeding this % are flagged */
const SIGNIFICANT_CHANGE_PCT = 10;

// ==========================================
// MAIN CASCADE
// ==========================================

/**
 * Apply a price update from an invoice line item and cascade through
 * the full costing graph.
 */
export async function applyPriceUpdate(
  input: PriceUpdateInput,
): Promise<CascadeResult> {
  const result: CascadeResult = {
    ingredientsUpdated: [],
    preppedRecalculated: [],
    cocktailIngredientsUpdated: 0,
    significantChanges: [],
  };

  // 1. Get current ingredient state
  const { data: ingredient } = await supabase
    .from('ingredients')
    .select('id, name, product_cost, product_size, type')
    .eq('id', input.ingredientId)
    .single();

  if (!ingredient) return result;

  const oldCost = Number(ingredient.product_cost);
  const oldSize = ingredient.product_size as Volume;
  const newCost = input.newProductCost;
  const newSize = input.newProductSize ?? oldSize;

  // 2. Record price history before updating
  if (oldCost !== newCost) {
    await recordPriceChange({
      ingredientId: input.ingredientId,
      invoiceLineItemId: input.invoiceLineItemId,
      oldPrice: oldCost,
      newPrice: newCost,
    });
  }

  // 3. Update ingredient's productCost (and size if changed)
  const updatePayload: Record<string, unknown> = {
    product_cost: newCost,
  };
  if (input.newProductSize) {
    updatePayload.product_size = newSize;
  }

  await supabase
    .from('ingredients')
    .update(updatePayload)
    .eq('id', input.ingredientId);

  result.ingredientsUpdated.push(input.ingredientId);

  // 4. Update the ingredient_configuration if relevant
  if (input.invoiceId) {
    await upsertDefaultConfiguration(input, newCost, newSize);
  }

  // 5. Track significant changes
  if (oldCost > 0) {
    const changePct = ((newCost - oldCost) / oldCost) * 100;
    if (Math.abs(changePct) >= SIGNIFICANT_CHANGE_PCT) {
      result.significantChanges.push({
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        oldPrice: oldCost,
        newPrice: newCost,
        changePct: Math.round(changePct * 10) / 10,
      });
    }
  }

  // 6. Cascade to cocktail_ingredients that use this ingredient directly
  const cocktailUpdates = await cascadeToCocktailIngredients(
    input.ingredientId,
    newCost,
    newSize,
  );
  result.cocktailIngredientsUpdated += cocktailUpdates;

  // 7. Cascade to prepped ingredients that use this as a component
  await cascadeToPreppedIngredients(
    input.ingredientId,
    new Set<string>(), // visited set for cycle protection
    result,
  );

  return result;
}

/**
 * Apply price updates for multiple line items from a single invoice.
 * Aggregates results across all updates.
 */
export async function applyInvoicePriceUpdates(
  updates: PriceUpdateInput[],
): Promise<CascadeResult> {
  const combined: CascadeResult = {
    ingredientsUpdated: [],
    preppedRecalculated: [],
    cocktailIngredientsUpdated: 0,
    significantChanges: [],
  };

  for (const update of updates) {
    const result = await applyPriceUpdate(update);
    combined.ingredientsUpdated.push(...result.ingredientsUpdated);
    combined.preppedRecalculated.push(...result.preppedRecalculated);
    combined.cocktailIngredientsUpdated += result.cocktailIngredientsUpdated;
    combined.significantChanges.push(...result.significantChanges);
  }

  // Deduplicate
  combined.ingredientsUpdated = [...new Set(combined.ingredientsUpdated)];
  combined.preppedRecalculated = [...new Set(combined.preppedRecalculated)];

  return combined;
}

// ==========================================
// COCKTAIL INGREDIENT CASCADE
// ==========================================

/**
 * Update all cocktail_ingredients rows that reference this ingredient
 * with the new product cost/size and recalculated pour cost.
 */
async function cascadeToCocktailIngredients(
  ingredientId: string,
  newCost: number,
  newSize: Volume,
): Promise<number> {
  const { data: rows } = await supabase
    .from('cocktail_ingredients')
    .select('id, pour_size')
    .eq('ingredient_id', ingredientId);

  if (!rows || rows.length === 0) return 0;

  let updated = 0;
  for (const row of rows) {
    const pourSize = row.pour_size as Volume;
    const cost = calculateCostPerPour(newSize, newCost, pourSize);

    const { error } = await supabase
      .from('cocktail_ingredients')
      .update({
        product_cost: newCost,
        product_size: newSize,
        cost,
      })
      .eq('id', row.id);

    if (!error) updated++;
  }

  return updated;
}

// ==========================================
// PREPPED INGREDIENT CASCADE
// ==========================================

/**
 * Find prepped ingredients whose recipes include the given ingredient
 * as a component, recalculate their cost_per_oz, then recursively
 * cascade the new cost to anything that uses the prepped ingredient.
 */
async function cascadeToPreppedIngredients(
  componentIngredientId: string,
  visited: Set<string>,
  result: CascadeResult,
): Promise<void> {
  // Prevent circular dependencies
  if (visited.has(componentIngredientId)) return;
  visited.add(componentIngredientId);

  // Find prepped_ingredient_recipes where components JSONB array
  // contains an object with ingredient_id matching our updated ingredient.
  // Supabase .contains() on JSONB arrays: pass the array value directly.
  const { data: recipes } = await supabase
    .from('prepped_ingredient_recipes')
    .select('id, ingredient_id, components, yield, user_id')
    .contains('components', [{ ingredient_id: componentIngredientId }]);

  if (!recipes || recipes.length === 0) return;

  for (const recipe of recipes) {
    const preppedIngredientId = recipe.ingredient_id;

    // Recalculate cost_per_oz from all components
    const costPerOz = await recalcPreppedCost(recipe);

    if (costPerOz === null) continue;

    // Update the recipe's cached cost_per_oz
    await supabase
      .from('prepped_ingredient_recipes')
      .update({
        cost_per_oz: costPerOz,
        last_calculated_at: new Date().toISOString(),
      })
      .eq('id', recipe.id);

    // Update the parent ingredient's productCost to reflect new cost.
    // For prepped ingredients, productCost = cost_per_oz * productSize in oz.
    const { data: preppedIng } = await supabase
      .from('ingredients')
      .select('id, name, product_cost, product_size')
      .eq('id', preppedIngredientId)
      .single();

    if (!preppedIng) continue;

    const preppedSize = preppedIng.product_size as Volume;
    const sizeOz = volumeToOunces(preppedSize);
    const newPreppedCost = Math.round(costPerOz * sizeOz * 100) / 100;
    const oldPreppedCost = Number(preppedIng.product_cost);

    if (oldPreppedCost !== newPreppedCost) {
      await supabase
        .from('ingredients')
        .update({ product_cost: newPreppedCost })
        .eq('id', preppedIngredientId);

      // Record price history for the prepped ingredient too
      await recordPriceChange({
        ingredientId: preppedIngredientId,
        oldPrice: oldPreppedCost,
        newPrice: newPreppedCost,
      });

      result.preppedRecalculated.push(preppedIngredientId);

      // Track significant changes on prepped ingredients
      if (oldPreppedCost > 0) {
        const changePct = ((newPreppedCost - oldPreppedCost) / oldPreppedCost) * 100;
        if (Math.abs(changePct) >= SIGNIFICANT_CHANGE_PCT) {
          result.significantChanges.push({
            ingredientId: preppedIngredientId,
            ingredientName: preppedIng.name,
            oldPrice: oldPreppedCost,
            newPrice: newPreppedCost,
            changePct: Math.round(changePct * 10) / 10,
          });
        }
      }

      // Cascade to cocktails using this prepped ingredient
      await cascadeToCocktailIngredients(
        preppedIngredientId,
        newPreppedCost,
        preppedSize,
      );

      // Recursive: if another prepped ingredient uses THIS prepped ingredient
      // as a component (e.g., a flavored syrup using simple syrup), cascade further.
      await cascadeToPreppedIngredients(preppedIngredientId, visited, result);
    }
  }
}

/**
 * Recalculate cost_per_oz for a prepped ingredient recipe by summing
 * component costs and dividing by yield.
 */
async function recalcPreppedCost(recipe: {
  components: unknown;
  yield: unknown;
}): Promise<number | null> {
  const components = recipe.components as Array<{
    ingredient_id: string;
    quantity: Volume;
  }>;
  const recipeYield = recipe.yield as Volume;

  if (!components || !recipeYield) return null;

  const yieldOz = volumeToOunces(recipeYield);
  if (yieldOz <= 0) return null;

  let totalCost = 0;

  for (const comp of components) {
    // Fetch current cost/size for each component ingredient
    const { data: ing } = await supabase
      .from('ingredients')
      .select('product_cost, product_size')
      .eq('id', comp.ingredient_id)
      .single();

    if (!ing) continue;

    const compCost = Number(ing.product_cost);
    const compSize = ing.product_size as Volume;
    const compSizeOz = volumeToOunces(compSize);

    if (compSizeOz <= 0) continue;

    // Cost per oz of this component × quantity in oz used in recipe
    const costPerOzComponent = compCost / compSizeOz;
    const quantityOz = volumeToOunces(comp.quantity);
    totalCost += costPerOzComponent * quantityOz;
  }

  // cost_per_oz = total recipe cost / yield in oz
  return Math.round((totalCost / yieldOz) * 10000) / 10000;
}

// ==========================================
// INGREDIENT CONFIGURATION HELPER
// ==========================================

/**
 * Create or update the default ingredient_configuration to reflect
 * the invoice-sourced price.
 */
async function upsertDefaultConfiguration(
  input: PriceUpdateInput,
  newCost: number,
  newSize: Volume,
): Promise<void> {
  // Check if a configuration already exists for this size
  const { data: existing } = await supabase
    .from('ingredient_configurations')
    .select('id, is_default')
    .eq('ingredient_id', input.ingredientId)
    .eq('product_size', JSON.stringify(newSize))
    .maybeSingle();

  if (existing) {
    // Update existing configuration
    await supabase
      .from('ingredient_configurations')
      .update({
        product_cost: newCost,
        source: 'invoice',
        last_invoice_id: input.invoiceId,
        last_updated_price_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    // Check if any default exists
    const { data: hasDefault } = await supabase
      .from('ingredient_configurations')
      .select('id')
      .eq('ingredient_id', input.ingredientId)
      .eq('is_default', true)
      .maybeSingle();

    // New config — make it default only if no other default exists
    await supabase
      .from('ingredient_configurations')
      .insert({
        ingredient_id: input.ingredientId,
        product_size: newSize,
        product_cost: newCost,
        pack_size: 1,
        is_default: !hasDefault,
        source: 'invoice',
        last_invoice_id: input.invoiceId,
        last_updated_price_at: new Date().toISOString(),
      });
  }
}
