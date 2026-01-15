<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		padding?: 'sm' | 'md' | 'lg' | 'none';
		glow?: 'none' | 'subtle' | 'accent';
		class?: string;
		children: Snippet;
	}

	let { padding = 'md', glow = 'none', class: className = '', children }: Props = $props();

	const paddings = {
		none: '',
		sm: 'p-4',
		md: 'p-6',
		lg: 'p-8'
	};

	const glows = {
		none: '',
		subtle: 'shadow-[0_0_40px_rgba(0,0,0,0.3)]',
		accent: 'shadow-[0_0_60px_rgba(200,16,46,0.08)]'
	};
</script>

<div class="smoked-glass {paddings[padding]} {glows[glow]} rounded-[20px] {className}">
	{@render children()}
</div>

<style>
	.smoked-glass {
		/* Smoked glass - more opaque than frosted */
		background: linear-gradient(135deg, rgba(28, 28, 28, 0.94) 0%, rgba(12, 12, 12, 0.92) 100%);

		/* Reduced blur for luxury feel */
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);

		/* Subtle edge highlight */
		border: 1px solid rgba(255, 255, 255, 0.04);

		/* Deep shadow for grounding */
		box-shadow:
			0 25px 50px rgba(0, 0, 0, 0.4),
			0 10px 20px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.03);
	}

	/* Focus states for cards that might be interactive */
	.smoked-glass:focus-visible {
		outline: 2px solid var(--color-solidcam-gold, #d4af37);
		outline-offset: 2px;
	}
</style>
