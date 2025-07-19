/**
 * Common icon mappings for consistent icon usage throughout the app
 * Using Ionicons which is already included in Expo
 */

export const ICONS = {
  // Navigation & Actions
  ADD: 'add',
  CLOSE: 'close',
  BACK: 'arrow-back',
  FORWARD: 'arrow-forward',
  MENU: 'menu',
  MORE: 'ellipsis-horizontal',
  
  // Edit & CRUD Operations
  EDIT: 'pencil',
  DELETE: 'trash',
  SAVE: 'checkmark',
  CANCEL: 'close',
  
  // Content Types
  INGREDIENT: 'flask',
  COCKTAIL: 'wine',
  CALCULATOR: 'calculator',
  SETTINGS: 'settings',
  
  // UI Elements
  SEARCH: 'search',
  FILTER: 'filter',
  SORT: 'swap-vertical',
  FAVORITE: 'heart',
  FAVORITE_FILLED: 'heart',
  STAR: 'star',
  STAR_FILLED: 'star',
  
  // Status & Feedback
  SUCCESS: 'checkmark-circle',
  ERROR: 'alert-circle',
  WARNING: 'warning',
  INFO: 'information-circle',
  
  // Business & Finance
  MONEY: 'cash',
  PERCENTAGE: 'stats-chart',
  PROFIT: 'trending-up',
  LOSS: 'trending-down',
  
  // Data & Files
  EXPORT: 'download',
  IMPORT: 'cloud-upload',
  BACKUP: 'cloud',
  RESTORE: 'refresh',
  
  // User & Account
  USER: 'person',
  ACCOUNT: 'person-circle',
  LOGIN: 'log-in',
  LOGOUT: 'log-out',
  
  // System
  HELP: 'help-circle',
  ABOUT: 'information-circle',
  NOTIFICATION: 'notifications',
  DARK_MODE: 'moon',
  LIGHT_MODE: 'sunny',
  
  // Measurements
  VOLUME: 'beaker',
  WEIGHT: 'scale',
  TIME: 'time',
  TEMPERATURE: 'thermometer',
  
  // Common UI
  HOME: 'home',
  LIST: 'list',
  GRID: 'grid',
  CARD: 'card',
  
  // Arrows & Directions
  UP: 'chevron-up',
  DOWN: 'chevron-down',
  LEFT: 'chevron-back',
  RIGHT: 'chevron-forward',
  
  // Social & Sharing
  SHARE: 'share',
  COPY: 'copy',
  LINK: 'link',
  
  // Quality & Performance
  EXCELLENT: 'trophy',
  GOOD: 'thumbs-up',
  POOR: 'thumbs-down',
  
} as const;

// Type for icon names
export type IconName = typeof ICONS[keyof typeof ICONS];

/**
 * Get icon name for common actions
 */
export const getActionIcon = (action: 'add' | 'edit' | 'delete' | 'save' | 'cancel'): IconName => {
  switch (action) {
    case 'add': return ICONS.ADD;
    case 'edit': return ICONS.EDIT;
    case 'delete': return ICONS.DELETE;
    case 'save': return ICONS.SAVE;
    case 'cancel': return ICONS.CANCEL;
    default: return ICONS.MORE;
  }
};

/**
 * Get icon for content type
 */
export const getContentIcon = (type: 'ingredient' | 'cocktail' | 'calculator' | 'settings'): IconName => {
  switch (type) {
    case 'ingredient': return ICONS.INGREDIENT;
    case 'cocktail': return ICONS.COCKTAIL;
    case 'calculator': return ICONS.CALCULATOR;
    case 'settings': return ICONS.SETTINGS;
    default: return ICONS.MORE;
  }
};

/**
 * Get icon for status/feedback
 */
export const getStatusIcon = (status: 'success' | 'error' | 'warning' | 'info'): IconName => {
  switch (status) {
    case 'success': return ICONS.SUCCESS;
    case 'error': return ICONS.ERROR;
    case 'warning': return ICONS.WARNING;
    case 'info': return ICONS.INFO;
    default: return ICONS.INFO;
  }
};

/**
 * Get icon for performance level
 */
export const getPerformanceIcon = (level: 'excellent' | 'good' | 'poor'): IconName => {
  switch (level) {
    case 'excellent': return ICONS.EXCELLENT;
    case 'good': return ICONS.GOOD;
    case 'poor': return ICONS.POOR;
    default: return ICONS.INFO;
  }
};