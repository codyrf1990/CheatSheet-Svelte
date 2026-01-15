# Tailwind CSS v4 Best Practices (2026)

## Performance Improvements
- Full builds: **5x faster**
- Incremental builds: **8.8x faster**
- **35% smaller** installed footprint

## CSS-First Configuration

No `tailwind.config.js` required! Use CSS instead:

```css
/* app.css */
@import "tailwindcss";

@theme {
  /* Colors */
  --color-brand-red: #c8102e;
  --color-brand-gold: #d4af37;
  --color-bg-primary: #0a0a0f;

  /* Fonts */
  --font-display: "Satoshi", sans-serif;

  /* Spacing */
  --spacing-card: 1.5rem;

  /* Custom breakpoints */
  --breakpoint-3xl: 120rem;
}
```

## Key Syntax Changes

| v3 | v4 |
|----|-----|
| `!h-10` | `h-10!` |
| `mr-[var(--x)]` | `mr-(--x)` |
| `bg-opacity-50` | `bg-black/50` |

## SvelteKit Integration

```typescript
// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    tailwindcss(),  // MUST come before sveltekit()
    sveltekit(),
  ],
});
```

```css
/* src/app.css */
@import "tailwindcss";
```

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import "../app.css";
  let { children } = $props();
</script>

{@render children()}
```

## Using in Svelte Style Blocks

```svelte
<style lang="postcss">
  @reference "tailwindcss";

  .custom-class {
    @apply bg-brand-red text-white;
  }
</style>
```

## Dark Mode

### Media Query (Default)
```html
<div class="bg-white dark:bg-gray-800">
  <!-- Follows OS preference -->
</div>
```

### Manual Toggle
```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
```

```javascript
// Prevent FOUC - add to <head>
document.documentElement.classList.toggle(
  "dark",
  localStorage.theme === "dark" ||
    (!("theme" in localStorage) &&
     window.matchMedia("(prefers-color-scheme: dark)").matches)
);
```

## New Features

### Container Queries
```html
<div class="@container">
  <div class="grid grid-cols-1 @sm:grid-cols-3 @lg:grid-cols-4">
    <!-- Responsive based on container, not viewport -->
  </div>
</div>
```

### 3D Transforms
```html
<div class="perspective-distant">
  <article class="rotate-x-51 rotate-z-43 transform-3d">
</div>
```

### Gradient Improvements
```html
<!-- Angle-based -->
<div class="bg-linear-45 from-indigo-500 to-pink-500"></div>

<!-- OKLCH interpolation -->
<div class="bg-linear-to-r/oklch from-indigo-500 to-teal-400"></div>
```

### Dynamic Values
```html
<div class="grid grid-cols-15"><!-- Any number --></div>
<div class="mt-8 w-17 pr-29"><!-- Arbitrary spacing --></div>
```

## Design System for CheatSheet

```css
@import "tailwindcss";

@theme {
  /* SolidCAM Brand */
  --color-solidcam-red: #c8102e;
  --color-solidcam-dark-red: #8b0000;
  --color-solidcam-gold: #d4af37;

  /* Surfaces */
  --color-surface-dark: #1a1a1a;
  --color-surface-alt: #2d2d2d;

  /* Glass effects */
  --color-glass: oklch(0.1 0 0 / 0.32);
  --color-glass-border: oklch(1 0 0 / 0.22);

  /* Typography */
  --font-system: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'SF Mono', 'Monaco', monospace;

  /* Transitions */
  --ease-fast: 160ms ease;
  --ease-smooth: 240ms ease;

  /* Shadows */
  --shadow-lg: 0 18px 45px oklch(0 0 0 / 0.35);
}
```

## What You Don't Need
- No `postcss.config.js`
- No `autoprefixer` (Lightning CSS handles it)
- No `postcss-import` (built-in)
- No `tailwind.config.js` (optional)

## References
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [v4 Announcement](https://tailwindcss.com/blog/tailwindcss-v4)
