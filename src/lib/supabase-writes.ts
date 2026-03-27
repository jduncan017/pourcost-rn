/**
 * Offline-aware write wrappers for supabase-data.
 * When online: calls supabase-data directly.
 * When offline: updates local store optimistically, queues the write for later sync.
 *
 * Stores should import from here instead of supabase-data for all write operations.
 * Read operations still come from supabase-data directly.
 */

import { isOnline } from './network-monitor';
import { enqueue, QueuedOperation } from './offline-queue';
import {
  updateProfile as _updateProfile,
  insertIngredient as _insertIngredient,
  updateIngredientById as _updateIngredientById,
  deleteIngredientById as _deleteIngredientById,
  insertCocktail as _insertCocktail,
  updateCocktailById as _updateCocktailById,
  deleteCocktailById as _deleteCocktailById,
} from './supabase-data';
import type { ProfileData } from './supabase-data';
import type { SavedIngredient, Cocktail } from '@/src/types/models';
import { FeedbackService } from '@/src/services/feedback-service';

function showQueuedToast(): void {
  FeedbackService.showInfo('Offline', 'Changes saved locally — will sync when you reconnect');
}

/**
 * Try the write. If it fails and we're offline, queue it.
 * If it fails and we're online, it's a real error — rethrow.
 */
async function tryOrQueue<T>(
  fn: () => Promise<T>,
  operation: QueuedOperation,
  offlineFallback?: T,
): Promise<T> {
  if (!isOnline()) {
    await enqueue(operation);
    showQueuedToast();
    if (offlineFallback !== undefined) return offlineFallback;
    throw new Error('OFFLINE_QUEUED');
  }

  try {
    return await fn();
  } catch (error) {
    // Network error while we thought we were online — queue it
    const msg = error instanceof Error ? error.message : '';
    const isNetworkError =
      msg.includes('Network request failed') ||
      msg.includes('Failed to fetch') ||
      msg.includes('TypeError: Network') ||
      msg.includes('ECONNREFUSED');

    if (isNetworkError) {
      await enqueue(operation);
      showQueuedToast();
      if (offlineFallback !== undefined) return offlineFallback;
      throw new Error('OFFLINE_QUEUED');
    }

    // Real server error, rethrow
    throw error;
  }
}

// ==========================================
// WRAPPED WRITE OPERATIONS
// ==========================================

export async function updateProfile(profile: Partial<ProfileData>): Promise<void> {
  await tryOrQueue(
    () => _updateProfile(profile),
    { type: 'updateProfile', args: [profile] },
    undefined,
  );
}

export async function insertIngredient(
  ingredient: Omit<SavedIngredient, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
): Promise<SavedIngredient> {
  // Generate a temporary local ID for optimistic updates when offline
  const tempResult: SavedIngredient = {
    ...ingredient,
    id: `temp-${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'offline',
  };

  return tryOrQueue(
    () => _insertIngredient(ingredient),
    { type: 'insertIngredient', args: [ingredient] },
    tempResult,
  );
}

export async function updateIngredientById(
  id: string,
  updates: Partial<SavedIngredient>
): Promise<SavedIngredient> {
  // For offline, return a merged result. The store already has the current data.
  const offlineResult: SavedIngredient = {
    id,
    name: updates.name ?? '',
    productSize: updates.productSize ?? { kind: 'decimalOunces', ounces: 0 },
    productCost: updates.productCost ?? 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'offline',
  };

  return tryOrQueue(
    () => _updateIngredientById(id, updates),
    { type: 'updateIngredient', args: [id, updates] },
    offlineResult,
  );
}

export async function deleteIngredientById(id: string): Promise<void> {
  await tryOrQueue(
    () => _deleteIngredientById(id),
    { type: 'deleteIngredient', args: [id] },
    undefined,
  );
}

export async function insertCocktail(
  cocktail: Omit<Cocktail, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
): Promise<Cocktail> {
  const tempResult: Cocktail = {
    ...cocktail,
    id: `temp-${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'offline',
  };

  return tryOrQueue(
    () => _insertCocktail(cocktail),
    { type: 'insertCocktail', args: [cocktail] },
    tempResult,
  );
}

export async function updateCocktailById(
  id: string,
  updates: Partial<Cocktail>
): Promise<Cocktail> {
  const offlineResult: Cocktail = {
    id,
    name: updates.name ?? '',
    ingredients: updates.ingredients ?? [],
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'offline',
  };

  return tryOrQueue(
    () => _updateCocktailById(id, updates),
    { type: 'updateCocktail', args: [id, updates] },
    offlineResult,
  );
}

export async function deleteCocktailById(id: string): Promise<void> {
  await tryOrQueue(
    () => _deleteCocktailById(id),
    { type: 'deleteCocktail', args: [id] },
    undefined,
  );
}
