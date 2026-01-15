# Vite Configuration Best Practices (2026)

## Current Version
Vite 7.3.1 (Vite 8 beta with Rolldown available)

## Node.js Requirement
Node.js 20.19+ or 22.12+

## SvelteKit Configuration

```typescript
// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      tailwindcss(),  // MUST come before sveltekit
      sveltekit(),
      SvelteKitPWA({
        manifest: {
          name: 'SolidCAM CheatSheet',
          short_name: 'CheatSheet',
          start_url: '/',
          display: 'standalone',
          theme_color: '#c8102e',
          background_color: '#1a1a1a',
          icons: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
          ]
        }
      })
    ],
    build: {
      target: 'baseline-widely-available',
      sourcemap: mode !== 'production',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('svelte')) return 'svelte-vendor';
              if (id.includes('firebase')) return 'firebase-vendor';
              return 'vendor';
            }
          }
        }
      }
    },
    server: {
      port: parseInt(env.VITE_PORT) || 5173
    }
  };
});
```

## Environment Variables

### File Priority (highest to lowest)
1. Shell environment variables
2. `.env.[mode].local`
3. `.env.[mode]`
4. `.env.local`
5. `.env`

### Security: VITE_ Prefix
```bash
# .env
VITE_API_URL=https://api.example.com    # Exposed to client
VITE_FIREBASE_API_KEY=xxx               # Exposed to client
DATABASE_URL=postgres://...             # NOT exposed
SECRET_KEY=abc123                       # NOT exposed
```

### TypeScript Types
```typescript
// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### Accessing Variables
```typescript
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;
```

## Code Splitting

### Manual Chunks
```typescript
rollupOptions: {
  output: {
    manualChunks: {
      'svelte-vendor': ['svelte', 'svelte/store'],
      'firebase-vendor': ['firebase/app', 'firebase/firestore'],
      'ui': ['@your-ui-lib']
    }
  }
}
```

### Dynamic Imports
```typescript
// Lazy load routes/components
const Dashboard = () => import('./routes/Dashboard.svelte');
const Settings = () => import('./routes/Settings.svelte');
```

## Build Optimization

```typescript
build: {
  target: 'baseline-widely-available',
  minify: 'esbuild',  // or 'terser' for smaller output
  cssMinify: true,
  rollupOptions: {
    output: {
      manualChunks: { /* ... */ }
    }
  }
}
```

## Performance Debugging

```bash
# Debug plugin transforms
vite --debug plugin-transform

# CPU profiling
vite --profile
# Then press 'p + enter' to generate .cpuprofile
```

## Recommended Plugins

| Plugin | Purpose |
|--------|---------|
| `@tailwindcss/vite` | Tailwind CSS v4 |
| `@vite-pwa/sveltekit` | PWA support |
| `vite-plugin-checker` | TypeScript + ESLint |
| `rollup-plugin-visualizer` | Bundle analysis |
| `vite-plugin-compression` | Gzip/Brotli |

## Bundle Analysis

```typescript
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    // ... other plugins
    visualizer({
      open: true,
      filename: 'bundle-stats.html',
      gzipSize: true
    })
  ]
});
```

## Vite 8 Preview (Rolldown)

Benefits coming:
- **3x faster** dev server startup
- **40% faster** full reloads
- **10x fewer** network requests
- Built-in tsconfig paths support
- Module-level persistent cache

## Best Practices Summary

1. **Plugin order matters** - tailwindcss before sveltekit
2. **Use environment files** - `.env.local` for secrets
3. **Split vendor chunks** - Better caching
4. **Enable sourcemaps** only in dev
5. **Use dynamic imports** for large features
6. **Analyze bundles** regularly

## References
- [Vite Docs](https://vite.dev)
- [Vite 7 Announcement](https://vite.dev/blog/announcing-vite7)
- [SvelteKit + Vite](https://svelte.dev/docs/kit/configuration)
