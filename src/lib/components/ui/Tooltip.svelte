<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		text: string;
		position?: 'top' | 'bottom';
		children: Snippet;
	}

	let { text, position = 'top', children }: Props = $props();

	let tooltipId = `tip-${crypto.randomUUID()}`;
	let triggerEl: HTMLSpanElement | undefined = $state();
	let tipEl: HTMLDivElement | null = null;

	function show() {
		if (!triggerEl) return;
		const rect = triggerEl.getBoundingClientRect();
		const x = rect.left + rect.width / 2;

		if (!tipEl) {
			tipEl = document.createElement('div');
			tipEl.id = tooltipId;
			tipEl.role = 'tooltip';
			tipEl.className = 'app-tooltip';
			document.body.appendChild(tipEl);
		}

		tipEl.textContent = text;

		if (position === 'bottom') {
			tipEl.style.cssText = `left:${x}px;top:${rect.bottom + 6}px;transform:translateX(-50%)`;
		} else {
			tipEl.style.cssText = `left:${x}px;top:${rect.top - 6}px;transform:translateX(-50%) translateY(-100%)`;
		}

		tipEl.classList.add('visible');
	}

	function hide() {
		tipEl?.classList.remove('visible');
	}

	$effect(() => {
		return () => {
			tipEl?.remove();
			tipEl = null;
		};
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<span
	class="tooltip-trigger"
	aria-describedby={tooltipId}
	bind:this={triggerEl}
	onmouseenter={show}
	onmouseleave={hide}
	onfocusin={show}
	onfocusout={hide}
>
	{@render children()}
</span>

<style>
	.tooltip-trigger {
		position: relative;
		display: inline-flex;
	}
</style>
