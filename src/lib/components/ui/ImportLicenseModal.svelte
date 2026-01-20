<script lang="ts">
	import type { LicenseInfo, ImportResult } from '$lib/types';
	import { parseSalesforceText } from '$lib/utils/salesforceParser';
	import { getPageNameForLicense } from '$lib/utils/licenseSelections';
	import { importLicense, needsCompanyNameInput } from '$lib/services/licenseImport';
	import { toastStore } from '$lib/stores/toast.svelte';
	import Modal from './Modal.svelte';
	import Button from './Button.svelte';

	type ModalState = 'paste' | 'parsing' | 'preview' | 'importing' | 'results';

	interface Props {
		open: boolean;
		onclose: () => void;
	}

	let { open = $bindable(), onclose }: Props = $props();

	// State
	let modalState = $state<ModalState>('paste');
	let pastedText = $state('');
	let parsedLicense = $state<LicenseInfo | null>(null);
	let parseError = $state<string | null>(null);
	let companyNameOverride = $state('');
	let maintenanceEndOverride = $state('');
	let importResult = $state<ImportResult | null>(null);
	let showFeatures = $state(false);

	// Derived
	let canParse = $derived(pastedText.trim().length > 0);
	let needsCompanyName = $derived(parsedLicense ? needsCompanyNameInput(parsedLicense) : false);
	let maintenanceRange = $derived.by(() => {
		if (!parsedLicense) return '-';
		const start = parsedLicense.maintenanceStart?.trim() ?? '';
		const end = maintenanceEndOverride.trim();
		if (!start && !end) return '-';
		if (start && end) return `${start} - ${end}`;
		return start || end;
	});
	let canImport = $derived.by(() => {
		if (!parsedLicense) return false;
		if (needsCompanyName && !companyNameOverride.trim()) return false;
		return true;
	});
	let pageName = $derived.by(() => (parsedLicense ? getPageNameForLicense(parsedLicense) : 'P1'));

	// Reset state when modal opens
	$effect(() => {
		if (open) {
			modalState = 'paste';
			pastedText = '';
			parsedLicense = null;
			parseError = null;
			companyNameOverride = '';
			maintenanceEndOverride = '';
			importResult = null;
			showFeatures = false;
		}
	});

	// Parse handler
	function handleParse() {
		if (!canParse) return;

		modalState = 'parsing';
		parseError = null;

		// Small delay to show parsing state
		setTimeout(() => {
			const result = parseSalesforceText(pastedText);

			if (result.parseError || !result.license) {
				parseError = result.parseError || 'Failed to parse license data';
				modalState = 'paste';
				return;
			}

			parsedLicense = result.license;
			maintenanceEndOverride = result.license.maintenanceEnd || '';

			// Pre-fill company name if available and valid
			if (result.license.customer && result.license.customer !== 'Unknown') {
				companyNameOverride = result.license.customer;
			} else {
				companyNameOverride = '';
			}

			modalState = 'preview';
		}, 100);
	}

	// Import handler
	function handleImport() {
		if (!parsedLicense || !canImport) return;

		modalState = 'importing';

		// Small delay to show importing state
		setTimeout(() => {
			try {
				const companyName = needsCompanyName ? companyNameOverride : parsedLicense!.customer;
				const licenseToImport: LicenseInfo = {
					...parsedLicense!,
					maintenanceEnd: maintenanceEndOverride.trim()
				};
				importResult = importLicense(licenseToImport, companyName);

				modalState = 'results';

				if (importResult.success) {
					toastStore.success(`License imported for ${importResult.companyName}`);
				} else {
					toastStore.error(importResult.errors?.[0] || 'Import failed');
				}
			} catch {
				toastStore.error('Import failed');
				modalState = 'preview';
			}
		}, 100);
	}

	// Navigation handlers
	function handleBack() {
		parsedLicense = null;
		parseError = null;
		companyNameOverride = '';
		maintenanceEndOverride = '';
		modalState = 'paste';
	}

	function handleClose() {
		onclose();
	}
