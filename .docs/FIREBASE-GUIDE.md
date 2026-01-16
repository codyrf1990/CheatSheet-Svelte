# Firebase/Firestore Best Practices (2026)

## SDK Version

Firebase JavaScript SDK v12.x (modular)

## Initialization

```typescript
// lib/firebase/client.ts
import { browser } from '$app/environment';
import { initializeApp, getApps } from 'firebase/app';
import {
	initializeFirestore,
	persistentLocalCache,
	persistentMultipleTabManager
} from 'firebase/firestore';

const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
	// ...
};

let db: Firestore | null = null;

export function getDb() {
	if (!browser) return null;
	if (db) return db;

	const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

	db = initializeFirestore(app, {
		localCache: persistentLocalCache({
			tabManager: persistentMultipleTabManager()
		})
	});

	return db;
}
```

## Real-time Listeners with Svelte 5

```typescript
// lib/firebase/useDocument.svelte.ts
import { doc, onSnapshot } from 'firebase/firestore';
import { getDb } from './client';

export function useDocument<T>(path: string) {
	let data = $state<T | null>(null);
	let loading = $state(true);
	let error = $state<Error | null>(null);

	$effect(() => {
		const db = getDb();
		if (!db) return;

		const docRef = doc(db, path);
		const unsubscribe = onSnapshot(
			docRef,
			(snapshot) => {
				data = snapshot.exists() ? (snapshot.data() as T) : null;
				loading = false;
			},
			(err) => {
				error = err;
				loading = false;
			}
		);

		// Cleanup on unmount
		return () => unsubscribe();
	});

	return {
		get data() {
			return data;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		}
	};
}
```

## Collection Listener

```typescript
// lib/firebase/useCollection.svelte.ts
import { collection, query, onSnapshot, type QueryConstraint } from 'firebase/firestore';

export function useCollection<T>(path: string, ...constraints: QueryConstraint[]) {
	let data = $state<T[]>([]);
	let loading = $state(true);

	$effect(() => {
		const db = getDb();
		if (!db) return;

		const q = query(collection(db, path), ...constraints);
		const unsubscribe = onSnapshot(q, (snapshot) => {
			data = snapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data()
			})) as T[];
			loading = false;
		});

		return () => unsubscribe();
	});

	return {
		get data() {
			return data;
		},
		get loading() {
			return loading;
		}
	};
}
```

## Debounced Writes

```typescript
// lib/utils/debounce.ts
const timers = new Map<string, ReturnType<typeof setTimeout>>();

export function debouncedWrite(key: string, fn: () => Promise<void>, delay = 900) {
	const existing = timers.get(key);
	if (existing) clearTimeout(existing);

	timers.set(
		key,
		setTimeout(async () => {
			await fn();
			timers.delete(key);
		}, delay)
	);
}
```

## Authentication Pattern (Session Cookies)

```typescript
// hooks.server.ts
import { getAuth } from 'firebase-admin/auth';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionCookie = event.cookies.get('__session');

	if (sessionCookie) {
		try {
			const claims = await getAuth().verifySessionCookie(sessionCookie, true);
			event.locals.user = claims;
		} catch {
			event.cookies.delete('__session', { path: '/' });
		}
	}

	return resolve(event);
};
```

## Offline Persistence

Multi-tab persistence (recommended):

```typescript
initializeFirestore(app, {
	localCache: persistentLocalCache({
		tabManager: persistentMultipleTabManager()
	})
});
```

**Notes**:

- Only works in Chrome, Safari, Firefox
- One tab becomes "primary client"
- Writes resolve immediately in cache, promises wait for online

## Security Rules Best Practices

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Default deny
    match /{document=**} {
      allow read, write: if false;
    }

    // User data
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    // Validate input
    match /items/{itemId} {
      allow create: if request.auth != null
        && request.resource.data.keys().hasAll(['title', 'createdAt'])
        && request.resource.data.title is string
        && request.resource.data.title.size() <= 100;
    }
  }
}
```

## Tree-Shaking Imports

```typescript
// Good - tree-shakeable
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';

// Bad - prevents tree-shaking
import firebase from 'firebase/app';
```

## Firestore Lite (Read-Only)

80% smaller bundle for read-only operations:

```typescript
import { getFirestore, doc, getDoc } from 'firebase/firestore/lite';
```

## Bundle Size Impact

| Configuration                  | Size (gzipped) |
| ------------------------------ | -------------- |
| Full v8 SDK                    | ~300KB+        |
| Modular v12 (Auth + Firestore) | ~30-50KB       |
| Firestore Lite only            | ~15KB          |

## CheatSheet Firebase Structure

```
users/{normalizedUsername}
├── username: string
├── normalizedUsername: string
├── schemaVersion: number
├── updatedAt: Timestamp
├── pageSystem: {
│   ├── currentCompanyId: string
│   ├── companies: Company[]
│   ├── favoriteCompanyIds: string[]
│   ├── recentCompanyIds: string[]
│   └── updatedAt: number
│ }
└── client: 'solidcam-cheatsheet'
```

## References

- [Firebase Web Docs](https://firebase.google.com/docs/web/setup)
- [Firestore Offline](https://firebase.google.com/docs/firestore/manage-data/enable-offline)
- [Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
