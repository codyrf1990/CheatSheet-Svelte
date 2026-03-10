<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		onclose: () => void;
		position: { top: number; left?: number; right?: number };
		label: string;
		role?: 'menu' | 'listbox';
		children: Snippet;
	}

	let { open, onclose, position, label, role = 'menu', children }: Props = $props();

	let menuRef: HTMLDivElement | null = $state(null);

	// Arrow key navigation + Escape dismiss
	$effect(() => {
		if (!open || !menuRef) return;

		// Focus first item after render
		requestAnimationFrame(() => {
			const items = menuRef?.querySelectorAll<HTMLElement>('[role="menuitem"], [role="option"]');
			items?.[0]?.focus();
		});

		function handleKeydown(e: KeyboardEvent) {
			if (!menuRef) return;
			const selector = '[role="menuitem"], [role="option"]';
			const items = Array.from(menuRef.querySelectorAll<HTMLElement>(selector));
			if (items.length === 0) return;

			const current = items.indexOf(document.activeElement as HTMLElement);

			if (e.key === 'ArrowDown') {
				e.preventDefault();
				items[(current + 1) % items.length]?.focus();
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				items[(current - 1 + items.length) % items.length]?.focus();
			} else if (e.key === 'Home') {
				e.preventDefault();
				items[0]?.focus();
			} else if (e.key === 'End') {
				e.preventDefault();
				items[items.length - 1]?.focus();
			} else if (e.key === 'Escape') {
				e.preventDefault();
				onclose();
			}
		}

		function handleClickOutside(e: MouseEvent) {
			if (menuRef && !menuRef.contains(e.target as Node)) {
				onclose();
			}
		}

		document.addEventListener('keydown', handleKeydown);
		document.addEventListener('pointerdown', handleClickOutside);
		return () => {
			document.removeEventListener('keydown', handleKeydown);
			document.removeEventListener('pointerdown', handleClickOutside);
		};
	});

	// Viewport clamping
	function clampToViewport() {
		if (!menuRef) return;
		const rect = menuRef.getBoundingClientRect();
		if (rect.bottom > window.innerHeight) {
			menuRef.style.top = `${window.innerHeight - rect.height - 8}px`;
		}
		if (rect.right > window.innerWidth) {
			menuRef.style.left = `${window.innerWidth - rect.width - 8}px`;
		}
	}

	$effect(() => {
		if (!open || !menuRef) return;
		requestAnimationFrame(clampToViewport);

		// Re-clamp on resize/scroll, dismiss on orientation change
		const onResize = () => clampToViewport();
		const onScroll = () => clampToViewport();
		const onOrientationChange = () => onclose();

		window.addEventListener('resize', onResize);
		window.addEventListener('scroll', onScroll, true);
		window.addEventListener('orientationchange', onOrientationChange);
		return () => {
			window.removeEventListener('resize', onResize);
			window.removeEventListener('scroll', onScroll, true);
			window.removeEventListener('orientationchange', onOrientationChange);
		};
	});

	let positionStyle = $derived.by(() => {
		const parts: string[] = [`top: ${position.top}px`];
		if (position.left !== undefined) parts.push(`left: ${position.left}px`);
		if (position.right !== undefined) parts.push(`right: ${position.right}px`);
		return parts.join('; ');
	});
</script>

{#if open}
	<div bind:this={menuRef} class="menu-primitive" {role} aria-label={label} style={positionStyle}>
		{@render children()}
	</div>
{/if}

<style>
	.menu-primitive {
		position: fixed;
		z-index: 9000;
		min-width: 140px;
		padding: 0.375rem;
		background: linear-gradient(145deg, rgba(32, 32, 38, 0.98), rgba(24, 24, 30, 0.98));
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 10px;
		box-shadow:
			0 8px 24px rgba(0, 0, 0, 0.35),
			0 2px 8px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.04);
		backdrop-filter: blur(16px);
		animation: menuFadeIn 150ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	@keyframes menuFadeIn {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

</style>
