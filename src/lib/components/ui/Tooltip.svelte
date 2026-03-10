<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		text: string;
		children: Snippet;
	}

	let { text, children }: Props = $props();

	let tooltipId = crypto.randomUUID();
</script>

<span class="tooltip-trigger" aria-describedby={tooltipId}>
	{@render children()}
	<span id={tooltipId} class="tooltip" role="tooltip">{text}</span>
</span>

<style>
	.tooltip-trigger {
		position: relative;
		display: inline-flex;
	}

	.tooltip {
		position: absolute;
		bottom: calc(100% + 6px);
		left: 50%;
		transform: translateX(-50%);
		padding: 4px 10px;
		font-size: 0.75rem;
		line-height: 1.4;
		white-space: nowrap;
		color: #f5f5f5;
		background: #2a2a2a;
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 6px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
		pointer-events: none;
		opacity: 0;
		transition: opacity 150ms ease;
		z-index: 9999;
	}

	/* Show on hover or focus-within */
	.tooltip-trigger:hover .tooltip,
	.tooltip-trigger:focus-within .tooltip {
		opacity: 1;
	}

</style>
