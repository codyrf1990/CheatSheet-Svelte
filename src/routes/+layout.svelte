<script lang="ts">
	import '../app.css';
	import { untrack } from 'svelte';
	import type { Snippet } from 'svelte';
	import { pwaInfo } from 'virtual:pwa-info';
	import { ToastContainer, Skeleton } from '$components/ui';
	import { LoginScreen } from '$components/layout';
	import { syncStore } from '$stores/sync.svelte';
	import { bootPhaseStore } from '$stores/bootPhase.svelte';
	import { userPrefsStore } from '$stores/userPrefs.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
	let videoRef: HTMLVideoElement | null = $state(null);

	const initialized = $derived(bootPhaseStore.isReady);

	$effect(() => {
		untrack(() => {
			bootPhaseStore.boot();
		});

		// Flush pending debounced save when tab is hidden (covers mobile/Safari tab-close too)
		const onHide = () => {
			if (document.visibilityState === 'hidden') syncStore.flushPending();
		};
		document.addEventListener('visibilitychange', onHide);
		return () => document.removeEventListener('visibilitychange', onHide);
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
<div class="video-bg" aria-hidden="true">
	<video
		bind:this={videoRef}
		autoplay
		loop
		muted
		playsinline
		disablepictureinpicture
		class="absolute left-1/2 top-1/2 min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 object-cover"
	>
		<source src="/video/Particle.webm" type="video/webm" />
		<source src="/video/Particle-opt.mp4" type="video/mp4" />
	</video>
</div>

<!-- Content Gate -->
<div class="relative min-h-screen" id="main-content">
	{#if bootPhaseStore.isError}
		<div class="loading-screen">
			<div class="boot-error-card">
				<h1 class="boot-error-title">Unable to start</h1>
				<p class="boot-error-message">
					{bootPhaseStore.error || 'Something went wrong during startup.'}
				</p>
				<button class="boot-retry-btn" onclick={() => bootPhaseStore.retry()}>Try again</button>
			</div>
		</div>
	{:else if !initialized}
		<div class="loading-screen">
			<div class="skeleton-card">
				<span class="boot-brand">CheatSheet</span>
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
	/* Video background with overlay for legibility */
	.video-bg {
		position: fixed;
		inset: 0;
		z-index: -10;
		overflow: hidden;
	}

	.video-bg::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			180deg,
			rgba(10, 10, 15, 0.4) 0%,
			rgba(10, 10, 15, 0.2) 50%,
			rgba(10, 10, 15, 0.5) 100%
		);
		pointer-events: none;
	}

	@media (prefers-reduced-motion: reduce) {
		.video-bg video {
			display: none;
		}
		.video-bg {
			background: #0a0a0f;
		}
	}

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

	/* Boot branding */
	.boot-brand {
		font-size: 1.25rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		background: linear-gradient(135deg, #ffffff 0%, #e8d59a 50%, #ffffff 100%);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	/* Boot error card */
	.boot-error-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		width: 100%;
		max-width: 380px;
		padding: 2.5rem 2rem;
		background: rgba(20, 20, 28, 0.85);
		border: 1px solid rgba(200, 16, 46, 0.2);
		border-radius: 16px;
		backdrop-filter: blur(20px);
		text-align: center;
	}

	.boot-error-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: #d4af37;
		margin: 0;
	}

	.boot-error-message {
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.6);
		margin: 0;
		line-height: 1.5;
	}

	.boot-retry-btn {
		padding: 0.625rem 1.5rem;
		font-size: 0.9375rem;
		font-weight: 500;
		color: #1a1a1a;
		background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%);
		border: none;
		border-radius: 9999px;
		cursor: pointer;
		transition: filter 150ms ease;
	}

	.boot-retry-btn:hover {
		filter: brightness(1.1);
	}
</style>
