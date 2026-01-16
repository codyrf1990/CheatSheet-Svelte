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
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-4 py-2 text-base',
		lg: 'px-6 py-3 text-lg'
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
		transition: all 150ms ease;
		border: none;
		outline: none;
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
		background: linear-gradient(135deg, #c8102e 0%, #8b0000 100%);
		color: white;
		box-shadow:
			0 8px 20px rgba(200, 16, 46, 0.3),
			0 0 0 0 rgba(200, 16, 46, 0);
	}

	.btn-primary:hover {
		box-shadow:
			0 12px 28px rgba(200, 16, 46, 0.4),
			0 0 20px rgba(200, 16, 46, 0.2);
	}

	/* Gold - Premium accent */
	.btn-gold {
		background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%);
		color: #1a1a1a;
		box-shadow:
			0 8px 20px rgba(212, 175, 55, 0.25),
			0 0 0 0 rgba(212, 175, 55, 0);
	}

	.btn-gold:hover {
		box-shadow:
			0 12px 28px rgba(212, 175, 55, 0.35),
			0 0 25px rgba(212, 175, 55, 0.25);
	}

	/* Orange - Warning/attention */
	.btn-orange {
		background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
		color: white;
		box-shadow:
			0 8px 20px rgba(249, 115, 22, 0.25),
			0 0 0 0 rgba(249, 115, 22, 0);
	}

	.btn-orange:hover {
		box-shadow:
			0 12px 28px rgba(249, 115, 22, 0.35),
			0 0 20px rgba(249, 115, 22, 0.2);
	}

	/* Ghost - Subtle, transparent */
	.btn-ghost {
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.12);
		color: rgba(255, 255, 255, 0.7);
	}

	.btn-ghost:hover {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.2);
		box-shadow: 0 0 15px rgba(255, 255, 255, 0.05);
	}

	/* Danger - Destructive actions */
	.btn-danger {
		background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
		color: white;
		box-shadow:
			0 8px 20px rgba(239, 68, 68, 0.25),
			0 0 0 0 rgba(239, 68, 68, 0);
	}

	.btn-danger:hover {
		box-shadow:
			0 12px 28px rgba(239, 68, 68, 0.35),
			0 0 20px rgba(239, 68, 68, 0.2);
	}

	/* Focus state for accessibility */
	.btn:focus-visible {
		outline: 2px solid rgba(212, 175, 55, 0.8);
		outline-offset: 2px;
	}
</style>
