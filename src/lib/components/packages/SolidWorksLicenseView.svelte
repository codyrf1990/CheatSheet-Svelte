<script lang="ts">
	import { AlertTriangle, KeyRound, Trash2 } from 'lucide-svelte';
	import type { SolidWorksLicenseInfo } from '$types';
	import { companiesStore } from '$stores/companies.svelte';
	import { toastStore } from '$stores/toast.svelte';
	import { Button, Modal, Tooltip } from '$components/ui';
	import { copyToClipboard } from '$lib/utils/clipboard';
	import { solidworksMaintSku } from '$lib/services/licenseImport';

	// Delete-confirmation modal state
	let deleteSerial = $state<string | null>(null);
	let deleteLicense = $derived.by(() =>
		deleteSerial ? (licenses.find((l) => l.serialNumber === deleteSerial) ?? null) : null
	);

	interface Props {
		companyId: string;
		licenses: SolidWorksLicenseInfo[];
	}

	let { companyId, licenses }: Props = $props();

	function productClass(product: SolidWorksLicenseInfo['product']): string {
		switch (product) {
			case 'Pro':
				return 'badge-pro';
			case 'Standard':
				return 'badge-std';
			case 'Parts & Assemblies':
				return 'badge-pa';
			case 'Parts':
				return 'badge-p';
			default:
				return 'badge-other';
		}
	}

	function expirationStatus(end: string): { label: string; tone: 'expired' | 'soon' | 'ok' } | null {
		if (!end) return null;
		const parsed = new Date(end);
		if (Number.isNaN(parsed.getTime())) return null;
		const now = Date.now();
		const diff = parsed.getTime() - now;
		const day = 86_400_000;
		if (diff < 0) return { label: 'Expired', tone: 'expired' };
		if (diff < 90 * day) return { label: 'Expiring soon', tone: 'soon' };
		return { label: 'Active', tone: 'ok' };
	}

	function fmtImported(ts: number): string {
		try {
			return new Date(ts).toLocaleString();
		} catch {
			return '';
		}
	}

	async function handleCopySerial(serial: string) {
		await copyToClipboard(serial, 'Serial copied');
	}

	function requestRemove(serial: string) {
		deleteSerial = serial;
	}

	function cancelRemove() {
		deleteSerial = null;
	}

	function confirmRemove() {
		if (!deleteSerial) return;
		const serial = deleteSerial;
		const removed = companiesStore.removeSolidWorksLicense(companyId, serial);
		if (removed) {
			toastStore.success('SolidWorks license removed');
		} else {
			toastStore.error('Could not remove license');
		}
		deleteSerial = null;
	}
</script>

