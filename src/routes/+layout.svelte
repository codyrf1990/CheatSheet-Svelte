<script lang="ts">
	import '../app.css';
	import { untrack } from 'svelte';
	import type { Snippet } from 'svelte';
	import { pwaInfo } from 'virtual:pwa-info';
	import { ToastContainer, Skeleton } from '$components/ui';
	import { LoginScreen } from '$components/layout';
	import { syncStore } from '$stores/sync.svelte';
	import { bootPhaseStore } from '$stores/bootPhase.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

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
</script>

<svelte:head>
	<title>SolidCAM CheatSheet</title>
	<link rel="icon" href="/favicon.png" />
	{@html webManifestLink}
</svelte:head>

<!-- Skip to main content link (accessibility) -->
<a href="#main-content" class="skip-link">Skip to main content</a>

<!-- Aurora Background (decorative) -->
<div class="aurora-bg" aria-hidden="true">
	<div class="aurora-blob aurora-1"></div>
	<div class="aurora-blob aurora-2"></div>
	<div class="aurora-blob aurora-3"></div>
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
	/* Aurora background — warm dark red base */
	.aurora-bg {
		position: fixed;
		inset: 0;
		z-index: -10;
		overflow: hidden;
		background: linear-gradient(145deg, #1a0808 0%, #120a0a 50%, #0d0a10 100%);
	}

	/* Grain texture overlay for tactile depth */
	.aurora-bg::after {
		content: '';
		position: absolute;
		inset: 0;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'%3E%3Cfilter id='a'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23a)'/%3E%3C/svg%3E");
		background-repeat: repeat;
		background-size: 182px;
		opacity: 0.06;
		pointer-events: none;
		z-index: 1;
	}

	/* Aurora blobs — box-shadow technique with hue-rotate for living color */
	.aurora-blob {
		position: absolute;
		width: 0;
		height: 0;
		opacity: 0.7;
		will-change: transform, filter;
	}

	/* Crimson — dominant, top-left drift */
	.aurora-1 {
		top: 20%;
		left: 30%;
		box-shadow: 0 0 50vmax 50vmax rgba(180, 20, 40, 0.35);
		animation:
			aurora-hue-1 15s linear infinite,
			aurora-move-1 19s ease-in-out infinite;
	}

	/* Deep red-gold — bottom-right drift */
	.aurora-2 {
		top: 60%;
		left: 70%;
		box-shadow: 0 0 45vmax 45vmax rgba(160, 40, 20, 0.25);
		animation:
			aurora-hue-2 20s linear infinite,
			aurora-move-2 25s ease-in-out infinite;
	}

	/* Wine/burgundy — center drift, slower */
	.aurora-3 {
		top: 40%;
		left: 50%;
		box-shadow: 0 0 40vmax 40vmax rgba(120, 15, 50, 0.2);
		animation:
			aurora-hue-3 25s linear infinite,
			aurora-move-3 22s ease-in-out infinite;
	}

	/* Hue rotations — small range keeps it in the red/warm family
	   Full 360deg would cycle through greens and blues.
	   ±40deg stays in red → orange → wine → back */
	@keyframes aurora-hue-1 {
		0% {
			filter: hue-rotate(0deg);
		}
		50% {
			filter: hue-rotate(35deg);
		}
		100% {
			filter: hue-rotate(0deg);
		}
	}

	@keyframes aurora-hue-2 {
		0% {
			filter: hue-rotate(0deg);
		}
		50% {
			filter: hue-rotate(-30deg);
		}
		100% {
			filter: hue-rotate(0deg);
		}
	}

	@keyframes aurora-hue-3 {
		0% {
			filter: hue-rotate(0deg);
		}
		50% {
			filter: hue-rotate(25deg);
		}
		100% {
			filter: hue-rotate(0deg);
		}
	}

	/* Movement paths — different durations = never repeats */
	@keyframes aurora-move-1 {
		0%,
		100% {
			transform: translate(0, 0);
		}
		25% {
			transform: translate(15%, -10%);
		}
		50% {
			transform: translate(-10%, 15%);
		}
		75% {
			transform: translate(-15%, -5%);
		}
	}

	@keyframes aurora-move-2 {
		0%,
		100% {
			transform: translate(0, 0);
		}
		25% {
			transform: translate(-20%, -8%);
		}
		50% {
			transform: translate(10%, -15%);
		}
		75% {
			transform: translate(-5%, 12%);
		}
	}

	@keyframes aurora-move-3 {
		0%,
		100% {
			transform: translate(0, 0);
		}
		33% {
			transform: translate(12%, 10%);
		}
		66% {
			transform: translate(-15%, -8%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.aurora-blob {
			animation: none;
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
