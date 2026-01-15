# CheatSheet Migration Plan: Vanilla JS to SvelteKit

## Overview

Migrate the CheatSheet application from vanilla JavaScript (8,550 LOC) to SvelteKit 2 + Svelte 5 + Tailwind v4 + TypeScript.

## Current State

| Metric | Value |
|--------|-------|
| JavaScript | 8,550 lines across 14 modules |
| CSS | 6,881 lines in single file |
| Main file (dom.js) | 4,865 lines |
| Bundle size | 452 KB (unminified) |
| Assets | 84 MB (videos, images, audio) |

## Target State

| Metric | Target |
|--------|--------|
| Framework | SvelteKit 2.49+ |
| UI | Svelte 5.46+ (runes) |
| Styling | Tailwind CSS v4 |
| Language | TypeScript 5.9+ |
| Build | Vite 7.3+ |
| Bundle | < 100 KB (minified) |
| PWA | Full offline support |

---

## Phase 1: Project Setup

### 1.1 Initialize SvelteKit Project
```bash
cd /home/cody/CheatSheet-Svelte
npx sv create . --template minimal --types ts
```

### 1.2 Install Dependencies
```bash
pnpm add -D @tailwindcss/vite @vite-pwa/sveltekit
pnpm add firebase zod
```

### 1.3 Copy Configs from TOS Parser
- `svelte.config.js`
- `vite.config.ts`
- `tsconfig.json`
- `.prettierrc`
- `eslint.config.js`

### 1.4 Setup Tailwind v4
```css
/* src/app.css */
@import "tailwindcss";

@theme {
  --color-solidcam-red: #c8102e;
  --color-solidcam-gold: #d4af37;
  --color-surface-dark: #1a1a1a;
  /* ... rest of design tokens */
}
```

### 1.5 Copy Static Assets
```bash
cp -r ../CheatSheet/assets/video ./static/
cp -r ../CheatSheet/assets/img ./static/
cp ../CheatSheet/assets/img/fav.png ./static/favicon.png
```

---

## Phase 2: Core Components

### 2.1 UI Primitives
Create reusable components in `src/lib/components/ui/`:

| Component | Purpose |
|-----------|---------|
| `Button.svelte` | Styled button with variants |
| `Checkbox.svelte` | Tri-state checkbox for master bits |
| `Modal.svelte` | Focus-trapped modal |
| `Input.svelte` | Styled input field |
| `Toast.svelte` | Notification toasts |

### 2.2 Layout Components
Create in `src/lib/components/layout/`:

| Component | Purpose |
|-----------|---------|
| `Header.svelte` | Top navigation bar |
| `Sidebar.svelte` | Right panel container |
| `CompanySelector.svelte` | Company/page dropdown |

### 2.3 Background Component
```svelte
<!-- src/lib/components/background/ParticleBackground.svelte -->
<script lang="ts">
  let video: HTMLVideoElement;

  $effect(() => {
    if (video) {
      video.muted = true;
      video.pause();
    }
  });
</script>

<div class="fixed inset-0 -z-10">
  <div class="absolute inset-0 bg-gradient-to-br from-[#020101] to-[#050202]" />
  <video
    bind:this={video}
    class="absolute inset-0 w-full h-full object-cover"
    loop
    muted
    playsinline
  >
    <source src="/video/Particle.mp4" type="video/mp4" />
  </video>
</div>
```

---

## Phase 3: State Management

### 3.1 Store Files
Create in `src/lib/stores/`:

| Store | Purpose |
|-------|---------|
| `companies.svelte.ts` | Company/page management |
| `packages.svelte.ts` | Package bit states |
| `panels.svelte.ts` | Panel items + order |
| `sync.svelte.ts` | Cloud sync status |
| `user.svelte.ts` | Auth state |
| `toast.ts` | Notifications |

### 3.2 Companies Store Pattern
```typescript
// src/lib/stores/companies.svelte.ts
import type { Company, Page } from '$lib/types';

let companies = $state<Company[]>([]);
let currentCompanyId = $state<string | null>(null);

export function createCompaniesStore() {
  return {
    get all() { return companies; },
    get current() {
      return companies.find(c => c.id === currentCompanyId) ?? null;
    },
    get currentPage() {
      const company = this.current;
      if (!company) return null;
      return company.pages.find(p => p.id === company.currentPageId) ?? null;
    },

    add(name: string) { /* ... */ },
    remove(id: string) { /* ... */ },
    setActive(id: string) { /* ... */ },

    // Page operations
    addPage(companyId: string, name: string) { /* ... */ },
    removePage(companyId: string, pageId: string) { /* ... */ },
    setActivePage(companyId: string, pageId: string) { /* ... */ },

    // Persistence
    save() { /* ... */ },
    load() { /* ... */ },
    exportData() { /* ... */ },
    importData(data: unknown) { /* ... */ }
  };
}

export const companiesStore = createCompaniesStore();
```

