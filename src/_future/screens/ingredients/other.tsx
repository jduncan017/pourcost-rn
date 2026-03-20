/**
 * Other ingredient screen
 * Completely flexible form for garnishes and specialty items
 */

import React from 'react';
import FlexibleIngredientForm from '@/src/components/FlexibleIngredientForm';
import { CreateFlexibleIngredientData } from '@/src/types/flexible-models';
import { FlexibleIngredientService } from '@/src/services/flexible-ingredient-service';

export default function OtherIngredientScreen() {
  const handleSave = async (data: CreateFlexibleIngredientData) => {
    try {
      const ingredient = await FlexibleIngredientService.createIngredient(data);
      // TODO: Add to store when flexible ingredients store is ready
      console.log('Created other ingredient:', ingredient);
    } catch (error) {
      console.error('Error creating other ingredient:', error);
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await FlexibleIngredientService.deleteIngredient(id);
      // TODO: Remove from store when flexible ingredients store is ready
      console.log('Deleted other ingredient:', id);
    } catch (error) {
      console.error('Error deleting other ingredient:', error);
      throw error;
    }
  };

  return (
    <FlexibleIngredientForm
      ingredientType="Other"
      onSave={handleSave}
      onDelete={handleDelete}
    />
  );
}