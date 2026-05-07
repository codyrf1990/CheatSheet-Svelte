<script lang="ts">
	import type { LicenseInfo, ImportResult, SolidWorksLicenseInfo } from '$lib/types';
	import { parseSalesforceText } from '$lib/utils/salesforceParser';
	import { isSolidWorksText, parseSolidWorksText } from '$lib/utils/solidworksParser';
	import { getPageNameForLicense } from '$lib/utils/licenseSelections';
	import {
		importLicense,
		importSolidWorksLicense,
		needsCompanyNameInput,
		needsAccountNameInput,
		getImportPreview,
		solidworksMaintSku,
		enrichProfileFromParent,
		type InheritableField,
		type ParentLicenseMatch
	} from '$lib/services/licenseImport';
	import { toastStore } from '$lib/stores/toast.svelte';
	import Modal from './Modal.svelte';
	import Button from './Button.svelte';

	type ModalState = 'paste' | 'parsing' | 'preview' | 'importing' | 'results';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open = $bindable(), onClose }: Props = $props();

	// State
	let modalState = $state<ModalState>('paste');
	let pastedText = $state('');
	let parsedLicense = $state<LicenseInfo | null>(null);
	let parseError = $state<string | null>(null);
	let companyNameOverride = $state('');
	let maintenanceEndOverride = $state('');
	let importResult = $state<ImportResult | null>(null);
	let showFeatures = $state(false);
	let showSkus = $state(false);
	let parentMatch = $state<ParentLicenseMatch | null>(null);
	let inheritedFields = $state<Set<InheritableField>>(new Set());
	// SolidWorks: when set, the modal is in SW mode and the SolidCAM preview is hidden.
	let parsedSWLicense = $state<SolidWorksLicenseInfo | null>(null);
	let swAccountOverride = $state('');

	// Derived
	let canParse = $derived(pastedText.trim().length > 0);
	let needsCompanyName = $derived(parsedLicense ? needsCompanyNameInput(parsedLicense) : false);
	let maintenanceRange = $derived.by(() => {
		if (!parsedLicense) return '—';
		const start = parsedLicense.maintenanceStart?.trim() ?? '';
		const end = maintenanceEndOverride.trim();
		if (!start && !end) return '—';
		if (start && end) return `${start} → ${end}`;
		return start || end;
	});
	let needsSWAccount = $derived(parsedSWLicense ? needsAccountNameInput(parsedSWLicense) : false);
	let swMaintSkuPreview = $derived(parsedSWLicense ? solidworksMaintSku(parsedSWLicense) : null);
	let canImport = $derived.by(() => {
		if (parsedSWLicense) {
			if (needsSWAccount && !swAccountOverride.trim()) return false;
			return true;
		}
		if (!parsedLicense) return false;
		if (needsCompanyName && !companyNameOverride.trim()) return false;
		return true;
	});
	let pageName = $derived.by(() => (parsedLicense ? getPageNameForLicense(parsedLicense) : 'P1'));
	let parentPageName = $derived.by(() =>
		parentMatch ? getPageNameForLicense(parentMatch.license) : ''
	);
	let preview = $derived.by(() =>
		parsedLicense ? getImportPreview(parsedLicense, parentMatch?.companyId) : null
	);

	// Reset state when modal opens or closes
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
			showSkus = false;
			parentMatch = null;
			inheritedFields = new Set();
			parsedSWLicense = null;
			swAccountOverride = '';
		} else {
			// Also reset on close so stale state (e.g. stuck spinner) doesn't linger
			modalState = 'paste';
			parsedLicense = null;
			parseError = null;
			importResult = null;
			parentMatch = null;
			inheritedFields = new Set();
			parsedSWLicense = null;
			swAccountOverride = '';
		}
	});

	// Parse handler
	function handleParse() {
		if (!canParse) return;

		modalState = 'parsing';
		parseError = null;

		// Small delay to show parsing state
		setTimeout(() => {
			// SolidWorks branch — sniff first so SolidCAM parser doesn't false-fail
			if (isSolidWorksText(pastedText)) {
				const swResult = parseSolidWorksText(pastedText);
				if (swResult.parseError || !swResult.license) {
					parseError = swResult.parseError || 'Failed to parse SolidWorks license';
					modalState = 'paste';
					return;
				}
				parsedSWLicense = swResult.license;
				swAccountOverride =
					swResult.license.account && swResult.license.account !== 'Unknown'
						? swResult.license.account
						: '';
				modalState = 'preview';
				return;
			}

			const result = parseSalesforceText(pastedText);

			if (result.parseError || !result.license) {
				parseError = result.parseError || 'Failed to parse license data';
				modalState = 'paste';
				return;
			}

			// For profiles, try to inherit missing fields from an already-imported parent NPK.
			// No parent found → original license is used unchanged.
			let licenseToUse = result.license;
			parentMatch = null;
			inheritedFields = new Set();
			if (licenseToUse.isProfile) {
				const enrichment = enrichProfileFromParent(licenseToUse);
				if (enrichment) {
					licenseToUse = enrichment.license;
					parentMatch = enrichment.parent;
					inheritedFields = enrichment.inheritedFields;
				}
			}

			parsedLicense = licenseToUse;
			maintenanceEndOverride = licenseToUse.maintenanceEnd || '';

			// Pre-fill company name if available and valid
			if (licenseToUse.customer && licenseToUse.customer !== 'Unknown') {
				companyNameOverride = licenseToUse.customer;
			} else {
				companyNameOverride = '';
			}

			modalState = 'preview';
		}, 100);
	}

	// Import handler
	function handleImport() {
		if (!canImport) return;
		if (!parsedLicense && !parsedSWLicense) return;

		modalState = 'importing';

		// Small delay to show importing state
		setTimeout(() => {
			try {
				if (parsedSWLicense) {
					const accountName = needsSWAccount ? swAccountOverride : parsedSWLicense.account;
					importResult = importSolidWorksLicense(parsedSWLicense, accountName);
				} else {
					// When customer was inherited from a parent NPK, always trust the
					// parent — never let a typo split the profile into a new company.
					const companyName = needsCompanyName
						? companyNameOverride
						: parsedLicense!.customer;
					const licenseToImport: LicenseInfo = {
						...parsedLicense!,
						maintenanceEnd: maintenanceEndOverride.trim()
					};
					importResult = importLicense(
						licenseToImport,
						companyName,
						parentMatch?.companyId
					);
				}

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
		parsedSWLicense = null;
		parseError = null;
		companyNameOverride = '';
		swAccountOverride = '';
		maintenanceEndOverride = '';
		parentMatch = null;
		inheritedFields = new Set();
		modalState = 'paste';
	}

	function handleClose() {
		onClose();
	}
</script>

{#snippet footer()}
	<div class="modal-footer-actions">
		{#if modalState === 'paste'}
			<Button variant="ghost" size="sm" onclick={handleClose}>Cancel</Button>
			<Button variant="gold" size="sm" onclick={handleParse} disabled={!canParse}>Parse</Button>
		{:else if modalState === 'parsing'}
			<Button variant="ghost" size="sm" disabled>Parsing…</Button>
		{:else if modalState === 'preview'}
			<Button variant="ghost" size="sm" onclick={handleBack}>Back</Button>
			<Button variant="gold" size="sm" onclick={handleImport} disabled={!canImport}>Import</Button>
		{:else if modalState === 'importing'}
			<Button variant="ghost" size="sm" disabled>Importing…</Button>
		{:else if modalState === 'results'}
			<Button variant="gold" size="sm" onclick={handleClose}>Done</Button>
		{/if}
	</div>
{/snippet}

<Modal {open} {onClose} title="Import License" size="wide" {footer}>
	{#if modalState === 'paste'}
		<!-- Paste step -->
		<div class="paste-section">
			<div class="kind-cards">
				<div class="kind-card kind-solidcam">
					<div class="kind-card-head">
						<span class="kind-icon" aria-hidden="true">⚙</span>
						<div>
							<div class="kind-card-title">SolidCAM</div>
							<div class="kind-card-sub">Dongle · NPK · SPK · Profile</div>
						</div>
					</div>
					<p class="kind-card-body">
						Paste the dongle or product-key page. For licenses with profiles, paste each profile separately.
					</p>
				</div>
				<div class="kind-card kind-solidworks">
					<div class="kind-card-head">
						<span class="kind-icon" aria-hidden="true">▦</span>
						<div>
							<div class="kind-card-title">SolidWorks</div>
							<div class="kind-card-sub">Standard · P&amp;A · Pro</div>
						</div>
					</div>
					<p class="kind-card-body">
						Paste a SOLIDWORKS license page. Auto-detected and pinned as a single <strong>SW</strong> tab on the matching company.
					</p>
				</div>
			</div>

			<div class="how-to">
				<div class="how-to-title">Copy from Salesforce</div>
				<ol class="how-to-steps">
					<li><strong>Printable View</strong> on the Salesforce page</li>
					<li><kbd>Ctrl</kbd>+<kbd>A</kbd> · <kbd>Ctrl</kbd>+<kbd>C</kbd></li>
					<li>Click below · <kbd>Ctrl</kbd>+<kbd>V</kbd></li>
				</ol>
			</div>

			<div class="paste-field">
				<label class="paste-label" for="import-paste-textarea">Paste the page text</label>
				<textarea
					id="import-paste-textarea"
					class="paste-textarea"
					class:has-error={!!parseError}
					bind:value={pastedText}
					placeholder="Paste the full Salesforce page here…"
					rows="9"
				></textarea>
				{#if parseError}
					<p class="error-message" role="alert">{parseError}</p>
				{/if}
			</div>

			<div class="tip-row">
				<div class="tip tip-gold">
					<span class="tip-icon" aria-hidden="true">💡</span>
					<div class="tip-body">
						<strong>Profiles:</strong> import the top-level <strong>Network Product Key</strong> first.
						Profiles auto-link to the parent and inherit customer, maintenance dates, and version.
					</div>
				</div>
				<div class="tip tip-sw">
					<span class="tip-icon" aria-hidden="true">▦</span>
					<div class="tip-body">
						<strong>SolidWorks:</strong> creates a pinned <strong>SW</strong> tab and adds the matching maintenance SKU on that company's SolidWorks Maintenance panel.
					</div>
				</div>
			</div>
		</div>
	{:else if modalState === 'parsing'}
		<div class="loading-state">
			<div class="spinner"></div>
			<p class="loading-text">Parsing license data…</p>
		</div>
	{:else if modalState === 'preview'}
		<div class="preview-section">
			{#if parsedSWLicense}
				<!-- SolidWorks preview -->
				<div class="hero hero-sw">
					<div class="hero-icon" aria-hidden="true">▦</div>
					<div class="hero-text">
						<div class="hero-eyebrow">SolidWorks · {parsedSWLicense.product}</div>
						<div class="hero-title">{parsedSWLicense.account || 'Unknown account'}</div>
						<div class="hero-sub">{parsedSWLicense.productRaw}</div>
					</div>
					<div class="hero-flags">
						{#if parsedSWLicense.isNetworkLicense}<span class="chip chip-blue">Network</span>{/if}
						{#if parsedSWLicense.isTermLicense}<span class="chip chip-purple">Term</span>{/if}
						{#if parsedSWLicense.terminationOfSupport}
							<span class="chip chip-amber">End of support</span>
						{/if}
					</div>
				</div>

				<div class="field-grid">
					<div class="field">
						<span class="field-label">Account</span>
						{#if needsSWAccount}
							<input
								type="text"
								class="field-input"
								class:required-empty={!swAccountOverride.trim()}
								bind:value={swAccountOverride}
								placeholder="Enter account name"
							/>
						{:else}
							<span class="field-value">{parsedSWLicense.account}</span>
						{/if}
					</div>
					<div class="field">
						<span class="field-label">Serial Number</span>
						<span class="field-value mono">{parsedSWLicense.serialNumber}</span>
					</div>
					{#if parsedSWLicense.customerId}
						<div class="field">
							<span class="field-label">Customer ID</span>
							<span class="field-value mono">{parsedSWLicense.customerId}</span>
						</div>
					{/if}
					<div class="field">
						<span class="field-label">Subscription</span>
						<span class="field-value">
							{parsedSWLicense.subscriptionStart || '?'} → {parsedSWLicense.subscriptionEnd || '?'}
						</span>
					</div>
					<div class="field">
						<span class="field-label">Users</span>
						<span class="field-value">{parsedSWLicense.users}</span>
					</div>
					{#if parsedSWLicense.poNumber}
						<div class="field">
							<span class="field-label">PO Number</span>
							<span class="field-value mono dim">{parsedSWLicense.poNumber}</span>
						</div>
					{/if}
				</div>

				{#if swMaintSkuPreview}
					<div class="action-banner action-positive">
						<span class="action-icon" aria-hidden="true">✓</span>
						<span class="action-text">
							<strong>{swMaintSkuPreview}</strong> will be added to the SolidWorks Maintenance panel.
						</span>
					</div>
				{:else}
					<div class="action-banner action-warn">
						<span class="action-icon" aria-hidden="true">!</span>
						<span class="action-text">
							No matching maintenance SKU for this product — license stored, no SKU added.
						</span>
					</div>
				{/if}
			{:else if parsedLicense}
				<!-- SolidCAM preview -->
				{#if parentMatch}
					<div class="link-banner">
						<span class="link-banner-label">Linked to existing license</span>
						<span class="link-banner-value">
							{parentPageName} · {parentMatch.companyName}
						</span>
					</div>
				{/if}

				<div class="hero hero-sc">
					<div class="hero-icon" aria-hidden="true">⚙</div>
					<div class="hero-text">
						<div class="hero-eyebrow">SolidCAM · {parsedLicense.displayType}</div>
						{#if needsCompanyName}
							<input
								type="text"
								class="hero-title-input"
								class:required-empty={!companyNameOverride.trim()}
								bind:value={companyNameOverride}
								placeholder="Enter company name"
							/>
						{:else}
							<div class="hero-title">{parsedLicense.customer}</div>
						{/if}
						<div class="hero-sub mono">
							{parsedLicense.dongleNo || parsedLicense.productKey || '—'}
						</div>
					</div>
					<div class="hero-flags">
						{#if parsedLicense.isNetworkLicense}<span class="chip chip-blue">Network</span>{/if}
						{#if parsedLicense.isProfile}<span class="chip chip-purple">Profile</span>{/if}
					</div>
				</div>

				<div class="field-grid">
					<div class="field">
						<span class="field-label">
							Maintenance
							{#if inheritedFields.has('maintenanceStart') || inheritedFields.has('maintenanceEnd')}
								<span class="inherited-hint">from {parentPageName}</span>
							{/if}
						</span>
						<span class="field-value">{maintenanceRange}</span>
					</div>
					{#if parsedLicense.isProfile && !inheritedFields.has('maintenanceEnd')}
						<div class="field">
							<span class="field-label">Maintenance End</span>
							<input
								type="text"
								class="field-input"
								bind:value={maintenanceEndOverride}
								placeholder="MM/DD/YYYY"
							/>
						</div>
					{/if}
					<div class="field">
						<span class="field-label">
							SolidCAM Version
							{#if inheritedFields.has('solidcamVersion')}
								<span class="inherited-hint">from {parentPageName}</span>
							{/if}
						</span>
						<span class="field-value">{parsedLicense.solidcamVersion || '—'}</span>
					</div>
					{#if inheritedFields.has('isNetworkLicense')}
						<div class="field">
							<span class="field-label">Network License</span>
							<span class="field-value">
								Yes <span class="inherited-hint">from {parentPageName}</span>
							</span>
						</div>
					{/if}
				</div>

				<div class="features-section">
					<button
						class="collapsible-toggle"
						onclick={() => (showFeatures = !showFeatures)}
						type="button"
						aria-expanded={showFeatures}
					>
						<span class="collapsible-label">
							{parsedLicense.features.length} licensed modules
						</span>
						<span class="collapsible-icon" class:open={showFeatures} aria-hidden="true">▶</span>
					</button>
					{#if showFeatures}
						<ul class="collapsible-list">
							{#each parsedLicense.features as feature, index (index)}
								<li>{feature}</li>
							{/each}
						</ul>
					{/if}
				</div>

				<div
					class="action-banner"
					class:action-positive={preview && preview.isNewPage}
					class:action-info={preview && !preview.isNewPage}
				>
					<span class="action-icon" aria-hidden="true">{preview && preview.isNewPage ? '+' : '↻'}</span>
					<span class="action-text">
						{#if preview && !preview.isNewPage}
							Page <strong>{pageName}</strong> already exists — this import will update it.
						{:else}
							Will create page <strong>{pageName}</strong>.
						{/if}
					</span>
				</div>
			{/if}
		</div>
	{:else if modalState === 'importing'}
		<div class="loading-state">
			<div class="spinner"></div>
			<p class="loading-text">Importing license…</p>
		</div>
	{:else if modalState === 'results'}
		<div class="results-section">
			{#if importResult}
				{@const isSW = importResult.isSolidWorks ?? false}
				<div
					class="result-hero"
					class:result-success={importResult.success}
					class:result-error={!importResult.success}
					class:result-sw={isSW && importResult.success}
				>
					<div class="result-hero-icon">
						{#if importResult.success}
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
								<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
								<polyline points="22,4 12,14.01 9,11.01" />
							</svg>
						{:else}
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
								<circle cx="12" cy="12" r="10" />
								<line x1="15" y1="9" x2="9" y2="15" />
								<line x1="9" y1="9" x2="15" y2="15" />
							</svg>
						{/if}
					</div>
					<div class="result-hero-text">
						<h3 class="result-hero-title">
							{#if !importResult.success}
								Import failed
							{:else if isSW}
								SolidWorks license imported
							{:else}
								License imported
							{/if}
						</h3>
						<p class="result-hero-company">{importResult.companyName}</p>
					</div>
				</div>

				{#if importResult.success}
					{#if isSW}
						<div class="stats-grid stats-grid-2">
							<div class="stat-card">
								<span class="stat-value">{importResult.skusImported}</span>
								<span class="stat-label">
									SW Maint SKU{importResult.skusImported === 1 ? '' : 's'}
								</span>
							</div>
							<div class="stat-card">
								<span class="stat-value">{importResult.isNewCompany ? 'New' : 'Updated'}</span>
								<span class="stat-label">Company</span>
							</div>
						</div>
					{:else}
						<div class="stats-grid">
							<div class="stat-card">
								<span class="stat-value">{importResult.featuresImported}</span>
								<span class="stat-label">Modules</span>
							</div>
							<div class="stat-card">
								<span class="stat-value">{importResult.skusImported}</span>
								<span class="stat-label">SKUs added</span>
							</div>
							<div class="stat-card">
								<span class="stat-value">{importResult.isNewCompany ? 'New' : 'Updated'}</span>
								<span class="stat-label">Company</span>
							</div>
						</div>
					{/if}
				{/if}

				{#if importResult.importedSkuList?.length}
					<div class="features-section">
						<button
							class="collapsible-toggle"
							onclick={() => (showSkus = !showSkus)}
							type="button"
							aria-expanded={showSkus}
						>
							<span class="collapsible-label">
								{importResult.importedSkuList.length} SKU{importResult.importedSkuList.length === 1 ? '' : 's'} imported
							</span>
							<span class="collapsible-icon" class:open={showSkus} aria-hidden="true">▶</span>
						</button>
						{#if showSkus}
							<ul class="collapsible-list mono">
								{#each importResult.importedSkuList as sku, index (index)}
									<li>{sku}</li>
								{/each}
							</ul>
						{/if}
					</div>
				{/if}

				{#if importResult.errors?.length}
					<div class="errors-section">
						<div class="errors-title">Errors</div>
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

	/* ─── Paste step ─────────────────────────────────────────── */

	.paste-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.kind-cards {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-3);
	}

	@media (max-width: 640px) {
		.kind-cards {
			grid-template-columns: 1fr;
		}
	}

	.kind-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-3);
		background: rgba(0, 0, 0, 0.25);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 10px;
		border-top-width: 2px;
	}

	.kind-card.kind-solidcam {
		border-top-color: var(--color-solidcam-gold, #d4af37);
	}

	.kind-card.kind-solidworks {
		border-top-color: rgba(220, 38, 38, 0.7);
	}

	.kind-card-head {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.kind-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 8px;
		font-size: 1rem;
		flex-shrink: 0;
	}

	.kind-solidcam .kind-icon {
		background: rgba(212, 175, 55, 0.15);
		color: var(--color-solidcam-gold, #d4af37);
		border: 1px solid rgba(212, 175, 55, 0.35);
	}

	.kind-solidworks .kind-icon {
		background: rgba(220, 38, 38, 0.15);
		color: rgba(252, 165, 165, 0.95);
		border: 1px solid rgba(220, 38, 38, 0.35);
	}

	.kind-card-title {
		font-size: var(--text-sm);
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
		letter-spacing: 0.02em;
	}

	.kind-card-sub {
		margin-top: 1px;
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.5);
		letter-spacing: 0.02em;
	}

	.kind-card-body {
		margin: 0;
		font-size: 0.78rem;
		line-height: 1.5;
		color: rgba(255, 255, 255, 0.65);
	}

	.kind-card-body strong {
		color: rgba(255, 255, 255, 0.85);
	}

	.how-to {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-2) var(--space-3);
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 8px;
		flex-wrap: wrap;
	}

	.how-to-title {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: rgba(255, 255, 255, 0.5);
		flex-shrink: 0;
	}

	.how-to-steps {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-3);
		font-size: 0.78rem;
		color: rgba(255, 255, 255, 0.7);
		counter-reset: step;
	}

	.how-to-steps li {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.how-to-steps li::before {
		counter-increment: step;
		content: counter(step);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		font-size: 0.65rem;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.6);
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 50%;
	}

	.how-to-steps strong {
		color: rgba(255, 255, 255, 0.9);
	}

	.how-to-steps kbd {
		display: inline-block;
		padding: 1px 6px;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.16);
		border-radius: 4px;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
		font-size: 0.72rem;
		color: rgba(255, 255, 255, 0.85);
	}

	.paste-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.paste-label {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: rgba(255, 255, 255, 0.55);
	}

	.paste-textarea {
		width: 100%;
		min-height: 200px;
		padding: var(--space-3);
		background: rgba(0, 0, 0, 0.35);
		border: 1px solid rgba(255, 255, 255, 0.16);
		border-radius: 8px;
		color: rgba(255, 255, 255, 0.92);
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
		font-size: 0.8rem;
		line-height: 1.5;
		resize: vertical;
		transition: border-color 150ms ease, box-shadow 150ms ease;
	}

	.paste-textarea:focus {
		outline: none;
		border-color: var(--color-solidcam-gold, #d4af37);
		box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.12);
	}

	.paste-textarea::placeholder {
		color: rgba(255, 255, 255, 0.32);
	}

	.paste-textarea.has-error {
		border-color: var(--color-error, #ef4444);
		box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
	}

	.error-message {
		margin: 0;
		color: #f87171;
		font-size: var(--text-sm);
	}

	.tip-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-2);
	}

	@media (max-width: 640px) {
		.tip-row {
			grid-template-columns: 1fr;
		}
	}

	.tip {
		display: flex;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		border-radius: 8px;
		font-size: 0.78rem;
		line-height: 1.5;
	}

	.tip-icon {
		flex-shrink: 0;
		font-size: 0.95rem;
		line-height: 1.2;
	}

	.tip-body {
		color: rgba(255, 255, 255, 0.78);
	}

	.tip-body strong {
		color: rgba(255, 255, 255, 0.95);
	}

	.tip.tip-gold {
		background: rgba(212, 175, 55, 0.06);
		border: 1px solid rgba(212, 175, 55, 0.25);
	}

	.tip.tip-gold .tip-body strong {
		color: rgba(252, 211, 77, 0.95);
	}

	.tip.tip-sw {
		background: rgba(220, 38, 38, 0.06);
		border: 1px solid rgba(220, 38, 38, 0.25);
	}

	.tip.tip-sw .tip-body strong {
		color: rgba(252, 165, 165, 0.95);
	}

	/* ─── Loading state ─────────────────────────────────────── */

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 220px;
		gap: var(--space-4);
	}

	.loading-text {
		margin: 0;
		font-size: var(--text-sm);
		color: rgba(255, 255, 255, 0.6);
	}

	.spinner {
		width: 36px;
		height: 36px;
		border: 3px solid rgba(255, 255, 255, 0.08);
		border-top-color: var(--color-solidcam-gold, #d4af37);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* ─── Preview step ──────────────────────────────────────── */

	.preview-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.link-banner {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: var(--space-2) var(--space-3);
		background: rgba(96, 165, 250, 0.08);
		border: 1px solid rgba(96, 165, 250, 0.3);
		border-radius: 8px;
	}

	.link-banner-label {
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: rgba(96, 165, 250, 0.95);
	}

	.link-banner-value {
		font-size: var(--text-sm);
		color: rgba(255, 255, 255, 0.88);
	}

	.hero {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4);
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.06);
		background: linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.2));
		position: relative;
	}

	.hero-sc {
		border-left: 3px solid var(--color-solidcam-gold, #d4af37);
	}

	.hero-sw {
		border-left: 3px solid rgba(220, 38, 38, 0.65);
	}

	.hero-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border-radius: 10px;
		font-size: 1.4rem;
		flex-shrink: 0;
	}

	.hero-sc .hero-icon {
		background: rgba(212, 175, 55, 0.18);
		color: var(--color-solidcam-gold, #d4af37);
		border: 1px solid rgba(212, 175, 55, 0.35);
	}

	.hero-sw .hero-icon {
		background: rgba(220, 38, 38, 0.18);
		color: rgba(252, 165, 165, 0.95);
		border: 1px solid rgba(220, 38, 38, 0.35);
	}

	.hero-text {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.hero-eyebrow {
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: rgba(255, 255, 255, 0.5);
	}

	.hero-sc .hero-eyebrow {
		color: rgba(212, 175, 55, 0.85);
	}

	.hero-sw .hero-eyebrow {
		color: rgba(252, 165, 165, 0.85);
	}

	.hero-title {
		font-size: 1.05rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.95);
		line-height: 1.25;
		word-wrap: break-word;
	}

	.hero-title-input {
		font-size: 1.05rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.95);
		line-height: 1.25;
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.18);
		border-radius: 6px;
		padding: 4px 8px;
		width: 100%;
		max-width: 360px;
	}

	.hero-title-input:focus {
		outline: none;
		border-color: var(--color-solidcam-gold, #d4af37);
		box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
	}

	.hero-title-input.required-empty {
		border-color: var(--color-error, #ef4444);
		background: rgba(239, 68, 68, 0.1);
	}

	.hero-sub {
		font-size: 0.78rem;
		color: rgba(255, 255, 255, 0.55);
	}

	.hero-sub.mono {
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
		word-break: break-all;
	}

	.hero-flags {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		flex-shrink: 0;
	}

	@media (max-width: 640px) {
		.hero {
			flex-wrap: wrap;
		}
		.hero-flags {
			width: 100%;
			margin-top: var(--space-1);
		}
	}

	.chip {
		display: inline-block;
		padding: 2px 8px;
		border-radius: 4px;
		font-size: 0.7rem;
		font-weight: 500;
		letter-spacing: 0.02em;
		white-space: nowrap;
	}

	.chip-blue {
		background: rgba(59, 130, 246, 0.18);
		color: rgba(147, 197, 253, 0.95);
		border: 1px solid rgba(59, 130, 246, 0.35);
	}

	.chip-purple {
		background: rgba(168, 85, 247, 0.18);
		color: rgba(216, 180, 254, 0.95);
		border: 1px solid rgba(168, 85, 247, 0.35);
	}

	.chip-amber {
		background: rgba(245, 158, 11, 0.18);
		color: #fbbf24;
		border: 1px solid rgba(245, 158, 11, 0.35);
	}

	.field-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: var(--space-3);
		padding: var(--space-3);
		background: rgba(0, 0, 0, 0.22);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 10px;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}

	.field-label {
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: rgba(255, 255, 255, 0.45);
	}

	.field-value {
		font-size: var(--text-sm);
		color: rgba(255, 255, 255, 0.92);
		line-height: 1.4;
	}

	.field-value.mono {
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
		font-size: 0.78rem;
		word-break: break-all;
	}

	.field-value.dim {
		color: rgba(255, 255, 255, 0.55);
	}

	.field-input {
		padding: 5px 8px;
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.18);
		border-radius: 6px;
		color: rgba(255, 255, 255, 0.92);
		font-size: var(--text-sm);
		width: 100%;
	}

	.field-input:focus {
		outline: none;
		border-color: var(--color-solidcam-gold, #d4af37);
		box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
	}

	.field-input.required-empty {
		border-color: var(--color-error, #ef4444);
		background: rgba(239, 68, 68, 0.1);
	}

	.inherited-hint {
		display: inline-block;
		margin-left: 6px;
		padding: 0 6px;
		background: rgba(96, 165, 250, 0.12);
		border: 1px solid rgba(96, 165, 250, 0.25);
		border-radius: 4px;
		color: rgba(147, 197, 253, 0.95);
		font-size: 0.62rem;
		font-style: italic;
		font-weight: 500;
		text-transform: none;
		letter-spacing: 0;
		vertical-align: middle;
	}

	/* ─── Action banner (success/info/warn) ─────────────────── */

	.action-banner {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		border-radius: 8px;
		font-size: var(--text-sm);
		line-height: 1.4;
	}

	.action-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		font-size: 0.82rem;
		font-weight: 700;
		flex-shrink: 0;
	}

	.action-banner.action-positive {
		background: rgba(34, 197, 94, 0.08);
		border: 1px solid rgba(34, 197, 94, 0.3);
		color: rgba(255, 255, 255, 0.85);
	}

	.action-positive .action-icon {
		background: rgba(34, 197, 94, 0.25);
		color: #4ade80;
	}

	.action-banner.action-info {
		background: rgba(245, 158, 11, 0.08);
		border: 1px solid rgba(245, 158, 11, 0.3);
		color: rgba(255, 255, 255, 0.85);
	}

	.action-info .action-icon {
		background: rgba(245, 158, 11, 0.25);
		color: #fbbf24;
	}

	.action-banner.action-warn {
		background: rgba(239, 68, 68, 0.08);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: rgba(255, 255, 255, 0.85);
	}

	.action-warn .action-icon {
		background: rgba(239, 68, 68, 0.25);
		color: #fca5a5;
	}

	.action-text strong {
		color: rgba(255, 255, 255, 0.98);
	}

	/* ─── Collapsible section (modules / SKUs) ─────────────── */

	.features-section {
		padding: var(--space-2) var(--space-3);
		background: rgba(0, 0, 0, 0.18);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 8px;
	}

	.collapsible-toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		width: 100%;
		padding: var(--space-1) 0;
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.78);
		font-size: var(--text-sm);
		cursor: pointer;
	}

	.collapsible-toggle:hover {
		color: rgba(255, 255, 255, 1);
	}

	.collapsible-label {
		font-weight: 500;
	}

	.collapsible-icon {
		font-size: 0.65rem;
		color: rgba(255, 255, 255, 0.5);
		transition: transform 150ms ease;
	}

	.collapsible-icon.open {
		transform: rotate(90deg);
	}

	.collapsible-list {
		margin: var(--space-2) 0 0;
		padding-left: var(--space-4);
		color: rgba(255, 255, 255, 0.7);
		font-size: 0.78rem;
		line-height: 1.6;
		max-height: 200px;
		overflow-y: auto;
	}

	.collapsible-list.mono {
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
		font-size: 0.78rem;
	}

	.collapsible-list li {
		margin-bottom: 2px;
	}

	/* ─── Results step ─────────────────────────────────────── */

	.results-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.result-hero {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4);
		border-radius: 12px;
	}

	.result-success {
		background: rgba(34, 197, 94, 0.08);
		border: 1px solid rgba(34, 197, 94, 0.25);
	}

	.result-success.result-sw {
		background: rgba(220, 38, 38, 0.08);
		border-color: rgba(220, 38, 38, 0.3);
	}

	.result-error {
		background: rgba(239, 68, 68, 0.08);
		border: 1px solid rgba(239, 68, 68, 0.3);
	}

	.result-hero-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.result-hero-icon svg {
		width: 28px;
		height: 28px;
	}

	.result-success .result-hero-icon {
		background: rgba(34, 197, 94, 0.18);
		color: #4ade80;
	}

	.result-success.result-sw .result-hero-icon {
		background: rgba(220, 38, 38, 0.2);
		color: rgba(252, 165, 165, 0.95);
	}

	.result-error .result-hero-icon {
		background: rgba(239, 68, 68, 0.18);
		color: #f87171;
	}

	.result-hero-text {
		flex: 1;
		min-width: 0;
	}

	.result-hero-title {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.95);
	}

	.result-hero-company {
		margin: 2px 0 0;
		font-size: var(--text-sm);
		color: rgba(255, 255, 255, 0.65);
		word-wrap: break-word;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-3);
	}

	.stats-grid.stats-grid-2 {
		grid-template-columns: repeat(2, 1fr);
	}

	@media (max-width: 480px) {
		.stats-grid,
		.stats-grid.stats-grid-2 {
			grid-template-columns: 1fr;
		}
	}

	.stat-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--space-3) var(--space-2);
		background: rgba(0, 0, 0, 0.25);
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.05);
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.95);
		line-height: 1;
	}

	.stat-label {
		margin-top: 4px;
		font-size: 0.7rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: rgba(255, 255, 255, 0.55);
	}

	.errors-section {
		padding: var(--space-3);
		background: rgba(239, 68, 68, 0.08);
		border: 1px solid rgba(239, 68, 68, 0.25);
		border-radius: 8px;
	}

	.errors-title {
		margin-bottom: var(--space-2);
		font-size: 0.78rem;
		font-weight: 600;
		color: #f87171;
	}

	.errors-list {
		margin: 0;
		padding-left: var(--space-4);
		color: rgba(248, 113, 113, 0.95);
		font-size: 0.8rem;
		line-height: 1.5;
	}

	.errors-list li {
		margin-bottom: 2px;
	}
</style>
