/**
 * Invoices Store for PourCost-RN
 * Manages invoice scanning state. Line items are loaded on-demand per invoice.
 * Invoice list is cached in AsyncStorage for offline access.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FeedbackService } from '@/src/services/feedback-service';
import { ensureDate } from '@/src/lib/ensureDate';
import {
  fetchInvoices,
  fetchInvoiceById,
  fetchLineItemsForInvoice,
  insertInvoice,
  updateInvoiceStatus,
  deleteInvoiceById,
  updateLineItemMatch,
  uploadInvoiceImage,
  type CreateInvoiceParams,
} from '@/src/lib/invoice-data';
import type {
  Invoice,
  InvoiceLineItem,
  InvoiceStatus,
  MatchStatus,
} from '@/src/types/invoice-models';

// ==========================================
// STORE INTERFACE
// ==========================================

export interface InvoicesState {
  invoices: Invoice[];
  // Line items are kept per-invoice in memory (not persisted — fetched on review)
  lineItemsByInvoiceId: Record<string, InvoiceLineItem[]>;
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;

  loadInvoices: (forceReload?: boolean) => Promise<void>;

  /**
   * Full flow: upload images → create invoice record → return invoice.
   * Actual OCR/matching is triggered server-side (Edge Function) after creation.
   */
  createInvoice: (params: CreateInvoiceParams & { imageUris: string[] }) => Promise<Invoice>;

  deleteInvoice: (id: string) => Promise<void>;

  loadLineItems: (invoiceId: string) => Promise<InvoiceLineItem[]>;

  confirmLineItemMatch: (params: {
    lineItemId: string;
    ingredientId: string;
    matchStatus: MatchStatus;
    matchMethod?: InvoiceLineItem['matchMethod'];
    matchConfidence?: number;
  }) => Promise<void>;

  skipLineItem: (lineItemId: string) => Promise<void>;

  getInvoiceById: (id: string) => Invoice | undefined;
  getLineItemsForInvoice: (invoiceId: string) => InvoiceLineItem[] | undefined;

  clearError: () => void;
  reset: () => void;
}

// ==========================================
// STORE
// ==========================================

