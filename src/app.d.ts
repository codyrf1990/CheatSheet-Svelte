// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	// One-time-setup flags that must survive HMR module re-execution in dev,
	// so they live on window instead of module scope.
	interface Window {
		__scToastVisibilityListener__?: boolean;
		__syncSessionListenersInstalled?: boolean;
	}
}

export {};
