# PourCost Design Guide for Claude Code

> **Purpose**: UI/UX design system and implementation guidelines for the PourCost Expo/React Native app. Follow these conventions across all screens and components. The app targets bar managers and hospitality professionals working in fast-paced, often dimly-lit environments.

---

## 1. Design Philosophy

PourCost should feel **premium but effortless** — like a well-made cocktail tool, not enterprise software. The UI should respect the user's time and environment. Bar managers are scanning, not reading. They're often standing, often in the dark, often in a rush.

**Core principles:**

- **Dark-first**: Dark mode is the default. These users work in dark rooms. A bright white screen at 11pm behind the bar is hostile.
- **Glanceable data**: Key numbers (pour cost, margin, price) should be visually dominant. Users should get the answer without hunting.
- **Progressive disclosure**: Show the essential action first, reveal detail on demand. Don't front-load complexity.
- **Generous touch targets**: Bar managers have wet hands, are multitasking, and may be using the app in a walk-in cooler. Minimum 48pt touch targets, ideally larger for primary actions.
- **Offline-resilient**: Cache aggressively. Never show a blank screen because of a network hiccup. Queue writes when offline and sync when reconnected.

---

## 2. Color System

### Raw Palette Tokens

The PourCost palette is a navy-blue-based dark theme with warm cream text, brand gold accents, and semantic color families.

```typescript
// Raw palette tokens — reference only, use semantic mappings below
const palette = {
  // Primary blues (backgrounds, depth layers)
  p1: '#3262C2',  // Bright blue — CTA buttons, interactive highlights
  p2: '#2C3E63',  // Mid navy — elevated surfaces (modals, sheets)
  p3: '#1D273C',  // Dark navy — card/surface backgrounds
  p4: '#041021',  // Deepest navy — base/root background

  // Neutrals (text, warm cream family)
  n1: '#FFFFFF',  // Pure white — use sparingly (icons, dividers)
  n2: '#FCF9ED',  // Warm off-white — primary text, headings
  n3: '#ECE7D1',  // Cream — secondary text (labels, descriptions)
  n4: '#CEC59D',  // Muted gold-cream — de-emphasized text (timestamps, placeholders)

  // Greys (supporting)
  g1: '#EEEEEE',
  g2: '#AFAFAF',  // Tertiary text, disabled states
  g3: '#585858',
  g4: '#111111',

  // Semantic 1 — Gold/Yellow family
  s11: '#FBE09D',  // Light yellow — warnings, caution states
  s12: '#DCB962',  // Brand gold — logo, section headers, premium moments ONLY
  s13: '#AF8827',  // Dark gold
  s14: '#694920',  // Deepest gold

  // Semantic 2 — Teal/Green family
  s21: '#51CCAE',  // Teal — success, healthy margins
  s22: '#439883',
  s23: '#286052',
  s24: '#062920',

  // Semantic 3 — Purple family
  s31: '#7663E7',  // Purple — AI features, intelligence indicators
  s32: '#594DA5',
  s33: '#382E78',
  s34: '#251C5F',

  // Error/Danger — Pink/Red family
  e1: '#D63663',   // Danger — losses, errors, destructive actions
  e2: '#B0244B',
  e3: '#780A29',
  e4: '#4C0015',
};
```

### Semantic Theme Mapping

