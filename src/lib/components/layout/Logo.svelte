<script lang="ts">
	interface Props {
		href?: string;
		external?: boolean;
	}

	let { href = 'https://solidcam.com/en-us/', external = true }: Props = $props();
</script>

<a
	{href}
	target={external ? '_blank' : undefined}
	rel={external ? 'noopener noreferrer' : undefined}
	class="logo-container"
>
	<img src="/images/solidcam-logo.png" alt="SolidCAM" class="logo" />
</a>

<style>
	.logo-container {
		width: clamp(150px, 18vw, 240px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: clamp(0.3rem, 0.8vw, 0.5rem);
		border-radius: 14px;
		position: relative;
	}

	/* Breathing red glow cloud under tagline */
	.logo-container::after {
		content: '';
		position: absolute;
		bottom: 5%;
		left: 0%;
		right: -20%;
		height: 35%;
		background: radial-gradient(
			ellipse 60% 80% at 50% 100%,
			rgba(200, 16, 46, 0.8) 0%,
			rgba(200, 16, 46, 0.4) 40%,
			transparent 70%
		);
		filter: blur(12px);
		animation: glow-breathe 3s ease-in-out infinite;
		pointer-events: none;
	}

	@keyframes glow-breathe {
		0%,
		100% {
			opacity: 0.7;
			transform: scaleY(0.95);
		}
		50% {
			opacity: 1;
			transform: scaleY(1.05);
		}
	}

	.logo {
		width: 100%;
		height: auto;
		filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.5)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
		transition: transform 200ms ease;
		mix-blend-mode: lighten;
	}

	.logo-container:hover .logo {
		transform: scale(1.02);
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.logo-container::after {
			animation: none;
		}
	}
</style>