<div class="sw-view" translate="no">
	<div class="sw-view-header">
		<span class="sw-view-icon" aria-hidden="true">
			<KeyRound size={16} strokeWidth={2.25} />
		</span>
		<h2 class="sw-view-title">SolidWorks Licenses</h2>
		<p class="sw-view-subtitle">
			{licenses.length} license{licenses.length === 1 ? '' : 's'} on this company
		</p>
	</div>

	{#if licenses.length === 0}
		<div class="sw-empty">No SolidWorks licenses imported yet.</div>
	{:else}
		<div class="sw-card-list">
			{#each licenses as license (license.serialNumber)}
				{@const status = expirationStatus(license.subscriptionEnd)}
				{@const maintSku = solidworksMaintSku(license)}
				<div class="sw-card">
					<div class="sw-card-head">
						<span class="sw-product-badge {productClass(license.product)}">
							{license.product}
						</span>
						<span class="sw-product-raw">{license.productRaw}</span>
						<div class="sw-card-actions">
							<Tooltip text="Remove this license" position="top">
								<button
									type="button"
									class="sw-remove-btn"
									aria-label="Remove SolidWorks license {license.serialNumber}"
									onclick={() => requestRemove(license.serialNumber)}
								>
									<Trash2 size={13} strokeWidth={2} />
								</button>
							</Tooltip>
						</div>
					</div>

					<div class="sw-card-grid">
						<div class="sw-row">
							<span class="sw-label">Serial</span>
							<button
								type="button"
								class="sw-value mono copyable"
								onclick={() => handleCopySerial(license.serialNumber)}
								aria-label="Copy serial number"
							>
								{license.serialNumber}
							</button>
						</div>
						<div class="sw-row">
							<span class="sw-label">Account</span>
							<span class="sw-value">{license.account}</span>
						</div>
						{#if license.customerId}
							<div class="sw-row">
								<span class="sw-label">Customer ID</span>
								<span class="sw-value mono">{license.customerId}</span>
							</div>
						{/if}
						<div class="sw-row">
							<span class="sw-label">Subscription</span>
							<span class="sw-value">
								{license.subscriptionStart || '?'} → {license.subscriptionEnd || '?'}
								{#if status}
									<span class="status-chip status-{status.tone}">{status.label}</span>
								{/if}
							</span>
						</div>
						<div class="sw-row">
							<span class="sw-label">Users</span>
							<span class="sw-value">{license.users}</span>
						</div>
						<div class="sw-row">
							<span class="sw-label">Flags</span>
							<span class="sw-value sw-flags">
								{#if license.isNetworkLicense}
									<span class="flag-chip flag-network">Network</span>
								{/if}
								{#if license.isTermLicense}
									<span class="flag-chip flag-term">Term</span>
								{/if}
								{#if license.terminationOfSupport}
									<span class="flag-chip flag-warn">Termination of Support</span>
								{/if}
								{#if !license.isNetworkLicense && !license.isTermLicense && !license.terminationOfSupport}
									<span class="sw-empty-flags">—</span>
								{/if}
							</span>
						</div>
						{#if license.poNumber}
							<div class="sw-row">
								<span class="sw-label">PO Number</span>
								<span class="sw-value mono dim">{license.poNumber}</span>
							</div>
						{/if}
						{#if license.originalOrderType}
							<div class="sw-row">
								<span class="sw-label">Order Type</span>
								<span class="sw-value dim">{license.originalOrderType}</span>
							</div>
						{/if}
						{#if maintSku}
							<div class="sw-row">
								<span class="sw-label">Maint SKU</span>
								<span class="sw-value mono">{maintSku}</span>
							</div>
						{/if}
					</div>

					<div class="sw-card-foot">
						Imported {fmtImported(license.importedAt)}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Delete confirmation modal -->
{#snippet deleteFooter()}
	<div class="dialog-actions">
		<Button variant="ghost" size="sm" onclick={cancelRemove}>Cancel</Button>
		<Button variant="danger" size="sm" onclick={confirmRemove}>Remove License</Button>
	</div>
{/snippet}

<Modal
	open={deleteSerial !== null}
	onClose={cancelRemove}
	title="Remove SolidWorks License"
	footer={deleteFooter}
>
	<div class="confirm-body">
		<span class="confirm-icon" aria-hidden="true">
			<AlertTriangle size={22} strokeWidth={2} />
		</span>
		<p class="confirm-message">
			Remove this SolidWorks license? This can't be undone — the serial number, subscription dates, and maintenance SKU will be cleared from this company.
		</p>
		{#if deleteLicense}
			<dl class="confirm-details">
				<div class="confirm-row">
					<dt>Product</dt>
					<dd>{deleteLicense.productRaw || deleteLicense.product}</dd>
				</div>
				<div class="confirm-row">
					<dt>Serial</dt>
					<dd class="mono">{deleteLicense.serialNumber}</dd>
				</div>
				{#if deleteLicense.account}
					<div class="confirm-row">
						<dt>Account</dt>
						<dd>{deleteLicense.account}</dd>
					</div>
				{/if}
			</dl>
		{/if}
	</div>
</Modal>

<style>
	.sw-view {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-4);
		background: rgba(0, 0, 0, 0.18);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 12px;
	}

	.sw-view-header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.sw-view-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: rgba(220, 38, 38, 0.14);
		border: 1px solid rgba(220, 38, 38, 0.32);
		color: rgba(252, 165, 165, 0.95);
	}

	.sw-view-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 580;
		letter-spacing: -0.012em;
		color: rgba(252, 165, 165, 0.95);
	}

	.sw-view-subtitle {
		margin: 0;
		font-size: var(--text-xs);
		color: rgba(255, 255, 255, 0.5);
	}

	.sw-empty {
		padding: var(--space-6);
		text-align: center;
		color: rgba(255, 255, 255, 0.4);
		font-size: var(--text-sm);
	}

	.sw-card-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.sw-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		background:
			linear-gradient(135deg, rgba(28, 28, 32, 0.92) 0%, rgba(16, 16, 20, 0.9) 100%);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-left: 3px solid rgba(220, 38, 38, 0.55);
		border-radius: 10px;
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.25),
			inset 0 1px 0 rgba(255, 255, 255, 0.04);
		transition:
			background 200ms var(--ease-out-quart),
			border-color 200ms var(--ease-out-quart);
	}

	.sw-card:hover {
		background:
			linear-gradient(135deg, rgba(34, 34, 38, 0.94) 0%, rgba(20, 20, 24, 0.92) 100%);
		border-color: rgba(255, 255, 255, 0.1);
	}

	.sw-card-head {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.sw-product-badge {
		padding: 2px 10px;
		border-radius: 999px;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		white-space: nowrap;
	}

	.badge-pro {
		background: rgba(212, 175, 55, 0.18);
		color: rgba(252, 211, 77, 0.95);
		border: 1px solid rgba(212, 175, 55, 0.4);
	}

	.badge-std {
		background: rgba(96, 165, 250, 0.18);
		color: rgba(147, 197, 253, 0.95);
		border: 1px solid rgba(96, 165, 250, 0.4);
	}

	.badge-pa {
		background: rgba(34, 197, 94, 0.18);
		color: rgba(134, 239, 172, 0.95);
		border: 1px solid rgba(34, 197, 94, 0.4);
	}

	.badge-p {
		background: rgba(168, 85, 247, 0.18);
		color: rgba(216, 180, 254, 0.95);
		border: 1px solid rgba(168, 85, 247, 0.4);
	}

	.badge-other {
		background: rgba(255, 255, 255, 0.06);
		color: rgba(255, 255, 255, 0.7);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.sw-product-raw {
		flex: 1;
		font-size: var(--text-sm);
		color: rgba(255, 255, 255, 0.7);
	}

	.sw-card-actions {
		display: flex;
		gap: var(--space-1);
	}

	.sw-remove-btn {
		width: 28px;
		height: 28px;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 6px;
		color: rgba(255, 255, 255, 0.5);
		line-height: 1;
		cursor: pointer;
		transition:
			background 150ms var(--ease-out-quart),
			border-color 150ms var(--ease-out-quart),
			color 150ms var(--ease-out-quart);
	}

	.sw-remove-btn:hover,
	.sw-remove-btn:focus-visible {
		background: var(--red-a20);
		border-color: var(--red-a30);
		color: rgba(252, 165, 165, 1);
		outline: none;
	}

	.sw-card-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: var(--space-2) var(--space-4);
	}

	.sw-row {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.sw-label {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: rgba(255, 255, 255, 0.4);
	}

	.sw-value {
		font-size: var(--text-sm);
		color: rgba(255, 255, 255, 0.9);
	}

	.sw-value.mono {
		font-family: 'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace;
		font-variant-numeric: tabular-nums;
		font-size: 0.8rem;
		word-break: break-all;
	}

	.sw-value.dim {
		color: rgba(255, 255, 255, 0.55);
	}

	.sw-value.copyable {
		background: none;
		border: none;
		padding: 0;
		margin: 0;
		text-align: left;
		cursor: pointer;
		font-family: 'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace;
		font-variant-numeric: tabular-nums;
	}

	.sw-value.copyable:hover {
		color: rgba(252, 165, 165, 0.95);
		text-decoration: underline;
	}

	.sw-flags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
	}

	.flag-chip {
		padding: 1px 8px;
		border-radius: 4px;
		font-size: 0.7rem;
		font-weight: 500;
		white-space: nowrap;
	}

	.flag-network {
		background: rgba(96, 165, 250, 0.15);
		color: rgba(147, 197, 253, 0.95);
		border: 1px solid rgba(96, 165, 250, 0.3);
	}

	.flag-term {
		background: rgba(168, 85, 247, 0.15);
		color: rgba(216, 180, 254, 0.95);
		border: 1px solid rgba(168, 85, 247, 0.3);
	}

	.flag-warn {
		background: rgba(245, 158, 11, 0.15);
		color: #fbbf24;
		border: 1px solid rgba(245, 158, 11, 0.4);
	}

	.sw-empty-flags {
		color: rgba(255, 255, 255, 0.3);
	}

	.status-chip {
		display: inline-block;
		margin-left: 6px;
		padding: 1px 8px;
		border-radius: 4px;
		font-size: 0.7rem;
		font-weight: 600;
	}

	.status-ok {
		background: rgba(34, 197, 94, 0.15);
		color: #4ade80;
		border: 1px solid rgba(34, 197, 94, 0.3);
	}

	.status-soon {
		background: rgba(245, 158, 11, 0.15);
		color: #fbbf24;
		border: 1px solid rgba(245, 158, 11, 0.3);
	}

	.status-expired {
		background: rgba(239, 68, 68, 0.15);
		color: #fca5a5;
		border: 1px solid rgba(239, 68, 68, 0.4);
	}

	.sw-card-foot {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.35);
	}

	/* Delete-confirmation modal body */
	.confirm-body {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		text-align: center;
	}

	.confirm-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: var(--red-a10);
		border: 1px solid var(--red-a20);
		color: #fca5a5;
	}

	.confirm-message {
		margin: 0;
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.78);
		line-height: 1.5;
		max-width: 42ch;
	}

	.confirm-details {
		width: 100%;
		max-width: 360px;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin: 0.5rem 0 0;
		padding: 0.65rem 0.85rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: var(--radius-sm);
		text-align: left;
	}

	.confirm-row {
		display: grid;
		grid-template-columns: 80px 1fr;
		gap: 0.75rem;
		align-items: center;
	}

	.confirm-row dt {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: rgba(255, 255, 255, 0.45);
		margin: 0;
	}

	.confirm-row dd {
		margin: 0;
		font-size: 0.8125rem;
		color: rgba(255, 255, 255, 0.92);
		word-break: break-word;
	}

	.confirm-row dd.mono {
		font-family: 'JetBrains Mono Variable', 'JetBrains Mono', monospace;
		font-variant-numeric: tabular-nums;
		font-size: 0.78rem;
	}

	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-2);
		width: 100%;
	}
</style>
