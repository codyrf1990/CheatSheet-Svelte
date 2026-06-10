import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Standalone unit-test config — deliberately does NOT load the SvelteKit/PWA
// plugins so pure utils (parsers, mappers) test fast with no browser.
export default defineConfig({
	resolve: {
		alias: {
			$lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
			$components: fileURLToPath(new URL('./src/lib/components', import.meta.url)),
			$stores: fileURLToPath(new URL('./src/lib/stores', import.meta.url)),
			$firebase: fileURLToPath(new URL('./src/lib/firebase', import.meta.url)),
			$types: fileURLToPath(new URL('./src/lib/types', import.meta.url)),
			$data: fileURLToPath(new URL('./src/lib/data', import.meta.url)),
			$utils: fileURLToPath(new URL('./src/lib/utils', import.meta.url))
		}
	},
	test: {
		include: ['tests/unit/**/*.test.ts'],
		environment: 'node'
	}
});
