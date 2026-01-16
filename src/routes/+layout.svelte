<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import { pwaInfo } from 'virtual:pwa-info';
	import { ToastContainer } from '$components/ui';
	import { LoginScreen } from '$components/layout';
	import { syncStore } from '$stores/sync.svelte';
	import { userPrefsStore } from '$stores/userPrefs.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
	let initialized = $state(false);

	onMount(() => {
		syncStore.load();
		userPrefsStore.init();
		initialized = true;
	});

	const isLoggedIn = $derived(syncStore.isLoggedIn);
	const webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');
</script>

<svelte:head>
	<title>SolidCAM CheatSheet</title>
	<link rel="icon" href="/favicon.png" />
	{@html webManifestLink}
</svelte:head>

<!-- Skip to main content link (accessibility) -->
<a href="#main-content" class="skip-link">Skip to main content</a>

<!-- Video Background (decorative) -->
<div class="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
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
<div class="relative min-h-screen" id="main-content">
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
	/* Skip link - visible only when focused */
	.skip-link {
		position: fixed;
		top: -100px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 9999;
		padding: 0.75rem 1.5rem;
		background: #0a0a0f;
		color: #d4af37;
		border: 2px solid #d4af37;
		border-radius: 8px;
		font-weight: 600;
		text-decoration: none;
		transition: top 200ms ease;
	}

	.skip-link:focus {
		top: 1rem;
		outline: none;
	}

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
		to {
			transform: rotate(360deg);
		}
	}
</style>