```typescript
const theme = {
  // Backgrounds — layered depth system (darkest → lightest)
  bg: {
    base: palette.p4,       // #041021 — root background, screen fill
    surface: palette.p3,    // #1D273C — cards, list items, containers
    elevated: palette.p2,   // #2C3E63 — modals, bottom sheets, nested elements
    overlay: '#344B74',     // hover/press states (derived from p2, slightly lighter)
  },

  // Text hierarchy — 4 tiers, warm cream family
  text: {
    primary: palette.n2,    // #FCF9ED — headings, key data points, item names
    secondary: palette.n3,  // #ECE7D1 — labels, descriptions, body text (~6.5:1 on p3)
    tertiary: palette.g2,   // #AFAFAF — de-emphasized (timestamps, metadata)
    muted: palette.n4,      // #CEC59D — very subtle (placeholder text, disabled labels)
    inverse: palette.p4,    // #041021 — text on light/accent backgrounds
  },

  // Accent colors
  accent: {
    primary: palette.p1,              // #3262C2 — primary CTA buttons, links
    primaryHover: '#3D72D4',          // slightly lighter p1 for hover
    gold: palette.s12,                // #DCB962 — brand gold ONLY (see Design Decision #1)
    goldLight: palette.s11,           // #FBE09D — gold tint backgrounds
    goldSubtle: 'rgba(220, 185, 98, 0.12)',   // gold wash for cards/badges
    blueSubtle: 'rgba(50, 98, 194, 0.15)',    // blue wash for highlighted areas
    ai: palette.s31,                  // #7663E7 — AI badge bg, borders, dots (NEVER as text on dark bg)
    aiSubtle: 'rgba(118, 99, 231, 0.12)',     // AI tint for card backgrounds
    go: palette.s21,                  // #51CCAE — positive CTAs: upgrade, confirm, save (see Decision #5)
    goHover: '#5ED9BA',
    goSubtle: 'rgba(81, 204, 174, 0.12)',
  },

  // Semantic states
  semantic: {
    success: palette.s21,             // #51CCAE — healthy margins, confirmations
    successSubtle: 'rgba(81, 204, 174, 0.10)',
    warning: palette.s11,             // #FBE09D — caution, approaching thresholds (NOT s12)
    warningSubtle: 'rgba(251, 224, 157, 0.10)',
    danger: palette.e1,               // #D63663 — losses, errors, over-budget
    dangerSubtle: 'rgba(214, 54, 99, 0.10)',
    info: palette.s31,                // #7663E7 — informational, also AI context
    infoSubtle: 'rgba(118, 99, 231, 0.08)',
  },

  // Borders and dividers
  border: {
    subtle: 'rgba(255, 255, 255, 0.06)',   // card edges, section dividers
    default: 'rgba(255, 255, 255, 0.10)',   // standard borders
    strong: 'rgba(255, 255, 255, 0.18)',    // emphasized borders, button outlines
  },
};
```

### Critical Design Decisions

