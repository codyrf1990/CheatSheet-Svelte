<script lang="ts">
	import Modal from './Modal.svelte';
	import { companiesStore } from '$stores/companies.svelte';
	import { toastStore } from '$stores/toast.svelte';

	interface Props {
		open: boolean;
		onclose: () => void;
	}

	let { open, onclose }: Props = $props();

	// Local state
	let searchQuery = $state('');

	// Reactive data from store
	let allCompanies = $derived(companiesStore.all);
	let currentCompany = $derived(companiesStore.current);

	// Filtered companies based on search
	let filteredCompanies = $derived.by(() => {
		if (!searchQuery.trim()) return allCompanies;
		return companiesStore.search(searchQuery);
	});

	function handleCompanySelect(companyId: string) {
		companiesStore.switchTo(companyId);
		onclose();
	}

	function handleNewCompany() {
		const name = prompt('New company name:');
		if (name?.trim()) {
			companiesStore.create(name.trim());
			toastStore.success('Company created');
		}
	}

	function handleRenameCompany(companyId: string, currentName: string) {
		const newName = prompt('Rename company:', currentName);
		if (newName?.trim() && newName !== currentName) {
			companiesStore.rename(companyId, newName.trim());
			toastStore.success('Company renamed');
		}
	}

	function handleDeleteCompany(companyId: string, companyName: string) {
		if (allCompanies.length <= 1) {
			toastStore.error('Cannot delete the last company');
			return;
		}
		if (confirm(`Delete "${companyName}"? This cannot be undone.`)) {
			companiesStore.delete(companyId);
			toastStore.success('Company deleted');
		}
	}

	// Reset search when modal opens
	$effect(() => {
		if (open) {
			searchQuery = '';
		}
	});
</script>

{#snippet footer()}
	<div class="modal-footer-content">
		<button type="button" class="new-company-btn" onclick={handleNewCompany}>
			+ New Company
		</button>
		<span class="company-count">{allCompanies.length} companies</span>
	</div>
{/snippet}

<Modal {open} {onclose} title="All Companies" {footer}>
	<div class="companies-content">
		<!-- Search (fixed) -->
		<div class="search-container">
			<input
				type="search"
				placeholder="Search companies..."
				bind:value={searchQuery}
				class="search-input"
				aria-label="Search companies"
			/>
		</div>

		<!-- Company List (scrollable) -->
		<div class="companies-list">
			{#if filteredCompanies.length > 0}
				{#each filteredCompanies as company (company.id)}
					<div class="company-row" class:active={company.id === currentCompany?.id}>
						<button
							type="button"
							class="company-name-btn"
							onclick={() => handleCompanySelect(company.id)}
						>
							<span class="company-name">{company.name}</span>
							{#if company.id === currentCompany?.id}
								<span class="current-badge">Current</span>
							{/if}
						</button>
						<div class="company-actions">
							<button
								type="button"
								class="action-btn"
								onclick={() => handleRenameCompany(company.id, company.name)}
								aria-label="Rename {company.name}"
							>
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
									<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
									<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
								</svg>
							</button>
							<button
								type="button"
								class="action-btn action-btn--danger"
								onclick={() => handleDeleteCompany(company.id, company.name)}
								aria-label="Delete {company.name}"
								disabled={allCompanies.length <= 1}
							>
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
									<polyline points="3 6 5 6 21 6" />
									<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
								</svg>
							</button>
						</div>
					</div>
				{/each}
			{:else}
				<div class="no-results">
					{#if searchQuery.trim()}
						No companies match "{searchQuery}"
					{:else}
						No companies yet
					{/if}
				</div>
			{/if}
		</div>
	</div>
</Modal>

<style>
	.companies-content {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		height: 350px;
	}

	.search-container {
		flex-shrink: 0;
	}

	.search-input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		color: #f5f5f5;
		font-size: 0.8125rem;
		transition: all 200ms ease;
	}

	.search-input::placeholder {
		color: rgba(255, 255, 255, 0.5);
	}

	.search-input:focus {
		outline: none;
		border-color: var(--color-solidcam-gold, #d4af37);
		box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
	}

	.companies-list {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding-right: 0.25rem;
	}

	.companies-list::-webkit-scrollbar {
		width: 6px;
	}

	.companies-list::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.2);
		border-radius: 3px;
	}

	.companies-list::-webkit-scrollbar-thumb {
		background: rgba(212, 175, 55, 0.3);
		border-radius: 3px;
	}

	.companies-list::-webkit-scrollbar-thumb:hover {
		background: rgba(212, 175, 55, 0.5);
	}

	.company-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.125rem;
		border-radius: 8px;
		transition: background 150ms ease;
	}

	.company-row:hover {
		background: rgba(255, 255, 255, 0.03);
	}

	.company-row.active {
		background: rgba(212, 175, 55, 0.08);
	}

	.company-name-btn {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.625rem;
		background: transparent;
		border: none;
		border-radius: 6px;
		color: rgba(255, 255, 255, 0.85);
		font-size: 0.8125rem;
		text-align: left;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.company-name-btn:hover {
		background: rgba(255, 255, 255, 0.06);
		color: #f5f5f5;
	}

	.company-row.active .company-name-btn {
		color: var(--color-solidcam-gold, #d4af37);
	}

	.company-name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.current-badge {
		flex-shrink: 0;
		padding: 0.125rem 0.375rem;
		background: rgba(212, 175, 55, 0.2);
		border-radius: 4px;
		font-size: 0.625rem;
		font-weight: 600;
		color: var(--color-solidcam-gold, #d4af37);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.company-actions {
		display: flex;
		gap: 0.25rem;
		flex-shrink: 0;
		opacity: 0;
		transition: opacity 150ms ease;
	}

	.company-row:hover .company-actions,
	.company-row:focus-within .company-actions {
		opacity: 1;
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		padding: 0;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		color: rgba(255, 255, 255, 0.6);
		cursor: pointer;
		transition: all 150ms ease;
	}

	.action-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.9);
		border-color: rgba(255, 255, 255, 0.2);
	}

	.action-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.action-btn--danger:hover:not(:disabled) {
		background: rgba(239, 68, 68, 0.15);
		color: #ef4444;
		border-color: rgba(239, 68, 68, 0.3);
	}

	.action-btn svg {
		width: 14px;
		height: 14px;
	}

	.no-results {
		padding: 2rem 1rem;
		text-align: center;
		color: rgba(255, 255, 255, 0.4);
		font-size: 0.8125rem;
	}

	/* Footer */
	.modal-footer-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
	}

	.new-company-btn {
		padding: 0.5rem 1rem;
		background: linear-gradient(145deg, #e8c547, #d4af37, #b8941f);
		border: none;
		border-radius: 8px;
		color: #1a1a1a;
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow:
			0 2px 8px rgba(212, 175, 55, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.25);
	}

	.new-company-btn:hover {
		transform: translateY(-1px);
		box-shadow:
			0 4px 16px rgba(212, 175, 55, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
	}

	.company-count {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.4);
	}
</style>
