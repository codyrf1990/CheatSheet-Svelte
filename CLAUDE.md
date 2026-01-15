# CheatSheet SvelteKit

SolidCAM Package/Panel selection tool - rewrite from vanilla JS to SvelteKit 2 + Svelte 5.

## Tech Stack

| Technology | Version | Notes |
|------------|---------|-------|
| SvelteKit | 2.49+ | Minimal template with TypeScript |
| Svelte | 5.46+ | **Runes only** - no legacy syntax |
| Tailwind CSS | 4.x | CSS-first config via `@tailwindcss/vite` |
| TypeScript | 5.9+ | Strict mode enabled |
| Vite | 7.3+ | Plugin order: tailwindcss → sveltekit → pwa |
| Firebase | 12.x | Firestore with persistent local cache |
| PWA | @vite-pwa/sveltekit | Offline-first |

## Project Structure

```
src/
├── routes/
│   ├── +layout.svelte      # Root layout with background, toast
│   └── +page.svelte        # Main app page
├── lib/
│   ├── components/
│   │   ├── ui/             # Button, Modal, Input, Checkbox, Toast
│   │   ├── layout/         # Header, Sidebar, CompanySelector
│   │   ├── packages/       # PackageTable, PackageRow, MasterBit, SubBit
│   │   ├── panels/         # Panel, PanelItem, EditablePanel
│   │   ├── calculator/     # Calculator
│   │   └── background/     # ParticleBackground, VideoBackground
│   ├── stores/             # *.svelte.ts files (runes-based)
│   ├── firebase/           # client.ts, sync utilities
│   ├── types/              # TypeScript interfaces
│   ├── data/               # packages.ts, panels.ts (migrated from data.js)
│   └── utils/              # Helpers
├── app.css                 # Tailwind v4 with @theme tokens
├── app.html
└── hooks.server.ts         # Security headers
```

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm preview      # Preview production build
pnpm check        # Type check + Svelte validation
pnpm lint         # ESLint + Prettier
pnpm format       # Auto-format code
```

## Svelte 5 Runes Patterns

**IMPORTANT: Use runes syntax only. No legacy `$:`, `export let`, or stores.**

```typescript
// Reactive state
let count = $state(0);
let items = $state<Item[]>([]);

// Computed values (NO side effects!)
let doubled = $derived(count * 2);
let filtered = $derived.by(() => items.filter(i => i.active));

// Props (replaces export let)
interface Props { name: string; count?: number; }
let { name, count = 0 } = $props();

// Two-way binding
let { value = $bindable() } = $props();

// Side effects (cleanup via return)
$effect(() => {
  const sub = store.subscribe();
  return () => sub.unsubscribe();
});
```

**Event handlers:** Use `onclick`, `oninput` (NOT `on:click`, `on:input`)

**Snippets:** Use `{@render children()}` (NOT `<slot />`)

## Store Pattern

Stores use `.svelte.ts` extension with runes:

```typescript
// src/lib/stores/companies.svelte.ts
let companies = $state<Company[]>([]);

export const companiesStore = {
  get all() { return companies; },
  get current() { return companies.find(c => c.id === currentId); },
  add(company: Company) { companies = [...companies, company]; },
  remove(id: string) { companies = companies.filter(c => c.id !== id); }
};
```

## Data Schemas

```typescript
interface Company {
  id: string;
  name: string;
  pages: Page[];
  currentPageId: string;
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
}

interface Page {
  id: string;
  name: string;
  state: PageState;
}

interface PageState {
  panels: Record<string, PanelState>;
  packages: Record<string, PackageState>;
}

interface PackageState {
  selectedBits: string[];
  customBits: string[];
  order: string[];
}
```

## Tailwind v4 Setup

**CRITICAL: No tailwind.config.js needed. Use CSS-first config.**

```css
/* src/app.css */
@import "tailwindcss";

@theme {
  --color-solidcam-red: #c8102e;
  --color-solidcam-dark-red: #8b0000;
  --color-solidcam-gold: #d4af37;
  --color-surface-dark: #1a1a1a;
  --color-surface-alt: #2d2d2d;
  --color-glass: oklch(0.1 0 0 / 0.32);
  --color-glass-border: oklch(1 0 0 / 0.22);
  --font-system: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --ease-fast: 160ms ease;
  --ease-smooth: 240ms ease;
}
```

**Syntax changes from v3:**
- `h-10!` not `!h-10` (important)
- `bg-black/50` not `bg-opacity-50`
- `mr-(--spacing)` not `mr-[var(--spacing)]`

## Vite Config

**CRITICAL: Plugin order matters - tailwindcss MUST be first.**

```typescript
// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
  plugins: [
    tailwindcss(),  // FIRST
    sveltekit(),    // SECOND
    SvelteKitPWA({...})  // THIRD
  ]
});
```

## Firebase Integration

```typescript
// src/lib/firebase/client.ts
import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
```

**Environment variables (.env):**
```
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
```

## localStorage Keys (Maintain for Migration)

These keys MUST match the original app for seamless data migration:
- `solidcam-companies`
- `solidcam-current-company-id`
- `solidcam-favorites`
- `solidcam-recent`
- `solidcam-sync-username`

## Reference Projects

- **TOS Parser Svelte:** `/home/cody/Projects/TOS Parser Svelte/` - Same stack, copy configs
- **Original CheatSheet:** `/home/cody/CheatSheet/` - Source app (read-only reference)

## Key Files to Migrate

| Original File | Lines | Migration Target |
|--------------|-------|------------------|
| `assets/js/dom.js` | 4,865 | Split into components |
| `assets/js/data.js` | ~200 | `src/lib/data/` |
| `assets/js/page-system.js` | ~620 | `src/lib/stores/companies.svelte.ts` |
| `assets/js/cloud-sync.js` | ~188 | `src/lib/firebase/sync.ts` |
| `assets/js/calculator.js` | ~300 | `src/lib/components/calculator/` |
| `assets/css/main.css` | 6,881 | Tailwind + component styles |

## Critical Rules

1. **Svelte 5:** NO `$:` reactive statements, NO `export let`, NO `createEventDispatcher`
2. **$derived:** NEVER put side effects in `$derived()` - use `$effect()` instead
3. **Plugin order:** tailwindcss → sveltekit → pwa (or build fails)
4. **Firebase:** Check `browser` before any Firebase calls (SSR safety)
5. **localStorage:** Match original keys exactly for migration compatibility

## Progress Tracking

**IMPORTANT: Maintain `PROGRESS.md` as the single source of truth for all work.**

Rules:

1. **Update `PROGRESS.md` after completing any task** - components, features, bug fixes
2. **Log what was done, not what will be done** - keep it factual
3. **Include file paths** for new/modified files
4. **Mark phase completion** when all phase tasks are done
5. **Add blockers/issues** if work is paused or stuck

Format:

```markdown
## Phase X: [Name]
**Status:** In Progress | Complete
**Started:** YYYY-MM-DD

### Completed
- [x] Task description
  - Files: `path/to/file.ts`

### In Progress
- [ ] Current task

### Blockers
- Issue description (if any)
```

## Documentation

All research docs in `.docs/`:
- `MIGRATION-PLAN.md` - 7-phase migration plan
- `SVELTEKIT-GUIDE.md` - Svelte 5 runes patterns
- `TAILWIND-V4-GUIDE.md` - Tailwind v4 setup
- `FIREBASE-GUIDE.md` - Firebase integration
