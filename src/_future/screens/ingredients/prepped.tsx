/**
 * Prepped ingredient screen
 * Specialized form for house-made items with batch containers and recipe amounts
 */

import React from 'react';
import FlexibleIngredientForm from '@/src/components/FlexibleIngredientForm';
import { CreateFlexibleIngredientData } from '@/src/types/flexible-models';
import { FlexibleIngredientService } from '@/src/services/flexible-ingredient-service';

export default function PreppedIngredientScreen() {
  const handleSave = async (data: CreateFlexibleIngredientData) => {
    try {
      const ingredient = await FlexibleIngredientService.createIngredient(data);
      // TODO: Add to store when flexible ingredients store is ready
      console.log('Created prepped ingredient:', ingredient);
    } catch (error) {
      console.error('Error creating prepped ingredient:', error);
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await FlexibleIngredientService.deleteIngredient(id);
      // TODO: Remove from store when flexible ingredients store is ready
      console.log('Deleted prepped ingredient:', id);
    } catch (error) {
      console.error('Error deleting prepped ingredient:', error);
      throw error;
    }
  };

  return (
    <FlexibleIngredientForm
      ingredientType="Prepped"
      onSave={handleSave}
      onDelete={handleDelete}
    />
  );
}