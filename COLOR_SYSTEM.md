# Uplora Color System Architecture

## Single Source of Truth

**ALL colors in the application are defined in ONE place:**

### Primary Source: `src/app/globals.css`

This file contains all CSS variables for the 6-color palette. Every visual element in the app uses these colors.

### JavaScript/TypeScript Access: `src/config/colors.ts`

For programmatic access to colors (Canvas, JavaScript calculations, etc.), use this file which mirrors the values in `globals.css`.

---

## The 6-Color Palette

```
#97A87A - Sage Green    (Primary brand color)
#A8BBA3 - Light Sage    (Accent/Secondary)
#FCF9EA - Cream         (Background)
#FFA239 - Orange        (Warning/Highlight)
#000000 - Black         (Text/Dark elements)
#FFFFFF - White         (Light text/backgrounds)
```

---

## How to Use Colors

### ✅ CORRECT: Use Tailwind Classes

```tsx
// Backgrounds
<div className="bg-primary">
<div className="bg-accent">
<div className="bg-warning">
<div className="bg-card">
<div className="bg-background">

// Text
<span className="text-primary">
<span className="text-warning">
<span className="text-foreground">

// Borders
<div className="border-primary">
<div className="border-accent">

// Gradients
<div className="bg-gradient-to-r from-primary to-accent">
<div className="bg-gradient-to-r from-warning to-primary">
```

### ✅ CORRECT: Use CSS Variables

```tsx
<div style={{ background: 'var(--primary)' }}>
<div style={{ color: 'var(--warning)' }}>
```

### ✅ CORRECT: Import for JavaScript

```tsx
import { BRAND_COLORS, withOpacity } from '@/config/colors';

const color = BRAND_COLORS.sageGreen;
const transparent = withOpacity(BRAND_COLORS.orange, 0.5);
```

### ❌ INCORRECT: Hardcoded Colors

```tsx
// NEVER DO THIS:
<div style={{ background: '#97A87A' }}>          // ❌
<div className="bg-blue-500">                    // ❌
<div style={{ color: 'rgb(151, 168, 122)' }}>  // ❌
```

---

## Color Mapping Reference

### Semantic Colors

| Purpose | Tailwind Class | CSS Variable | colors.ts |
|---------|----------------|--------------|-----------|
| Primary brand | `bg-primary` | `--primary` | `SEMANTIC_COLORS.primary` |
| Accent/Secondary | `bg-accent` | `--accent` | `SEMANTIC_COLORS.accent` |
| Warning/Highlight | `bg-warning` | `--warning` | `SEMANTIC_COLORS.warning` |
| Success | `bg-success` | `--success` | `SEMANTIC_COLORS.success` |
| Error/Destructive | `bg-destructive` | `--destructive` | `SEMANTIC_COLORS.destructive` |
| Background | `bg-background` | `--background` | `SEMANTIC_COLORS.background` |
| Card | `bg-card` | `--card` | `SEMANTIC_COLORS.card` |
| Muted | `bg-muted` | `--muted` | `SEMANTIC_COLORS.muted` |
| Border | `border-border` | `--border` | `SEMANTIC_COLORS.border` |

### Gradients

```tsx
// Tailwind gradient classes
className="bg-gradient-to-r from-primary to-accent"
className="bg-gradient-to-r from-primary via-accent to-warning"
className="bg-gradient-to-r from-warning to-primary"

// CSS variables
background: var(--gradient-primary);
background: var(--gradient-luxury);
background: var(--gradient-hero);
```

### Shadows

```tsx
// Tailwind shadow classes
className="shadow-sage"
className="shadow-orange"
className="shadow-medium"
className="shadow-strong"

// CSS variables
box-shadow: var(--shadow-sage);
box-shadow: var(--shadow-orange);
```

---

## Platform Brand Colors

Social media platform icons should use their official brand colors for recognition:

```tsx
import { PLATFORM_BRAND_COLORS } from '@/config/colors';

// Use with style prop
<Icon style={{ color: PLATFORM_BRAND_COLORS.facebook }} />
<Icon style={{ color: PLATFORM_BRAND_COLORS.instagram }} />
```

**These are the ONLY exception to the 6-color rule.**

---

## Architecture Benefits

1. **Single Source of Truth**: All colors defined once in `globals.css`
2. **Consistency**: Impossible to use wrong colors
3. **Easy Theme Updates**: Change colors in one place
4. **Type Safety**: TypeScript constants in `colors.ts`
5. **Performance**: CSS variables are optimized by browser
6. **Dark Mode Ready**: Color system supports light/dark modes

---

## Maintenance Rules

### Adding New Colors

1. **DON'T** add new colors unless absolutely necessary
2. Use existing semantic colors (primary, accent, warning, etc.)
3. If truly needed, add to `globals.css` first, then mirror in `colors.ts`

### Updating Colors

1. Edit values in `src/app/globals.css`
2. Update matching values in `src/config/colors.ts`
3. Test in both light and dark modes
4. Verify across all pages and components

### Code Review Checklist

- [ ] No hardcoded hex colors (#97A87A)
- [ ] No hardcoded rgb/rgba values
- [ ] No arbitrary Tailwind colors (bg-blue-500, text-red-600)
- [ ] Uses Tailwind utility classes (bg-primary, text-warning)
- [ ] Platform icons use PLATFORM_BRAND_COLORS
- [ ] JavaScript colors import from colors.ts

---

## Examples

### Button Component

```tsx
// ✅ CORRECT
<button className="bg-primary text-primary-foreground hover:bg-primary-hover">
  Click me
</button>

// ❌ INCORRECT
<button className="bg-green-500 text-white hover:bg-green-600">
  Click me
</button>
```

### Card Component

```tsx
// ✅ CORRECT
<div className="bg-card border border-border shadow-sage rounded-lg">
  <h2 className="text-foreground">Title</h2>
  <p className="text-muted-foreground">Description</p>
</div>
```

### Canvas Drawing

```tsx
// ✅ CORRECT
import { BRAND_COLORS, withOpacity } from '@/config/colors';

ctx.fillStyle = BRAND_COLORS.sageGreen;
ctx.strokeStyle = withOpacity(BRAND_COLORS.orange, 0.5);
```

---

## Summary

**Remember: globals.css is the single source of truth. Every color, everywhere, comes from there.**

- Components use Tailwind classes (`bg-primary`, `text-warning`)
- JavaScript uses `colors.ts` imports
- NO hardcoded colors anywhere
- Platform icons are the only exception (use official brand colors)
