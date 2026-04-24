# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## PourCost React Native App

A cocktail costing application that helps users calculate ingredient costs and drink pricing. Built with React Native, Expo, TypeScript, and modern development practices.

## Component Design Guidelines

### Avoid Multiple Component Exports from Single Files
**DO NOT** create multiple component variants exported from a single file (e.g., FeatureCard, ListCard, SummaryCard all from Card.tsx). This pattern creates several problems:

- **Hard to find components**: Developers can't easily locate where a specific component is defined
- **Difficult styling tracking**: Changes to base components can unexpectedly affect variant components
- **Poor maintainability**: Makes refactoring and updates more complex
- **IDE confusion**: Autocomplete and go-to-definition become less reliable

**Instead:**
- Keep one component per file with clear, descriptive names
- Use props and className for variations rather than separate wrapper components
- Create separate files for genuinely different components

## Architecture Guidelines

### Data Model
- `Volume` is a discriminated union (see `src/types/models.ts`) matching the iOS Volume enum. Use `volumeToOunces()`, `volumeLabel()`, and `fraction()` helpers.
- `SavedIngredient` uses `productSize: Volume` and `productCost: number` — NOT bottleSize/bottlePrice.
- `CocktailIngredient` uses `ingredientId`, `pourSize: Volume`, `cost` — NOT amount/unit.
- Stores hold base types only (`SavedIngredient[]`, `Cocktail[]`). Metrics are computed on-demand via `calculateIngredientMetrics()` and `calculateCocktailMetrics()` from `calculation-service.ts`.
- Calculation constants match iOS exactly: `ml * 0.033814 = oz`, default margin 18%.

### Backend (Supabase)
- **Schema**: `supabase/schema.sql` is the source of truth. Volume stored as JSONB — zero conversion between DB and TypeScript.
- **Auth**: Facebook + Google via Supabase Auth. Preserve existing Facebook App ID `1522826757747836` for iOS user migration.
- **RLS Strategy**: MVP uses simple `user_id = auth.uid()` RLS policies with direct client access. This is sufficient while each user only sees their own data. When multi-location, staff roles, or enterprise features are added post-MVP, move authorization logic to Edge Functions (service role key bypasses RLS) and keep RLS as a safety net only. Don't try to encode complex permission logic in SQL policies.
- **Legacy data**: No port from the old DynamoDB backend. New users start fresh in Supabase; existing auth identities (Facebook/Google) carry over via Supabase Auth provider linking.

### Archived Code
- `src/_future/` contains the flexible ingredient system (type-specific forms, multi-retail-config models). Excluded from TypeScript compilation. Intended for post-MVP reimplementation.

### Theme System
- Always use the centralized theme colors from `useThemeColors()` hook
- Never use hardcoded hex colors, RGB, or RGBA values
- Theme colors follow Tailwind config naming (p1, p2, g1, g2, s22, etc.)
- Use themeColors when Tailwind classes aren't viable (e.g., in React Native components)

### Component Structure
- Prefer single-responsibility components
- Use TypeScript interfaces for all props
- Follow consistent naming conventions
- Keep components focused and reusable

### Styling Guidelines
- **PascalCase Class Names**: Always start className with a PascalCase component identifier
  - Example: `className="Button p-2 bg-g1 rounded-lg"`
  - Example: `className="InputField border border-g2 px-3 py-2"`
  - This helps identify component-specific styles and improves maintainability

- **Theme Colors**: Always use ThemeContext instead of hex codes for maintainability
  - **NEVER** use hex codes like `#8B5CF6` or `#DC2626` 
  - **DO** use `useThemeColors()` hook when Tailwind classes aren't viable
  - Example: `color={themeColors.colors.s31}` instead of `color="#8B5CF6"`
  - Available colors: p1-p4, n1-n4, g1-g4, s11-s14, s21-s24, s31-s34, e1-e4

- **Card Component Usage**: The Card component has built-in styling and special props
  - **DON'T** add color/background styling via `className` - Card handles this automatically
  - **DO** use `displayClasses` prop for layout/spacing inside the card
  - **DO** use `variant` prop: 'gradient' (default) or 'custom'
  - **DO** use `padding` prop: 'none', 'small', 'medium' (default), 'large'
  - Example: `<Card displayClasses="flex-row items-center gap-4">` ✅
  - Example: `<Card className="bg-blue-500 p-4">` ❌ (conflicts with Card's styling)
  - The Card automatically provides glassmorphism gradient background and proper theming

- **Spacing**: Always use flexbox with `gap` instead of `space-y` or `space-x`
  - **DON'T** use `space-y-4` or `space-x-3` - these can be unreliable
  - **DO** use `flex-col gap-4` or `flex-row gap-3` for consistent spacing
  - Example: `<View className="flex-col gap-4">` ✅
  - Example: `<View className="space-y-4">` ❌ (unreliable)
  - This ensures consistent spacing across all platforms