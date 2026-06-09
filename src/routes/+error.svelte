<script lang="ts">
	import { page } from '$app/state';
	import { AlertTriangle } from 'lucide-svelte';
</script>

<div class="error-page">
	<div class="error-card">
		<span class="error-icon" aria-hidden="true">
			<AlertTriangle size={22} strokeWidth={2} />
		</span>
		<h1 class="error-code">{page.status}</h1>
		<p class="error-message">{page.error?.message || 'Something went wrong'}</p>
		<a href="/" class="home-link">Go home</a>
	</div>
</div>

<style>
	.error-page {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 2rem;
	}

	.error-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		text-align: center;
		padding: 2.5rem 2rem;
		width: 100%;
		max-width: 420px;
		background: linear-gradient(135deg, rgba(28, 28, 28, 0.94) 0%, rgba(12, 12, 12, 0.92) 100%);
		border: 1px solid var(--red-a20);
		border-radius: 20px;
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		box-shadow:
			0 30px 60px -20px rgba(0, 0, 0, 0.55),
			0 12px 28px -8px rgba(0, 0, 0, 0.35),
			inset 0 1px 0 rgba(255, 255, 255, 0.06),
			inset 0 -1px 0 rgba(0, 0, 0, 0.3);
	}

	.error-icon {
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

	.error-code {
		font-size: 3.25rem;
		font-weight: 580;
		letter-spacing: -0.025em;
		color: var(--color-solidcam-gold);
		margin: 0;
		line-height: 1;
		background: linear-gradient(135deg, #ffffff 0%, #d4af37 100%);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.error-message {
		font-size: 0.95rem;
		font-weight: 420;
		color: rgba(255, 255, 255, 0.62);
		margin: 0 0 1rem;
		line-height: 1.5;
		max-width: 32ch;
	}

	.home-link {
		display: inline-block;
		padding: 0.625rem 1.5rem;
		font-size: 0.9375rem;
		font-weight: 520;
		color: var(--color-on-gold);
		background: var(--gradient-gold);
		border-radius: 9999px;
		text-decoration: none;
		box-shadow:
			0 8px 20px rgba(212, 175, 55, 0.25),
			inset 0 1px 0 rgba(255, 255, 255, 0.35);
		transition:
			filter 200ms var(--ease-out-quart),
			box-shadow 250ms var(--ease-out-expo),
			transform 200ms var(--ease-out-quart);
	}

	.home-link:hover {
		filter: brightness(1.06);
		box-shadow:
			0 12px 28px rgba(212, 175, 55, 0.35),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
		transform: translateY(-1px);
	}

	.home-link:active {
		transform: translateY(0);
	}
</style>
