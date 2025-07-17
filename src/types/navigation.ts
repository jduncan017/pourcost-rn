/**
 * Navigation types for PourCost React Native app
 * Defines the structure of our navigation system
 */

export type RootStackParamList = {
  main: undefined;
  modal: { title?: string };
};

export type DrawerParamList = {
  calculator: undefined;
  ingredients: undefined;
  cocktails: undefined;
  settings: undefined;
  about: undefined;
};

export type CalculatorStackParamList = {
  index: undefined;
  'ingredient-detail': { id?: string };
  'cocktail-detail': { id?: string };
};

export type IngredientsStackParamList = {
  index: undefined;
  detail: { id?: string };
  create: undefined;
  edit: { id: string };
};

export type CocktailsStackParamList = {
  index: undefined;
  detail: { id?: string };
  create: undefined;
  edit: { id: string };
};

export type SettingsStackParamList = {
  index: undefined;
  currency: undefined;
  measurements: undefined;
  account: undefined;
};

// Navigation prop types for easy use in components
export type NavigationProps = {
  navigation: any; // Will be properly typed later
  route: any;
};