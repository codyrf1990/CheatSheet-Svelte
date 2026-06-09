<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		variant?: 'primary' | 'gold' | 'orange' | 'ghost' | 'danger';
		size?: 'sm' | 'md' | 'lg';
		children: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		class: className = '',
		children,
		...rest
	}: Props = $props();

	const variants = {
		primary: 'btn-primary',
		gold: 'btn-gold',
		orange: 'btn-orange',
		ghost: 'btn-ghost',
		danger: 'btn-danger'
	};

	const sizes = {
		sm: 'btn-sm',
		md: 'btn-md',
		lg: 'btn-lg'
	};
</script>

<button class="btn {variants[variant]} {sizes[size]} {className}" {...rest}>
	{@render children()}
</button>

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-weight: 500;
		border-radius: 9999px;
		cursor: pointer;
		transition:
			background 150ms var(--ease-out-quart),
			border-color 150ms var(--ease-out-quart),
			box-shadow 250ms var(--ease-out-expo),
			transform 150ms var(--ease-out-quart),
			filter 150ms var(--ease-out-quart);
		border: none;
	}

	.btn:focus-visible {
		outline: 2px solid var(--color-solidcam-gold, #d4af37);
		outline-offset: 2px;
		box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.2);
	}

	.btn-sm {
		padding: calc(var(--space-1) + var(--space-0)) var(--space-3);
		font-size: var(--text-sm);
	}

	.btn-md {
		padding: var(--space-2) var(--space-4);
		font-size: var(--text-base);
	}

	.btn-lg {
		padding: var(--space-3) calc(var(--space-4) + var(--space-2));
		font-size: var(--text-lg);
	}

	.btn:hover {
		transform: translateY(-2px);
		filter: brightness(1.05);
	}

	.btn:active {
		transform: translateY(0);
		filter: brightness(0.98);
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
		filter: none;
	}

	/* Primary - SolidCAM Red */
	.btn-primary {
		background: var(--gradient-red);
		color: white;
		box-shadow:
			0 8px 20px rgba(200, 16, 46, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.2);
	}

	.btn-primary:hover {
		box-shadow:
			0 12px 28px rgba(200, 16, 46, 0.4),
			0 0 20px rgba(200, 16, 46, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.25);
	}

	/* Gold - Premium accent */
	.btn-gold {
		background: var(--gradient-gold);
		color: var(--color-on-gold);
		box-shadow:
			0 8px 20px rgba(212, 175, 55, 0.25),
			inset 0 1px 0 rgba(255, 255, 255, 0.28);
	}

	.btn-gold:hover {
		box-shadow:
			0 12px 28px rgba(212, 175, 55, 0.35),
			0 0 25px rgba(212, 175, 55, 0.25),
			inset 0 1px 0 rgba(255, 255, 255, 0.32);
	}

	/* Orange - Warning/attention */
	.btn-orange {
		background: var(--gradient-orange);
		color: white;
		box-shadow:
			0 8px 20px rgba(249, 115, 22, 0.25),
			inset 0 1px 0 rgba(255, 255, 255, 0.22);
	}

	.btn-orange:hover {
		box-shadow:
			0 12px 28px rgba(249, 115, 22, 0.35),
			0 0 20px rgba(249, 115, 22, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.26);
	}

	/* Ghost - Subtle, transparent */
	.btn-ghost {
		background: transparent;
		border: 1px solid var(--border-strong);
		color: rgba(255, 255, 255, 0.85);
	}

	.btn-ghost:hover {
		background: var(--glass-t2);
		border-color: rgba(255, 255, 255, 0.2);
		box-shadow: 0 0 15px rgba(255, 255, 255, 0.05);
	}

	/* Danger - Destructive actions */
	.btn-danger {
		background: var(--gradient-danger);
		color: white;
		box-shadow:
			0 8px 20px rgba(239, 68, 68, 0.25),
			inset 0 1px 0 rgba(255, 255, 255, 0.22);
	}

	.btn-danger:hover {
		box-shadow:
			0 12px 28px rgba(239, 68, 68, 0.35),
			0 0 20px rgba(239, 68, 68, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.26);
	}
</style>
