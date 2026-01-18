<script lang="ts">
	import type { ParsedPDF, ImportResult } from '$lib/types';
	import {
		parsePdfs,
		getImportPreview,
		importParsedPdfs,
		calculateImportSummary,
		needsCompanyNameOverride,
		getSuggestedCompanyName
	} from '$lib/services/licenseImport';
	import { toastStore } from '$lib/stores/toast.svelte';
	import Modal from './Modal.svelte';
	import Button from './Button.svelte';
	import Checkbox from './Checkbox.svelte';

	type ModalState = 'select' | 'parsing' | 'preview' | 'importing' | 'results';

	interface Props {
		open: boolean;
		onclose: () => void;
	}

	let { open = $bindable(), onclose }: Props = $props();

	// State
	let modalState = $state<ModalState>('select');
	let parsedPdfs = $state<ParsedPDF[]>([]);
	let selectedPdfs = $state<Set<string>>(new Set());
	let companyNameOverrides = $state<Map<string, string>>(new Map());
	let importResults = $state<ImportResult[]>([]);
	let isDragging = $state(false);
	let fileInput: HTMLInputElement | null = $state(null);

	// Derived
	let validPdfs = $derived(parsedPdfs.filter((p) => p.license && !p.parseError));
	let canImport = $derived.by(() => {
		if (selectedPdfs.size === 0) return false;

		for (const fileName of selectedPdfs) {
			const pdf = parsedPdfs.find((p) => p.fileName === fileName);
			if (!pdf?.license) return false;

			// Check if this PDF needs a company name override
			const needsOverride = needsCompanyNameOverride(pdf);
			if (needsOverride) {
				const override = companyNameOverrides.get(fileName);
				const hasValidName = override && override.trim().length > 0;
				console.log(`[canImport] ${fileName}: needsOverride=${needsOverride}, override="${override}", valid=${hasValidName}`);
				if (!hasValidName) return false;
			}
		}
		return true;
	});
	let importSummary = $derived(importResults.length > 0 ? calculateImportSummary(importResults) : null);

	// Reset state when modal opens
	$effect(() => {
		if (open) {
			modalState = 'select';
			parsedPdfs = [];
			selectedPdfs = new Set();
			companyNameOverrides = new Map();
			importResults = [];
			isDragging = false;
		}
	});

	// File handling
	async function handleFileSelect(files: FileList | File[]) {
		const pdfFiles = Array.from(files).filter((f) => f.name.toLowerCase().endsWith('.pdf'));
		if (pdfFiles.length === 0) {
			toastStore.error('No PDF files selected');
			return;
		}

		modalState = 'parsing';

		try {
			parsedPdfs = await parsePdfs(pdfFiles);

			// Pre-select all valid PDFs
			selectedPdfs = new Set(validPdfs.map((p) => p.fileName));

			// Initialize company name overrides for Profile PDFs
			for (const pdf of parsedPdfs) {
				if (pdf.license && needsCompanyNameOverride(pdf)) {
					companyNameOverrides.set(pdf.fileName, getSuggestedCompanyName(pdf));
				}
			}
			// Force reactivity
			companyNameOverrides = new Map(companyNameOverrides);

			modalState = 'preview';
		} catch (error) {
			toastStore.error('Failed to parse PDFs');
			modalState = 'select';
		}
	}

	function handleInputChange(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files?.length) {
			handleFileSelect(input.files);
		}
	}

	// Drag-drop handlers
	function handleDragEnter(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		const target = e.currentTarget as HTMLElement;
		if (!target.contains(e.relatedTarget as Node)) {
			isDragging = false;
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'copy';
		}
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		const files = e.dataTransfer?.files;
		if (files?.length) {
			handleFileSelect(files);
		}
	}

	// Selection handlers
	function handleToggleSelection(fileName: string) {
		if (selectedPdfs.has(fileName)) {
			selectedPdfs.delete(fileName);
		} else {
			selectedPdfs.add(fileName);
		}
		selectedPdfs = new Set(selectedPdfs);
	}

	function handleSelectAll() {
		selectedPdfs = new Set(validPdfs.map((p) => p.fileName));
	}

	function handleDeselectAll() {
		selectedPdfs = new Set();
	}

	// Company name override handler
	function handleCompanyNameChange(fileName: string, newName: string) {
		companyNameOverrides.set(fileName, newName);
		companyNameOverrides = new Map(companyNameOverrides);
	}

	// Import handler
	async function handleImport() {
		const toImport = parsedPdfs.filter((p) => selectedPdfs.has(p.fileName));
		if (toImport.length === 0) return;

		modalState = 'importing';

		try {
			importResults = importParsedPdfs(toImport, companyNameOverrides);
			modalState = 'results';

			const summary = calculateImportSummary(importResults);
			if (summary.successCount > 0) {
				toastStore.success(`Imported ${summary.successCount} license(s)`);
			}
			if (summary.failureCount > 0) {
				toastStore.error(`${summary.failureCount} import(s) failed`);
			}
		} catch (error) {
			toastStore.error('Import failed');
			modalState = 'preview';
		}
	}

	// Navigation handlers
	function handleBack() {
		parsedPdfs = [];
		selectedPdfs = new Set();
		companyNameOverrides = new Map();
		modalState = 'select';
	}

	function handleClose() {
		onclose();
	}

	// Helpers
	function truncateFilename(name: string, maxLen = 25): string {
		if (name.length <= maxLen) return name;
		const ext = name.slice(name.lastIndexOf('.'));
		const base = name.slice(0, name.lastIndexOf('.'));
		const availLen = maxLen - ext.length - 3;
		return base.slice(0, availLen) + '...' + ext;
	}

	function getStatusInfo(pdf: ParsedPDF): { text: string; class: string } {
		if (pdf.parseError) {
			return { text: 'Error', class: 'status-error' };
		}
		if (!pdf.license) {
			return { text: 'No Data', class: 'status-error' };
		}
		if (needsCompanyNameOverride(pdf)) {
			const override = companyNameOverrides.get(pdf.fileName);
			if (!override?.trim()) {
				return { text: 'Name Required', class: 'status-warning' };
			}
		}
		return { text: 'Ready', class: 'status-ready' };
	}
