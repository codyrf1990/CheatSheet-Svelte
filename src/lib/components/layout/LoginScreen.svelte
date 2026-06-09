<script lang="ts">
	import { browser } from '$app/environment';
	import { ArrowRight, Check, WifiOff, Loader2 } from 'lucide-svelte';
	import SmokedGlassCard from '$components/ui/SmokedGlassCard.svelte';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Checkbox from '$components/ui/Checkbox.svelte';
	import LoginAtmosphere from './LoginAtmosphere.svelte';
	import { syncStore } from '$stores/sync.svelte';

	let username = $state(syncStore.lastUsername || '');
	let error = $state('');
	let isLoading = $state(false);
	let mounted = $state(false);
	let isOffline = $state(false);
	let rememberMe = $state(syncStore.rememberMe);
	let loginStep = $state<'idle' | 'connecting' | 'syncing' | 'success'>('idle');

	// "Ready to submit" — input has a usable name
	let isReady = $derived(username.trim().length >= 2 && !isLoading);

	$effect(() => {
		// Trigger entrance animation
		const timer = setTimeout(() => (mounted = true), 100);
		return () => clearTimeout(timer);
	});

	// Track online/offline status
	$effect(() => {
		if (!browser) return;

		isOffline = !navigator.onLine;

		const handleOnline = () => (isOffline = false);
		const handleOffline = () => (isOffline = true);

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';

		if (!username.trim()) {
			error = 'Please enter a tag';
			return;
		}

		isLoading = true;
		loginStep = 'connecting';

		try {
			// Brief delay to show connecting step
			await new Promise((r) => setTimeout(r, 400));
			loginStep = 'syncing';

			const success = await syncStore.connect(username, rememberMe);

			if (success) {
				// Show success state
				loginStep = 'success';
				await new Promise((r) => setTimeout(r, 800));
			} else {
				// connect() returned false (validation error or load failure)
				error = syncStore.error || 'Connection failed';
				loginStep = 'idle';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to connect';
			loginStep = 'idle';
		} finally {
			isLoading = false;
		}
	}

	// Step labels for progress display
	const stepLabels = {
		idle: '',
		connecting: 'Connecting...',
		syncing: 'Syncing...',
		success: 'Ready!'
	};
</script>

<div class="login-screen">
	<LoginAtmosphere />

	<!-- Offline indicator -->
	{#if isOffline}
		<div class="offline-banner">
			<span class="offline-icon-wrap" aria-hidden="true">
				<WifiOff size={13} strokeWidth={2.25} />
			</span>
			<span>You're offline — data will sync when connected</span>
		</div>
	{/if}

	<a
		href="https://solidcam.com/en-us/"
		target="_blank"
		rel="noopener noreferrer"
		class="logo-top"
		class:mounted
	>
		<img src="/img/solidcam-logo.svg" alt="SolidCAM" class="logo-img" />
	</a>

	<div class="login-container" class:mounted>
		<SmokedGlassCard padding="lg" glow="accent" variant="hero" class="login-card">
			<div class="login-content">
				<div class="title-group">
					<h1 class="login-title">Welcome</h1>
					<div class="title-rule" aria-hidden="true"></div>
					<p class="login-subtitle">Enter your name to get started</p>
				</div>

				<form onsubmit={handleSubmit} class="login-form">
					<div class="input-row" class:has-error={error}>
						<div class="input-wrapper">
							<Input
								type="text"
								placeholder="e.g., carlos"
								bind:value={username}
								{error}
								hint="Your name is used to save and sync your work across devices"
								autocomplete="nickname"
								autocapitalize="none"
								autofocus
								disabled={isLoading}
							/>
						</div>
						<Checkbox
							bind:checked={rememberMe}
							disabled={isLoading}
							label="Remember me"
							aria-label="Remember me"
						/>
					</div>

					<Button
						type="submit"
						variant="gold"
						size="lg"
						disabled={isLoading}
						class="submit-btn {loginStep === 'success' ? 'success' : ''} {isReady
							? 'is-ready'
							: ''}"
					>
						{#if loginStep === 'success'}
							<span class="success-ring" aria-hidden="true"></span>
							<Check class="success-icon" size={18} strokeWidth={3} />
							Ready!
						{:else if isLoading}
							<Loader2 class="loading-spinner" size={18} strokeWidth={2.5} />
							{stepLabels[loginStep]}
						{:else}
							Start
							<ArrowRight class="arrow-icon" size={18} strokeWidth={2} />
						{/if}
					</Button>
				</form>

				<!-- Footer hairline rule -->
				<div class="footer-rule" aria-hidden="true"></div>
			</div>
		</SmokedGlassCard>
	</div>

	<!-- Bottom branding -->
	<div class="bottom-brand" class:mounted>
		<span class="brand-text">SolidCAM CheatSheet</span>
	</div>
</div>

<style>
	.login-screen {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		position: relative;
		overflow: hidden;
	}

	/* Offline banner — soft amber instead of aggressive red */
	.offline-banner {
		position: absolute;
		top: 1rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 0.85rem 0.4rem 0.4rem;
		background: rgba(245, 158, 11, 0.1);
		border: 1px solid rgba(245, 158, 11, 0.25);
		border-radius: 9999px;
		color: #fbbf24;
		font-size: 0.78rem;
		font-weight: 500;
		letter-spacing: -0.005em;
		box-shadow:
			0 6px 20px -8px rgba(245, 158, 11, 0.35),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
		animation: slideDown 0.4s var(--ease-out-expo);
		z-index: 10;
	}

	.offline-icon-wrap {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: rgba(245, 158, 11, 0.18);
		color: #fbbf24;
		flex-shrink: 0;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}

	/* Logo */
	.logo-top {
		position: absolute;
		top: 7%;
		left: 50%;
		transform: translateX(-50%) translateY(-20px) scale(0.96);
		opacity: 0;
		transition: all 0.8s var(--ease-out-expo);
		width: clamp(296px, 35vw, 476px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: clamp(0.4rem, 1vw, 0.6rem);
		border-radius: 14px;
	}

	/* Breathing red glow cloud under tagline — centered under the logo at every viewport */
	.logo-top::after {
		content: '';
		position: absolute;
		bottom: 5%;
		left: 50%;
		width: 100%;
		transform: translateX(-50%);
		height: 35%;
		background: radial-gradient(
			ellipse 60% 80% at 50% 100%,
			rgba(200, 16, 46, 0.88) 0%,
			rgba(200, 16, 46, 0.44) 40%,
			transparent 70%
		);
		filter: blur(10px);
		animation: glow-breathe 3s ease-in-out infinite;
		pointer-events: none;
	}

	@keyframes glow-breathe {
		0%,
		100% {
			opacity: 0.7;
			transform: translateX(-50%) scaleY(0.95);
		}
		50% {
			opacity: 1;
			transform: translateX(-50%) scaleY(1.05);
		}
	}

	.logo-top.mounted {
		opacity: 1;
		transform: translateX(-50%) translateY(0) scale(1);
	}

	.logo-img {
		width: 100%;
		height: auto;
		filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.5)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
		transition: transform 200ms var(--ease-out-quart);
	}

	.logo-top:hover .logo-img {
		transform: scale(1.02);
	}

	/* Login container */
	.login-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2rem;
		width: 100%;
		max-width: 420px;
		opacity: 0;
		transform: translateY(30px) scale(0.95);
		transition: all 0.8s var(--ease-out-expo) 0.2s;
	}

	.login-container.mounted {
		opacity: 1;
		transform: translateY(0) scale(1);
	}

	:global(.login-card) {
		width: 100%;
		position: relative;
	}

	.login-content {
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
		position: relative;
		z-index: 1;
	}

	.title-group {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	/* Hairline gold rule between title and subtitle — mirrors the footer rule for rhythm */
	.title-rule {
		height: 1px;
		width: 30%;
		background: linear-gradient(90deg, transparent, var(--gold-a30), transparent);
	}

	/* Animated gradient angle — modern browsers (Chrome 85+, Firefox 128+, Safari 16.4+).
	   Older browsers fall back to a static 135deg gradient gracefully. */
	@property --title-angle {
		syntax: '<angle>';
		initial-value: 135deg;
		inherits: false;
	}

	/* Typography pass — Inter Variable axis */
	.login-title {
		font-size: clamp(1.75rem, 1.4rem + 1.2vw, 2.125rem);
		font-weight: 580;
		letter-spacing: -0.022em;
		color: var(--color-text-primary);
		margin: 0;
		background: linear-gradient(
			var(--title-angle, 135deg),
			#ffffff 0%,
			#f3dc8a 38%,
			#d4af37 52%,
			#f3dc8a 66%,
			#ffffff 100%
		);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
		/* Letterpress depth — text-shadow is invisible with transparent fill */
		filter: drop-shadow(0 1px 0 rgba(0, 0, 0, 0.55));
		animation: titleSheen 9s ease-in-out infinite;
	}

	@keyframes titleSheen {
		0%,
		100% {
			--title-angle: 110deg;
		}
		50% {
			--title-angle: 165deg;
		}
	}

	.login-subtitle {
		font-size: 0.95rem;
		font-weight: 420;
		letter-spacing: -0.005em;
		color: rgba(255, 255, 255, 0.62);
		margin: 0;
	}

	.login-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.input-row {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
	}

	.input-wrapper {
		flex: 1;
		position: relative;
	}

	/* Align the Remember-me checkbox with the input field's vertical center
	   (not the whole input wrapper, which includes the hint line below). */
	.input-row > :global(.checkbox-wrapper) {
		margin-top: 11px;
	}

	.input-row.has-error {
		animation: shake 0.3s var(--ease-out-quart);
	}

	:global(.submit-btn) {
		width: 100%;
		min-width: 160px;
		position: relative;
		overflow: hidden;
		justify-content: center;
		transition:
			box-shadow 350ms var(--ease-out-expo),
			transform 200ms var(--ease-out-quart),
			filter 200ms var(--ease-out-quart);
	}

	/* "Ready to fire" — input has a usable name. Soft gold glow halo + the arrow inches forward. */
	:global(.submit-btn.is-ready) {
		box-shadow:
			0 12px 28px rgba(212, 175, 55, 0.38),
			0 0 28px rgba(212, 175, 55, 0.28),
			inset 0 1px 0 rgba(255, 255, 255, 0.45);
	}

	:global(.submit-btn.is-ready .arrow-icon) {
		transform: translateX(2px);
	}

	:global(.submit-btn .arrow-icon),
	:global(.submit-btn .success-icon) {
		flex-shrink: 0;
	}

	:global(.submit-btn .arrow-icon) {
		transition: transform 200ms var(--ease-out-quart);
	}

	:global(.submit-btn .success-icon) {
		color: #000;
		animation: successPop 0.4s var(--ease-spring);
	}

	@keyframes successPop {
		0% {
			transform: scale(0);
			opacity: 0;
		}
		50% {
			transform: scale(1.2);
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}

	/* Conic ring sweep on success — replaces the green flash, stays in the gold palette */
	.success-ring {
		position: absolute;
		inset: 0;
		border-radius: inherit;
		padding: 2px;
		background: conic-gradient(
			from 0deg,
			transparent 0deg 270deg,
			rgba(255, 255, 255, 0.8) 320deg,
			transparent 360deg
		);
		-webkit-mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		-webkit-mask-composite: xor;
		mask-composite: exclude;
		animation: ringSweep 600ms var(--ease-spring) forwards;
		pointer-events: none;
	}

	@keyframes ringSweep {
		0% {
			transform: rotate(0deg);
			opacity: 0;
		}
		20% {
			opacity: 1;
		}
		100% {
			transform: rotate(360deg);
			opacity: 0;
		}
	}

	:global(.submit-btn:hover .arrow-icon) {
		transform: translateX(4px);
	}

	:global(.submit-btn .loading-spinner) {
		flex-shrink: 0;
		color: rgba(0, 0, 0, 0.85);
		animation: spin 0.85s linear infinite;
	}

	/* Footer hairline rule — replaces the 3-dot decoration */
	.footer-rule {
		height: 1px;
		width: 60%;
		margin: 0.25rem auto 0;
		background: linear-gradient(90deg, transparent, var(--gold-a30), transparent);
	}

	/* Bottom branding */
	.bottom-brand {
		position: absolute;
		bottom: 1.5rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		opacity: 0;
		transform: translateY(10px);
		transition: all 0.8s var(--ease-out-expo) 0.4s;
	}

	/* Flanking gold hairlines — mirrors the title/footer rules */
	.bottom-brand::before,
	.bottom-brand::after {
		content: '';
		height: 1px;
		width: 42px;
		background: linear-gradient(90deg, transparent, var(--gold-a30));
	}

	.bottom-brand::after {
		background: linear-gradient(90deg, var(--gold-a30), transparent);
	}

	.bottom-brand.mounted {
		opacity: 1;
		transform: translateY(0);
	}

	.brand-text {
		font-size: 0.6875rem;
		font-weight: 520;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.5);
	}

	@media (max-width: 480px) {
		.login-screen {
			padding: 1.5rem;
		}

		.logo-top {
			top: 1.5rem;
		}
	}
</style>
