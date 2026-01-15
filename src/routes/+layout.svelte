<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import { ToastContainer } from '$components/ui';
	import { LoginScreen } from '$components/layout';
	import { syncStore } from '$stores/sync.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
	let initialized = $state(false);

	onMount(() => {
		syncStore.load();
		initialized = true;
	});

	const isLoggedIn = $derived(syncStore.isLoggedIn);
</script>

<svelte:head>
	<title>SolidCAM CheatSheet</title>
	<link rel="icon" href="/favicon.png" />
</svelte:head>

<!-- Video Background (no overlay) -->
<div class="fixed inset-0 -z-10 overflow-hidden">
	<video
		autoplay
		loop
		muted
		playsinline
		disablepictureinpicture
		class="absolute left-1/2 top-1/2 min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 object-cover"
	>
		<source src="/video/Particle.mp4" type="video/mp4" />
	</video>
</div>

<!-- Content Gate -->
<div class="relative min-h-screen">
	{#if !initialized}
		<div class="loading-screen">
			<div class="loading-spinner"></div>
		</div>
	{:else if !isLoggedIn}
		<LoginScreen />
	{:else}
		{@render children()}
	{/if}
</div>

<!-- Toast Notifications (global) -->
<ToastContainer />

<style>
	.loading-screen {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid rgba(255, 255, 255, 0.1);
		border-top-color: #d4af37;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
