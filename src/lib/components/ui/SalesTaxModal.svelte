<script lang="ts">
	import { AlertCircle, CheckCircle2, Globe, ShieldCheck } from 'lucide-svelte';
	import Modal from './Modal.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open, onClose }: Props = $props();

	const requiredStates = [
		'Arizona',
		'Colorado',
		'Indiana',
		'Massachusetts',
		'Michigan',
		'Minnesota',
		'North Carolina',
		'Ohio',
		'Pennsylvania',
		'South Carolina',
		'Tennessee',
		'Utah',
		'Washington',
		'Wisconsin'
	];

	const exemptStates = ['Alaska', 'Delaware', 'Montana', 'New Hampshire', 'Oregon'];
</script>

<Modal {open} {onClose} title="U.S. Sales Tax Guide {new Date().getFullYear()}">
	<div class="sales-tax-content">
		<!-- Required States -->
		<section class="tax-section">
			<h4 class="section-title section-title--required">
				<CheckCircle2 size={14} strokeWidth={2.25} />
				<span>Required to Collect</span>
				<span class="state-count">{requiredStates.length}</span>
			</h4>
			<div class="states-grid">
				{#each requiredStates as state (state)}
					<span class="state-tag state-tag--required">{state}</span>
				{/each}
			</div>
		</section>

		<!-- Exempt States -->
		<section class="tax-section">
			<h4 class="section-title section-title--exempt">
				<ShieldCheck size={14} strokeWidth={2.25} />
				<span>Exempt</span>
				<span class="state-count">{exemptStates.length}</span>
			</h4>
			<div class="states-grid">
				{#each exemptStates as state (state)}
					<span class="state-tag state-tag--exempt">{state}</span>
				{/each}
			</div>
		</section>

		<!-- Exception States -->
		<section class="tax-section">
			<h4 class="section-title section-title--exception">
				<AlertCircle size={14} strokeWidth={2.25} />
				<span>Exceptions</span>
			</h4>
			<div class="exception-note">
				<strong>California</strong> — Certain products and services exempt
			</div>
		</section>

		<!-- International -->
		<section class="tax-section">
			<h4 class="section-title">
				<Globe size={14} strokeWidth={2.25} />
				<span>International</span>
			</h4>
			<p class="info-note">Canada customers pay their own local and province taxes.</p>
		</section>
	</div>
</Modal>

<style>
	.sales-tax-content {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.tax-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.section-title {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		font-size: 0.8125rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		padding-bottom: 0.375rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		margin: 0;
		color: rgba(255, 255, 255, 0.7);
	}

	.state-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 22px;
		height: 18px;
		padding: 0 0.4rem;
		margin-left: auto;
		font-family: 'JetBrains Mono Variable', 'JetBrains Mono', monospace;
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0;
		text-transform: none;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 9999px;
		color: rgba(255, 255, 255, 0.65);
	}

	.section-title--required {
		color: #4ade80;
		border-bottom-color: rgba(74, 222, 128, 0.3);
	}

	.section-title--required .state-count {
		background: rgba(74, 222, 128, 0.12);
		border-color: rgba(74, 222, 128, 0.3);
		color: #4ade80;
	}

	.section-title--exempt {
		color: #60a5fa;
		border-bottom-color: rgba(96, 165, 250, 0.3);
	}

	.section-title--exempt .state-count {
		background: rgba(96, 165, 250, 0.12);
		border-color: rgba(96, 165, 250, 0.3);
		color: #60a5fa;
	}

	.section-title--exception {
		color: #fbbf24;
		border-bottom-color: rgba(251, 191, 36, 0.3);
	}

	.states-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.state-tag {
		padding: 0.25rem 0.625rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 500;
		transition:
			background 150ms var(--ease-out-quart),
			border-color 150ms var(--ease-out-quart);
	}

	.state-tag--required {
		background: rgba(74, 222, 128, 0.15);
		color: #4ade80;
		border: 1px solid rgba(74, 222, 128, 0.3);
	}

	.state-tag--required:hover {
		background: rgba(74, 222, 128, 0.25);
	}

	.state-tag--exempt {
		background: rgba(96, 165, 250, 0.15);
		color: #60a5fa;
		border: 1px solid rgba(96, 165, 250, 0.3);
	}

	.state-tag--exempt:hover {
		background: rgba(96, 165, 250, 0.25);
	}

	.exception-note {
		padding: 0.625rem 0.875rem;
		background: rgba(251, 191, 36, 0.1);
		border: 1px solid rgba(251, 191, 36, 0.25);
		border-radius: 8px;
		font-size: 0.8125rem;
		color: rgba(255, 255, 255, 0.9);
	}

	.exception-note strong {
		color: #fbbf24;
	}

	.info-note {
		margin: 0;
		font-size: 0.8125rem;
		color: rgba(255, 255, 255, 0.7);
		line-height: 1.5;
	}
</style>
