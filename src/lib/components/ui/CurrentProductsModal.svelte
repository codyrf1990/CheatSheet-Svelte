<script lang="ts">
	import Modal from './Modal.svelte';

	interface Props {
		open: boolean;
		onclose: () => void;
	}

	let { open, onclose }: Props = $props();

	type TabId = 'overview' | 'milling' | 'other' | 'training' | 'posts';
	let activeTab = $state<TabId>('overview');

	const tabs: { id: TabId; label: string }[] = [
		{ id: 'overview', label: 'Overview' },
		{ id: 'milling', label: 'Milling' },
		{ id: 'other', label: 'Other Modules' },
		{ id: 'training', label: 'Training' },
		{ id: 'posts', label: 'Post Processors' }
	];

	// Data structures for cleaner rendering
	const foundationalPackages = [
		{
			product: 'SolidCAM Milling',
			sku: 'SC-Mill',
			desc: '2.5D toolpaths, 4th/5th indexing, C Axis Wrap, AFRM, Multi-Depth Drilling, HSS'
		},
		{
			product: 'SolidCAM Turning',
			sku: 'SC-Turn',
			desc: 'Foundational 2 Axis Turning including Back Spindle'
		}
	];

	const swBundles = [
		{
			product: 'Milling + SOLIDWORKS',
			sku: 'SW-SC-Mill',
			note: 'Adjust description to specific SW version'
		},
		{
			product: 'Turning + SOLIDWORKS',
			sku: 'SW-SC-Turn',
			note: 'Adjust description to specific SW version'
		}
	];

	const upgradePackages = [
		{
			pkg: 'Advanced Milling',
			sku: 'SC-Mill-Adv',
			includes: 'iMachining 2D, Edge Breaking, Advanced Machine Simulation'
		},
		{
			pkg: '3D High Performance',
			sku: 'SC-Mill-3D',
			includes: 'iMachining 3D, HSM (Requires iMachining 2D)'
		},
		{
			pkg: '5 Axis Milling',
			sku: 'SC-Mill-5Axis',
			includes: 'Sim 4/5 Axis, Auto 3+2, Rotary, HSM to 5X Conversion, Geodesic, SWARF, Multiaxis'
		}
	];

	const swProductCodes = [
		{ code: 'SW-P', name: 'Parts' },
		{ code: 'SW-PA', name: 'Parts & Assemblies' },
		{ code: 'SW-Std', name: 'Standard' },
		{ code: 'SW-Pro', name: 'Professional' },
		{ code: 'SW-Std-Net', name: 'Standard Networked' },
		{ code: 'SW-Pro-Net', name: 'Professional Networked' }
	];

	const millingModules = [
		{
			name: '2.5D Milling + AFRM',
			sku: 'SC-25M',
			desc: 'Profile, Pocket, Drilling, Automatic Feature Recognition, Multi-Depth-Drilling, 4th/5th Indexing, C Axis Wrap'
		},
		{
			name: 'High-Speed Surfacing (HSS)',
			sku: 'SC-HSS',
			desc: 'Surface machining strategies for efficient, smooth, gouge-free toolpaths'
		},
		{
			name: 'High-Speed Roughing (HSR)',
			sku: 'SC-HSR',
			desc: 'Overall roughing of complex 3D parts (molds/dies), optimized for high-speed motion'
		},
		{
			name: 'High-Speed Machining (HSM)',
			sku: 'SC-HSM',
			desc: 'Roughing and finishing of complex 3D parts, includes HSR'
		},
		{
			name: 'iMachining 2D',
			sku: 'SC-iMach2d',
			desc: 'Constant tool engagement, knowledge-based Technology Wizard'
		},
		{
			name: 'iMachining 3D',
			sku: 'SC-iMach3D',
			desc: 'Automated roughing and rest roughing for 3D parts'
		},
		{
			name: 'Simultaneous 4 Axis',
			sku: 'SC-Sim4x',
			desc: 'Continuous 4-axis movement with collision checking'
		},
		{
			name: 'Simultaneous 5 Axis Standard',
			sku: 'SC-Sim5x',
			desc: 'Auto 3+2 Roughing, Rotary, HSM to 5X Conversion, Geodesic, SWARF'
		},
		{ name: 'Edge Breaking', sku: 'SC-EdgeBreak', desc: 'Automatic deburring with precise orientation' },
		{ name: 'Edge Trimming', sku: 'SC-EdgeTrim', desc: 'Precise trimming of thin materials' },
		{
			name: 'Auto 3+2 Roughing',
			sku: 'SC-Auto32',
			desc: 'Intelligent 3+2 axis positioning and machining'
		}
	];

	const turningModules = [
		{
			name: 'Multi-Turret Sync',
			sku: 'SC-MTS',
			desc: 'Coordinates multiple turrets for simultaneous machining'
		},
		{ name: 'Swiss', sku: 'SC-Swiss', desc: 'Advanced programming for Swiss CNC machines' }
	];

	const addonModules = [
		{
			name: 'Machine Simulation',
			sku: 'SC-MachSim',
			desc: 'Advanced collision detection using 3D machine models'
		},
		{
			name: 'Solid Probe',
			sku: 'SC-Probe',
			desc: 'Home definition, On-Machine Verification, Tool Presetter'
		},
		{
			name: 'Vericut Integration',
			sku: 'SC-Vericut',
			desc: 'Integration for Vericut G-code Simulation software'
		}
	];

	const solidShopModules = [
		{ name: 'CIMCO Editor', sku: 'SolidShop-Editor', desc: 'G-Code editor with simulation tools' },
		{
			name: 'SolidCAM for Operators',
			sku: 'SC-4Op',
			desc: 'Shop floor modifications and simulations'
		},
		{
			name: 'Operators - Sim Only',
			sku: 'SC-4Op-Sim',
			desc: 'Simulation access only at the machine'
		}
	];

	const trainingCredits = [
		{ sku: 'SC-Mill', credits: '2 credits' },
		{ sku: 'SC-Mill-Adv', credits: '1 credit' },
		{ sku: 'SC-Mill-3D', credits: '2 credits' },
		{ sku: 'SC-Mill-5Axis', credits: '2 credits' },
		{ sku: 'SC-MTS', credits: '2 credits' }
	];

	const trainingHours = [
		{
			sku: 'Train-2hr',
			desc: 'One 2-hour 1-on-1 web training (expires 12 mo)',
			price: '$350'
		},
		{
			sku: 'Train-8hr',
			desc: 'Four 2-hour 1-on-1 web sessions (expires 12 mo)',
			price: '$1,295'
		},
		{
			sku: 'Train-Onsite',
			desc: 'Onsite training per day (+ travel costs)',
			price: '$2,500'
		}
	];

	const discountCodes = [
		{ code: 'Discount-Software', usage: 'All software discounts' },
		{ code: 'Discount-Post', usage: 'Post discounts (requires Post Manager approval)' },
		{ code: 'VCD', usage: 'Valued Customer Discount (pre-2025 CLR customers)' },
		{ code: 'Tier-Discount', usage: 'Based on Total Software Value (TSV)' }
	];

	const postProcessors = [
		{ name: '3X Milling', sku: 'Post-3X', derv: 'Post-3X-Derv' },
		{ name: '4X Milling', sku: 'Post-4X', derv: 'Post-4X-Derv' },
		{ name: '5X Milling', sku: 'Post-5X', derv: 'Post-5X-Derv' },
		{ name: 'Turning', sku: 'Post-Turn', derv: 'Post-Turn-Derv' },
		{ name: 'Mill-Turn 1 Channel', sku: 'Post-MT1', derv: 'Post-MT1-Derv' },
		{ name: 'Mill-Turn 2 Channel *', sku: 'Post-MT2', derv: 'Post-MT2-Derv' },
		{ name: 'Mill-Turn 3+ Channel *', sku: 'Post-MT3', derv: 'Post-MT3-Derv' },
		{ name: 'Swiss Basic *', sku: 'Post-Swiss', derv: 'Post-Swiss-Derv' },
		{ name: 'Swiss Advanced *', sku: 'Post-Swiss-Adv', derv: 'Post-Swiss-Adv-Derv' },
		{ name: 'Swiss 3+ Channel *', sku: 'Post-Swiss-3Ch', derv: 'Post-Swiss-3Ch-Derv' }
	];

	const simDevelopment = [
		{ code: 'PSim-3X', name: '3X Milling' },
		{ code: 'PSim-4X', name: '4X Milling' },
		{ code: 'PSim-5X', name: '5X Milling' },
		{ code: 'PSim-Turn', name: 'Turning' },
		{ code: 'PSim-MT', name: 'Mill-Turn' },
		{ code: 'PSim-Swiss', name: 'Swiss' }
	];
