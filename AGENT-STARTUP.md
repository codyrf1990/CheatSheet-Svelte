# Agent Startup Prompt

Copy and paste this to start the next session:

---

## Project: CheatSheet SvelteKit Rewrite

I'm rewriting my SolidCAM CheatSheet app from vanilla JavaScript to SvelteKit.

### Workspace Structure
- **Main workspace**: `/home/cody/CheatSheet-Svelte/` - The new SvelteKit project (to be built)
- **Reference folder**: `/home/cody/CheatSheet/` - The original vanilla JS app (for reference only, don't modify)

### Documentation
All research and plans are in `.docs/`:
- `STACK-2026.md` - Tech stack overview (Jan 2026 best practices)
- `SVELTEKIT-GUIDE.md` - Svelte 5 runes patterns
- `TAILWIND-V4-GUIDE.md` - Tailwind CSS v4 setup
- `TYPESCRIPT-SVELTE.md` - TypeScript patterns
- `PWA-GUIDE.md` - PWA configuration
- `FIREBASE-GUIDE.md` - Firebase integration
- `VITE-CONFIG.md` - Vite configuration
- `MIGRATION-PLAN.md` - Full 7-phase migration plan

### Target Stack
- SvelteKit 2.49+ / Svelte 5.46+ (runes)
- Tailwind CSS v4 (CSS-first config)
- TypeScript 5.9+
- Vite 7.3+
- Firebase 12.x (Firestore)
- PWA with @vite-pwa/sveltekit

### Reference: TOS Parser Svelte
I have another SvelteKit project at `/home/cody/Projects/TOS Parser Svelte/` using the same stack - use it as a template for configs and patterns.

### Current Status
Phase 1 not started. The `.docs/` folder has all research, but no actual SvelteKit project initialized yet.

### Next Step
Start Phase 1 from `MIGRATION-PLAN.md`:
1. Initialize SvelteKit project with `npx sv create`
2. Install dependencies (Tailwind v4, PWA, Firebase, Zod)
3. Copy configs from TOS Parser Svelte
4. Set up Tailwind with SolidCAM design tokens
5. Copy static assets (video, images)

### Key Files in Original App (for reference)
- `assets/js/data.js` - Package/panel definitions to migrate
- `assets/js/dom.js` - Main rendering logic (4,865 lines to componentize)
- `assets/js/cloud-sync.js` - Firebase sync logic to adapt
- `assets/js/page-system.js` - Company/page state management
- `assets/css/main.css` - Design tokens to extract

Please read the `.docs/MIGRATION-PLAN.md` first, then start Phase 1. I'm not a coder so explain things clearly and ask questions if needed.

---
