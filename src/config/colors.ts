/**
 * CENTRALIZED COLOR SYSTEM
 * =========================
 * This is the SINGLE SOURCE OF TRUTH for ALL colors used in the application.
 * Every component, page, modal, notification, button, text, background, gradient,
 * icon, and any other visual element MUST use colors from this file.
 *
 * The 6-color palette:
 * - Sage Green (#97A87A) - Primary brand color
 * - Light Sage (#A8BBA3) - Accent/Secondary color
 * - Cream (#FCF9EA) - Background color
 * - Orange (#FFA239) - Warning/Highlight color
 * - Black (#000000) - Text/Dark elements
 * - White (#FFFFFF) - Light text/backgrounds
 */

export const BRAND_COLORS = {
  // Primary - Sage Green
  sageGreen: '#97A87A',
  sageGreenRgb: 'rgb(151, 168, 122)',
  sageGreenHsl: 'hsl(82, 24%, 57%)',

  // Accent - Light Sage
  lightSage: '#A8BBA3',
  lightSageRgb: 'rgb(168, 187, 163)',
  lightSageHsl: 'hsl(100, 23%, 69%)',

  // Background - Cream
  cream: '#FCF9EA',
  creamRgb: 'rgb(252, 249, 234)',
  creamHsl: 'hsl(50, 60%, 96%)',

  // Warning/Highlight - Orange
  orange: '#FFA239',
  orangeRgb: 'rgb(255, 162, 57)',
  orangeHsl: 'hsl(33, 100%, 62%)',

  // Black
  black: '#000000',
  blackRgb: 'rgb(0, 0, 0)',

  // White
  white: '#FFFFFF',
  whiteRgb: 'rgb(255, 255, 255)',
} as const;

export const SEMANTIC_COLORS = {
  // Primary (Sage Green)
  primary: BRAND_COLORS.sageGreen,
  primaryHover: 'hsl(82, 24%, 47%)',
  primaryForeground: BRAND_COLORS.white,
  primaryMuted: 'hsl(82, 24%, 80%)',

  // Accent (Light Sage)
  accent: BRAND_COLORS.lightSage,
  accentHover: 'hsl(100, 23%, 59%)',
  accentForeground: BRAND_COLORS.black,
  accentMuted: 'hsl(100, 23%, 85%)',

  // Background
  background: BRAND_COLORS.cream,
  backgroundDark: 'hsl(50, 15%, 12%)',

  // Foreground (Text)
  foreground: BRAND_COLORS.black,
  foregroundDark: BRAND_COLORS.cream,

  // Card
  card: BRAND_COLORS.white,
  cardDark: 'hsl(50, 10%, 15%)',
  cardForeground: BRAND_COLORS.black,
  cardForegroundDark: BRAND_COLORS.cream,

  // Border
  border: 'hsl(82, 20%, 85%)',
  borderDark: 'hsl(82, 15%, 25%)',

  // Input
  input: 'hsl(82, 20%, 85%)',
  inputDark: 'hsl(82, 15%, 25%)',

  // Ring (Focus)
  ring: BRAND_COLORS.sageGreen,
  ringDark: BRAND_COLORS.lightSage,

  // Muted
  muted: 'hsl(82, 15%, 88%)',
  mutedDark: 'hsl(82, 10%, 20%)',
  mutedForeground: 'hsl(82, 10%, 45%)',
  mutedForegroundDark: 'hsl(82, 10%, 70%)',

  // Popover
  popover: BRAND_COLORS.white,
  popoverDark: 'hsl(50, 10%, 15%)',
  popoverForeground: BRAND_COLORS.black,
  popoverForegroundDark: BRAND_COLORS.cream,

  // Success (using sage green tones)
  success: BRAND_COLORS.sageGreen,
  successMuted: 'hsl(82, 40%, 90%)',
  successMutedDark: 'hsl(82, 30%, 20%)',

  // Warning (Orange)
  warning: BRAND_COLORS.orange,
  warningMuted: 'hsl(33, 100%, 90%)',
  warningMutedDark: 'hsl(33, 60%, 20%)',

  // Error/Destructive (using darker sage for errors)
  destructive: 'hsl(0, 50%, 45%)',
  destructiveMuted: 'hsl(0, 50%, 90%)',
  destructiveMutedDark: 'hsl(0, 40%, 20%)',
  destructiveForeground: BRAND_COLORS.white,

  // Info (Light sage)
  info: BRAND_COLORS.lightSage,
  infoMuted: 'hsl(100, 40%, 90%)',
  infoMutedDark: 'hsl(100, 30%, 20%)',
} as const;

