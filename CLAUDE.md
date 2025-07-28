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