**DECISION 1 — Gold Separation**: `s12` (brand gold, #DCB962) is reserved EXCLUSIVELY for brand identity moments: the PourCost logo, section headers, premium/upgrade badges. Warning/caution states use `s11` (#FBE09D, lighter yellow) instead. This prevents "brand gold" and "something is wrong" from looking the same.

**DECISION 2 — Text Contrast**: Secondary text uses `n3` (#ECE7D1), not `n4`. On the `p3` (#1D273C) card background, `n3` achieves approximately 6.5:1 contrast — comfortably above WCAG AA's 4.5:1 minimum. `n4` (#CEC59D) is a new fourth tier (`text.muted`) reserved for truly de-emphasized content like placeholder text, disabled labels, and timestamps.

**DECISION 3 — Purple = AI (Supportive Only)**: `s31` (#7663E7) marks AI-generated content, but it is a **supportive color only** — never used as foreground text on dark navy backgrounds (poor contrast, hard to read). Instead, purple appears as: solid badge backgrounds with white/cream text on top, subtle background tints on cards with cream text, and thin left-border accents on suggestion cards. All readable text on AI-tinted surfaces uses `n2`/`n3` (cream), never purple.

**DECISION 5 — Green = Go**: Teal/green (`s21` / #51CCAE) is the "positive action" color for CTAs like Upgrade Plan, Confirm Matches, Save, Proceed. This separates "do this" (green) from "brand moment" (gold) and "navigate" (blue).

**DECISION 4 — Tab Bar Accessibility**: The active tab state uses a filled dot indicator below the icon (in addition to color change) so that color-blind users can identify the active tab without relying on color alone.

### Usage Rules

- **Pour cost / margin numbers** always use semantic colors: teal = healthy margin, yellow = watch, pink = losing money. This creates an instant visual language the user learns once and reads forever.
- **Brand gold** (`accent.gold` / `s12`) is reserved for brand identity and premium moments. Do not use for warnings, alerts, or semantic states.
- **Never use pure white (#FFFFFF)** as a text color on dark backgrounds — it's too harsh. Use `text.primary` (`n2` / #FCF9ED) instead. Reserve `n1` for small icons or dividers.
- **AI features use purple supportively** — solid purple badges with white text, subtle purple background tints, thin purple left-borders. Never use purple as foreground text on dark backgrounds. All readable text on AI-tinted surfaces stays cream (`n2`/`n3`).
- **Green for positive actions** (`accent.go` / `s21`). Use for Upgrade, Confirm, Save, Proceed buttons. Separates "do this" from brand moments (gold) and navigation (blue).

---

## 3. Typography

Use the system font stack (`-apple-system` / `SF Pro` on iOS, `Roboto` on Android) for maximum readability and native feel. Do NOT use custom fonts unless there's a strong brand reason — system fonts render faster and respect the user's accessibility settings.

```typescript
const typography = {
  // Size scale
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 28,
    '3xl': 34,
  },

  // Weight scale
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};
```

### Hierarchy Rules

- **Data points** (pour cost, price, margin): `xl` or `2xl`, `bold`, `text.primary` or semantic color
- **Item names** (cocktail name, ingredient name): `md` or `lg`, `semibold`, `text.primary`
- **Labels and descriptions**: `base`, `regular`, `text.secondary` (`n3`)
- **Metadata** (timestamps, counts): `sm`, `regular`, `text.muted` (`n4`)
- **Section headers**: `sm`, `semibold`, `accent.gold` (`s12`), UPPERCASE with letter-spacing 1.5
- **AI labels/badges**: `sm`, `semibold`, `accent.ai` (`s31`)

**Key data should be 2-3x larger than its label.** If a card shows "Pour Cost" above "$2.94", the dollar amount should dominate, not the label.

---

## 4. Spacing & Layout

```typescript
const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
};
```

### Layout Rules

- **Screen padding**: `base` (16) minimum on sides, `xl` (24) preferred
- **Card internal padding**: `lg` (20) to `xl` (24) — be generous, don't cram
- **Spacing between cards/sections**: `base` (16) to `lg` (20)
- **Spacing between label and value**: `xs` (4) to `sm` (8)
- **List item vertical padding**: `md` (12) to `base` (16) — enough for comfortable tap targets
- **Bottom safe area**: Always account for home indicator. Use `useSafeAreaInsets()` from `react-native-safe-area-context`

---

## 5. Component Patterns

### Cards

Cards are the primary content container. They should feel like physical objects — slightly raised, with clear edges.

```typescript
const cardStyle = {
  backgroundColor: theme.bg.surface,      // p3
  borderRadius: 16,
  padding: spacing.xl,                     // 24
  borderWidth: 1,
  borderColor: theme.border.subtle,        // 6% white
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 8,
  elevation: 3,
};
```

**Card rules:**
- Corner radius: 16 for standard cards, 12 for nested cards, 20 for hero/featured cards
- Never nest cards more than one level deep
- On dark backgrounds, a subtle border (1px, 6-10% white) provides more visual definition than shadows

### Buttons

```typescript
// Primary — blue, main CTA
const primaryButton = {
  backgroundColor: theme.accent.primary,   // p1
  borderRadius: 12,
  paddingVertical: 14,
  paddingHorizontal: 24,
  minHeight: 48,
  // Text: n1 white, semibold
};

// Gold — premium/upgrade actions only
const goldButton = {
  backgroundColor: theme.accent.gold,      // s12
  borderRadius: 12,
  paddingVertical: 14,
  paddingHorizontal: 24,
  minHeight: 48,
  // Text: p4 inverse, semibold
};

// Secondary — ghost/outline style
const secondaryButton = {
  backgroundColor: 'transparent',
  borderRadius: 12,
  borderWidth: 1.5,
  borderColor: theme.border.strong,
  paddingVertical: 14,
  paddingHorizontal: 24,
  minHeight: 48,
  // Text: text.primary, regular
};

// Go — green for positive actions (upgrade, confirm, save)
const goButton = {
  backgroundColor: theme.accent.go,        // s21
  borderRadius: 12,
  paddingVertical: 14,
  paddingHorizontal: 24,
  minHeight: 48,
  // Text: p4 inverse, semibold
};

// AI — subtle purple tint for AI-powered actions
const aiButton = {
  backgroundColor: theme.accent.aiSubtle,
  borderRadius: 12,
  borderWidth: 1.5,
  borderColor: 'rgba(118, 99, 231, 0.4)',  // subtle purple border
  paddingVertical: 14,
  paddingHorizontal: 24,
  minHeight: 48,
  // Text: text.primary (cream), NOT purple — purple stays supportive
};

// Destructive — for delete/remove actions
const destructiveButton = {
  backgroundColor: theme.semantic.dangerSubtle,
  borderRadius: 12,
  paddingVertical: 14,
  paddingHorizontal: 24,
  minHeight: 48,
  // Text: semantic.danger
};
```

**Button rules:**
- Only ONE primary (blue) button visible per screen at a time
- Green "go" buttons for positive actions: Upgrade Plan, Confirm Matches, Save Changes, Proceed
- Gold buttons are reserved for brand chrome moments only — not for regular CTAs
- AI-styled buttons use subtle purple tint with cream text — purple never as foreground text
- Destructive actions should require confirmation (swipe-to-delete or modal)
- Place primary CTA at the bottom of the screen within thumb reach, not at the top
- Disable buttons during async operations and show a loading indicator

### AI Components

All AI-generated or AI-suggested content should be visually distinct using purple **supportively** — as backgrounds, badges, and borders. Never use purple as text color on dark backgrounds.

```typescript
// AI Badge — small SOLID purple pill with white text
const aiBadge = {
  backgroundColor: theme.accent.ai,    // solid purple background
  borderRadius: 6,
  paddingHorizontal: 8,
  paddingVertical: 2,
  // Text: n1 WHITE, xs size, semibold — NOT purple text
  // Content: "AI" or "AI Match" or "AI Suggested"
};

// AI Suggestion Card — subtle purple tint with cream text
const aiSuggestionCard = {
  backgroundColor: theme.accent.aiSubtle,  // purple 12% tint
  borderLeftWidth: 3,
  borderLeftColor: theme.accent.ai,        // solid purple border accent
  borderRadius: 12,
  padding: spacing.lg,
  // Title in text.primary (cream), body in text.secondary (cream)
  // NEVER purple text — purple is only the tint and border
};

// AI Alert — purple tinted background, cream text
const aiAlert = {
  backgroundColor: theme.accent.aiSubtle,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: 'rgba(118, 99, 231, 0.2)',
  padding: spacing.base,
  // Text in text.secondary (cream), NOT purple
};
```

**AI component rules:**
- Every AI-generated suggestion gets a solid purple `aiBadge` (white text on purple bg)
- Text on AI-tinted surfaces always uses `text.primary` or `text.secondary` (cream) — never purple
- Invoice auto-matches show "AI Match" badge (solid purple pill) next to the match label
- AI menu review results use `aiSuggestionCard` with purple left-border + cream text
- Use `aiButton` variant (subtle purple tint, cream text) for AI-triggered actions
- Purple's role is to *tint* and *badge*, not to be read as text

### Lists & Scrollable Content

- Use `FlashList` (from `@shopify/flash-list`) instead of `FlatList` for all long lists — it's significantly faster
- Add pull-to-refresh on data lists
- Swipe actions (edit, delete) should supplement visible controls, not replace them
- Use section headers for grouped content (e.g., ingredients by category)
- Empty states should include an illustration or icon + a clear CTA ("Add your first ingredient")

### Bottom Sheets

Use `@gorhom/bottom-sheet` for detail views, filters, and secondary actions. Bottom sheets feel more native on mobile than modals and keep context visible.

```typescript
// Standard bottom sheet snap points
const snapPoints = ['25%', '50%', '90%'];

// Bottom sheet styling
const bottomSheetStyle = {
  backgroundColor: theme.bg.elevated,      // p2
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  // Drag handle: 36w × 4h, border.strong color, centered at top
  // Backdrop: rgba(0,0,0,0.5)
};
```

### Alerts & Notifications

```typescript
// Alert types with color mapping
const alertStyles = {
  success: {
    bg: theme.semantic.successSubtle,
    border: theme.semantic.success,         // s21
    icon: 'check-circle',
  },
  warning: {
    bg: theme.semantic.warningSubtle,
    border: theme.semantic.warning,         // s11 (NOT brand gold)
    icon: 'alert-triangle',
  },
  danger: {
    bg: theme.semantic.dangerSubtle,
    border: theme.semantic.danger,          // e1
    icon: 'alert-circle',
  },
  ai: {
    bg: theme.accent.aiSubtle,
    border: theme.accent.ai,               // s31
    icon: 'sparkles',                       // or 'brain', 'wand'
  },
};
```

---

## 6. Animations & Motion

Use `react-native-reanimated` for all animations. Do NOT use the built-in `Animated` API — Reanimated runs on the UI thread and is vastly smoother.

### Motion Rules

- **Duration**: 200-300ms for micro-interactions (button press, toggle), 350-500ms for screen transitions, layout shifts
- **Easing**: Use `Easing.bezier(0.25, 0.1, 0.25, 1.0)` (ease-out) for entrances, `Easing.bezier(0.42, 0, 1.0, 1.0)` (ease-in) for exits
- **Layout animations**: Use `LayoutAnimation` or Reanimated's layout transitions for list item additions/removals
- **Shared element transitions**: Use for navigating from a list item to its detail view (cocktail card → cocktail detail)
- **Spring physics**: Use for drag-and-drop, pull-to-refresh, and bounce effects. `withSpring({ damping: 15, stiffness: 150 })` is a good starting point.

### What to animate:
- List item appearing/disappearing
- Card expanding to show detail
- Tab transitions
- Toast/notification entry
- Loading skeleton shimmer

### What NOT to animate:
- Data value changes (just update instantly — animating a price change is confusing)
- Every single screen transition (pick key moments, not everything)
- Anything that delays the user from doing their next action

---

## 7. Haptic Feedback

Use `expo-haptics` to add physical feedback at key moments. This makes the app feel substantial and real.

```typescript
import * as Haptics from 'expo-haptics';

// When to use each type:

// Light impact — toggling switches, selecting items, small confirmations
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Medium impact — confirming an action, completing a step
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Heavy impact — destructive action confirmed, significant event
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

// Selection — scrolling through a picker, moving between segments
Haptics.selectionAsync();

// Success — save completed, invoice matched, AI match confirmed
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Warning — approaching a threshold, unusual value detected
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

// Error — validation failure, action blocked
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
```

**Haptic rules:**
- Use sparingly — if everything vibrates, nothing feels special
- Always pair with visual feedback (don't rely on haptics alone)
- Never use haptics for passive/informational events (data loading, etc.)
- Haptics are a no-op on web — no need to conditionally import

---

## 8. Data Display Patterns

### Currency Values

```typescript
// Always format with 2 decimal places
const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

// Pour cost as percentage — show with % sign and colored by health
// Teal (s21): < 20%    Yellow (s11): 20-28%    Pink (e1): > 28%
const pourCostColor = (pct: number) =>
  pct < 20 ? theme.semantic.success :
  pct < 28 ? theme.semantic.warning :
  theme.semantic.danger;
```

### Measurement Values

```typescript
// Support both metric and imperial
// Display the user's preferred unit system
// Store internally in milliliters, convert for display

// Format: "750mL" or "25.4oz" — unit attached, no space
const formatVolume = (ml: number, scale: 'metric' | 'imperial') =>
  scale === 'metric'
    ? `${ml}mL`
    : `${(ml * 0.033814).toFixed(1)}oz`;
```

### Empty States

Every list/screen should have a designed empty state, not just blank space:
- Illustration or relevant icon (muted, in `text.tertiary` color)
- Short headline in `text.primary` ("No ingredients yet")
- Brief explanation in `text.secondary` ("Add your first ingredient to start building recipes")
- Single CTA button (primary blue)

### Loading States

- Use skeleton screens (shimmer effect on `bg.elevated` / `p2`), not spinners, for initial page loads
- Use inline loading indicators for actions (save, delete)
- Use pull-to-refresh for manual data refresh
- Show optimistic updates — when a user saves an ingredient, show it immediately in the list and sync in the background

---

## 12. Accessibility

- **Minimum contrast ratio**: 4.5:1 for body text, 3:1 for large text (WCAG AA). `n3` on `p3` achieves ~6.5:1.
- **Touch targets**: 48x48pt minimum, even if the visual element is smaller
- **Screen reader labels**: Add `accessibilityLabel` to all interactive elements, especially icon-only buttons
- **Reduce Motion**: Respect `useReducedMotion()` from Reanimated — skip animations for users who prefer it
- **Dynamic Type**: Use relative font sizes where possible to respect the user's system font size preference
- **Focus order**: Ensure logical tab/focus order for keyboard and screen reader navigation
- **Color-blind safety**: Never rely on color alone to convey state. The tab bar uses a dot indicator (Decision #4), and semantic states should pair color with icons or labels.
- **AI distinction**: AI-generated content is marked with both purple color AND an "AI" text badge, ensuring it's identifiable regardless of color perception

---

## 13. Performance Guidelines

- **Use `FlashList`** instead of `FlatList` for any list over ~20 items
- **Memoize expensive components** with `React.memo()` and `useMemo()`
- **Avoid inline styles in render**: Define styles outside the component or use `useMemo`
- **Image optimization**: Use `expo-image` (not `Image` from RN) — it handles caching, progressive loading, and format optimization
- **Limit shadow usage in scrollable lists**: Shadows are GPU-expensive. Use borders on dark backgrounds instead.
- **Lazy load tabs**: Don't render all tab screens on initial mount. Use `lazy: true` in tab navigator config.
- **Batch state updates**: Use `useReducer` for complex state rather than multiple `useState` calls

---

## 14. Reference

For current tech stack, file organization, and architecture decisions, see `CLAUDE.md` and `SETUP.md`.
For the interactive mockup with all these tokens in use, see `mockup.jsx`.