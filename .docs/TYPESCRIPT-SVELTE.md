# TypeScript with Svelte 5 (2026)

## Props Typing

```svelte
<script lang="ts">
  interface Props {
    name: string;
    count?: number;
    onSave: (data: { id: string }) => void;
  }
  let { name, count = 0, onSave }: Props = $props();
</script>
```

## Extending HTML Attributes

```svelte
<script lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements';

  interface Props extends HTMLButtonAttributes {
    variant?: 'primary' | 'secondary';
  }
  let { variant = 'primary', ...rest }: Props = $props();
</script>

<button {...rest}>{variant}</button>
```

## Generic Components

```svelte
<script lang="ts" generics="T extends { id: string }">
  interface Props {
    items: T[];
    onSelect: (item: T) => void;
  }
  let { items, onSelect }: Props = $props();
</script>

{#each items as item (item.id)}
  <button onclick={() => onSelect(item)}>
    {item.id}
  </button>
{/each}
```

## State Typing

```typescript
// Inference works automatically
let count = $state(0);

// Explicit when needed
let user = $state<User | null>(null);

// Arrays
let items = $state<string[]>([]);
```

## Store Pattern (Runes)

```typescript
// stores/user.svelte.ts
interface User {
  id: string;
  name: string;
  email: string;
}

let currentUser = $state<User | null>(null);
let isLoading = $state(false);

export function createUserStore() {
  return {
    get current() { return currentUser; },
    get isLoggedIn() { return currentUser !== null; },
    get loading() { return isLoading; },

    async login(username: string) {
      isLoading = true;
      try {
        currentUser = await fetchUser(username);
      } finally {
        isLoading = false;
      }
    },

    logout() {
      currentUser = null;
    }
  };
}

export const userStore = createUserStore();
```

## Event Handler Typing

```svelte
<script lang="ts">
  function handleClick(event: MouseEvent) {
    console.log(event.clientX);
  }

  function handleInput(event: Event & { currentTarget: HTMLInputElement }) {
    console.log(event.currentTarget.value);
  }
</script>

<button onclick={handleClick}>Click</button>
<input oninput={handleInput} />
```

## Validation with Zod

```typescript
// schema.ts
import { z } from 'zod';

export const userSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  age: z.number().min(18).optional()
});

export type User = z.infer<typeof userSchema>;

// Type guard
export function isUser(data: unknown): data is User {
  return userSchema.safeParse(data).success;
}
```

## Recommended tsconfig.json

```json
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "target": "ES2022",
    "sourceMap": true,
    "skipLibCheck": true
  }
}
```

## Component Types

```typescript
import type { Component, ComponentProps } from 'svelte';
import MyComponent from './MyComponent.svelte';

// Get props type from component
type MyProps = ComponentProps<typeof MyComponent>;

// Type a component reference
let component: Component<{ name: string }>;
```

## Derived Typing

```svelte
<script lang="ts">
  let count = $state(0);

  // Auto-inferred as number
  let doubled = $derived(count * 2);

  // Explicit return type
  let status = $derived<'low' | 'high'>(() => {
    return count > 10 ? 'high' : 'low';
  });
</script>
```

## Key Changes from Svelte 4

| Svelte 4 | Svelte 5 |
|----------|----------|
| `ComponentProps<Component>` | `ComponentProps<typeof Component>` |
| Components are classes | Components are functions |
| `createEventDispatcher<T>` | Callback props with types |

## References
- [Svelte TypeScript Docs](https://svelte.dev/docs/svelte/typescript)
- [$props Docs](https://svelte.dev/docs/svelte/$props)
