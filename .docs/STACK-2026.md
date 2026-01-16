# CheatSheet SvelteKit - Tech Stack (January 2026)

## Overview

This document defines the technology stack for the CheatSheet rewrite, based on January 2026 best practices research.

## Core Stack

| Technology       | Version        | Purpose                    |
| ---------------- | -------------- | -------------------------- |
| **SvelteKit**    | 2.49+          | Full-stack framework       |
| **Svelte**       | 5.46+          | UI framework (runes)       |
| **Tailwind CSS** | 4.x            | Styling (CSS-first config) |
| **TypeScript**   | 5.9+           | Type safety                |
| **Vite**         | 7.3+           | Build tool                 |
| **Firebase**     | 12.x           | Cloud database             |
| **Vercel**       | adapter-vercel | Deployment                 |

## Key Features

### Svelte 5 Runes

- `$state()` for reactive state
- `$derived()` for computed values
- `$effect()` for side effects
- `$props()` for component props
- `$bindable()` for two-way binding

### Tailwind CSS v4

- CSS-first configuration via `@theme` directive
- No `tailwind.config.js` required
- Native cascade layers
- Container queries built-in
- OKLCH color space

### SvelteKit Features

- Hybrid SSR/CSR rendering
- File-based routing
- OpenTelemetry support
- Remote functions (type-safe RPC)
- Vite 7 + Rolldown support

### PWA Support

- `@vite-pwa/sveltekit` for zero-config PWA
- Workbox for service worker management
- Offline-first caching strategies

## Browser Support

- Chrome 111+
- Safari 16.4+
- Firefox 128+
- Edge 111+

## Node.js Requirement

- Node.js 20.19+ or 22.12+
- pnpm recommended (workspace support)

## Project Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── ui/           # Reusable primitives
│   │   ├── layout/       # Layout components
│   │   ├── packages/     # Package matrix
│   │   ├── panels/       # Sidebar panels
│   │   └── ...
│   ├── stores/           # Svelte 5 rune stores
│   ├── firebase/         # Firebase client
│   ├── types/            # TypeScript types
│   ├── utils/            # Utilities
│   └── data/             # Static data
├── routes/
│   ├── +layout.svelte
│   ├── +page.svelte
│   └── layout.css        # Design system
├── app.html
└── hooks.server.ts       # Security headers
```

## Performance Targets

| Metric         | Target   |
| -------------- | -------- |
| Initial bundle | < 100 KB |
| TTI (offline)  | < 200ms  |
| LCP            | < 2.5s   |
| FID            | < 100ms  |
| CLS            | < 0.1    |

## References

See individual guide documents for detailed best practices:

- [SVELTEKIT-GUIDE.md](./SVELTEKIT-GUIDE.md)
- [TAILWIND-V4-GUIDE.md](./TAILWIND-V4-GUIDE.md)
- [TYPESCRIPT-SVELTE.md](./TYPESCRIPT-SVELTE.md)
- [PWA-GUIDE.md](./PWA-GUIDE.md)
- [FIREBASE-GUIDE.md](./FIREBASE-GUIDE.md)
- [VITE-CONFIG.md](./VITE-CONFIG.md)
