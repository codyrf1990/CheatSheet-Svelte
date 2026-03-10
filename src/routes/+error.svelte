<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="error-page">
	<div class="error-card">
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
		text-align: center;
		padding: 3rem 2.5rem;
		background: rgba(26, 26, 26, 0.85);
		border: 1px solid rgba(212, 175, 55, 0.2);
		border-radius: 1rem;
		max-width: 420px;
	}

	.error-code {
		font-size: 4rem;
		font-weight: 700;
		color: #d4af37;
		margin: 0 0 0.5rem;
		line-height: 1;
	}

	.error-message {
		font-size: 1.125rem;
		color: rgba(255, 255, 255, 0.7);
		margin: 0 0 2rem;
	}

	.home-link {
		display: inline-block;
		padding: 0.625rem 1.5rem;
		font-size: 0.9375rem;
		font-weight: 500;
		color: #1a1a1a;
		background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%);
		border-radius: 9999px;
		text-decoration: none;
		transition: filter 150ms ease;
	}

	.home-link:hover {
		filter: brightness(1.1);
	}

</style>
