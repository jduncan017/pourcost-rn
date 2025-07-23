# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## PourCost React Native App

A React Native version of the PourCost cocktail costing application. This cross-platform app helps users calculate ingredient costs and drink pricing with support for multiple platforms (iOS, Android, Web).

## Development Commands

### Dependencies

```bash
npm install                # Install all dependencies
npx expo install           # Install Expo-specific dependencies
```

### Development

```bash
npm start                  # Start Expo development server
npm run ios               # Run on iOS simulator
npm run android           # Run on Android emulator
npm run web               # Run in web browser
```

### Build & Deploy

```bash
npx expo build:ios       # Build for iOS
npx expo build:android   # Build for Android
eas build                 # Build with Expo Application Services
```

### Code Quality

```bash
npm run lint              # Run ESLint
npm run type-check        # Run TypeScript type checking
```

## Architecture Overview

### Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: Zustand
- **UI Components**: Custom component library with glassmorphism design
- **Theme System**: Context-based dark/light mode switching
- **Platform Support**: iOS, Android, Web

### Key Patterns

- **Component-Based Architecture**: Reusable UI components with consistent styling
- **File-Based Routing**: Expo Router for navigation (similar to Next.js)
- **Theme Context**: Centralized theme management with dark mode support
- **Design System**: Custom color palette and typography system
- **Cross-Platform**: Single codebase targeting multiple platforms
- **UI-Layout**: Never use margins outside of components and always control spacing with parent flex containers and gap spacing
- **Styling**: Always use Tailwind classNames instead of inline styles. Use PascalCase naming for the first className (e.g., `className="HeaderContainer flex-row items-center"`). Only use inline styles for dynamic values like theme colors or safe area insets. Font family is set globally to Geist in global.css, so never add `style={{ fontFamily: 'Geist' }}`.

### Core Components

#### App Structure

- **app/\_layout.tsx**: Root layout with theme provider and navigation setup
- **app/(drawer)/\_layout.tsx**: Drawer/tab navigation layout
- **src/components/**: Reusable UI components
- **src/contexts/**: React contexts (theme, app state)
- **src/stores/**: Zustand state management

#### Screens (app/(drawer)/)

- **calculator.tsx**: Quick cocktail cost calculator
- **ingredients.tsx**: Ingredient library management
- **cocktails.tsx**: Cocktail recipe management
- **settings.tsx**: App configuration
- **about.tsx**: App information

#### UI Components (src/components/)

- **ui/GradientBackground.tsx**: Dark mode gradient backgrounds
- **ui/Card.tsx**: Glassmorphism card component
- **ui/SearchBar.tsx**: Search input component
- **IngredientListItem.tsx**: Ingredient list display
- **CocktailListItem.tsx**: Cocktail list display
- **EmptyState.tsx**: Empty state messaging

#### Theme System

- **src/contexts/ThemeContext.tsx**: Theme provider with dark/light mode
- **tailwind.config.js**: Custom design system colors and configuration
- **Dynamic theming**: Components automatically adapt to theme changes

### Design System

#### Colors

- **Primary**: p1-p4 (blues, from light to dark)
- **Neutrals**: n1-n4 (whites/creams)
- **Grays**: g1-g4 (light to dark grays)
- **Secondary Yellows**: s11-s14
- **Secondary Teals**: s21-s24
- **Secondary Purples**: s31-s34
- **Error/Caution**: e1-e4 (reds)

#### Dark Mode Implementation

- **Gradient Backgrounds**: Linear gradient from p3→p4 (top-left to bottom-right)
- **Header Background**: Solid p4 color
- **Text**: All text uses n1 (white) in dark mode
- **Cards**: Glassmorphism with n1/10 background and backdrop blur
- **Logo**: Automatic switching between black/white variants
- **Accent Colors**: Teal (s22) and yellow (s12) for better contrast on dark backgrounds

#### Typography

- **Font**: Geist variable font (supports all weights)
- **Responsive**: Automatic scaling across platforms
- **Consistent**: Unified typography scale

### Key Features

- **Cross-Platform**: Single codebase for iOS, Android, and Web
- **Dark Mode**: Complete dark theme with gradient backgrounds
- **Cost Calculator**: Real-time cocktail cost calculations
- **Ingredient Library**: Save and manage ingredient costs
- **Recipe Management**: Create and store cocktail recipes
- **Responsive Design**: Adapts to different screen sizes
- **Glassmorphism UI**: Modern glass-effect design
- **Search & Filter**: Advanced filtering and sorting options

### File Structure

```
PourCost-RN/
├── app/                          # Expo Router screens
│   ├── _layout.tsx              # Root layout
│   ├── (drawer)/                # Main app screens
│   │   ├── _layout.tsx         # Navigation layout
│   │   ├── calculator.tsx      # Cost calculator
│   │   ├── ingredients.tsx     # Ingredients management
│   │   ├── cocktails.tsx       # Cocktail recipes
│   │   ├── settings.tsx        # App settings
│   │   └── about.tsx          # About page
│   ├── ingredient-detail.tsx   # Ingredient detail view
│   ├── cocktail-detail.tsx     # Cocktail detail view
│   ├── ingredient-form.tsx     # Add/edit ingredient
│   └── cocktail-form.tsx       # Add/edit cocktail
├── src/
│   ├── components/             # Reusable components
│   │   ├── ui/                # Base UI components
│   │   └── ...                # Feature components
│   ├── contexts/              # React contexts
│   ├── stores/                # Zustand stores
│   └── types/                 # TypeScript types
├── assets/                    # Static assets
│   ├── fonts/                # Custom fonts
│   └── images/               # Images and icons
├── tailwind.config.js        # Tailwind configuration
└── global.css               # Global styles
```

### Platform Considerations

- **iOS**: Native navigation patterns with drawer/tab hybrid
- **Android**: Material Design adaptations
- **Web**: Responsive layout with tab navigation fallback
- **Fonts**: Variable font loading with platform fallbacks
- **Icons**: Expo vector icons for cross-platform consistency

### Development Notes

- **Hot Reload**: Expo development server supports fast refresh
- **TypeScript**: Full type safety with strict configuration
- **ESLint**: Code quality enforcement
- **NativeWind**: Tailwind classes work consistently across platforms
- **Expo Router**: File-based routing similar to Next.js
- **Theme Context**: Centralized theme state management

### Migration from iOS Swift

This React Native version maintains feature parity with the original iOS Swift app while providing cross-platform compatibility. Key architectural changes:

- Swift → TypeScript/React Native
- UIKit → React Native components
- Core Data → Local state (Zustand) with future cloud sync plans
- Storyboard navigation → Expo Router file-based routing
- iOS-specific UI → Cross-platform design system

### Future Enhancements

- Cloud synchronization (Firebase/Supabase)
- Push notifications
- Offline-first data persistence
- Advanced analytics
- Export/import functionality
- Multi-currency support
- Recipe sharing features
