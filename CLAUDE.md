# CheatSheet SvelteKit

SolidCAM Package/Panel selection tool built with SvelteKit 2 + Svelte 5.

## Tech Stack

| Technology   | Version             | Notes                                       |
| ------------ | ------------------- | ------------------------------------------- |
| SvelteKit    | 2.49+               | Minimal template with TypeScript            |
| Svelte       | 5.46+               | **Runes only** - no legacy syntax           |
| Tailwind CSS | 4.x                 | CSS-first config via `@tailwindcss/vite`    |
| TypeScript   | 5.9+                | Strict mode enabled                         |
| Vite         | 7.3+                | Plugin order: tailwindcss → sveltekit → pwa |
| Firebase     | 12.x                | Firestore with persistent local cache       |
| PWA          | @vite-pwa/sveltekit | Offline-first                               |

## Project Structure

```text
src/
├── routes/
│   ├── +layout.svelte      # Root layout with background, toast
│   └── +page.svelte        # Main app page
├── lib/
│   ├── components/
│   │   ├── ui/             # Button, Modal, Input, Checkbox, Toast
│   │   ├── layout/         # Header, Sidebar, CompanyPageBar
│   │   ├── packages/       # PackageTable, MasterBit, SubBit, LooseBit
│   │   ├── panels/         # Panel, PanelItem, EditablePanel
│   │   └── calculator/     # Calculator, SalesTaxModal
│   ├── stores/             # *.svelte.ts (runes-based state)
│   ├── firebase/           # Firestore client + sync
│   ├── types/              # TypeScript interfaces
│   ├── data/               # packages.ts, panels.ts
│   └── utils/              # Helpers
├── app.css                 # Tailwind v4 with @theme tokens
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

## Svelte 5 Runes

**Use runes only. No legacy `$:`, `export let`, or stores.**

```typescript
// State
let count = $state(0);
let items = $state<Item[]>([]);

// Derived (NO side effects!)
let doubled = $derived(count * 2);
let filtered = $derived.by(() => items.filter((i) => i.active));

// Props
interface Props { name: string; count?: number; }
let { name, count = 0 }: Props = $props();

// Two-way binding
let { value = $bindable() }: Props = $props();

// Effects (cleanup via return)
$effect(() => {
    const sub = store.subscribe();
    return () => sub.unsubscribe();
});
```

**Events:** `onclick`, `oninput` (NOT `on:click`)
**Snippets:** `{@render children()}` (NOT `<slot />`)

## Store Pattern

```typescript
// src/lib/stores/example.svelte.ts
let items = $state<Item[]>([]);

export const exampleStore = {
    get all() { return items; },
    get count() { return items.length; },
    add(item: Item) { items = [...items, item]; },
    remove(id: string) { items = items.filter(i => i.id !== id); }
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

## Tailwind v4

**CSS-first config - no tailwind.config.js needed.**

```css
/* src/app.css */
@import 'tailwindcss';

@theme {
    --color-solidcam-red: #c8102e;
    --color-solidcam-gold: #d4af37;
    --color-surface-dark: #1a1a1a;
}
```

**Syntax:**

- `h-10!` not `!h-10` (important modifier)
- `bg-black/50` not `bg-opacity-50`

## Vite Config

**Plugin order matters - tailwindcss MUST be first.**

```typescript
plugins: [
    tailwindcss(),      // FIRST
    sveltekit(),        // SECOND
    SvelteKitPWA({})    // THIRD
]
```

## Firebase

```typescript
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';

const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});
```

**Environment (.env):**

```text
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
```

## localStorage Keys

```text
solidcam-companies
solidcam-current-company-id
solidcam-favorites
solidcam-recent
solidcam-sync-username
```

## Critical Rules

1. **Svelte 5:** NO `$:`, NO `export let`, NO `createEventDispatcher`
2. **$derived:** NEVER put side effects - use `$effect()` instead
3. **Plugin order:** tailwindcss → sveltekit → pwa
4. **Firebase:** Check `browser` before any Firebase calls (SSR safety)
5. **Accessibility:** WCAG AA compliance, keyboard navigation, ARIA labels
