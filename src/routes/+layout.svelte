<script lang="ts">
	import '../app.css';
	import { untrack } from 'svelte';
	import type { Snippet } from 'svelte';
	import { pwaInfo } from 'virtual:pwa-info';
	import { AlertTriangle } from 'lucide-svelte';
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
	const backgroundVideoPaused = $derived(userPrefsStore.all.backgroundVideoPaused);

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
		preload="metadata"
		class="absolute left-1/2 top-1/2 min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 object-cover"
	>
		<source src="/video/Particle.mp4" type="video/mp4" />
	</video>

	<!-- Aurora re-light: huge drifting color fields blended over the video.
	     screen blend keeps the particles visible underneath. -->
	<div class="aurora aurora-red"></div>
	<div class="aurora aurora-gold"></div>
	<div class="aurora aurora-ember"></div>
</div>

<!-- Content Gate -->
<div class="relative min-h-screen" id="main-content">
	{#if bootPhaseStore.isError}
		<div class="loading-screen">
			<div class="boot-error-card">
				<span class="boot-error-icon" aria-hidden="true">
					<AlertTriangle size={22} strokeWidth={2} />
				</span>
				<h1 class="boot-error-title">Unable to start</h1>
				<p class="boot-error-message">
					{bootPhaseStore.error ||
						'Check your connection and try again. If this keeps happening, refresh the page.'}
				</p>
				<button class="boot-retry-btn" onclick={() => bootPhaseStore.retry()}>Try again</button>
			</div>
		</div>
	{:else if !initialized}
		<div class="loading-screen">
			<!-- Logo skeleton — pre-placed at the same position as the real logo
			     so the boot → login transition is a fade in place -->
			<div class="skeleton-logo">
				<Skeleton width="100%" height="100%" />
			</div>

			<div class="skeleton-card">
				<div class="skeleton-text-group">
					<Skeleton width="160px" height="1.75rem" />
					<Skeleton width="220px" height="0.95rem" />
				</div>
				<div class="skeleton-input-row">
					<Skeleton width="100%" height="48px" class="skeleton-input" />
					<Skeleton variant="circular" width="20px" height="20px" />
				</div>
				<Skeleton width="100%" height="48px" class="skeleton-button" />
				<div class="skeleton-footer-rule"></div>
			</div>

			<!-- Bottom brand skeleton — matches the real bottom-brand position -->
			<div class="skeleton-bottom-brand">
				<Skeleton width="140px" height="0.75rem" />
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
		background: radial-gradient(
			ellipse at center,
			transparent 0%,
			rgba(10, 10, 15, 0.35) 60%,
			rgba(10, 10, 15, 0.65) 100%
		);
		pointer-events: none;
	}

	/* Aurora color fields — transform-only animation, GPU friendly */
	.aurora {
		position: absolute;
		border-radius: 50%;
		filter: blur(90px);
		mix-blend-mode: screen;
		pointer-events: none;
		will-change: transform;
	}

	.aurora-red {
		width: 62vw;
		height: 62vh;
		top: -18%;
		left: -12%;
		background: radial-gradient(circle, rgba(200, 16, 46, 0.5) 0%, transparent 65%);
		animation: auroraDrift 38s ease-in-out infinite;
	}

	.aurora-gold {
		width: 52vw;
		height: 58vh;
		top: 28%;
		right: -14%;
		background: radial-gradient(circle, rgba(212, 175, 55, 0.34) 0%, transparent 65%);
		animation: auroraDrift 46s ease-in-out infinite reverse;
	}

	.aurora-ember {
		width: 46vw;
		height: 42vh;
		bottom: -20%;
		left: 22%;
		background: radial-gradient(circle, rgba(170, 30, 44, 0.42) 0%, transparent 65%);
		animation: auroraDrift 52s ease-in-out infinite 8s;
	}

	@keyframes auroraDrift {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		30% {
			transform: translate(6vw, 4vh) scale(1.12);
		}
		60% {
			transform: translate(-4vw, -3vh) scale(0.94);
		}
		80% {
			transform: translate(3vw, -5vh) scale(1.06);
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
		background: var(--color-bg-primary);
		color: var(--color-solidcam-gold);
		border: 2px solid var(--color-solidcam-gold);
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
		position: relative;
	}

	/* Logo skeleton — mirrors .logo-top in LoginScreen so the boot → login transition is a fade in place */
	.skeleton-logo {
		position: absolute;
		top: 7%;
		left: 50%;
		transform: translateX(-50%);
		width: clamp(296px, 35vw, 476px);
		height: clamp(60px, 7vw, 96px);
		padding: clamp(0.4rem, 1vw, 0.6rem);
		border-radius: 14px;
	}

	.skeleton-card {
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
		width: 100%;
		max-width: 420px;
		padding: 2rem;
		background: linear-gradient(135deg, rgba(28, 28, 28, 0.94) 0%, rgba(12, 12, 12, 0.92) 100%);
		border: 1px solid rgba(255, 255, 255, 0.04);
		border-radius: 20px;
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		box-shadow:
			0 25px 50px rgba(0, 0, 0, 0.4),
			0 10px 20px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.03);
	}

	.skeleton-text-group {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.skeleton-input-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.skeleton-footer-rule {
		height: 1px;
		width: 60%;
		margin: 0.25rem auto 0;
		background: linear-gradient(90deg, transparent, var(--gold-a30), transparent);
	}

	/* Bottom brand skeleton — mirrors .bottom-brand in LoginScreen */
	.skeleton-bottom-brand {
		position: absolute;
		bottom: 1.5rem;
		left: 50%;
		transform: translateX(-50%);
	}

	:global(.skeleton-input) {
		border-radius: 8px !important;
	}

	:global(.skeleton-button) {
		border-radius: 9999px !important;
	}

	/* Boot error card — matches login card geometry, with red accent */
	.boot-error-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		width: 100%;
		max-width: 420px;
		padding: 2.5rem 2rem;
		background: linear-gradient(135deg, rgba(28, 28, 28, 0.94) 0%, rgba(12, 12, 12, 0.92) 100%);
		border: 1px solid rgba(200, 16, 46, 0.22);
		border-radius: 20px;
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		box-shadow:
			0 30px 60px -20px rgba(0, 0, 0, 0.55),
			0 12px 28px -8px rgba(0, 0, 0, 0.35),
			inset 0 1px 0 rgba(255, 255, 255, 0.06),
			inset 0 -1px 0 rgba(0, 0, 0, 0.3);
		text-align: center;
		animation: fadeIn 350ms var(--ease-out-expo);
	}

	.boot-error-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: var(--red-a10);
		border: 1px solid var(--red-a20);
		color: #fca5a5;
		margin-bottom: 0.25rem;
	}

	.boot-error-title {
		font-size: 1.125rem;
		font-weight: 580;
		letter-spacing: -0.012em;
		color: var(--color-text-primary);
		margin: 0;
	}

	.boot-error-message {
		font-size: 0.875rem;
		font-weight: 420;
		color: rgba(255, 255, 255, 0.62);
		margin: 0;
		line-height: 1.55;
		max-width: 32ch;
	}

	.boot-retry-btn {
		margin-top: 0.5rem;
		padding: 0.625rem 1.5rem;
		font-size: 0.9375rem;
		font-weight: 520;
		color: var(--color-on-gold);
		background: var(--gradient-gold);
		border: none;
		border-radius: 9999px;
		cursor: pointer;
		box-shadow:
			0 8px 20px rgba(212, 175, 55, 0.25),
			inset 0 1px 0 rgba(255, 255, 255, 0.35);
		transition:
			filter 200ms var(--ease-out-quart),
			box-shadow 250ms var(--ease-out-expo),
			transform 200ms var(--ease-out-quart);
	}

	.boot-retry-btn:hover {
		filter: brightness(1.06);
		box-shadow:
			0 12px 28px rgba(212, 175, 55, 0.35),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
		transform: translateY(-1px);
	}

	.boot-retry-btn:active {
		transform: translateY(0);
	}
</style>
