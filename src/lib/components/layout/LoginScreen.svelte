<script lang="ts">
	import { browser } from '$app/environment';
	import SmokedGlassCard from '$components/ui/SmokedGlassCard.svelte';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import Checkbox from '$components/ui/Checkbox.svelte';
	import { syncStore } from '$stores/sync.svelte';

	let username = $state('');
	let error = $state('');
	let isLoading = $state(false);
	let mounted = $state(false);
	let isOffline = $state(false);
	let rememberMe = $state(syncStore.rememberMe);
	let loginStep = $state<'idle' | 'connecting' | 'syncing' | 'success'>('idle');

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

			await syncStore.connect(username, rememberMe);

			// Show success state
			loginStep = 'success';
			await new Promise((r) => setTimeout(r, 800));
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
	<!-- Ambient background effects -->
	<div class="ambient-glow ambient-1"></div>
	<div class="ambient-glow ambient-2"></div>
	<div class="ambient-glow ambient-3"></div>

	<!-- Floating particles -->
	<div class="particles">
		{#each [0, 1, 2, 3, 4, 5] as i (i)}
			<div
				class="particle"
				style="--delay: {i * 0.8}s; --x: {10 + i * 15}%; --duration: {8 + i * 2}s;"
			></div>
		{/each}
	</div>

	<!-- Offline indicator -->
	{#if isOffline}
		<div class="offline-banner">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<line x1="1" y1="1" x2="23" y2="23" />
				<path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
				<path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
				<path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
				<path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
				<path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
				<line x1="12" y1="20" x2="12.01" y2="20" />
			</svg>
			<span>You're offline — data will sync when connected</span>
		</div>
	{/if}

	<div class="logo-top" class:mounted>
		<img src="/img/solidcam-logo.svg" alt="SolidCAM" class="logo-img" />
	</div>

	<div class="login-container" class:mounted>
		<SmokedGlassCard padding="lg" glow="accent" class="login-card">
			<div class="login-content">
				<!-- Decorative header -->
				<div class="header-decoration">
					<div class="deco-line left"></div>
					<div class="deco-icon">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
							<path
								d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"
							/>
						</svg>
					</div>
					<div class="deco-line right"></div>
				</div>

				<div class="title-group">
					<h1 class="login-title">Welcome</h1>
					<p class="login-subtitle">Pick a tag to get started</p>
				</div>

				<form onsubmit={handleSubmit} class="login-form">
					<div class="input-wrapper" class:has-error={error}>
						<Input
							label="Tag"
							type="text"
							placeholder="e.g., carlos"
							bind:value={username}
							{error}
							hint="Used to save and sync your selections"
							autocomplete="nickname"
							autocapitalize="none"
							autofocus
							disabled={isLoading}
						/>
					</div>

					<div class="remember-row">
						<Checkbox bind:checked={rememberMe} disabled={isLoading}>
							Remember me
						</Checkbox>
					</div>

					<Button
						type="submit"
						variant="gold"
						size="lg"
						disabled={isLoading}
						class="submit-btn {loginStep === 'success' ? 'success' : ''}"
					>
						{#if loginStep === 'success'}
							<svg class="success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
								<polyline points="20 6 9 17 4 12" />
							</svg>
							Ready!
						{:else if isLoading}
							<span class="loading-spinner"></span>
							{stepLabels[loginStep]}
						{:else}
							Start
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								class="arrow-icon"
							>
								<path d="M5 12h14m-7-7l7 7-7 7" />
							</svg>
						{/if}
					</Button>
				</form>

				<!-- Footer decoration -->
				<div class="footer-decoration">
					<div class="footer-dots">
						<span></span><span></span><span></span>
					</div>
				</div>
			</div>
		</SmokedGlassCard>
	</div>

	<!-- Bottom branding -->
	<div class="bottom-brand" class:mounted>
		<span class="brand-text">SolidCAM CheatSheet</span>
		<span class="brand-divider"></span>
		<span class="brand-version">v1.0</span>
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

	/* Ambient glows */
	.ambient-glow {
		position: absolute;
		border-radius: 50%;
		filter: blur(80px);
		opacity: 0.4;
		pointer-events: none;
	}

	.ambient-1 {
		width: 400px;
		height: 400px;
		background: radial-gradient(circle, rgba(212, 175, 55, 0.3) 0%, transparent 70%);
		top: -100px;
		left: -100px;
		animation: ambientFloat 20s ease-in-out infinite;
	}

	.ambient-2 {
		width: 300px;
		height: 300px;
		background: radial-gradient(circle, rgba(200, 16, 46, 0.25) 0%, transparent 70%);
		bottom: -50px;
		right: -50px;
		animation: ambientFloat 25s ease-in-out infinite reverse;
	}

	.ambient-3 {
		width: 250px;
		height: 250px;
		background: radial-gradient(circle, rgba(212, 175, 55, 0.2) 0%, transparent 70%);
		top: 40%;
		right: 10%;
		animation: ambientFloat 18s ease-in-out infinite 5s;
	}

	@keyframes ambientFloat {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		25% {
			transform: translate(20px, -30px) scale(1.1);
		}
		50% {
			transform: translate(-10px, 20px) scale(0.95);
		}
		75% {
			transform: translate(30px, 10px) scale(1.05);
		}
	}

	/* Particles */
	.particles {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
	}

	.particle {
		position: absolute;
		width: 4px;
		height: 4px;
		background: rgba(212, 175, 55, 0.5);
		border-radius: 50%;
		left: var(--x);
		bottom: -10px;
		animation: particleRise var(--duration) ease-out infinite;
		animation-delay: var(--delay);
	}

	@keyframes particleRise {
		0% {
			transform: translateY(0) scale(0);
			opacity: 0;
		}
		10% {
			opacity: 1;
			transform: scale(1);
		}
		90% {
			opacity: 0.5;
		}
		100% {
			transform: translateY(-100vh) scale(0.5);
			opacity: 0;
		}
	}

	/* Offline banner */
	.offline-banner {
		position: absolute;
		top: 1rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: rgba(239, 68, 68, 0.15);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 8px;
		color: #fca5a5;
		font-size: 0.8rem;
		animation: slideDown 0.3s ease;
		z-index: 10;
	}

	.offline-banner svg {
		width: 16px;
		height: 16px;
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
		top: 2rem;
		left: 50%;
		transform: translateX(-50%) translateY(-20px);
		opacity: 0;
		transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.logo-top.mounted {
		opacity: 1;
		transform: translateX(-50%) translateY(0);
	}

	.logo-img {
		height: 48px;
		filter: drop-shadow(0 0 20px rgba(200, 16, 46, 0.3));
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
		transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s;
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
	}

	/* Header decoration */
	.header-decoration {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}

	.deco-line {
		flex: 1;
		height: 1px;
		background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.3));
	}

	.deco-line.right {
		background: linear-gradient(90deg, rgba(212, 175, 55, 0.3), transparent);
	}

	.deco-icon {
		width: 44px;
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(145deg, rgba(212, 175, 55, 0.15), rgba(212, 175, 55, 0.05));
		border: 1px solid rgba(212, 175, 55, 0.2);
		border-radius: 12px;
		color: #d4af37;
		animation: iconFloat 3s ease-in-out infinite;
	}

	.deco-icon svg {
		width: 24px;
		height: 24px;
	}

	@keyframes iconFloat {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-3px);
		}
	}

	.title-group {
		text-align: center;
	}

	.login-title {
		font-size: 1.75rem;
		font-weight: 700;
		color: #f5f5f5;
		margin: 0 0 0.5rem 0;
		background: linear-gradient(135deg, #ffffff 0%, #d4af37 100%);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.login-subtitle {
		font-size: 0.95rem;
		color: rgba(255, 255, 255, 0.55);
		margin: 0;
	}

	.login-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.input-wrapper {
		position: relative;
	}

	.remember-row {
		display: flex;
		align-items: center;
		margin-top: -0.5rem;
	}

	.input-wrapper.has-error {
		animation: shake 0.3s ease;
	}

	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(-4px);
		}
		75% {
			transform: translateX(4px);
		}
	}

	:global(.submit-btn) {
		width: 100%;
		min-width: 160px;
		position: relative;
		overflow: hidden;
		justify-content: center;
	}

	.arrow-icon,
	.loading-spinner,
	.success-icon {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
	}

	.arrow-icon {
		transition: transform 200ms ease;
	}

	.success-icon {
		color: #000;
		animation: successPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
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

	:global(.submit-btn.success) {
		background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
		border-color: #22c55e;
	}

	:global(.submit-btn:hover) .arrow-icon {
		transform: translateX(4px);
	}

	.loading-spinner {
		border: 2px solid rgba(0, 0, 0, 0.2);
		border-top-color: currentColor;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Footer decoration */
	.footer-decoration {
		display: flex;
		justify-content: center;
		padding-top: 0.5rem;
	}

	.footer-dots {
		display: flex;
		gap: 6px;
	}

	.footer-dots span {
		width: 4px;
		height: 4px;
		background: rgba(212, 175, 55, 0.3);
		border-radius: 50%;
	}

	.footer-dots span:nth-child(2) {
		background: rgba(212, 175, 55, 0.5);
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
		transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.4s;
	}

	.bottom-brand.mounted {
		opacity: 1;
		transform: translateY(0);
	}

	.brand-text {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
		letter-spacing: 0.05em;
	}

	.brand-divider {
		width: 1px;
		height: 12px;
		background: rgba(255, 255, 255, 0.25);
	}

	.brand-version {
		font-size: 0.7rem;
		color: rgba(212, 175, 55, 0.7);
		font-weight: 500;
	}

	@media (max-width: 480px) {
		.login-screen {
			padding: 1.5rem;
		}

		.logo-top {
			top: 1.5rem;
		}

		.login-title {
			font-size: 1.5rem;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.ambient-glow,
		.particle,
		.deco-icon {
			animation: none;
		}

		.logo-top,
		.login-container,
		.bottom-brand {
			transition: none;
		}
	}
</style>
