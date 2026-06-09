<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		padding?: 'sm' | 'md' | 'lg' | 'none';
		glow?: 'none' | 'subtle' | 'accent';
		variant?: 'default' | 'hero';
		class?: string;
		children: Snippet;
	}

	let {
		padding = 'md',
		glow = 'none',
		variant = 'default',
		class: className = '',
		children
	}: Props = $props();

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

<div
	class="smoked-glass {paddings[padding]} {glows[glow]} rounded-[20px] {variant === 'hero'
		? 'smoked-glass--hero'
		: ''} {className}"
>
	{@render children()}
</div>

<style>
	.smoked-glass {
		position: relative;
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
			var(--elev-2);
	}

	/* Focus states for cards that might be interactive */
	.smoked-glass:focus-visible {
		outline: 2px solid var(--color-solidcam-gold, #d4af37);
		outline-offset: 2px;
	}

	/* ======== Hero variant ======== */
	/* Used on the login card. Adds: gradient-stroke border (mask-composite),
	   upgraded inner highlight stack, and a subtle SVG noise overlay for grain. */

	.smoked-glass--hero {
		border: none;
		box-shadow:
			0 30px 60px -20px rgba(0, 0, 0, 0.55),
			0 12px 28px -8px rgba(0, 0, 0, 0.35),
			inset 0 1px 0 rgba(255, 255, 255, 0.06),
			inset 0 -1px 0 rgba(0, 0, 0, 0.3),
			inset 0 0 24px rgba(255, 255, 255, 0.015);
	}

	/* Gradient-stroke border via mask-composite — 1px gold→red sweep around the card */
	.smoked-glass--hero::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		padding: 1px;
		background: linear-gradient(
			135deg,
			rgba(212, 175, 55, 0.55) 0%,
			rgba(255, 255, 255, 0.08) 35%,
			rgba(255, 255, 255, 0.02) 65%,
			rgba(200, 16, 46, 0.35) 100%
		);
		-webkit-mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		-webkit-mask-composite: xor;
		mask-composite: exclude;
		pointer-events: none;
	}

	/* Subtle noise grain — inline SVG turbulence, no asset request */
	.smoked-glass--hero::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0   0 0 0 0 0   0 0 0 0 0   0 0 0 0.5 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
		opacity: 0.035;
		mix-blend-mode: overlay;
		pointer-events: none;
	}
</style>