</script>

<Modal {open} {onclose} title="SolidCAM Product Catalog" size="wide">
	<!-- Tabs -->
	<div class="tabs-container" role="tablist" aria-label="Product categories">
		{#each tabs as tab}
			<button
				role="tab"
				class="tab-btn"
				class:active={activeTab === tab.id}
				aria-selected={activeTab === tab.id}
				onclick={() => (activeTab = tab.id)}
			>
				{tab.label}
			</button>
		{/each}
	</div>

	<!-- Tab Content -->
	<div class="tab-content" role="tabpanel" aria-label="{tabs.find(t => t.id === activeTab)?.label || 'Content'}">
		{#if activeTab === 'overview'}
			<!-- Overview Tab -->
			<section class="section">
				<h4 class="section-title">Foundational Packages</h4>
				<div class="data-table">
					<div class="table-row table-header">
						<span>Product</span>
						<span>SKU</span>
						<span>Description</span>
					</div>
					{#each foundationalPackages as item}
						<div class="table-row">
							<strong>{item.product}</strong>
							<code>{item.sku}</code>
							<span>{item.desc}</span>
						</div>
					{/each}
				</div>
			</section>

			<section class="section">
				<h4 class="section-title">SW Bundles</h4>
				<div class="data-table">
					<div class="table-row table-header">
						<span>Product</span>
						<span>SKU</span>
						<span>Note</span>
					</div>
					{#each swBundles as item}
						<div class="table-row">
							<strong>{item.product}</strong>
							<code>{item.sku}</code>
							<span>{item.note}</span>
						</div>
					{/each}
				</div>
			</section>

			<section class="section">
				<h4 class="section-title">Upgrade Packages</h4>
				<div class="data-table">
					<div class="table-row table-header">
						<span>Package</span>
						<span>SKU</span>
						<span>Includes</span>
					</div>
					{#each upgradePackages as item}
						<div class="table-row">
							<strong>{item.pkg}</strong>
							<code>{item.sku}</code>
							<span>{item.includes}</span>
						</div>
					{/each}
				</div>
			</section>

			<section class="section">
				<h4 class="section-title">SOLIDWORKS Product Codes</h4>
				<div class="code-grid">
					{#each swProductCodes as item}
						<div class="code-item">
							<code>{item.code}</code>
							<span>{item.name}</span>
						</div>
					{/each}
				</div>
				<p class="note">
					Add <code>-Maint</code> suffix for maintenance SKUs
				</p>
			</section>
		{:else if activeTab === 'milling'}
			<!-- Milling Tab -->
			<section class="section">
				<h4 class="section-title">Milling Modules</h4>
				<div class="module-list">
					{#each millingModules as mod}
						<div class="module-item">
							<div class="module-header">
								<strong>{mod.name}</strong>
								<code>{mod.sku}</code>
							</div>
							<p>{mod.desc}</p>
						</div>
					{/each}
				</div>
			</section>
		{:else if activeTab === 'other'}
			<!-- Other Modules Tab -->
			<section class="section">
				<h4 class="section-title">Turning Modules</h4>
				<div class="module-list">
					{#each turningModules as mod}
						<div class="module-item">
							<div class="module-header">
								<strong>{mod.name}</strong>
								<code>{mod.sku}</code>
							</div>
							<p>{mod.desc}</p>
						</div>
					{/each}
				</div>
			</section>

			<section class="section">
				<h4 class="section-title">Add-on Modules</h4>
				<div class="module-list">
					{#each addonModules as mod}
						<div class="module-item">
							<div class="module-header">
								<strong>{mod.name}</strong>
								<code>{mod.sku}</code>
							</div>
							<p>{mod.desc}</p>
						</div>
					{/each}
				</div>
			</section>

			<section class="section">
				<h4 class="section-title">SolidShop</h4>
				<div class="module-list">
					{#each solidShopModules as mod}
						<div class="module-item">
							<div class="module-header">
								<strong>{mod.name}</strong>
								<code>{mod.sku}</code>
							</div>
							<p>{mod.desc}</p>
						</div>
					{/each}
				</div>
			</section>
		{:else if activeTab === 'training'}
			<!-- Training Tab -->
			<section class="section">
				<h4 class="section-title">Training Credits</h4>
				<p class="note">Credits apply to 1 hour remote training or $100 toward onsite training</p>
				<div class="code-grid">
					{#each trainingCredits as item}
						<div class="code-item">
							<code>{item.sku}</code>
							<span>{item.credits}</span>
						</div>
					{/each}
				</div>
			</section>

			<section class="section">
				<h4 class="section-title">Training Hours & Onsite</h4>
				<div class="data-table">
					<div class="table-row table-header">
						<span>SKU</span>
						<span>Description</span>
						<span>Price</span>
					</div>
					{#each trainingHours as item}
						<div class="table-row">
							<code>{item.sku}</code>
							<span>{item.desc}</span>
							<strong class="price">{item.price}</strong>
						</div>
					{/each}
				</div>
			</section>

			<section class="section">
				<h4 class="section-title">Discounts</h4>
				<div class="discount-info">
					<div class="discount-block">
						<strong>Standard Promotions</strong>
						<p>10% off 2nd seat+ on single order OR up to 5% discretionary</p>
					</div>
					<div class="discount-block">
						<strong>Renewals</strong>
						<p>Year 2: 5% off &bull; Year 3: 10% off</p>
					</div>
				</div>

				<div class="data-table" style="margin-top: 0.75rem;">
					<div class="table-row table-header">
						<span>Code</span>
						<span>Usage</span>
					</div>
					{#each discountCodes as item}
						<div class="table-row">
							<code>{item.code}</code>
							<span>{item.usage}</span>
						</div>
					{/each}
				</div>

				<div class="tier-info">
					<strong>Tier Discounts (based on TSV):</strong>
					<ul>
						<li>Tier 3 ($100k-$199k): 10% off</li>
						<li>Tier 2 ($200k-$299k): 15% off</li>
						<li>Tier 1 ($300k+): 20% off</li>
					</ul>
				</div>
			</section>
		{:else if activeTab === 'posts'}
			<!-- Post Processors Tab -->
			<section class="section">
				<h4 class="section-title">Post Processor Services</h4>
				<p class="note">Lead time: 4-6 weeks. * = Simulation required</p>
				<div class="module-list">
					{#each postProcessors as post}
						<div class="module-item module-item--compact">
							<div class="module-header">
								<strong>{post.name}</strong>
								<span class="sku-pair">
									<code>{post.sku}</code> / <code>{post.derv}</code>
								</span>
							</div>
						</div>
					{/each}
				</div>
			</section>

			<section class="section">
				<h4 class="section-title">Machine Simulation Development</h4>
				<p class="note">Customer must supply SolidWorks models of machine</p>
				<div class="code-grid">
					{#each simDevelopment as item}
						<div class="code-item">
							<code>{item.code}</code>
							<span>{item.name}</span>
						</div>
					{/each}
				</div>
			</section>
		{/if}
	</div>
</Modal>

<style>
	.tabs-container {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		margin-bottom: 1rem;
	}

	.tab-btn {
		padding: 0.5rem 0.875rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.6);
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.tab-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.9);
	}

	.tab-btn.active {
		background: rgba(212, 175, 55, 0.2);
		color: #d4af37;
		border-color: rgba(212, 175, 55, 0.4);
	}

	.tab-content {
		max-height: 60vh;
		overflow-y: auto;
		padding-right: 0.5rem;
	}

	.section {
		margin-bottom: 1.25rem;
	}

	.section:last-child {
		margin-bottom: 0;
	}

	.section-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: #d4af37;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 0.625rem 0;
		padding-bottom: 0.375rem;
		border-bottom: 1px solid rgba(212, 175, 55, 0.3);
	}

	.data-table {
		display: flex;
		flex-direction: column;
		gap: 0;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		overflow: hidden;
	}

	.table-row {
		display: grid;
		grid-template-columns: 1fr 1fr 2fr;
		gap: 0.75rem;
		padding: 0.5rem 0.75rem;
		font-size: 0.75rem;
		align-items: center;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	.table-row:last-child {
		border-bottom: none;
	}

	.table-header {
		background: rgba(255, 255, 255, 0.05);
		font-weight: 600;
		color: rgba(255, 255, 255, 0.7);
		text-transform: uppercase;
		font-size: 0.6875rem;
		letter-spacing: 0.05em;
	}

	.table-row code {
		background: rgba(200, 16, 46, 0.2);
		color: #f87171;
		padding: 0.125rem 0.375rem;
		border-radius: 4px;
		font-size: 0.6875rem;
		font-family: 'JetBrains Mono', monospace;
	}

	.table-row strong {
		color: rgba(255, 255, 255, 0.95);
	}

	.price {
		color: #4ade80 !important;
	}

	.code-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 0.375rem;
	}

	.code-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.625rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 6px;
		font-size: 0.75rem;
	}

	.code-item code {
		background: rgba(200, 16, 46, 0.2);
		color: #f87171;
		padding: 0.125rem 0.375rem;
		border-radius: 4px;
		font-size: 0.6875rem;
		font-family: 'JetBrains Mono', monospace;
	}

	.code-item span {
		color: rgba(255, 255, 255, 0.7);
	}

	.note {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
		margin: 0.375rem 0 0.625rem 0;
		font-style: italic;
	}

	.note code {
		background: rgba(200, 16, 46, 0.2);
		color: #f87171;
		padding: 0.125rem 0.25rem;
		border-radius: 3px;
		font-size: 0.6875rem;
		font-style: normal;
	}

	.module-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.module-item {
		padding: 0.625rem 0.75rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 8px;
	}

	.module-item--compact {
		padding: 0.5rem 0.75rem;
	}

	.module-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.module-header strong {
		color: rgba(255, 255, 255, 0.95);
		font-size: 0.8125rem;
	}

	.module-header code {
		background: rgba(200, 16, 46, 0.2);
		color: #f87171;
		padding: 0.125rem 0.375rem;
		border-radius: 4px;
		font-size: 0.6875rem;
		font-family: 'JetBrains Mono', monospace;
	}

	.module-item p {
		margin: 0.375rem 0 0 0;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.6);
		line-height: 1.4;
	}

	.sku-pair {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.discount-info {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 0.625rem;
	}

	.discount-block {
		padding: 0.625rem 0.75rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 8px;
	}

	.discount-block strong {
		font-size: 0.8125rem;
		color: rgba(255, 255, 255, 0.9);
	}

	.discount-block p {
		margin: 0.25rem 0 0 0;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.6);
	}

	.tier-info {
		margin-top: 0.75rem;
		padding: 0.625rem 0.75rem;
		background: rgba(74, 222, 128, 0.08);
		border: 1px solid rgba(74, 222, 128, 0.2);
		border-radius: 8px;
		font-size: 0.75rem;
	}

	.tier-info strong {
		color: #4ade80;
	}

	.tier-info ul {
		margin: 0.375rem 0 0 1rem;
		padding: 0;
		color: rgba(255, 255, 255, 0.7);
	}

	.tier-info li {
		margin: 0.125rem 0;
	}

	/* Scrollbar styling */
	.tab-content::-webkit-scrollbar {
		width: 6px;
	}

	.tab-content::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 3px;
	}

	.tab-content::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.15);
		border-radius: 3px;
	}

	.tab-content::-webkit-scrollbar-thumb:hover {
		background: rgba(212, 175, 55, 0.4);
	}
</style>
