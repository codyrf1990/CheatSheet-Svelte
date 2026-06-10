<script lang="ts">
	import type { Package } from '$types';
	import { Check } from 'lucide-svelte';
	import { Checkbox } from '$components/ui';
	import { packagesStore } from '$stores/packages.svelte';
	import { panelsStore } from '$stores/panels.svelte';
	import { toastStore } from '$stores/toast.svelte';
	import { copyToClipboard } from '$lib/utils/clipboard';
	import { userPrefsStore } from '$stores/userPrefs.svelte';
	import { tooltip } from '$lib/utils/tooltipAction';
	import { applyOrder } from '$lib/utils/order';
	import { PACKAGE_TOGGLE_BITS, SC_TURN_LOCKED } from '$lib/data/prerequisites';
	import { getDisabledBits } from '$lib/services/buildValidation';
	import MasterBit from './MasterBit.svelte';
	import LooseBit from './LooseBit.svelte';

	// Compute disabled bits map from build validation
	let disabledBits = $derived(getDisabledBits(packagesStore.all, packagesStore.buildMode));

	interface Props {
		pkg: Package;
		index?: number;
	}

	let { pkg, index = 0 }: Props = $props();

	// Identity rail color per package — makes packages scannable at a glance
	const RAIL_COLORS: Record<string, string> = {
		'SC-Mill': '212, 175, 55', // gold — the flagship
		'SC-Turn': '96, 165, 250', // sky
		'SC-Mill-Adv': '192, 132, 252', // violet
		'SC-Mill-3D': '74, 222, 128', // green
		'SC-Mill-5Axis': '248, 113, 113' // rose
	};
	const railRgb = $derived(RAIL_COLORS[pkg.code] ?? '212, 175, 55');

	// Package master toggle state
	let packageToggleDef = $derived(PACKAGE_TOGGLE_BITS[pkg.code]);

	// Package is disabled if any of its group masterIds or loose bits are gated
	let isPackageDisabled = $derived.by(() => {
		if (!packageToggleDef) return false;
		if (packageToggleDef.groups?.some((g) => disabledBits.has(g))) return true;
		if (packageToggleDef.looseBits?.some((b) => disabledBits.has(b))) return true;
		return false;
	});

	let packageDisabledReason = $derived.by(() => {
		if (!packageToggleDef) return '';
		for (const g of packageToggleDef.groups ?? []) {
			if (disabledBits.has(g)) return disabledBits.get(g) ?? '';
		}
		for (const b of packageToggleDef.looseBits ?? []) {
			if (disabledBits.has(b)) return disabledBits.get(b) ?? '';
		}
		return '';
	});

	let packageToggleState = $derived.by(() => {
		if (!packageToggleDef) return { checked: false, indeterminate: false };
		const allBits: string[] = [];
		// Collect group bits
		if (packageToggleDef.groups && pkg.groups) {
			for (const groupId of packageToggleDef.groups) {
				const group = pkg.groups.find((g) => g.masterId === groupId);
				if (group) allBits.push(...group.bits);
			}
		}
		// Collect loose bits
		if (packageToggleDef.looseBits) allBits.push(...packageToggleDef.looseBits);

		const state = packagesStore.getStateReadOnly(pkg.code);
		const selectedCount = allBits.filter((b) => state.selectedBits.includes(b)).length;
		if (selectedCount === 0) return { checked: false, indeterminate: false };
		if (selectedCount === allBits.length) return { checked: true, indeterminate: false };
		return { checked: false, indeterminate: true };
	});

	function handlePackageToggle() {
		if (!packageToggleDef) return;
		if (isPackageDisabled) {
			toastStore.warning(packageDisabledReason);
			return;
		}
		const allBits: string[] = [];
		if (packageToggleDef.groups && pkg.groups) {
			for (const groupId of packageToggleDef.groups) {
				const group = pkg.groups.find((g) => g.masterId === groupId);
				if (group) allBits.push(...group.bits);
			}
		}
		if (packageToggleDef.looseBits) allBits.push(...packageToggleDef.looseBits);

		const state = packagesStore.getStateReadOnly(pkg.code);
		const allSelected = allBits.every((b) => state.selectedBits.includes(b));
		if (allSelected) {
			packagesStore.removeBits(pkg.code, allBits);
		} else {
			packagesStore.selectBits(pkg.code, allBits);
		}
	}

	// SC-Turn: combined display check
	let isSCTurn = $derived(pkg.code === 'SC-Turn');

	let scTurnSelected = $derived.by(() => {
		if (!isSCTurn) return false;
		const state = packagesStore.getStateReadOnly(pkg.code);
		return SC_TURN_LOCKED.every((b) => state.selectedBits.includes(b));
	});

	function handleSCTurnToggle() {
		const disabledBit = SC_TURN_LOCKED.find((b) => disabledBits.has(b));
		if (disabledBit) {
			toastStore.warning(disabledBits.get(disabledBit) ?? '');
			return;
		}
		if (scTurnSelected) {
			packagesStore.removeBits(pkg.code, SC_TURN_LOCKED);
		} else {
			packagesStore.selectBits(pkg.code, SC_TURN_LOCKED);
		}
	}

	// Use global remove mode from store
	let removeMode = $derived(panelsStore.removeMode);

	let hasGroups = $derived(pkg.groups && pkg.groups.length > 0);

	// Merge static loose bits with custom bits and moved bits, then apply stored order (global)
	let allLooseBits = $derived.by(() => {
		const staticBits = pkg.looseBits || [];
		const customBits = userPrefsStore.getCustomPackageBits(pkg.code);
		const membership = packagesStore.getGroupMembership(pkg.code);

		// Include bits that have been moved to 'loose' from groups
		const movedToLoose: string[] = [];
		for (const [bit, group] of Object.entries(membership)) {
			if (group === 'loose' && !staticBits.includes(bit) && !customBits.includes(bit)) {
				movedToLoose.push(bit);
			}
		}

		const allBits = [
			...staticBits,
			...customBits.filter((c) => !staticBits.includes(c)),
			...movedToLoose
		];
		return applyOrder(allBits, packagesStore.getLooseBitsOrder(pkg.code));
	});

	let hasLooseBits = $derived(allLooseBits.length > 0);

	function isCustomBit(bit: string): boolean {
		return userPrefsStore.isCustomPackageBit(pkg.code, bit);
	}

	let codeCopied = $state(false);
	let maintCopied = $state(false);

	async function handleCodeCopy() {
		const ok = await copyToClipboard(pkg.code, false);
		if (ok) {
			codeCopied = true;
			setTimeout(() => (codeCopied = false), 1500);
		}
	}

	async function handleMaintCopy() {
		const ok = await copyToClipboard(pkg.maintenance, false);
		if (ok) {
			maintCopied = true;
			setTimeout(() => (maintCopied = false), 1500);
		}
	}