---

## Phase 4: Feature Components

### 4.1 Package Matrix
Create in `src/lib/components/packages/`:

| Component | Purpose |
|-----------|---------|
| `PackageTable.svelte` | Main table container |
| `PackageRow.svelte` | Single package row |
| `MasterBit.svelte` | Tri-state master checkbox |
| `SubBit.svelte` | Individual sub-checkbox |

### 4.2 Panels
Create in `src/lib/components/panels/`:

| Component | Purpose |
|-----------|---------|
| `Panel.svelte` | Collapsible panel container |
| `PanelItem.svelte` | Single item with copy |
| `EditablePanel.svelte` | Drag-drop reorderable |

### 4.3 Calculator
- `src/lib/components/calculator/Calculator.svelte`

### 4.4 Cloud Sync
- `src/lib/components/cloud-sync/SyncStatus.svelte`
- `src/lib/components/cloud-sync/SyncModal.svelte`

---

## Phase 5: Data Migration

### 5.1 Type Definitions
```typescript
// src/lib/types/index.ts
export interface Company {
  id: string;
  name: string;
  pages: Page[];
  currentPageId: string;
  createdAt: number;
  updatedAt: number;
  lastAccessed: number;
  isFavorite: boolean;
}

export interface Page {
  id: string;
  name: string;
  state: PageState;
}

export interface PageState {
  panels: Record<string, PanelItem[]>;
  packages: Record<string, PackageState>;
}

export interface PackageState {
  bits: Bit[];
  groups: MasterBitGroup[];
}
```

### 5.2 Data Files
Migrate from `assets/js/data.js`:
- `src/lib/data/packages.ts` - Package definitions
- `src/lib/data/panels.ts` - Panel definitions

### 5.3 LocalStorage Compatibility
Keep same localStorage keys for seamless migration:
- `solidcam-companies`
- `solidcam-current-company-id`
- `solidcam-favorites`
- `solidcam-recent`
- `solidcam-sync-username`

---

## Phase 6: Firebase Integration

### 6.1 Client Setup
```typescript
// src/lib/firebase/client.ts
import { browser } from '$app/environment';
import { initializeApp, getApps } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // ...
};

export function getDb() {
  if (!browser) return null;
  // ... initialization
}
```

### 6.2 Sync Store
```typescript
// src/lib/stores/sync.svelte.ts
let username = $state<string | null>(null);
let status = $state<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
let lastSync = $state<number | null>(null);

export function createSyncStore() {
  return {
    get username() { return username; },
    get status() { return status; },
    get isConnected() { return status === 'connected'; },

    async connect(name: string) { /* ... */ },
    async disconnect() { /* ... */ },
    async push() { /* ... */ },
    async pull() { /* ... */ }
  };
}
```

---

## Phase 7: PWA & Polish

### 7.1 PWA Setup
- Configure `@vite-pwa/sveltekit`
- Create manifest icons (192x192, 512x512)
- Add update prompt component

### 7.2 Accessibility
- Focus management
- Keyboard navigation
- ARIA labels
- Color contrast (WCAG AA)

### 7.3 Animations
- Page transitions
- Panel expand/collapse
- Toast notifications
- Button feedback

### 7.4 Security Headers
```typescript
// src/hooks.server.ts
export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
};
```

---

## Component Mapping

| Original (dom.js) | New Component |
|-------------------|---------------|
| `renderHeader()` | `Header.svelte` |
| `renderPackagesTable()` | `PackageTable.svelte` |
| `renderPanels()` | `Sidebar.svelte` |
| `renderCalculator()` | `Calculator.svelte` |
| `renderCloudSyncUI()` | `SyncStatus.svelte` |
| `renderParticleBackground()` | `ParticleBackground.svelte` |

---

## Testing Strategy

1. **Unit Tests** - Vitest for stores and utilities
2. **Component Tests** - Testing Library for components
3. **E2E Tests** - Playwright for critical flows

---

## Verification Checklist

- [ ] All companies/pages load correctly
- [ ] Package checkboxes persist state
- [ ] Panel items maintain order
- [ ] Drag-drop works smoothly
- [ ] Cloud sync connects and syncs
- [ ] Offline mode works
- [ ] PWA installs correctly
- [ ] All keyboard shortcuts work
- [ ] Mobile responsive
- [ ] Performance meets targets

---

## Rollback Plan

Keep original CheatSheet repository unchanged. New SvelteKit version in separate folder. Can switch back by reverting deployment.

---

## Timeline Considerations

This is a significant rewrite. Key phases:
1. **Setup + Core Components** - Foundation
2. **State + Data** - Critical path
3. **Features** - Main functionality
4. **Polish + PWA** - Production ready

No time estimates provided - proceed at comfortable pace.
