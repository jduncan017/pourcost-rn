/**
 * Beer ingredient screen
 * Specialized form for beer with cans/kegs and serving sizes
 */

import React from 'react';
import FlexibleIngredientForm from '@/src/components/FlexibleIngredientForm';
import { CreateFlexibleIngredientData } from '@/src/types/flexible-models';
import { FlexibleIngredientService } from '@/src/services/flexible-ingredient-service';

export default function BeerIngredientScreen() {
  const handleSave = async (data: CreateFlexibleIngredientData) => {
    try {
      const ingredient = await FlexibleIngredientService.createIngredient(data);
      // TODO: Add to store when flexible ingredients store is ready
      console.log('Created beer ingredient:', ingredient);
    } catch (error) {
      console.error('Error creating beer ingredient:', error);
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await FlexibleIngredientService.deleteIngredient(id);
      // TODO: Remove from store when flexible ingredients store is ready
      console.log('Deleted beer ingredient:', id);
    } catch (error) {
      console.error('Error deleting beer ingredient:', error);
      throw error;
    }
  };

  return (
    <FlexibleIngredientForm
      ingredientType="Beer"
      onSave={handleSave}
      onDelete={handleDelete}
    />
  );
}