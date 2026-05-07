<script lang="ts">
	import type { PackageGroup } from '$types';
	import { Checkbox, CollapseWrapper, Tooltip } from '$components/ui';
	import { packagesStore } from '$stores/packages.svelte';
	import { userPrefsStore } from '$stores/userPrefs.svelte';
	import { toastStore } from '$stores/toast.svelte';
	import { copyToClipboard } from '$lib/utils/clipboard';
	import { applyOrder } from '$lib/utils/order';
	import { tooltip } from '$lib/utils/tooltipAction';
	import SubBit from './SubBit.svelte';

	interface Props {
		group: PackageGroup;
		packageCode: string;
		disabled?: boolean;
		disabledReason?: string;
	}

	let {
		group,
		packageCode,
		disabled = false,
		disabledReason = ''
	}: Props = $props();

	// Local state for expand/collapse
	let expanded = $state(true);

	// Compute effective bits considering groupMembership overrides (global)
	let effectiveBits = $derived.by(() => {
		const membership = packagesStore.getGroupMembership(packageCode);

		// Start with static bits that haven't been moved elsewhere
		const bits = group.bits.filter((bit) => {
			const assignedGroup = membership[bit];
			return !assignedGroup || assignedGroup === group.masterId;
		});

		// Add bits that have been moved to this group from elsewhere
		for (const [bit, assignedGroup] of Object.entries(membership)) {
			if (assignedGroup === group.masterId && !group.bits.includes(bit)) {
				bits.push(bit);
			}
		}

		return bits;
	});

	// Apply stored order to effective bits (global order)
	let orderedBits = $derived.by(() => {
		const storedOrder = packagesStore.getOrder(packageCode);
		return applyOrder(effectiveBits, storedOrder);
	});

	// Custom bits for this package
	let customBits = $derived(userPrefsStore.getCustomPackageBits(packageCode));

	// Derived state from store - use effective bits for checkbox state
	let masterState = $derived(packagesStore.getMasterBitState(packageCode, effectiveBits));

	function handleMasterToggle() {
		if (disabled) {
			toastStore.warning(disabledReason);
			return;
		}
		packagesStore.toggleMasterBit(packageCode, group.masterId, effectiveBits);
	}

	function handleExpandToggle() {
		expanded = !expanded;
	}

	async function handleLabelCopy() {
		await copyToClipboard(group.label);
	}

</script>

<div
	class="master-bit"
	class:disabled-bit={disabled}
	data-master={group.masterId}
	data-master-label={group.label}
