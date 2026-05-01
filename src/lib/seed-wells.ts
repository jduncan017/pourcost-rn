/**
 * Inserts well-tier ingredient rows for the user's wells onboarding picks.
 *
 * Three pick sources, all funnel through here:
 *   - Curated quick pick: name/size/cost from `wells.ts` quickPicks array.
 *   - Canonical search pick: name/size from canonical_products + cost the
 *     user typed in the inline price input. canonical_product_id linked.
 *   - (Future) Custom-create pick: deferred to V1.1.
 *
 * Wells are tagged with `is_well = true` (migration 012) so the cocktail
 * picker can substitute them into generic recipe slots.
 */
import { supabase } from '@/src/lib/supabase';
import { Volume } from '@/src/types/models';
import { WELL_CATEGORIES } from '@/src/lib/wells';

export interface WellSelection {
  /** WELL_CATEGORIES[i].key */
  categoryKey: string;
  name: string;
  productSize: Volume;
  productCost: number;
  /** Set when the pick came from canonical search (not a curated quickPick). */
  canonicalProductId?: string;
}

async function currentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export async function seedWells(selections: WellSelection[]): Promise<void> {
  if (selections.length === 0) return;

  const userId = await currentUserId();

  // Mirror the safety net from seed-sample-bar — if `handle_new_user` hasn't
  // fired yet, the FK on ingredients.user_id would fail.
  const { error: profileErr } = await supabase
    .from('profiles')
    .upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true });
  if (profileErr) throw new Error(`Could not ensure profile row: ${profileErr.message}`);

  const rows = selections
    .map((selection) => {
      const category = WELL_CATEGORIES.find((c) => c.key === selection.categoryKey);
      if (!category) return null;
      return {
        user_id: userId,
        name: selection.name,
        type: 'Spirit',
        sub_type: category.subType,
        product_size: selection.productSize,
        product_cost: selection.productCost,
        not_for_sale: false,
        is_well: true,
        canonical_product_id: selection.canonicalProductId ?? null,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length === 0) return;

  const { error } = await supabase.from('ingredients').insert(rows);
  if (error) throw new Error(`Failed to seed wells: ${error.message}`);
}
