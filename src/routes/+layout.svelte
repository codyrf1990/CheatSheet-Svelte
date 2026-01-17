<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import { pwaInfo } from 'virtual:pwa-info';
	import { ToastContainer, Skeleton } from '$components/ui';
	import { LoginScreen } from '$components/layout';
	import { syncStore } from '$stores/sync.svelte';
	import { userPrefsStore } from '$stores/userPrefs.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
	let initialized = $state(false);
	let videoRef: HTMLVideoElement | null = $state(null);

	onMount(async () => {
		await syncStore.load();
		userPrefsStore.init();
		initialized = true;
	});

	const isLoggedIn = $derived(syncStore.isLoggedIn);
	const webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');
	const backgroundVideoPaused = $derived(userPrefsStore.isBackgroundVideoPaused());

	// Control video playback based on user preference
	$effect(() => {
		if (!videoRef) return;
		if (backgroundVideoPaused) {
			videoRef.pause();
		} else {
			videoRef.play().catch(() => {
				// Ignore autoplay errors (e.g., user hasn't interacted yet)
			});
		}
	});
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
		bind:this={videoRef}
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
			<div class="skeleton-card">
				<Skeleton variant="circular" width="44px" height="44px" />
				<div class="skeleton-text-group">
					<Skeleton width="120px" height="1.5rem" />
					<Skeleton width="180px" height="0.875rem" />
				</div>
				<Skeleton width="100%" height="48px" class="skeleton-input" />
				<Skeleton width="100%" height="48px" class="skeleton-button" />
			</div>
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
		padding: 2rem;
	}

	.skeleton-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		width: 100%;
		max-width: 380px;
		padding: 2rem;
		background: rgba(20, 20, 28, 0.8);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 16px;
		backdrop-filter: blur(20px);
	}

	.skeleton-text-group {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	:global(.skeleton-input) {
		border-radius: 8px !important;
	}

	:global(.skeleton-button) {
		border-radius: 10px !important;
	}
</style>
