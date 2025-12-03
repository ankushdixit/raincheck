/**
 * Common style patterns for RainCheck components
 * These patterns use the Tailwind v4 theme defined in globals.css
 */

// Re-export cn from utils for convenience
export { cn } from "./utils";

/**
 * Card component style variants
 */
export const cardStyles = {
  base: "rounded-card border border-border-default bg-surface-elevated p-4",
  interactive: "hover:border-forest-accent transition-colors cursor-pointer",
  selected: "border-forest-accent bg-forest-accent/10",
} as const;

/**
 * Button component style variants
 */
export const buttonStyles = {
  primary:
    "bg-forest-accent text-text-primary rounded-button px-4 py-2 hover:bg-forest-light transition-colors",
  secondary:
    "bg-forest-dark text-text-primary rounded-button px-4 py-2 border border-border-strong hover:border-forest-accent transition-colors",
  ghost: "text-text-secondary hover:text-text-primary transition-colors",
} as const;

/**
 * Input component style variants
 */
export const inputStyles = {
  base: "bg-forest-dark border border-border-strong rounded-input px-4 py-3 text-text-primary placeholder:text-text-muted focus:border-forest-accent focus:outline-none transition-colors w-full",
} as const;

/**
 * Text style variants
 */
export const textStyles = {
  primary: "text-text-primary",
  secondary: "text-text-secondary",
  muted: "text-text-muted",
  accent: "text-text-accent",
} as const;

/**
 * Surface/background style variants
 */
export const surfaceStyles = {
  base: "bg-surface-base",
  elevated: "bg-surface-elevated",
  overlay: "bg-surface-overlay",
} as const;
