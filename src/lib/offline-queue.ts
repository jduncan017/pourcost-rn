/**
 * Offline write queue.
 * Queues failed Supabase writes when offline and replays them when connectivity returns.
 * Uses AsyncStorage for persistence so queued operations survive app restarts.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { FeedbackService } from '@/src/services/feedback-service';
import { addNetworkListener, isOnline } from './network-monitor';

const QUEUE_KEY = 'offline-write-queue';

// ==========================================
// TYPES
// ==========================================

export type QueuedOperation =
  | { type: 'updateProfile'; args: [any] }
  | { type: 'insertIngredient'; args: [any] }
  | { type: 'updateIngredient'; args: [string, any] }
  | { type: 'deleteIngredient'; args: [string] }
  | { type: 'insertCocktail'; args: [any] }
  | { type: 'updateCocktail'; args: [string, any] }
  | { type: 'deleteCocktail'; args: [string] };

interface QueueEntry {
  id: string;
  operation: QueuedOperation;
  createdAt: string;
  retries: number;
}

const MAX_RETRIES = 3;

// Insert operations are not idempotent — retrying creates duplicates.
// If they fail, discard them rather than re-queuing.
const NON_RETRYABLE_TYPES = new Set(['insertIngredient', 'insertCocktail']);

// ==========================================
// QUEUE STORAGE
// ==========================================

async function loadQueue(): Promise<QueueEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveQueue(queue: QueueEntry[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function enqueue(operation: QueuedOperation): Promise<void> {
  const entry: QueueEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    operation,
    createdAt: new Date().toISOString(),
    retries: 0,
  };

  const queue = await loadQueue();
  queue.push(entry);
  await saveQueue(queue);
}

export async function getQueueLength(): Promise<number> {
  const queue = await loadQueue();
  return queue.length;
}

// ==========================================
// QUEUE PROCESSING
// ==========================================

let _isSyncing = false;

/**
 * Replay all queued operations in order.
 * Called automatically when network connectivity is restored.
 */
export async function processQueue(): Promise<void> {
  if (_isSyncing) return;
  _isSyncing = true;

  try {
    const queue = await loadQueue();
    if (queue.length === 0) return;

    // Lazy import to avoid circular dependency
    let supabaseData;
    try {
      supabaseData = await import('./supabase-data');
    } catch {
      FeedbackService.showWarning('Sync Error', 'Could not load sync module — will retry later');
      return;
    }

    const executors: Record<string, (args: any[]) => Promise<any>> = {
      updateProfile: (args) => supabaseData.updateProfile(args[0]),
      insertIngredient: (args) => supabaseData.insertIngredient(args[0]),
      updateIngredient: (args) => supabaseData.updateIngredientById(args[0], args[1]),
      deleteIngredient: (args) => supabaseData.deleteIngredientById(args[0]),
      insertCocktail: (args) => supabaseData.insertCocktail(args[0]),
      updateCocktail: (args) => supabaseData.updateCocktailById(args[0], args[1]),
      deleteCocktail: (args) => supabaseData.deleteCocktailById(args[0]),
    };

    let processed = 0;
    let failed = 0;
    const remaining: QueueEntry[] = [];

    for (const entry of queue) {
      const executor = executors[entry.operation.type];
      if (!executor) {
        // Unknown operation type, discard
        continue;
      }

      try {
        await executor(entry.operation.args);
        processed++;
      } catch {
        // Insert operations are not safe to retry (would create duplicates)
        if (NON_RETRYABLE_TYPES.has(entry.operation.type)) {
          failed++;
          // Don't re-queue — the insert may have partially succeeded
          continue;
        }

        // For updates/deletes: retry up to MAX_RETRIES
        entry.retries++;
        if (entry.retries < MAX_RETRIES) {
          remaining.push(entry);
        }
        failed++;
      }
    }

    await saveQueue(remaining);

    if (processed > 0 || failed > 0) {
      // Reload stores from server to reconcile any stale local state
      try {
        const { useIngredientsStore } = await import('@/src/stores/ingredients-store');
        const { useCocktailsStore } = await import('@/src/stores/cocktails-store');
        await useIngredientsStore.getState().loadIngredients(true);
        await useCocktailsStore.getState().loadCocktails(true);
      } catch {
        // Non-critical — stores will sync on next manual refresh
      }
    }

    if (processed > 0) {
      FeedbackService.showSuccess(
        'Synced',
        `${processed} offline change${processed > 1 ? 's' : ''} saved to server`
      );
    }

    if (remaining.length > 0) {
      FeedbackService.showWarning(
        'Sync Issue',
        `${remaining.length} change${remaining.length > 1 ? 's' : ''} failed to sync. We'll retry shortly.`
      );
    } else if (failed > 0) {
      FeedbackService.showWarning(
        'Sync Issue',
        `${failed} change${failed > 1 ? 's' : ''} could not be synced`
      );
    }
  } finally {
    _isSyncing = false;
  }
}

// ==========================================
// INITIALIZATION
// ==========================================

let _initialized = false;

/**
 * Start listening for network changes and process queue on reconnect.
 * Call once at app startup.
 */
export function initOfflineQueue(): () => void {
  if (_initialized) return () => {};
  _initialized = true;

  const removeListener = addNetworkListener((connected) => {
    if (connected) {
      processQueue();
    }
  });

  // Also try to process on init in case there are leftover items from a previous session
  if (isOnline()) {
    processQueue();
  }

  return () => {
    removeListener();
    _initialized = false;
  };
}
