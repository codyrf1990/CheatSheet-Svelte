# SolidCAM CheatSheet

Package and panel selection tool for SolidCAM sales operations.

## Stack

- **SvelteKit 2.49** + **Svelte 5.46** (runes)
- **Tailwind CSS 4** (CSS-first config)
- **TypeScript 5.9**
- **Firebase 12** (Firestore with offline persistence)
- **PWA** (@vite-pwa/sveltekit)

## Development

```bash
pnpm install    # Install dependencies
pnpm dev        # Start dev server at localhost:5173
pnpm build      # Production build
pnpm preview    # Preview production build
```

## Quality

```bash
pnpm check      # Type check + Svelte validation
pnpm lint       # ESLint + Prettier check
pnpm format     # Auto-format code
```

## Project Structure

```text
src/
├── routes/           # SvelteKit routes (+page.svelte, +layout.svelte)
├── lib/
│   ├── components/   # Svelte components
│   │   ├── ui/       # Button, Modal, Input, Checkbox, Toast
│   │   ├── layout/   # Header, Sidebar, CompanyPageBar
│   │   ├── packages/ # PackageTable, MasterBit, SubBit
│   │   ├── panels/   # Panel, PanelItem, EditablePanel
│   │   └── calculator/
│   ├── stores/       # Runes-based state (*.svelte.ts)
│   ├── firebase/     # Firestore client
│   ├── types/        # TypeScript interfaces
│   ├── data/         # Package/panel definitions
│   └── utils/        # Helpers
├── app.css           # Tailwind + theme tokens
└── app.html
static/
├── video/            # Background video
├── audio/            # Sound effects
└── icons/            # PWA icons
```

## Environment

Copy `.env.example` to `.env` and fill in Firebase credentials:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
```

## Features

- Multi-company/page management
- Package bit selection with master/sub checkboxes
- Customizable panels with drag-drop reordering
- Cloud sync via Firebase
- Offline-first PWA
- Sales tax calculator
- Current products lookup

## License

Proprietary - SolidCAM internal use only.
