/**
 * Ingredient-type icon + accent color mapping. Shared across the app so the
 * same glyph and color represent the same type everywhere (ingredient detail,
 * search results, list rows, etc.).
 *
 * Uses MaterialCommunityIcons for bar-specific glyphs (actual bottle shapes,
 * wine glasses, beer mugs, etc.). Colors are picked for quick recognition —
 * spirits are gold, wine burgundy, beer amber, and so on.
 */

import type { MaterialCommunityIcons } from '@expo/vector-icons';
import { palette } from '@/src/contexts/ThemeContext';

export type TypeIcon = {
  name: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
};

/** Lookup by ingredient type string (case-insensitive). */
export function ingredientTypeIcon(type?: string): TypeIcon {
  switch ((type || '').toLowerCase()) {
    case 'spirit':
      return { name: 'bottle-wine', color: palette.Y4 }; // gold — signature bar spirit
    case 'wine':
      return { name: 'glass-wine', color: palette.R4 }; // burgundy
    case 'beer':
      return { name: 'glass-mug-variant', color: palette.O4 }; // amber
    case 'garnish':
      return { name: 'leaf', color: palette.O3 }; // lighter orange
    case 'non-alc':
      return { name: 'coffee-outline', color: palette.P3 }; // purple
    case 'prepped':
      return { name: 'flask-outline', color: palette.B5 }; // blue — matches Create New Ingredient CTA
    default:
      return { name: 'cube-outline', color: palette.N4 }; // neutral fallback
  }
}

/** Icon + color to represent a cocktail (vs an ingredient). */
export const cocktailIcon: TypeIcon = {
  name: 'glass-cocktail',
  color: palette.G3, // green — fresh cocktail
};
