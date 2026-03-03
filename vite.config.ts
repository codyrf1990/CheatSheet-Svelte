import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(), // MUST be first
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			manifest: {
				id: '/',
				start_url: '/',
				scope: '/',
				name: 'SolidCAM CheatSheet',
				short_name: 'CheatSheet',
				description: 'SolidCAM Package/Panel selection tool',
				theme_color: '#0a0a0f',
				background_color: '#0a0a0f',
				display: 'standalone',
				orientation: 'any',
				icons: [
					{
						src: 'pwa-192x192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: 'pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png'
					},
					{
						src: 'pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable'
					}
				]
			},
			workbox: {
				globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,woff2,webmanifest}']
			}
		})
	]
});
