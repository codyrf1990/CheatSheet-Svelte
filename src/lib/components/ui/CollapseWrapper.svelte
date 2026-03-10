<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		duration?: number;
		children: Snippet;
	}

	let { open, duration = 200, children }: Props = $props();
</script>

<div
	class="collapse-wrapper"
	style="--collapse-duration: {duration}ms"
	class:open
	aria-hidden={!open}
>
	<div class="collapse-inner">
		{@render children()}
	</div>
</div>

<style>
	.collapse-wrapper {
		display: grid;
		grid-template-rows: 0fr;
		transition: grid-template-rows var(--collapse-duration) cubic-bezier(0.4, 0, 0.2, 1);
		overflow: hidden;
	}

	.collapse-wrapper.open {
		grid-template-rows: 1fr;
	}

	.collapse-inner {
		min-height: 0;
	}
</style>