export const useInvoicesStore = create<InvoicesState>()(
  persist(
    (set, get) => ({
      invoices: [],
      lineItemsByInvoiceId: {},
      isLoading: false,
      isUploading: false,
      error: null,

      loadInvoices: async (forceReload = false) => {
        const { invoices, isLoading } = get();
        if (invoices.length > 0 && !isLoading && !forceReload) return;

        set({ isLoading: true, error: null });
        try {
          const data = await fetchInvoices();
          set({ invoices: data, isLoading: false });
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Failed to load invoices';
          set({ error: msg, isLoading: false });
        }
      },

      createInvoice: async ({ imageUris, ...params }) => {
        set({ isUploading: true, error: null });
        try {
          // Step 1: Create invoice record first to get the ID for storage paths
          const invoice = await insertInvoice({ ...params, imageUrls: [] });

          // Step 2: Upload all images to Supabase Storage
          const storagePaths: string[] = [];
          for (let i = 0; i < imageUris.length; i++) {
            const path = await uploadInvoiceImage(imageUris[i], invoice.id, i);
            storagePaths.push(path);
          }

          // Step 3: Update invoice record with storage paths
          await updateInvoiceStatus(invoice.id, 'processing', {});

          // Update image_urls directly via supabase (storage paths added)
          const { supabase } = await import('@/src/lib/supabase');
          await supabase
            .from('invoices')
            .update({ image_urls: storagePaths })
            .eq('id', invoice.id);

          const updatedInvoice = { ...invoice, imageUrls: storagePaths };

          set(state => ({
            invoices: [updatedInvoice, ...state.invoices],
            isUploading: false,
          }));

          FeedbackService.showSuccess('Invoice Uploaded', 'Processing will begin shortly');
          return updatedInvoice;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Failed to upload invoice';
          set({ error: msg, isUploading: false });
          FeedbackService.showError('Upload Failed', msg);
          throw error;
        }
      },

      deleteInvoice: async (id) => {
        const invoice = get().invoices.find(i => i.id === id);
        if (!invoice) return;

        // Optimistic removal
        set(state => ({
          invoices: state.invoices.filter(i => i.id !== id),
          lineItemsByInvoiceId: Object.fromEntries(
            Object.entries(state.lineItemsByInvoiceId).filter(([k]) => k !== id)
          ),
        }));

        let cancelled = false;
        const timer = setTimeout(async () => {
          if (cancelled) return;
          try {
            await deleteInvoiceById(id);
          } catch (error) {
            // Re-add on failure
            set(state => ({ invoices: [...state.invoices, invoice] }));
            const msg = error instanceof Error ? error.message : 'Failed to delete invoice';
            FeedbackService.showError('Delete Failed', msg);
          }
        }, 5000);

        FeedbackService.showSuccess(
          'Deleted',
          `Invoice removed`,
          {
            label: 'Undo',
            onPress: () => {
              cancelled = true;
              clearTimeout(timer);
              set(state => ({ invoices: [...state.invoices, invoice] }));
            },
          }
        );
      },

      loadLineItems: async (invoiceId) => {
        try {
          const items = await fetchLineItemsForInvoice(invoiceId);
          set(state => ({
            lineItemsByInvoiceId: {
              ...state.lineItemsByInvoiceId,
              [invoiceId]: items,
            },
          }));
          return items;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Failed to load line items';
          FeedbackService.showError('Load Failed', msg);
          return [];
        }
      },

      confirmLineItemMatch: async ({ lineItemId, ingredientId, matchStatus, matchMethod, matchConfidence }) => {
        try {
          await updateLineItemMatch(lineItemId, {
            matchedIngredientId: ingredientId,
            matchStatus,
            matchMethod,
            matchConfidence,
          });

          // Update local state
          set(state => {
            const updated = { ...state.lineItemsByInvoiceId };
            for (const invoiceId of Object.keys(updated)) {
              updated[invoiceId] = updated[invoiceId].map(item =>
                item.id === lineItemId
                  ? { ...item, matchedIngredientId: ingredientId, matchStatus, matchMethod, matchConfidence }
                  : item
              );
            }
            return { lineItemsByInvoiceId: updated };
          });
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Failed to update match';
          FeedbackService.showError('Update Failed', msg);
          throw error;
        }
      },

      skipLineItem: async (lineItemId) => {
        try {
          await updateLineItemMatch(lineItemId, {
            matchedIngredientId: null,
            matchStatus: 'skipped',
          });

          set(state => {
            const updated = { ...state.lineItemsByInvoiceId };
            for (const invoiceId of Object.keys(updated)) {
              updated[invoiceId] = updated[invoiceId].map(item =>
                item.id === lineItemId ? { ...item, matchStatus: 'skipped' as MatchStatus } : item
              );
            }
            return { lineItemsByInvoiceId: updated };
          });
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Failed to skip item';
          FeedbackService.showError('Update Failed', msg);
        }
      },

      getInvoiceById: (id) => get().invoices.find(i => i.id === id),

      getLineItemsForInvoice: (invoiceId) => get().lineItemsByInvoiceId[invoiceId],

      clearError: () => set({ error: null }),

      reset: () => set({
        invoices: [],
        lineItemsByInvoiceId: {},
        isLoading: false,
        isUploading: false,
        error: null,
      }),
    }),
    {
      name: 'invoices-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ invoices: state.invoices }),
      // merge runs synchronously inside setState so dates are Date objects before
      // the first re-render — avoids "undefined is not a function" on toLocaleDateString
      merge: (persisted, current) => {
        const stored = persisted as Partial<InvoicesState>;
        return {
          ...current,
          invoices: (stored.invoices ?? []).map(inv => ({
            ...inv,
            imageUrls: inv.imageUrls ?? [],
            invoiceDate: inv.invoiceDate ? ensureDate(inv.invoiceDate as any) : undefined,
            createdAt: ensureDate(inv.createdAt as any),
            updatedAt: ensureDate(inv.updatedAt as any),
          })),
        };
      },
    }
  )
);
