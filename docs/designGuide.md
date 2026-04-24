# PourCost Design Guide

> **Purpose**: UI/UX design system and implementation guidelines for the PourCost Expo/React Native app. The app targets bar managers and hospitality professionals working in fast-paced, often dimly-lit environments.

---

## 1. Design Philosophy

**Dark-first, premium but effortless.** Bar managers are scanning, not reading. They're often standing, in the dark, in a rush.

- **Dark-first**: Dark mode is the default. Bright screens at 11pm behind the bar are hostile.
- **Glanceable data**: Key numbers (pour cost, margin, price) should be visually dominant.
- **Progressive disclosure**: Show the essential action first, reveal detail on demand.
- **Generous touch targets**: Minimum 48pt, ideally larger for primary actions.
- **Component reuse**: Every UI pattern should be a reusable component. No inline one-offs.

---

## 2. Color System

### Expanded Palette (9 shades per family)

Each family has 9 shades from lightest (1) to darkest (9), normalized on even HSL lightness steps. Hero shades are marked.

```typescript
// Located in: src/contexts/ThemeContext.tsx → `palette`

// Blues — H:220 S:59 | hero: B5 (primary CTA)
B1-B9: '#EFF1F5' → '#0C121D'

// Neutrals — pure gray, zero saturation
N1-N9: '#FFFFFF' → '#0D0D0D'

// Yellows/Golds — H:43 S:64 | hero: Y4 (brand gold)
// Y1-Y3 serve as warm creams (replaces old n2/n3/n4)
Y1-Y9: '#F6F4EF' → '#1E180B'

// Greens/Teals — H:165 S:55 | hero: G3 (success)
G1-G9: '#EFF5F4' → '#0D1C18'

// Purples — H:249 S:73 | hero: P3 (AI/intelligence)
P1-P9: '#F0EFF6' → '#0D0A1F'

// Reds/Pinks — H:343 S:66 | hero: R3 (danger)
R1-R9: '#F6EFF1' → '#1E0B10'

// Oranges — H:28 S:80 | hero: O4 (caution)
O1-O9: '#F6F2EE' → '#201409'
```

### Semantic Theme Tokens

All components use `useThemeColors()` which returns flat semantic tokens. Never hardcode hex colors in components.

**Dark mode:**
- `background`: `#0B1120` — screen fill
- `surface`: `#162238` — cards
- `elevated`: `#1E3050` — bottom sheets, modals
- `inputBg`: `#0E1726` — text inputs (darker than surface = "inset")
- `text`: `#F1F2F4` — primary text (near-white, not pure white)
- `textSecondary`: `#C4CBD8` — labels, descriptions
- `textTertiary`: `#8E99AB` — metadata, subtitles
- `textMuted`: `#4A5568` — placeholders
- `gold`: `palette.Y4` — section headers, brand moments
- `go`: `palette.G5` — save/confirm buttons

**Light mode:**
- `background`: `#E6ECF2` — pale blue wash (brand-tinted)
- `surface`: `#FFFFFF` — white cards pop against blue bg
- `inputBg`: `#F0F3F7` — very light blue-gray
- `gold`: `palette.B5` — uses blue instead of gold (gold looks muddy on light)
- Section headers, cards, inputs all use the same semantic tokens

### Color Rules

- **Never use opacity hacks** for colors. Use explicit palette shades instead.
- **Borders**: Dark mode uses `rgba(255,255,255,0.12)`. Light mode uses `palette.N3`.
- **Purple = AI**: Used for suggested prices, AI badges. Background `P1`/`P8`, border `P2`/`P5`, icon always `P3`.
- **Pour cost performance colors**: Green (on target) → Yellow (close) → Orange (drifting) → Red (way off).
- **Drawer active items**: Gold text in dark mode, blue text in light mode. No background highlight.

---

## 3. Component Architecture

### Input Components (all share identical visual styling)

| Component | File | Purpose |
|-----------|------|---------|
| `TextInput` | `ui/TextInput.tsx` | Text entry with label, prefix, error state |
| `SearchBar` | `ui/SearchBar.tsx` | Search with icon and clear button |
| `Dropdown` | `ui/Dropdown.tsx` | Picker trigger that opens BottomSheet |
| `CustomSlider` | `ui/CustomSlider.tsx` | Range slider with label |

All use: `rounded-lg p-4`, `backgroundColor: colors.surface`, `borderWidth: 1, borderColor: colors.border`

Labels: `text-lg`, `color: colors.textSecondary`, `fontWeight: '500'`

### Card System

| Component | File | Purpose |
|-----------|------|---------|
| `Card` | `ui/Card.tsx` | Base card with blue gradient (dark), white+shadow (light) |
| `SwipeableCard` | `SwipeableCard.tsx` | Card with swipe-to-edit/delete actions |
| `SettingsCard` | `ui/SettingsCard.tsx` | Settings row (wraps Card internally) |

Cards have: `borderRadius: 12`, `colors.surface` bg, `colors.border` border, blue gradient overlay in dark mode.

### Selection Components

