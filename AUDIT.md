# PourCost RN - Codebase Audit (2026-03-26)

## Critical Issues

### 1. Division by zero in garnish calculator
- **File**: `app/(drawer)/calculator.tsx`
- **Issue**: `garnishCostPerServing` divides by `garnishAmount` without checking > 0. Clearing the field produces `Infinity`.
- **Fix**: Guard with `garnishAmount > 0` check

### 2. Offline queue import can fail silently
- **File**: `src/lib/offline-queue.ts`
- **Issue**: Lazy `await import('./supabase-data')` not wrapped in its own try-catch. If import fails, queue processing silently dies.
- **Fix**: Wrap in try-catch with error feedback

### 3. No double-submit protection
- **Files**: `app/ingredient-form.tsx`, `app/cocktail-form.tsx`
- **Issue**: Button shows "Saving..." but form inputs aren't disabled. User can modify form or tap Save again during save.
- **Fix**: Disable all inputs while `isSaving === true`

### 4. Settings debounce can lose edits
- **File**: `app/(drawer)/settings.tsx`
- **Issue**: If app closes before 1500ms debounce fires, profile changes are lost.
- **Fix**: Save on unmount via useEffect cleanup

---

## Security

### 5. Console.error in production
- **Files**: Multiple
- **Issue**: `console.error` for parse failures leaks info in production
- **Fix**: Replace with FeedbackService or remove

### 6. No input sanitization
- **Files**: `ingredient-form.tsx`, `cocktail-form.tsx`
- **Issue**: Names/descriptions go to Supabase unsanitized. Low risk on mobile, XSS risk if web renders user content.
- **Fix**: Add sanitization helper

---

## Code Consistency

### 7. Hardcoded colors instead of theme
- `ingredient-selector.tsx`: `#6B7280`, `#10B981`, `#3B82F6`
- `settings.tsx`: `#FFFFFF` for button text
- Several onboarding screens: mixed `palette.` direct usage
- **Fix**: Replace all with `useThemeColors()` values

### 8. Duplicate constants
- `QUICK_POUR_SIZES` in `CocktailIngredientItem.tsx` — should be in `appConstants.ts`
- `DEFAULT_PRODUCT_SIZE` map duplicated in `IngredientInputs.tsx`
- Pour cost thresholds (0.15, 0.35, 0.6) hardcoded in `PourCostPerformanceBar.tsx`
- **Fix**: Centralize in `appConstants.ts`

### 9. Inconsistent error handling across stores
- `app-store.ts`: `console.warn`
- `ingredients-store.ts`: `set({ error })` + throws
- `cocktails-store.ts`: same as ingredients
- **Fix**: Use `FeedbackService.showError()` consistently

### 10. TypeScript `any` usage
- `cocktail-form.tsx`: `(ingredient: any)` in map
- `calculator.tsx`: `as any` for router.navigate
- `ingredients.tsx`: `as any` for setSortBy
- **Fix**: Properly type with actual interfaces

### 11. Card component misuse
- `ingredient-selector.tsx`: passes `className` to Card (conflicts with Card styling)
- **Fix**: Use `displayClasses` per CLAUDE.md guidelines

### 12. Date handling inconsistency
- Some files: `instanceof Date` checks
- Others: always `new Date()` conversion
- **Fix**: Normalize — store ISO strings, convert on display

---

## Performance

### 13. List item calculations not memoized
- **Files**: `IngredientListItem.tsx`, `CocktailListItem.tsx`
- **Issue**: Metrics calculated on every render. With 50+ items sorted by cost/margin, expensive per-item per-render.
- **Fix**: Wrap in `useMemo`

### 14. Search calculates metrics for all items, then slices
- **File**: `app/search.tsx`
- **Issue**: Computes metrics for every item, then `.slice(0, 10)`
- **Fix**: Slice first, then calculate

### 15. Ingredient selector auto-select is fragile
- **File**: `app/ingredient-selector.tsx`
- **Issue**: Relies on `allIngredients[0]` being newest. Breaks if sort order changes.
- **Fix**: Match by timestamp or explicit ID

---

## UX Improvements

### 16. No offline indicator
- **Issue**: App has offline queue but users can't see online/offline state
- **Fix**: Small badge in header or drawer

### 17. No undo for deletes
- **Issue**: Delete is immediate and irreversible
- **Fix**: Toast with "Undo" action, delay commit by ~5 seconds

### 18. Ingredient edits don't cascade to cocktails
- **Issue**: Changing ingredient cost doesn't update cocktails using it. `cocktail_ingredients` stores a snapshot.
- **Fix**: Update cocktail_ingredients when source ingredient changes, or recompute on read

### 19. No empty state guidance differentiation
- **Issue**: Same empty message for "filtered to nothing" vs "genuinely empty"
- **Fix**: Different messaging per case

### 20. Silent JSON parse failures
- **File**: `ingredient-form.tsx`
- **Issue**: Empty catch blocks when parsing params. Form silently uses defaults if edit params are malformed.
- **Fix**: Show error toast

---

## Code Reduction Opportunities

### 21. PickerSheet component
- **File**: `settings.tsx`
- **Issue**: Inline component wrapping BottomSheet. Could be reusable.
- **Fix**: Extract to `src/components/ui/PickerSheet.tsx`

### 22. Pour size constants consolidation
- **Issue**: `QUICK_POUR_SIZES` and `OTHER_POUR_SIZES` in `CocktailIngredientItem.tsx` overlap with `getPourChipsForContext` in `appConstants.ts`
- **Fix**: Centralize in `appConstants.ts`

### 23. Ingredient edit param builder
- **Issue**: Same param-building logic duplicated in `ingredients.tsx`, `ingredient-detail.tsx`, `cocktail-detail.tsx`
- **Fix**: Create `buildIngredientEditParams(ingredient)` helper

---

## Remaining MVP Checklist

From the original list, still pending:
- [ ] DynamoDB migration script (for existing iOS users)
- [ ] App icons & splash (need final assets)
- [ ] EAS build config (`eas.json`, signing, store metadata)
- [ ] Network error states (retry logic, error UI)
- [ ] Terms & Privacy URL (hosted page for store compliance)
- [ ] Light mode polish (some screens need fine-tuning)
- [ ] Navigation race condition (rapid double-tap crashes)
- [ ] Add animations (screen transitions, list item interactions, micro-interactions)

---

## DB Migrations Pending

```sql
ALTER TABLE ingredients ADD COLUMN retail_price NUMERIC(10,2);
ALTER TABLE ingredients ADD COLUMN sub_type TEXT;
ALTER TABLE ingredients ADD COLUMN pour_size JSONB;
ALTER TABLE profiles ADD COLUMN enabled_product_sizes JSONB DEFAULT '[]'::jsonb;
```

---

## Priority Order for Fixes

**Batch 1 — Critical (do first):**
- #1 Division by zero
- #3 Double-submit protection
- #4 Settings save on unmount
- #13 Memoize list calculations

**Batch 2 — Consistency (do next):**
- #7 Replace hardcoded colors
- #8 Centralize duplicate constants
- #9 Unified error handling
- #10 Remove `any` types

**Batch 3 — UX Polish:**
- #16 Offline indicator
- #17 Undo for deletes
- #18 Cascade ingredient edits
- #19 Better empty states
- #20 Surface parse failures

**Batch 4 — Code Quality:**
- #21-23 Extract shared code
- #5-6 Security hardening
- #11-12 Guideline compliance
