<script lang="ts">
	interface Props {
		variant?: 'text' | 'circular' | 'rectangular';
		width?: string;
		height?: string;
		class?: string;
	}

	let { variant = 'text', width, height, class: className = '' }: Props = $props();

	// Default dimensions based on variant
	let defaultWidth = $derived(variant === 'circular' ? '40px' : '100%');
	let defaultHeight = $derived(
		variant === 'text' ? '1rem' : variant === 'circular' ? '40px' : '100px'
	);
</script>

<div
	class="skeleton {variant} {className}"
	style:width={width ?? defaultWidth}
	style:height={height ?? defaultHeight}
	aria-hidden="true"
></div>

<style>
	.skeleton {
		background: linear-gradient(
			90deg,
			rgba(255, 255, 255, 0.04) 0%,
			rgba(255, 255, 255, 0.08) 50%,
			rgba(255, 255, 255, 0.04) 100%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s ease-in-out infinite;
	}

	.text {
		border-radius: 4px;
	}

	.circular {
		border-radius: 50%;
	}

	.rectangular {
		border-radius: 8px;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.skeleton {
			animation: none;
			background: rgba(255, 255, 255, 0.06);
		}
	}
</style>