export const GRADIENT_COLORS = {
  // Sage gradients
  primaryToAccent: `linear-gradient(to right, ${BRAND_COLORS.sageGreen}, ${BRAND_COLORS.lightSage})`,
  accentToPrimary: `linear-gradient(to right, ${BRAND_COLORS.lightSage}, ${BRAND_COLORS.sageGreen})`,

  // Sage to Orange
  primaryToWarning: `linear-gradient(to right, ${BRAND_COLORS.sageGreen}, ${BRAND_COLORS.orange})`,
  warningToPrimary: `linear-gradient(to right, ${BRAND_COLORS.orange}, ${BRAND_COLORS.sageGreen})`,

  // Triple gradients
  primaryViaAccentToWarning: `linear-gradient(to right, ${BRAND_COLORS.sageGreen}, ${BRAND_COLORS.lightSage}, ${BRAND_COLORS.orange})`,

  // Accent to Orange
  accentToWarning: `linear-gradient(to right, ${BRAND_COLORS.lightSage}, ${BRAND_COLORS.orange})`,
} as const;

export const SHADOW_COLORS = {
  sage: `0 4px 20px rgba(151, 168, 122, 0.15)`,
  sageMedium: `0 8px 32px rgba(151, 168, 122, 0.2)`,
  sageStrong: `0 12px 48px rgba(151, 168, 122, 0.25)`,

  orange: `0 4px 20px rgba(255, 162, 57, 0.15)`,
  orangeMedium: `0 8px 32px rgba(255, 162, 57, 0.2)`,
  orangeStrong: `0 12px 48px rgba(255, 162, 57, 0.25)`,

  lightSage: `0 4px 20px rgba(168, 187, 163, 0.15)`,
  lightSageMedium: `0 8px 32px rgba(168, 187, 163, 0.2)`,

  neutral: `0 4px 20px rgba(0, 0, 0, 0.1)`,
  neutralMedium: `0 8px 32px rgba(0, 0, 0, 0.15)`,
  neutralStrong: `0 12px 48px rgba(0, 0, 0, 0.2)`,
} as const;

export const OPACITY_VALUES = {
  hover: '0.8',
  disabled: '0.5',
  subtle: '0.6',
  verySubtle: '0.3',
  background: '0.1',
} as const;

/**
 * Tailwind CSS class mappings
 * Use these utility classes in components
 */
export const TAILWIND_CLASSES = {
  // Background classes
  bgPrimary: 'bg-primary',
  bgPrimaryHover: 'hover:bg-primary-hover',
  bgAccent: 'bg-accent',
  bgWarning: 'bg-warning',
  bgCard: 'bg-card',
  bgBackground: 'bg-background',
  bgMuted: 'bg-muted',

  // Text classes
  textPrimary: 'text-primary',
  textAccent: 'text-accent',
  textWarning: 'text-warning',
  textForeground: 'text-foreground',
  textMuted: 'text-muted-foreground',
  textSuccess: 'text-success',
  textDestructive: 'text-destructive',

  // Border classes
  borderPrimary: 'border-primary',
  borderAccent: 'border-accent',
  borderWarning: 'border-warning',
  borderDefault: 'border-border',

  // Gradient classes (use with bg-gradient-to-r, etc.)
  gradientPrimaryToAccent: 'from-primary to-accent',
  gradientAccentToPrimary: 'from-accent to-primary',
  gradientPrimaryToWarning: 'from-primary to-warning',
  gradientWarningToPrimary: 'from-warning to-primary',
  gradientPrimaryViaAccentToWarning: 'from-primary via-accent to-warning',
  gradientAccentToWarning: 'from-accent to-warning',

  // Shadow classes
  shadowSage: 'shadow-sage',
  shadowOrange: 'shadow-orange',
  shadowMedium: 'shadow-medium',
  shadowStrong: 'shadow-strong',
} as const;

/**
 * Helper function to get color with opacity
 */
export function withOpacity(color: string, opacity: number): string {
  // Convert hex to rgba
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  // If already rgba or rgb, modify opacity
  if (color.startsWith('rgb')) {
    return color.replace(/rgba?\(([^)]+)\)/, (_, values) => {
      const parts = values.split(',').slice(0, 3);
      return `rgba(${parts.join(',')}, ${opacity})`;
    });
  }
  return color;
}

/**
 * Platform-specific brand colors (for social media icons)
 * These should ONLY be used for platform branding and nothing else
 */
export const PLATFORM_BRAND_COLORS = {
  youtube: '#FF0000',
  instagram: '#E4405F',
  facebook: '#1877F2',
  twitter: '#000000',
  linkedin: '#0077B5',
  tiktok: '#000000',
  pinterest: '#E60023',
  threads: '#000000',
} as const;

export default {
  BRAND_COLORS,
  SEMANTIC_COLORS,
  GRADIENT_COLORS,
  SHADOW_COLORS,
  OPACITY_VALUES,
  TAILWIND_CLASSES,
  PLATFORM_BRAND_COLORS,
  withOpacity,
};
