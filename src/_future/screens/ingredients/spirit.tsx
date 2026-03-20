/**
 * Spirit ingredient screen
 * Specialized form for spirits with bottles and fractional oz pours
 */

import React from 'react';
import FlexibleIngredientForm from '@/src/components/FlexibleIngredientForm';
import { CreateFlexibleIngredientData } from '@/src/types/flexible-models';
import { FlexibleIngredientService } from '@/src/services/flexible-ingredient-service';

export default function SpiritIngredientScreen() {
  const handleSave = async (data: CreateFlexibleIngredientData) => {
    try {
      const ingredient = await FlexibleIngredientService.createIngredient(data);
      // TODO: Add to store when flexible ingredients store is ready
      console.log('Created spirit ingredient:', ingredient);
    } catch (error) {
      console.error('Error creating spirit ingredient:', error);
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await FlexibleIngredientService.deleteIngredient(id);
      // TODO: Remove from store when flexible ingredients store is ready
      console.log('Deleted spirit ingredient:', id);
    } catch (error) {
      console.error('Error deleting spirit ingredient:', error);
      throw error;
    }
  };

  return (
    <FlexibleIngredientForm
      ingredientType="Spirit"
      onSave={handleSave}
      onDelete={handleDelete}
    />
  );
}