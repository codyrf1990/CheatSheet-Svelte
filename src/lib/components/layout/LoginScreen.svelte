<script lang="ts">
	import SmokedGlassCard from '$components/ui/SmokedGlassCard.svelte';
	import Button from '$components/ui/Button.svelte';
	import Input from '$components/ui/Input.svelte';
	import { syncStore } from '$stores/sync.svelte';

	let username = $state('');
	let error = $state('');
	let isLoading = $state(false);
	let mounted = $state(false);

	$effect(() => {
		// Trigger entrance animation
		const timer = setTimeout(() => mounted = true, 100);
		return () => clearTimeout(timer);
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';

		if (!username.trim()) {
			error = 'Please enter a username';
			return;
		}

		isLoading = true;
		try {
			await syncStore.connect(username);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to login';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="login-screen">
	<!-- Ambient background effects -->
	<div class="ambient-glow ambient-1"></div>
	<div class="ambient-glow ambient-2"></div>
	<div class="ambient-glow ambient-3"></div>

	<!-- Floating particles -->
	<div class="particles">
		{#each Array(6) as _, i}
			<div class="particle" style="--delay: {i * 0.8}s; --x: {10 + i * 15}%; --duration: {8 + i * 2}s;"></div>
		{/each}
	</div>

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
							<path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
						</svg>
					</div>
					<div class="deco-line right"></div>
				</div>

				<div class="title-group">
					<h1 class="login-title">Welcome</h1>
					<p class="login-subtitle">Enter your username to get started</p>
				</div>

				<form onsubmit={handleSubmit} class="login-form">
					<div class="input-wrapper">
						<Input
							label="Username"
							type="text"
							placeholder="e.g., john.doe"
							bind:value={username}
							{error}
							autocomplete="username"
							autocapitalize="none"
							disabled={isLoading}
						/>
					</div>

					<p class="login-hint">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/>
						</svg>
						This is just an identifier, not a secure login
					</p>

					<Button type="submit" variant="gold" size="lg" disabled={isLoading} class="submit-btn">
						{#if isLoading}
							<span class="loading-spinner"></span>
							Signing in...
						{:else}
							Continue
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="arrow-icon">
								<path d="M5 12h14m-7-7l7 7-7 7"/>
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
		0%, 100% { transform: translate(0, 0) scale(1); }
		25% { transform: translate(20px, -30px) scale(1.1); }
		50% { transform: translate(-10px, 20px) scale(0.95); }
		75% { transform: translate(30px, 10px) scale(1.05); }
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
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-3px); }
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

	.login-hint {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.4);
		margin: 0;
		line-height: 1.5;
	}

	.login-hint svg {
		width: 14px;
		height: 14px;
		flex-shrink: 0;
		opacity: 0.6;
	}

	:global(.submit-btn) {
		width: 100%;
		position: relative;
		overflow: hidden;
	}

	.arrow-icon {
		width: 18px;
		height: 18px;
		transition: transform 200ms ease;
	}

	:global(.submit-btn:hover) .arrow-icon {
		transform: translateX(4px);
	}

	.loading-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(0, 0, 0, 0.2);
		border-top-color: currentColor;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
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
		color: rgba(255, 255, 255, 0.35);
		letter-spacing: 0.05em;
	}

	.brand-divider {
		width: 1px;
		height: 12px;
		background: rgba(255, 255, 255, 0.15);
	}

	.brand-version {
		font-size: 0.7rem;
		color: rgba(212, 175, 55, 0.5);
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
