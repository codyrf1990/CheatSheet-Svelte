# SvelteKit & Svelte 5 Best Practices (2026)

## Current Versions

- **Svelte**: 5.46.0
- **SvelteKit**: 2.49.0

## Svelte 5 Runes

### `$state` - Reactive State

```typescript
let count = $state(0);
let user = $state<{ name: string } | null>(null);

// Deep reactivity - mutation works
user.name = 'Jane'; // UI updates automatically
```

### `$derived` - Computed Values

```typescript
let count = $state(0);
let doubled = $derived(count * 2);

// For complex derivations:
let summary = $derived.by(() => {
	return `Count: ${count}, Doubled: ${doubled}`;
});
```

**Rule**: No side effects in `$derived()` - use `$effect()` for that.

### `$effect` - Side Effects

```typescript
$effect(() => {
	console.log(`Count changed to ${count}`);

	// Cleanup function
	return () => {
		console.log('Cleaning up...');
	};
});
```

**Note**: Does NOT run during SSR.

### `$props` - Component Props

```svelte
<script lang="ts">
	interface Props {
		name: string;
		count?: number;
	}
	let { name, count = 0 }: Props = $props();
</script>
```

### `$bindable` - Two-Way Binding

```svelte
<script lang="ts">
	let { value = $bindable() }: { value: string } = $props();
</script>
```

## Project Structure

```
src/
├── lib/              # $lib alias
│   ├── components/
│   ├── stores/       # .svelte.ts files for runes
│   ├── server/       # $lib/server (server-only)
│   └── utils/
├── params/           # Route matchers
├── routes/           # File-based routing
├── app.html
├── hooks.server.ts
├── hooks.client.ts
└── service-worker.ts
```

## Rendering Modes

| Page Type         | Mode             |
| ----------------- | ---------------- |
| Landing/Marketing | SSR or Prerender |
| Blog/Content      | Prerender        |
| Dashboard         | CSR acceptable   |
| User Settings     | CSR acceptable   |

```typescript
// +page.ts
export const ssr = true;
export const csr = true;
export const prerender = false;
```

## Breaking Changes from Svelte 4

| Svelte 4                   | Svelte 5                   |
| -------------------------- | -------------------------- |
| `on:click`                 | `onclick`                  |
| `<slot />`                 | `{@render children?.()}`   |
| `export let prop`          | `let { prop } = $props()`  |
| `$: derived`               | `$derived()`               |
| `createEventDispatcher`    | Callback props             |
| `beforeUpdate/afterUpdate` | `$effect.pre()` + `tick()` |

## Performance Tips

1. **Upgrade to Svelte 5** - 15-30% smaller bundles
2. **Use dynamic imports** for lazy loading
3. **Stream non-critical data** from load functions
4. **Use `@sveltejs/enhanced-img`** for image optimization
5. **Minimize third-party scripts**
6. **Deploy frontend/backend in same data center**

## State Management Pattern

```typescript
// stores/counter.svelte.ts
let count = $state(0);

export function createCounterStore() {
	return {
		get value() {
			return count;
		},
		increment() {
			count++;
		},
		decrement() {
			count--;
		},
		reset() {
			count = 0;
		}
	};
}

export const counterStore = createCounterStore();
```

## Snippets (Replacing Slots)

```svelte
<!-- Card.svelte -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	let { header, content }: { header: Snippet; content: Snippet } = $props();
</script>

<!-- Parent -->
<Card>
	{#snippet header()}
		<h1>Title</h1>
	{/snippet}
	{#snippet content()}
		<p>Body text</p>
	{/snippet}
</Card>

<div class="card">
	{@render header()}
	{@render content()}
</div>
```

## References

- [Svelte 5 Docs](https://svelte.dev/docs/svelte)
- [SvelteKit Docs](https://svelte.dev/docs/kit)
- [Migration Guide](https://svelte.dev/docs/svelte/v5-migration-guide)