</script>

{#snippet footer()}
	<div class="modal-footer-actions">
		{#if modalState === 'select'}
			<Button variant="ghost" size="sm" onclick={handleClose}>Cancel</Button>
			<Button variant="gold" size="sm" onclick={() => fileInput?.click()}>Choose Files</Button>
		{:else if modalState === 'parsing'}
			<Button variant="ghost" size="sm" disabled>Parsing...</Button>
		{:else if modalState === 'preview'}
			<Button variant="ghost" size="sm" onclick={handleBack}>Back</Button>
			<Button variant="gold" size="sm" onclick={handleImport} disabled={!canImport}>
				Import Selected ({selectedPdfs.size})
			</Button>
		{:else if modalState === 'importing'}
			<Button variant="ghost" size="sm" disabled>Importing...</Button>
		{:else if modalState === 'results'}
			<Button variant="gold" size="sm" onclick={handleClose}>Done</Button>
		{/if}
	</div>
{/snippet}

<Modal {open} {onclose} title="Import License" size="wide" {footer}>
	{#if modalState === 'select'}
		<!-- File picker with drag-drop -->
		<div
			class="drop-zone"
			class:dragging={isDragging}
			ondragenter={handleDragEnter}
			ondragleave={handleDragLeave}
			ondragover={handleDragOver}
			ondrop={handleDrop}
			role="button"
			tabindex="0"
			onclick={() => fileInput?.click()}
			onkeydown={(e) => e.key === 'Enter' && fileInput?.click()}
		>
			<input
				bind:this={fileInput}
				type="file"
				accept=".pdf"
				multiple
				class="file-input"
				onchange={handleInputChange}
			/>
			<div class="drop-zone-content">
				<svg class="drop-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
				</svg>
				<p class="drop-text">Drag and drop PDF files here</p>
				<p class="drop-hint">or click to browse</p>
			</div>
		</div>

	{:else if modalState === 'parsing'}
		<!-- Parsing indicator -->
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Parsing {parsedPdfs.length > 0 ? parsedPdfs.length : ''} PDF files...</p>
		</div>

	{:else if modalState === 'preview'}
		<!-- Preview table -->
		<div class="preview-wrapper">
			{#if validPdfs.length === 0}
				<div class="empty-state">
					<p>No valid PDFs found. Please check the files and try again.</p>
				</div>
			{:else}
				<table class="preview-table" role="grid" aria-label="PDF import preview">
					<thead>
						<tr>
							<th scope="col" class="col-select">
								<Checkbox
									checked={selectedPdfs.size === validPdfs.length && validPdfs.length > 0}
									indeterminate={selectedPdfs.size > 0 && selectedPdfs.size < validPdfs.length}
									onchange={() => (selectedPdfs.size === validPdfs.length ? handleDeselectAll() : handleSelectAll())}
									aria-label="Select all"
								/>
							</th>
							<th scope="col" class="col-filename">Filename</th>
							<th scope="col" class="col-company">Company</th>
							<th scope="col" class="col-dongle">Dongle/Key</th>
							<th scope="col" class="col-type">Type</th>
							<th scope="col" class="col-features">Features</th>
							<th scope="col" class="col-status">Status</th>
						</tr>
					</thead>
					<tbody>
						{#each parsedPdfs as pdf (pdf.fileName)}
							{@const isValid = pdf.license && !pdf.parseError}
							{@const status = getStatusInfo(pdf)}
							{@const preview = isValid ? getImportPreview(pdf) : null}
							<tr class:error={!isValid}>
								<td class="col-select">
									<Checkbox
										checked={selectedPdfs.has(pdf.fileName)}
										disabled={!isValid}
										onchange={() => handleToggleSelection(pdf.fileName)}
										aria-label="Select {pdf.fileName}"
									/>
								</td>
								<td class="col-filename" title={pdf.fileName}>
									{truncateFilename(pdf.fileName)}
								</td>
								<td class="col-company">
									{#if pdf.license && needsCompanyNameOverride(pdf)}
										{@const nameValue = companyNameOverrides.get(pdf.fileName) || ''}
										<input
											type="text"
											class="company-input"
											class:required-empty={!nameValue.trim()}
											value={nameValue}
											oninput={(e) => handleCompanyNameChange(pdf.fileName, e.currentTarget.value)}
											placeholder="Enter company name"
											required
											aria-label="Company name for {pdf.fileName}"
										/>
									{:else}
										{pdf.license?.customer || '-'}
									{/if}
								</td>
								<td class="col-dongle">
									{pdf.license?.dongleNo || pdf.license?.productKey?.slice(0, 8) || '-'}
								</td>
								<td class="col-type">
									{#if pdf.license}
										<span class="type-badge">{pdf.license.displayType}</span>
									{:else}
										-
									{/if}
								</td>
								<td class="col-features">
									{#if preview}
										{preview.mappableFeatures} / {preview.totalFeatures}
									{:else}
										-
									{/if}
								</td>
								<td class="col-status">
									<span class="status {status.class}" title={pdf.parseError || ''}>{status.text}</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</div>

	{:else if modalState === 'importing'}
		<!-- Importing indicator -->
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Importing licenses...</p>
		</div>

	{:else if modalState === 'results'}
		<!-- Results summary -->
		<div class="results-wrapper">
			{#if importSummary}
				<div class="summary-grid">
					<div class="summary-card">
						<span class="summary-value success">{importSummary.successCount}</span>
						<span class="summary-label">Succeeded</span>
					</div>
					<div class="summary-card">
						<span class="summary-value error">{importSummary.failureCount}</span>
						<span class="summary-label">Failed</span>
					</div>
					<div class="summary-card">
						<span class="summary-value">{importSummary.newCompanies}</span>
						<span class="summary-label">New Companies</span>
					</div>
					<div class="summary-card">
						<span class="summary-value">{importSummary.updatedCompanies}</span>
						<span class="summary-label">Updated</span>
					</div>
				</div>

				<div class="details-section">
					<h4>Details</h4>
					<ul class="details-list">
						<li>Features imported: {importSummary.totalFeaturesImported}</li>
						<li>Features skipped: {importSummary.totalFeaturesSkipped}</li>
						<li>SKUs added: {importSummary.totalSkusImported}</li>
					</ul>
				</div>

				{#if importResults.some((r) => r.errors?.length)}
					<div class="errors-section">
						<h4>Errors</h4>
						<ul class="errors-list">
							{#each importResults.filter((r) => r.errors?.length) as result}
								<li>
									<strong>{result.companyName}:</strong>
									{result.errors?.join(', ')}
								</li>
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

	/* Drop zone */
	.drop-zone {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 200px;
		padding: var(--space-8);
		border: 2px dashed rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		background: rgba(0, 0, 0, 0.2);
		cursor: pointer;
		transition: all 200ms ease;
	}

	.drop-zone:hover,
	.drop-zone.dragging {
		border-color: var(--color-solidcam-gold);
		background: rgba(212, 175, 55, 0.05);
	}

	.drop-zone:focus-visible {
		outline: 2px solid var(--color-solidcam-gold);
		outline-offset: 2px;
	}

	.file-input {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		border: 0;
	}

	.drop-zone-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		pointer-events: none;
	}

	.drop-icon {
		width: 48px;
		height: 48px;
		color: rgba(255, 255, 255, 0.4);
	}

	.drop-text {
		font-size: var(--text-base);
		color: rgba(255, 255, 255, 0.8);
		margin: 0;
	}

	.drop-hint {
		font-size: var(--text-sm);
		color: rgba(255, 255, 255, 0.5);
		margin: 0;
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

	/* Preview table */
	.preview-wrapper {
		max-height: 400px;
		overflow-y: auto;
	}

	.preview-table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--text-sm);
	}

	.preview-table th,
	.preview-table td {
		padding: var(--space-2) var(--space-3);
		text-align: left;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	.preview-table th {
		font-weight: 600;
		color: rgba(255, 255, 255, 0.7);
		background: rgba(0, 0, 0, 0.3);
		position: sticky;
		top: 0;
		z-index: 1;
	}

	.preview-table tbody tr:hover {
		background: rgba(255, 255, 255, 0.02);
	}

	.preview-table tr.error {
		opacity: 0.6;
	}

	.col-select {
		width: 40px;
	}

	.col-filename {
		max-width: 150px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.col-company {
		min-width: 150px;
	}

	.company-input {
		width: 100%;
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

	.type-badge {
		display: inline-block;
		padding: 2px 6px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		font-size: 0.75rem;
	}

	.net-badge {
		display: inline-block;
		margin-left: 4px;
		padding: 2px 6px;
		background: rgba(59, 130, 246, 0.2);
		color: #60a5fa;
		border-radius: 4px;
		font-size: 0.75rem;
	}

	.status {
		display: inline-block;
		padding: 2px 8px;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.status-ready {
		background: rgba(34, 197, 94, 0.2);
		color: #4ade80;
	}

	.status-warning {
		background: rgba(234, 179, 8, 0.2);
		color: #facc15;
	}

	.status-error {
		background: rgba(239, 68, 68, 0.2);
		color: #f87171;
	}

	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 150px;
		color: rgba(255, 255, 255, 0.6);
	}

	/* Results */
	.results-wrapper {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.summary-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--space-4);
	}

	.summary-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--space-4);
		background: rgba(0, 0, 0, 0.3);
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.06);
	}

	.summary-value {
		font-size: 2rem;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.9);
	}

	.summary-value.success {
		color: #4ade80;
	}

	.summary-value.error {
		color: #f87171;
	}

	.summary-label {
		font-size: var(--text-sm);
		color: rgba(255, 255, 255, 0.6);
		margin-top: var(--space-1);
	}

	.details-section,
	.errors-section {
		padding: var(--space-4);
		background: rgba(0, 0, 0, 0.2);
		border-radius: 8px;
	}

	.details-section h4,
	.errors-section h4 {
		margin: 0 0 var(--space-3) 0;
		font-size: var(--text-base);
		font-weight: 600;
		color: rgba(255, 255, 255, 0.8);
	}

	.details-list,
	.errors-list {
		margin: 0;
		padding-left: var(--space-4);
		color: rgba(255, 255, 255, 0.7);
		font-size: var(--text-sm);
	}

	.details-list li,
	.errors-list li {
		margin-bottom: var(--space-1);
	}

	.errors-section {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.2);
	}

	.errors-list {
		color: #f87171;
	}

	/* Scrollbar styling */
	.preview-wrapper::-webkit-scrollbar {
		width: 8px;
	}

	.preview-wrapper::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.2);
		border-radius: 4px;
	}

	.preview-wrapper::-webkit-scrollbar-thumb {
		background: rgba(212, 175, 55, 0.3);
		border-radius: 4px;
	}

	.preview-wrapper::-webkit-scrollbar-thumb:hover {
		background: rgba(212, 175, 55, 0.5);
	}
</style>
