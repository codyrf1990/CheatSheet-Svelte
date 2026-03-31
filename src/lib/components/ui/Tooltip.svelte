<script lang="ts">
	import type { Snippet } from 'svelte';
	import { showTooltip, hideTooltip } from '$lib/utils/tooltipEngine';

	interface Props {
		text: string;
		position?: 'top' | 'bottom';
		children: Snippet;
	}

	let { text, position = 'top', children }: Props = $props();
	let triggerEl: HTMLSpanElement | undefined = $state();

	function show() {
		if (triggerEl) showTooltip(triggerEl, text, position);
	}

	function hide() {
		hideTooltip();
	}

	// Clean up on component destroy
	$effect(() => {
		return () => hideTooltip();
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<span
	class="tooltip-trigger"
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
