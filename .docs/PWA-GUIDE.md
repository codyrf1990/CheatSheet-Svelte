# PWA Best Practices (2026)

## SvelteKit PWA Setup

### Installation
```bash
npm i @vite-pwa/sveltekit -D
```

### Vite Configuration
```typescript
// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
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
      },
      workbox: {
        globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,webmanifest}']
      }
    })
  ]
});
```

## Web Manifest Requirements

```json
{
  "name": "SolidCAM CheatSheet",
  "short_name": "CheatSheet",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#c8102e",
  "background_color": "#1a1a1a",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**Requirements**:
- HTTPS required
- Service worker with offline fallback
- `prefer_related_applications` must NOT be `true`

## Caching Strategies

| Content Type | Strategy | Use Case |
|-------------|----------|----------|
| Static assets | **Cache-First** | CSS, images, fonts |
| API data | **Network-First** | Fresh data, cache fallback |
| JS bundles | **Stale-While-Revalidate** | Fast + background update |
| App shell | **Cache-Only** | Never changes |

### Workbox Configuration
```javascript
workbox: {
  runtimeCaching: [
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
      handler: 'CacheFirst',
      options: { cacheName: 'images' }
    },
    {
      urlPattern: /\/api\//,
      handler: 'NetworkFirst',
      options: { cacheName: 'api' }
    },
    {
      urlPattern: /\.(?:js|css)$/,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'static' }
    }
  ]
}
```

## SPA Caching Rules

1. **Never cache index.html** - `Cache-Control: no-store`
2. **Use filename hashing** - `app.abc123.js`
3. **Precache wisely** - Only critical assets
4. **Version your caches** - Show update prompt

## Update Prompt Component

```svelte
<script>
  import { useRegisterSW } from 'virtual:pwa-register/svelte';

  const { needRefresh, updateServiceWorker } = useRegisterSW({
    onRegistered(r) {
      r && setInterval(() => r.update(), 60 * 60 * 1000); // Check hourly
    }
  });
</script>

{#if $needRefresh}
  <div class="fixed bottom-4 right-4 bg-brand-red text-white p-4 rounded-lg">
    <span>New version available!</span>
    <button onclick={() => updateServiceWorker(true)}>Update</button>
  </div>
{/if}
```

## Install Prompt

```typescript
let deferredPrompt: BeforeInstallPromptEvent | null = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallButton();
});

async function handleInstallClick() {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`User ${outcome === 'accepted' ? 'accepted' : 'dismissed'} install`);
  deferredPrompt = null;
}
```

## Platform Support

| Platform | Support |
|----------|---------|
| Chrome/Edge (desktop & Android) | Full |
| Safari (iOS 16.4+) | Share menu only |
| Firefox (143.0+, Sept 2025) | Full |

## Best Practices

1. Show install prompt after user engagement
2. Don't prompt immediately on page load
3. Provide clear value proposition
4. Handle iOS gracefully (no `beforeinstallprompt`)
5. Test offline behavior thoroughly

## Performance Impact

- **60% reduction** in repeat visit load times
- Offline TTI can be < 200ms
- Improved Core Web Vitals

## References
- [@vite-pwa/sveltekit](https://github.com/vite-pwa/sveltekit)
- [web.dev PWA Guide](https://web.dev/learn/pwa)
- [SvelteKit Service Workers](https://kit.svelte.dev/docs/service-workers)