</script>

{#snippet footer()}
	<div class="modal-footer-actions">
		{#if modalState === 'paste'}
			<Button variant="ghost" size="sm" onclick={handleClose}>Cancel</Button>
			<Button variant="gold" size="sm" onclick={handleParse} disabled={!canParse}>Parse</Button>
		{:else if modalState === 'parsing'}
			<Button variant="ghost" size="sm" disabled>Parsing...</Button>
		{:else if modalState === 'preview'}
			<Button variant="ghost" size="sm" onclick={handleBack}>Back</Button>
			<Button variant="gold" size="sm" onclick={handleImport} disabled={!canImport}>Import</Button>
		{:else if modalState === 'importing'}
			<Button variant="ghost" size="sm" disabled>Importing...</Button>
		{:else if modalState === 'results'}
			<Button variant="gold" size="sm" onclick={handleClose}>Done</Button>
		{/if}
	</div>
{/snippet}

<Modal {open} {onclose} title="Import License" size="wide" {footer}>
	{#if modalState === 'paste'}
		<!-- Textarea for pasting Salesforce text -->
		<div class="paste-section">
			<p class="paste-instructions">
				Open the dongle record in Salesforce, press <kbd>Ctrl+A</kbd> to select all, then
				<kbd>Ctrl+C</kbd> to copy. Paste below.
			</p>
			<textarea
				class="paste-textarea"
				class:has-error={!!parseError}
				bind:value={pastedText}
				placeholder="Paste Salesforce dongle page text here...

Example:
Dongle No.    77518
Customer      Apollo Design Technology, Inc.
Modeler       Checked    C-axes (Wrap)    Checked
HSM           Checked    5-axes indexial  Not Checked"
				rows="12"
			></textarea>
			{#if parseError}
				<p class="error-message">{parseError}</p>
			{/if}
		</div>
	{:else if modalState === 'parsing'}
		<!-- Parsing indicator -->
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Parsing license data...</p>
		</div>
	{:else if modalState === 'preview'}
		<!-- Preview of parsed data -->
		<div class="preview-section">
			{#if parsedLicense}
				<div class="summary-card">
					<div class="summary-row">
						<span class="summary-label">Customer:</span>
						{#if needsCompanyName}
							<input
								type="text"
								class="company-input"
								class:required-empty={!companyNameOverride.trim()}
								bind:value={companyNameOverride}
								placeholder="Enter company name"
							/>
						{:else}
							<span class="summary-value">{parsedLicense.customer}</span>
						{/if}
					</div>
					<div class="summary-row">
						<span class="summary-label">Dongle No:</span>
						<span class="summary-value">{parsedLicense.dongleNo || '-'}</span>
					</div>
					<div class="summary-row">
						<span class="summary-label">Type:</span>
						<span class="summary-value">
							{parsedLicense.displayType}
							{#if parsedLicense.isNetworkLicense}
								<span class="net-badge">Network</span>
							{/if}
						</span>
					</div>
					<div class="summary-row">
						<span class="summary-label">Maintenance:</span>
						<span class="summary-value">
							{maintenanceRange}
						</span>
					</div>
					{#if parsedLicense.isProfile}
						<div class="summary-row">
							<span class="summary-label">Maintenance End Date:</span>
							<input
								type="text"
								class="company-input"
								bind:value={maintenanceEndOverride}
								placeholder="Maintenance end date"
							/>
						</div>
					{/if}
					<div class="summary-row">
						<span class="summary-label">SolidCAM Version:</span>
						<span class="summary-value">{parsedLicense.solidcamVersion || '-'}</span>
					</div>
				</div>

				<div class="features-section">
					<button
						class="features-toggle"
						onclick={() => (showFeatures = !showFeatures)}
						type="button"
					>
						<span class="features-count">{parsedLicense.features.length} features found</span>
						<span class="toggle-icon">{showFeatures ? '▼' : '▶'}</span>
					</button>
					{#if showFeatures}
						<ul class="features-list">
							{#each parsedLicense.features as feature, index (index)}
								<li>{feature}</li>
							{/each}
						</ul>
					{/if}
				</div>

				<div class="page-info">
					<p>Will create/update page: <strong>{pageName}</strong></p>
				</div>
			{/if}
		</div>
	{:else if modalState === 'importing'}
		<!-- Importing indicator -->
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Importing license...</p>
		</div>
	{:else if modalState === 'results'}
		<!-- Import results -->
		<div class="results-section">
			{#if importResult}
				<div
					class="result-card"
					class:success={importResult.success}
					class:error={!importResult.success}
				>
					<div class="result-icon">
						{#if importResult.success}
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
								<polyline points="22,4 12,14.01 9,11.01" />
							</svg>
						{:else}
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<circle cx="12" cy="12" r="10" />
								<line x1="15" y1="9" x2="9" y2="15" />
								<line x1="9" y1="9" x2="15" y2="15" />
							</svg>
						{/if}
					</div>
					<h3>{importResult.success ? 'Import Successful' : 'Import Failed'}</h3>
					<p class="result-company">{importResult.companyName}</p>
				</div>

				{#if importResult.success}
					<div class="stats-grid">
						<div class="stat-card">
							<span class="stat-value">{importResult.featuresImported}</span>
							<span class="stat-label">Bits Selected</span>
						</div>
						<div class="stat-card">
							<span class="stat-value">{importResult.skusImported}</span>
							<span class="stat-label">SKUs Added</span>
						</div>
						<div class="stat-card">
							<span class="stat-value">{importResult.isNewCompany ? 'New' : 'Updated'}</span>
							<span class="stat-label">Company</span>
						</div>
					</div>
				{/if}

				{#if importResult.errors?.length}
					<div class="errors-section">
						<h4>Errors</h4>
						<ul class="errors-list">
							{#each importResult.errors as error, index (index)}
								<li>{error}</li>
							{/each}
						</ul>
					</div>
				{/if}
			{/if}
		</div>
	{/if}
</Modal>

<style>
	.modal-footer-actions {
		display: flex;
		gap: var(--space-3);
		justify-content: flex-end;
	}

	/* Paste section */
	.paste-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.paste-instructions {
		margin: 0;
		font-size: var(--text-sm);
		color: rgba(255, 255, 255, 0.7);
	}

	.paste-instructions kbd {
		display: inline-block;
		padding: 2px 6px;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 4px;
		font-family: monospace;
		font-size: 0.85em;
	}

	.paste-textarea {
		width: 100%;
		min-height: 250px;
		padding: var(--space-3);
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		color: rgba(255, 255, 255, 0.9);
		font-family: monospace;
		font-size: var(--text-sm);
		line-height: 1.5;
		resize: vertical;
	}

	.paste-textarea:focus {
		outline: none;
		border-color: var(--color-solidcam-gold);
	}

	.paste-textarea::placeholder {
		color: rgba(255, 255, 255, 0.4);
	}

	.paste-textarea.has-error {
		border-color: #ef4444;
	}

	.error-message {
		margin: 0;
		color: #f87171;
		font-size: var(--text-sm);
	}

	/* Loading state */
	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 200px;
		gap: var(--space-4);
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid rgba(255, 255, 255, 0.1);
		border-top-color: var(--color-solidcam-gold);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Preview section */
	.preview-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.summary-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-4);
		background: rgba(0, 0, 0, 0.3);
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.06);
	}

	.summary-row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.summary-label {
		min-width: 120px;
		font-size: var(--text-sm);
		color: rgba(255, 255, 255, 0.6);
	}

	.summary-value {
		font-size: var(--text-sm);
		color: rgba(255, 255, 255, 0.9);
	}

	.company-input {
		flex: 1;
		padding: var(--space-1) var(--space-2);
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 4px;
		color: rgba(255, 255, 255, 0.9);
		font-size: var(--text-sm);
	}

	.company-input:focus {
		outline: none;
		border-color: var(--color-solidcam-gold);
	}

	.company-input::placeholder {
		color: rgba(255, 255, 255, 0.4);
	}

	.company-input.required-empty {
		border-color: #ef4444;
		background: rgba(239, 68, 68, 0.1);
	}

	.net-badge {
		display: inline-block;
		margin-left: 8px;
		padding: 2px 6px;
		background: rgba(59, 130, 246, 0.2);
		color: #60a5fa;
		border-radius: 4px;
		font-size: 0.75rem;
	}

	/* Features section */
	.features-section {
		padding: var(--space-3);
		background: rgba(0, 0, 0, 0.2);
		border-radius: 8px;
	}

	.features-toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0;
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.8);
		font-size: var(--text-sm);
		cursor: pointer;
	}

	.features-toggle:hover {
		color: rgba(255, 255, 255, 1);
	}

	.features-count {
		font-weight: 500;
	}

	.toggle-icon {
		font-size: 0.75rem;
	}

	.features-list {
		margin: var(--space-3) 0 0;
		padding-left: var(--space-4);
		color: rgba(255, 255, 255, 0.7);
		font-size: var(--text-sm);
		max-height: 200px;
		overflow-y: auto;
	}

	.features-list li {
		margin-bottom: var(--space-1);
	}

	.page-info {
		padding: var(--space-3);
		background: rgba(212, 175, 55, 0.1);
		border: 1px solid rgba(212, 175, 55, 0.2);
		border-radius: 8px;
		color: rgba(255, 255, 255, 0.8);
		font-size: var(--text-sm);
	}

	.page-info p {
		margin: 0;
	}

	.page-info strong {
		color: var(--color-solidcam-gold);
	}

	/* Results section */
	.results-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.result-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-6);
		border-radius: 12px;
	}

	.result-card.success {
		background: rgba(34, 197, 94, 0.1);
		border: 1px solid rgba(34, 197, 94, 0.2);
	}

	.result-card.error {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.2);
	}

	.result-icon {
		width: 48px;
		height: 48px;
	}

	.result-card.success .result-icon {
		color: #4ade80;
	}

	.result-card.error .result-icon {
		color: #f87171;
	}

	.result-card h3 {
		margin: 0;
		font-size: var(--text-lg);
		color: rgba(255, 255, 255, 0.9);
	}

	.result-company {
		margin: 0;
		color: rgba(255, 255, 255, 0.7);
		font-size: var(--text-sm);
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-4);
	}

	.stat-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--space-4);
		background: rgba(0, 0, 0, 0.3);
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.06);
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.9);
	}

	.stat-label {
		font-size: var(--text-sm);
		color: rgba(255, 255, 255, 0.6);
		margin-top: var(--space-1);
	}

	.errors-section {
		padding: var(--space-4);
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.2);
		border-radius: 8px;
	}

	.errors-section h4 {
		margin: 0 0 var(--space-3) 0;
		font-size: var(--text-base);
		font-weight: 600;
		color: #f87171;
	}

	.errors-list {
		margin: 0;
		padding-left: var(--space-4);
		color: #f87171;
		font-size: var(--text-sm);
	}

	.errors-list li {
		margin-bottom: var(--space-1);
	}

	/* Scrollbar styling */
	.features-list::-webkit-scrollbar {
		width: 6px;
	}

	.features-list::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.2);
		border-radius: 3px;
	}

	.features-list::-webkit-scrollbar-thumb {
		background: rgba(212, 175, 55, 0.3);
		border-radius: 3px;
	}

	.features-list::-webkit-scrollbar-thumb:hover {
		background: rgba(212, 175, 55, 0.5);
	}
</style>
