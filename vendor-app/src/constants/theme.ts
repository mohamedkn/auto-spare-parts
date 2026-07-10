/**
 * Theme constants for Vendor App
 * Uses dark mode matching the website design system
 */

export const NAV_THEME = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#09090b',
    backgroundElement: '#18181b',
    backgroundSelected: '#27272a',
    textSecondary: '#a1a1aa',
  },
} as const;

export const Colors = {
  primary: '#208AEF',
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#09090b',
    backgroundElement: '#18181b',
    backgroundSelected: '#27272a',
    textSecondary: '#a1a1aa',
  },
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;