</script>

<tr
	class="package-row"
	data-package={pkg.code}
	translate="no"
	style="--rail-rgb: {railRgb}; --row-i: {index};"
>
	<td class="pkg-cell">
		<div class="pkg-header">
			{#if packageToggleDef}
				<span class="pkg-toggle">
					<Checkbox
						checked={packageToggleState.checked}
						indeterminate={packageToggleState.indeterminate}
						onchange={handlePackageToggle}
						disabled={isPackageDisabled}
						aria-label="Toggle all {pkg.code} bits"
					/>
				</span>
			{/if}
			<div>
				<button
					type="button"
					class="code-btn package-code"
					onclick={handleCodeCopy}
					use:tooltip={'Click to copy ' + pkg.code}
				>
					{#if codeCopied}<span class="copy-check"><Check size={13} strokeWidth={3} /></span
						>{:else}{pkg.code}{/if}
				</button>
				<span class="package-description">{pkg.description}</span>
			</div>
		</div>
	</td>
	<td class="maint-cell">
		<div class="maint-cell-inner">
			{#if packageToggleDef}
				<span class="pkg-toggle pkg-toggle-narrow">
					<Checkbox
						checked={packageToggleState.checked}
						indeterminate={packageToggleState.indeterminate}
						onchange={handlePackageToggle}
						disabled={isPackageDisabled}
						aria-label="Toggle all {pkg.code} bits"
					/>
				</span>
			{/if}
			<button
				type="button"
				class="code-btn maint-code"
				onclick={handleMaintCopy}
				use:tooltip={'Click to copy ' + pkg.maintenance}
			>
				{#if maintCopied}<span class="copy-check"><Check size={13} strokeWidth={3} /></span
					>{:else}{pkg.maintenance}{/if}
			</button>
		</div>
	</td>
	<td class="bits-cell">
		<div class="bits-container" data-package-bits={pkg.code}>
			{#if isSCTurn}
				<!-- SC-Turn: combined display — both bits toggle as one unit -->
				<div class="loose-bits-section">
					<ul class="loose-bits">
						<li class="loose-bit">
							<div class="bit-label">
								<span class="checkbox-wrapper">
									<Checkbox
										checked={scTurnSelected}
										onchange={handleSCTurnToggle}
										disabled={!!SC_TURN_LOCKED.find((b) => disabledBits.has(b))}
									/>
								</span>
								<button
									type="button"
									class="bit-text"
									onclick={handleCodeCopy}
									data-copyable-bit
									aria-label="Copy Turning + Backspindle">Turning + Backspindle</button
								>
							</div>
						</li>
					</ul>
				</div>
			{:else}
				{#if hasGroups}
					<div class="groups-grid">
						{#each pkg.groups as group (group.masterId)}
							<MasterBit
								{group}
								packageCode={pkg.code}
								disabled={disabledBits.has(group.masterId)}
								disabledReason={disabledBits.get(group.masterId) ?? ''}
							/>
						{/each}
					</div>
				{/if}
				{#if hasLooseBits}
					<div class="loose-bits-section" class:has-groups={hasGroups}>
						<ul class="loose-bits">
							{#each allLooseBits as bit (bit)}
								<LooseBit
									{bit}
									packageCode={pkg.code}
									{removeMode}
									isCustom={isCustomBit(bit)}
									disabled={disabledBits.has(bit)}
									disabledReason={disabledBits.get(bit) ?? ''}
								/>
							{/each}
						</ul>
					</div>
				{/if}
			{/if}
		</div>
	</td>
</tr>

<style>
	.package-row {
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
		/* Identity rail — each package wears its color down the left edge */
		box-shadow: inset 3px 0 0 rgba(var(--rail-rgb), 0.45);
		transition:
			background 180ms var(--ease-out-quart),
			box-shadow 180ms var(--ease-out-quart);
		/* Staggered entrance */
		animation: rowEnter 360ms var(--ease-out-expo) both;
		animation-delay: calc(var(--row-i, 0) * 55ms);
	}

	@keyframes rowEnter {
		from {
			opacity: 0;
			transform: translateY(7px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.package-row:hover {
		background: linear-gradient(90deg, rgba(var(--rail-rgb), 0.07), rgba(255, 255, 255, 0.03) 40%);
		box-shadow: inset 3px 0 0 rgba(var(--rail-rgb), 0.95);
	}

	.pkg-cell {
		padding: 0.3rem 0.4rem;
		vertical-align: top;
		overflow: hidden;
	}

	.pkg-header {
		display: flex;
		align-items: flex-start;
		gap: var(--space-0-5);
	}

	.pkg-toggle {
		display: flex;
		align-items: center;
		padding-top: 1px;
		flex-shrink: 0;
	}

	.checkbox-wrapper {
		display: flex;
		align-items: center;
	}

	.bit-label {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		flex: 1;
		cursor: pointer;
	}

	.bit-text {
		font-size: var(--text-xs);
		color: var(--chip-text-color);
		line-height: 1.2;
		cursor: pointer;
		transition: color 150ms var(--ease-out-quart);
		/* button reset */
		background: none;
		border: none;
		padding: 0;
		margin: 0;
		font-family: inherit;
		text-align: left;
	}

	.bit-text:hover,
	.bit-text:focus-visible {
		color: var(--chip-text-hover);
		text-decoration: underline;
		text-decoration-color: var(--gold-a45);
		text-underline-offset: 2px;
	}

	/* Copy feedback — gold flash on click */
	.bit-text:active,
	.maint-code:active,
	.package-code:active {
		text-shadow: 0 0 12px rgba(212, 175, 55, 0.7);
		color: var(--color-solidcam-gold);
	}

	.code-btn {
		display: block;
		padding: 0;
		background: transparent;
		border: none;
		text-align: left;
		cursor: pointer;
	}

	.package-code {
		font-family: 'JetBrains Mono', monospace;
		font-size: var(--text-base);
		font-weight: 600;
		color: var(--color-solidcam-gold, #d4af37);
		letter-spacing: 0.02em;
		line-height: 1.2;
		transition: color 150ms var(--ease-out-quart);
	}

	.package-code:hover,
	.code-btn:focus-visible .package-code {
		color: #e5c55a;
		text-decoration: underline;
		text-decoration-color: var(--gold-a45);
		text-underline-offset: 2px;
	}

	.copy-check {
		display: inline-flex;
		align-items: center;
		color: var(--color-success, #22c55e);
		filter: drop-shadow(0 0 4px rgba(34, 197, 94, 0.4));
	}

	.package-description {
		display: block;
		font-size: var(--text-xs);
		color: var(--chip-text-muted);
		margin-top: 0.15rem;
		line-height: 1.3;
	}

	.maint-cell {
		padding: 0.3rem 0.4rem;
		vertical-align: top;
		overflow: hidden;
	}

	.maint-cell-inner {
		display: flex;
		align-items: center;
		gap: var(--space-0-5);
	}

	/* Narrow-viewport checkbox: hidden until pkg column disappears */
	.pkg-toggle-narrow {
		display: none;
	}

	.maint-code {
		font-family: 'JetBrains Mono', monospace;
		font-size: var(--text-sm);
		color: var(--chip-text-muted);
		line-height: 1.2;
		cursor: pointer;
		transition: color 150ms var(--ease-out-quart);
	}

	.maint-code:hover {
		color: var(--chip-text-hover);
		text-decoration: underline;
		text-decoration-color: var(--gold-a45);
		text-underline-offset: 2px;
	}

	.bits-cell {
		padding: 0.3rem 0.4rem;
		vertical-align: top;
		width: 100%;
	}

	/* Main bits container - stacks groups grid above loose bits */
	.bits-container {
		display: flex;
		flex-direction: column;
		gap: calc(var(--space-1) + var(--space-0));
		width: 100%;
	}

	/* Flex layout for groups - fills available width */
	.groups-grid {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
		width: 100%;
	}

	.groups-grid > :global(.master-bit) {
		flex: 1 1 200px;
		min-width: 150px;
	}

	/* Loose bits section below groups */
	.loose-bits-section {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		min-height: 24px;
	}

	.loose-bits-section.has-groups {
		padding-top: var(--space-1);
		border-top: 1px solid var(--chip-border-color);
	}

	.loose-bits {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
	}

	/* Narrow viewport compaction */
	@media (max-width: 768px) {
		.pkg-cell {
			display: none;
		}

		/* Checkbox migrates to maint column when pkg column hides */
		.pkg-toggle-narrow {
			display: flex;
			align-items: center;
			flex-shrink: 0;
		}

		.maint-cell {
			padding: 0.25rem 0.2rem;
		}

		.maint-code {
			font-size: var(--text-xs);
		}

		.bits-cell {
			padding: 0.25rem 0.3rem;
		}

		.bits-container {
			gap: var(--space-1);
		}

		.groups-grid {
			gap: var(--space-0-5);
		}
	}

	/* Ultra-compact for split-screen */
	@media (max-width: 680px) {
		.maint-cell {
			padding: 0.2rem 0.15rem;
		}

		.maint-code {
			font-size: var(--text-xs);
		}

		.bits-cell {
			padding: 0.2rem 0.2rem;
		}

		.bits-container {
			gap: var(--space-0-5);
		}

		.groups-grid {
			gap: var(--space-0-5);
		}
	}

	/* Narrow viewport - keep 2-column layout, readable text */
	@media (max-width: 640px) {
		.maint-cell {
			padding: 0.15rem 0.1rem;
		}

		.maint-code {
			font-size: var(--text-xs);
		}

		.bits-cell {
			padding: 0.15rem 0.125rem;
		}

		.bits-container {
			gap: var(--space-0);
		}

		.groups-grid {
			gap: var(--space-0);
		}

		.groups-grid > :global(.master-bit) {
			flex: 1 1 120px;
			min-width: 100px;
		}

		.loose-bits {
			gap: var(--space-0);
		}
	}
</style>
