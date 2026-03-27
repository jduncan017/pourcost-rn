/**
 * Builds route params for navigating to the ingredient edit form.
 * Shared by ingredients list, ingredient detail, and anywhere else that opens the edit form.
 */

import { SavedIngredient } from '@/src/types/models';

export function buildIngredientEditParams(ingredient: SavedIngredient): Record<string, string> {
  return {
    id: ingredient.id,
    name: ingredient.name,
    type: ingredient.type ?? '',
    subType: ingredient.subType ?? '',
    productSize: JSON.stringify(ingredient.productSize),
    productCost: ingredient.productCost.toString(),
    retailPrice: ingredient.retailPrice?.toString() ?? '',
    pourSize: ingredient.pourSize ? JSON.stringify(ingredient.pourSize) : '',
    notForSale: ingredient.notForSale ? 'true' : 'false',
    description: ingredient.description ?? '',
  };
}