| Component | File | Variants |
|-----------|------|----------|
| `ChipSelector` | `ui/ChipSelector.tsx` | `filter` (rounded pills for pages), `compact` (rounded-lg for cards) |
| `Toggle` | `ui/Toggle.tsx` | Animated switch with teal active color |

### Layout Components

| Component | File | Purpose |
|-----------|------|---------|
| `GradientBackground` | `ui/GradientBackground.tsx` | Screen wrapper (gradient dark, subtle gradient light) |
| `SectionDivider` | `ui/SectionDivider.tsx` | Thin line between sections |
| `ScreenTitle` | `ui/ScreenTitle.tsx` | Title with variants: `main`, `section`, `page`, `group` |
| `MetricRow` | `ui/MetricRow.tsx` | Label + value pair |
| `AiSuggestionRow` | `ui/AiSuggestionRow.tsx` | Purple-tinted AI suggestion with sparkles icon |
| `ImagePlaceholder` | `ui/ImagePlaceholder.tsx` | Image or "Add Photo" placeholder, sizes: small/medium/large |

### Overlay Components

| Component | File | Purpose |
|-----------|------|---------|
| `BottomSheet` | `ui/BottomSheet.tsx` | Slide-up sheet with fade overlay |
| `ActionSheet` | `ui/ActionSheet.tsx` | Action menu (edit/delete) wrapping BottomSheet |
| `Dropdown` | `ui/Dropdown.tsx` | Picker using BottomSheet |

### Section Headers

`ScreenTitle variant="group"` renders gold uppercase section headers in dark mode, blue in light mode. Used for: INGREDIENTS, PRICING, COST ANALYSIS, DETAILS, TYPE, SORT BY, etc.

---

## 4. Screen Patterns

### Navigation
- All screens use Expo Router's built-in header (consistent styling from root Stack `screenOptions`)
- Back arrow (`arrow-back`) on all non-drawer screens
- 3-dot menu (`ellipsis-horizontal`) on detail screens opens ActionSheet
- Save button (green, top right) on form screens
- Cancel + back arrow (top left) on form screens
- Delete as text link at bottom of form screens (edit mode only)
- Drawer: gold active text (dark), blue active text (light), no bg highlight

### Detail Pages (Ingredient, Cocktail)
- Nav title: "Ingredient" / "Cocktail" (generic)
- Hero name as large title in body
- Sections separated by `SectionDivider`
- Gold `ScreenTitle variant="group"` for section headers
- Pricing rows with `borderSubtle` dividers between rows
- `AiSuggestionRow` for suggested price/retail
- `PourCostHero` — full-width banded section bleeding to screen edges (wrap in `<View className="-mx-6">` inside a padded container)

### Form Pages (Create/Edit)
- Section dividers between groups, no Card wrappers around sections
- `ChipSelector` for categories/types
- Ingredients as `CocktailIngredientItem` with pour size chips (not swipeable)
- Retail price input with `$` prefix
- Cost analysis with `AiSuggestionRow` for suggested price

### List Pages (Ingredients, Cocktails)
- Search bar at top
- `ScreenTitle variant="group"` for filter/sort section headers
- `SwipeableCard` items with swipe-to-edit (blue) and swipe-to-delete (red)
- Chevron on right when no metric highlight shown
- Metric highlight with left border accent when sorting by cost/margin/cost%

---

## 5. Data Display

### Currency
Always use `formatCurrency()` from `calculation-service.ts`. Never inline `$${x.toFixed(2)}`.

### Percentages
Always use `formatPercentage()`. Never inline `${x.toFixed(1)}%`.

### Pour Cost Performance
Colors based on ratio to user's goal (from settings):
- **Green** (G3): Within 15% of goal
- **Yellow** (Y3): Within 35% of goal
- **Orange** (O4/O5): Within 60% of goal
- **Red** (R3): Beyond 60% of goal

Bar scale: 0% on left → goal at center (50%) → 2x goal on right. Linear fill.

### Suggested Prices
All use `calculateSuggestedPrice(cost, pourCostGoal / 100)` — respects user's pour cost goal setting. Displayed in purple `AiSuggestionRow` with sparkles icon.

---

## 6. Settings Structure

Settings page (also contains About info):
- **Logo + tagline** at top
- **Calculations**: Pour Cost Goal, Default Pour Size, Default Retail Price, Ingredient Order
- **Appearance**: Theme (Dark/Light/Auto)
- **Account**: Your Name, Sign Out
- **Support**: Help & Support, Suggest a Feature, Terms & Privacy, Version

All settings rows use `SettingsCard` (which wraps `Card`). Pickers open `BottomSheet`. `showCaret` on items that open pickers/links.

---

## 7. Tech Stack Reference

- **Framework**: React Native + Expo
- **Navigation**: Expo Router (file-based)
- **Styling**: NativeWind (Tailwind) for layout, inline `style` for theme colors
- **State**: Zustand stores
- **Backend**: Supabase (auth, data, profiles)
- **Theme**: `useThemeColors()` hook from `ThemeContext.tsx`
- **Animations**: react-native-reanimated

For architecture details, see `CLAUDE.md`.
