<script lang="ts">
	// Pure decoration. No props. No events. Renders ambient glows + layered particles
	// behind the login card. Owns its own keyframes (ambientFloat, particleRise).

	// 18 particles total, distributed across 3 depth layers (back / mid / front).
	// Roughly 1 in 6 particles is a red "spark" that ties back to the SolidCAM red.
	// Below 480px viewport CSS hides the back/mid layers down to 9 visible.
	const particles = Array.from({ length: 18 }, (_, i) => ({
		i,
		layer: i % 3,
		accent: (i + 1) % 6 === 0,
		x: 4 + ((i * 5.5) % 92),
		delay: (i * 0.4) % 7,
		duration: 8 + (i % 5) * 2,
		drift: (i % 2 === 0 ? 1 : -1) * (10 + (i % 3) * 12)
	}));
</script>

<!-- Ambient glow blobs -->
<div class="ambient-glow ambient-1" aria-hidden="true"></div>
<div class="ambient-glow ambient-2" aria-hidden="true"></div>
<div class="ambient-glow ambient-3" aria-hidden="true"></div>

<!-- Particle field, layered for depth -->
<div class="particles" aria-hidden="true">
	{#each particles as p (p.i)}
		<div
			class="particle particle--l{p.layer}"
			class:particle--accent={p.accent}
			style="--x: {p.x}%; --delay: {p.delay}s; --duration: {p.duration}s; --drift: {p.drift}px;"
		></div>
	{/each}
</div>

<style>
	/* ======== Ambient glows ======== */
	.ambient-glow {
		position: absolute;
		border-radius: 50%;
		filter: blur(80px);
		opacity: 0.4;
		pointer-events: none;
		will-change: transform;
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

	/* ======== Particles ======== */
	.particles {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		will-change: transform, opacity;
	}

	.particle {
		position: absolute;
		left: var(--x);
		bottom: -10px;
		border-radius: 50%;
		animation: particleRise var(--duration) ease-out infinite;
		animation-delay: var(--delay);
	}

	/* Back layer — small, dim, slowest */
	.particle--l0 {
		width: 2px;
		height: 2px;
		background: rgba(212, 175, 55, 0.3);
		animation-duration: calc(var(--duration) * 1.4);
	}

	/* Mid layer — baseline */
	.particle--l1 {
		width: 3px;
		height: 3px;
		background: rgba(212, 175, 55, 0.5);
		box-shadow: 0 0 4px rgba(212, 175, 55, 0.3);
	}

	/* Front layer — large, bright, fastest, with warm tone variation */
	.particle--l2 {
		width: 5px;
		height: 5px;
		background: rgba(220, 160, 70, 0.7);
		box-shadow: 0 0 8px rgba(212, 175, 55, 0.5);
		animation-duration: calc(var(--duration) * 0.8);
	}

	/* Red spark — SolidCAM red accent, sprinkled across all layers (~1 in 6 particles) */
	.particle--accent {
		background: rgba(220, 60, 70, 0.65);
		box-shadow: 0 0 8px rgba(200, 16, 46, 0.55);
	}

	.particle--accent.particle--l0 {
		background: rgba(200, 50, 60, 0.32);
		box-shadow: none;
	}

	@keyframes particleRise {
		0% {
			transform: translateY(0) translateX(0) scale(0);
			opacity: 0;
		}
		10% {
			opacity: 1;
			transform: translateY(-10vh) translateX(0) scale(1);
		}
		50% {
			transform: translateY(-50vh) translateX(var(--drift)) scale(0.9);
			opacity: 0.6;
		}
		90% {
			opacity: 0.2;
		}
		100% {
			transform: translateY(-100vh) translateX(calc(var(--drift) * -0.5)) scale(0.3);
			opacity: 0;
		}
	}

	/* Narrow viewports — hide back + mid layers; keep ~6 front particles for atmosphere */
	@media (max-width: 480px) {
		.particle--l0,
		.particle--l1 {
			display: none;
		}
	}
</style>
