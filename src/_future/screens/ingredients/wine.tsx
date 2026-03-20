/**
 * Wine ingredient screen
 * Specialized form for wine with bottles and wine pours
 */

import React from 'react';
import FlexibleIngredientForm from '@/src/components/FlexibleIngredientForm';
import { CreateFlexibleIngredientData } from '@/src/types/flexible-models';
import { FlexibleIngredientService } from '@/src/services/flexible-ingredient-service';

export default function WineIngredientScreen() {
  const handleSave = async (data: CreateFlexibleIngredientData) => {
    try {
      const ingredient = await FlexibleIngredientService.createIngredient(data);
      // TODO: Add to store when flexible ingredients store is ready
      console.log('Created wine ingredient:', ingredient);
    } catch (error) {
      console.error('Error creating wine ingredient:', error);
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await FlexibleIngredientService.deleteIngredient(id);
      // TODO: Remove from store when flexible ingredients store is ready
      console.log('Deleted wine ingredient:', id);
    } catch (error) {
      console.error('Error deleting wine ingredient:', error);
      throw error;
    }
  };

  return (
    <FlexibleIngredientForm
      ingredientType="Wine"
      onSave={handleSave}
      onDelete={handleDelete}
    />
  );
}