>
	{#if disabled && disabledReason}
		<Tooltip text={disabledReason}>
			<div class="master-header">
				<Checkbox
					checked={masterState.checked}
					indeterminate={masterState.indeterminate}
					onchange={handleMasterToggle}
					{disabled}
				/>
				<button
					type="button"
					class="master-label"
					onclick={handleLabelCopy}
					data-copyable-bit
					aria-label="Copy {group.label}"
				>
					{group.label}
				</button>
				<button
					type="button"
					class="expand-toggle"
					onclick={handleExpandToggle}
					aria-expanded={expanded}
					aria-controls="subbits-{group.masterId}"
					aria-label="{expanded ? 'Collapse' : 'Expand'} {group.label}"
				>
					<svg
						class="expand-icon"
						class:rotated={!expanded}
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						aria-hidden="true"
					>
						<path d="M19 9l-7 7-7-7" />
					</svg>
				</button>
			</div>
		</Tooltip>
	{:else}
		<div class="master-header">
			<Checkbox
				checked={masterState.checked}
				indeterminate={masterState.indeterminate}
				onchange={handleMasterToggle}
				{disabled}
			/>
			<button
				type="button"
				class="master-label"
				onclick={handleLabelCopy}
				data-copyable-bit
				use:tooltip={group.label}
				aria-label="Copy {group.label}"
			>
				{group.label}
			</button>
			<button
				type="button"
				class="expand-toggle"
				onclick={handleExpandToggle}
				aria-expanded={expanded}
				aria-controls="subbits-{group.masterId}"
				aria-label="{expanded ? 'Collapse' : 'Expand'} {group.label}"
				use:tooltip={expanded ? 'Collapse' : 'Expand'}
			>
				<svg
					class="expand-icon"
					class:rotated={!expanded}
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					aria-hidden="true"
				>
					<path d="M19 9l-7 7-7-7" />
				</svg>
			</button>
		</div>
	{/if}
	<CollapseWrapper open={expanded}>
		<ul
			id="subbits-{group.masterId}"
			class="sub-bits"
			role="group"
			aria-label="{group.label} options"
		>
			{#each orderedBits as bit (bit)}
				<SubBit
					{bit}
					{packageCode}
					masterId={group.masterId}
					isCustom={customBits.includes(bit)}
					{disabled}
					{disabledReason}
				/>
			{/each}
		</ul>
	</CollapseWrapper>
</div>

<style>
	.master-bit {
		border: 1px solid var(--chip-border-color-strong);
		border-radius: var(--radius-xs);
		background: var(--chip-bg-strong);
		box-shadow: var(--chip-shadow);
		overflow: hidden;
		width: 100%;
		min-width: 0;
	}

	.master-bit.disabled-bit {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.master-header {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-1) calc(var(--space-1) + var(--space-0));
		background: var(--chip-bg);
		border-bottom: 1px solid var(--chip-border-color);
	}

	.master-label {
		flex: 1;
		font-size: var(--text-xs);
		font-weight: 600;
		color: var(--color-solidcam-gold, #d4af37);
		letter-spacing: 0.04em;
		line-height: 1.2;
		cursor: pointer;
		transition: color 150ms ease;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		/* button reset */
		background: none;
		border: none;
		padding: 0;
		margin: 0;
		font-family: inherit;
		text-align: left;
	}

	.master-label:hover {
		color: #e5c55a;
	}

	.expand-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		padding: 0;
		background: transparent;
		border: none;
		border-radius: var(--radius-2xs);
		color: rgba(255, 255, 255, 0.5);
		cursor: pointer;
		transition: all 150ms ease;
		flex-shrink: 0;
	}

	.expand-toggle:hover {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.8);
	}

	.expand-icon {
		width: 12px;
		height: 12px;
		transition: transform 200ms ease;
	}

	.expand-icon.rotated {
		transform: rotate(-90deg);
	}

	/* 2-column grid for sub-bits - balanced readability */
	.sub-bits {
		list-style: none;
		margin: 0;
		padding: var(--space-0-5);
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-0-5);
		min-height: 24px;
	}

/* Narrow viewport compaction */
	@media (max-width: 768px) {
		.master-header {
			padding: var(--space-0-5) var(--space-1);
			gap: var(--space-0-5);
		}

		.master-label {
			font-size: var(--text-xs);
		}

		.expand-toggle {
			width: 12px;
			height: 12px;
		}

		.expand-icon {
			width: 9px;
			height: 9px;
		}

		.sub-bits {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			column-gap: 6px;
			row-gap: 0;
			padding: var(--space-px);
		}
	}

	@media (max-width: 640px) {
		.master-header {
			padding: var(--space-0) var(--space-0-5);
			gap: var(--space-0);
		}

		.master-label {
			font-size: var(--text-xs);
		}

		.expand-toggle {
			width: 10px;
			height: 10px;
		}

		.expand-icon {
			width: 7px;
			height: 7px;
		}

		/* Single column at the narrow viewport so each sub-bit gets the
		   full master-card width — multi-word bits like "Profile/Pocket
		   2.5D Rest Material" wrap once or not at all instead of three
		   times in a 50px-wide cell. */
		.sub-bits {
			grid-template-columns: 1fr;
			column-gap: 0;
			row-gap: 0;
			padding: var(--space-px);
		}
	}
</style>
