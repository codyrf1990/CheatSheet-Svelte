<script lang="ts">
	import type { SyncStatus } from '$types';
	import Logo from './Logo.svelte';
	import UserAvatar from './UserAvatar.svelte';
	import SmokedGlassCard from '$components/ui/SmokedGlassCard.svelte';

	interface Props {
		syncUsername: string | null;
		syncStatus: SyncStatus;
		onLogout: () => void;
		onOperationsClick?: (position: { top: number; left: number }) => void;
		showOperationsDropdown?: boolean;
		onCFToolsClick?: (position: { top: number; left: number }) => void;
		showCFToolsDropdown?: boolean;
	}

	let {
		syncUsername,
		syncStatus,
		onLogout,
		onOperationsClick,
		showOperationsDropdown = false,
		onCFToolsClick,
		showCFToolsDropdown = false
	}: Props = $props();

	// SolidCAM navigation links with icons - matching Machine Research exactly
	const navLinks = [
		{ label: 'Main Support', href: 'https://us.solidcam.com/contact-support/', color: 'red', icon: 'support' },
		{ label: 'Ticket Site', href: 'https://solidcamsupport.com/', color: 'red', icon: 'ticket' },
		{ label: 'University', href: 'https://www.youtube.com/c/SolidCAMUniversity', color: 'purple', icon: 'video' },
		{ label: 'Academy', href: 'https://elearning-solidcam.talentlms.com/', color: 'blue', icon: 'book' },
		{ label: 'ChatBot', href: 'https://www.solidcamchat.com/', color: 'orange', icon: 'chat' }
	];

	function handleOperationsClick(e: MouseEvent) {
		const button = e.currentTarget as HTMLElement;
		const rect = button.getBoundingClientRect();
		onOperationsClick?.({
			top: rect.bottom + 8,
			left: rect.left
		});
	}

	function handleOperationsKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			const button = e.currentTarget as HTMLElement;
			const rect = button.getBoundingClientRect();
			onOperationsClick?.({
				top: rect.bottom + 8,
				left: rect.left
			});
		}
	}

	function handleCFToolsClick(e: MouseEvent) {
		const button = e.currentTarget as HTMLElement;
		const rect = button.getBoundingClientRect();
		onCFToolsClick?.({
			top: rect.bottom + 8,
			left: rect.left
		});
	}

	function handleCFToolsKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			const button = e.currentTarget as HTMLElement;
			const rect = button.getBoundingClientRect();
			onCFToolsClick?.({
				top: rect.bottom + 8,
				left: rect.left
			});
		}
	}
</script>

<SmokedGlassCard padding="none" class="header">
	<!-- Column 1: Logo -->
	<div class="header-logo">
		<Logo />
	</div>

	<!-- Column 2: Title and Nav (centered) -->
	<div class="header-content">
		<div class="title-container">
			<div class="title-glow"></div>
			<h1 class="header-title">Packages & Maintenance Cheat Sheet</h1>
		</div>

		<nav class="header-nav">
			<!-- Row 1: External links -->
			<div class="nav-row">
				{#each navLinks as link}
					<a href={link.href} target="_blank" rel="noopener noreferrer" class="nav-link nav-{link.color}">
						<span class="nav-icon">
							{#if link.icon === 'support'}
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r=".5" fill="currentColor"/></svg>
							{:else if link.icon === 'ticket'}
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 002 2 2 2 0 010 4 2 2 0 00-2 2v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 00-2-2 2 2 0 010-4 2 2 0 002-2V7a2 2 0 00-2-2H5z"/></svg>
							{:else if link.icon === 'video'}
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
							{:else if link.icon === 'book'}
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
							{:else if link.icon === 'chat'}
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
							{/if}
						</span>
						<span class="nav-label">{link.label}</span>
						<span class="nav-external">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
						</span>
					</a>
				{/each}
			</div>

			<!-- Row 2: Dropdowns -->
			<div class="nav-row">
				<div class="operations-dropdown">
					<button
						class="nav-link nav-gray operations-btn"
						class:active={showOperationsDropdown}
						onclick={handleOperationsClick}
						onkeydown={handleOperationsKeydown}
						aria-haspopup="true"
						aria-expanded={showOperationsDropdown}
					>
						<span class="nav-icon">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
						</span>
						<span class="nav-label">Operations</span>
						<svg
							class="dropdown-arrow"
							class:open={showOperationsDropdown}
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<polyline points="6 9 12 15 18 9"></polyline>
						</svg>
					</button>
				</div>

				<div class="cf-tools-dropdown">
					<button
						class="nav-link nav-gray cf-tools-btn"
						class:active={showCFToolsDropdown}
						onclick={handleCFToolsClick}
						onkeydown={handleCFToolsKeydown}
						aria-haspopup="true"
						aria-expanded={showCFToolsDropdown}
					>
						<span class="nav-icon">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
						</span>
						<span class="nav-label">CF Tools</span>
						<svg
							class="dropdown-arrow"
							class:open={showCFToolsDropdown}
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<polyline points="6 9 12 15 18 9"></polyline>
						</svg>
					</button>
				</div>
			</div>
		</nav>
	</div>

	<!-- Column 3: User -->
	<div class="header-user">
		<UserAvatar
			username={syncUsername}
			status={syncStatus}
			{onLogout}
		/>
	</div>
</SmokedGlassCard>

<style>
	:global(.header) {
		position: relative;
		overflow: hidden;
	}

	/* Apply grid directly to .header (SmokedGlassCard renders children directly) */
	:global(.header) {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		gap: clamp(0.4rem, 1.5vw, 0.75rem);
		align-items: center;
		padding: clamp(0.2rem, 0.5vw, 0.4rem);
	}

	/* Subtle animated border glow - very slow */
	:global(.header)::before {
		content: '';
		position: absolute;
		inset: -1px;
		background: linear-gradient(90deg,
			transparent 0%,
			rgba(212, 175, 55, 0.2) 25%,
			rgba(200, 16, 46, 0.15) 50%,
			rgba(212, 175, 55, 0.2) 75%,
			transparent 100%
		);
		background-size: 200% 100%;
		animation: borderShimmer 25s linear infinite;
		border-radius: inherit;
		z-index: -1;
		opacity: 0.35;
	}

	@keyframes borderShimmer {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	.header-logo {
		display: flex;
		align-items: center;
	}

	.header-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.title-container {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.title-glow {
		position: absolute;
		inset: -20px -40px;
		background: radial-gradient(ellipse at center, rgba(212, 175, 55, 0.1) 0%, transparent 70%);
		pointer-events: none;
		opacity: 0.6;
	}

	.header-title {
		font-size: 1rem;
		font-weight: 700;
		color: #f5f5f5;
		margin: 0;
		text-align: center;
		letter-spacing: -0.02em;
		background: linear-gradient(135deg, #ffffff 0%, #e8d59a 50%, #ffffff 100%);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
		position: relative;
		z-index: 1;
	}

	.header-nav {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		align-items: center;
	}

	.nav-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.2rem;
		align-items: center;
		justify-content: center;
	}

	.nav-link {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		padding: 0.15rem 0.4rem;
		font-size: 0.7rem;
		font-weight: 500;
		border-radius: 6px;
		text-decoration: none;
		transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
		border: 1px solid transparent;
		cursor: pointer;
		position: relative;
		overflow: hidden;
	}

	.nav-link::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%);
		opacity: 0;
		transition: opacity 200ms ease;
	}

	.nav-link:hover::before {
		opacity: 1;
	}

	.nav-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 14px;
		height: 14px;
		flex-shrink: 0;
	}

	.nav-icon svg {
		width: 12px;
		height: 12px;
	}

	.nav-label {
		position: relative;
	}

	.nav-external {
		display: flex;
		align-items: center;
		opacity: 0;
		transform: translateX(-4px);
		transition: all 200ms ease;
	}

	.nav-external svg {
		width: 10px;
		height: 10px;
	}

	.nav-link:hover .nav-external {
		opacity: 0.6;
		transform: translateX(0);
	}

	.nav-red {
		background: rgba(200, 16, 46, 0.12);
		color: #ef4444;
		border-color: rgba(200, 16, 46, 0.15);
	}
	.nav-red:hover {
		background: rgba(200, 16, 46, 0.22);
		border-color: rgba(200, 16, 46, 0.35);
		box-shadow: 0 4px 20px rgba(200, 16, 46, 0.2), inset 0 1px 0 rgba(255,255,255,0.1);
		transform: translateY(-2px);
	}

	.nav-purple {
		background: rgba(147, 51, 234, 0.12);
		color: #a855f7;
		border-color: rgba(147, 51, 234, 0.15);
	}
	.nav-purple:hover {
		background: rgba(147, 51, 234, 0.22);
		border-color: rgba(147, 51, 234, 0.35);
		box-shadow: 0 4px 20px rgba(147, 51, 234, 0.2), inset 0 1px 0 rgba(255,255,255,0.1);
		transform: translateY(-2px);
	}

	.nav-blue {
		background: rgba(59, 130, 246, 0.12);
		color: #3b82f6;
		border-color: rgba(59, 130, 246, 0.15);
	}
	.nav-blue:hover {
		background: rgba(59, 130, 246, 0.22);
		border-color: rgba(59, 130, 246, 0.35);
		box-shadow: 0 4px 20px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255,255,255,0.1);
		transform: translateY(-2px);
	}

	.nav-orange {
		background: rgba(249, 115, 22, 0.12);
		color: #f97316;
		border-color: rgba(249, 115, 22, 0.15);
	}
	.nav-orange:hover {
		background: rgba(249, 115, 22, 0.22);
		border-color: rgba(249, 115, 22, 0.35);
		box-shadow: 0 4px 20px rgba(249, 115, 22, 0.2), inset 0 1px 0 rgba(255,255,255,0.1);
		transform: translateY(-2px);
	}

	.nav-gray {
		background: rgba(255, 255, 255, 0.06);
		color: rgba(255, 255, 255, 0.75);
		border-color: rgba(255, 255, 255, 0.08);
	}
	.nav-gray:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.18);
		box-shadow: 0 4px 20px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255,255,255,0.1);
		transform: translateY(-2px);
	}
	.nav-gray.active {
		background: rgba(212, 175, 55, 0.15);
		border-color: rgba(212, 175, 55, 0.3);
		color: #d4af37;
	}

	.operations-dropdown,
	.cf-tools-dropdown {
		position: relative;
	}

	.operations-btn,
	.cf-tools-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
	}

	.dropdown-arrow {
		width: 12px;
		height: 12px;
		transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
		opacity: 0.6;
	}
	.dropdown-arrow.open {
		transform: rotate(180deg);
	}

	.header-user {
		flex-shrink: 0;
	}

	/* Focus states */
	.nav-link:focus-visible {
		outline: 2px solid var(--color-solidcam-gold, #d4af37);
		outline-offset: 2px;
	}

	/* Compact header at medium widths - keep 3-column grid */
	@media (max-width: 900px) {
		:global(.header) {
			gap: 0.4rem;
			padding: 0.25rem 0.35rem;
		}

		.header-title {
			font-size: 0.95rem;
		}

		.nav-link {
			font-size: 0.65rem;
			padding: 0.15rem 0.35rem;
		}

		.nav-icon svg {
			width: 11px;
			height: 11px;
		}

		.nav-label {
			display: none;
		}
	}

	/* Ultra-compact at narrow - still keep 3-column grid */
	@media (max-width: 768px) {
		:global(.header) {
			gap: 0.3rem;
			padding: 0.2rem 0.25rem;
		}

		.header-title {
			font-size: 0.85rem;
		}

		.nav-row {
			gap: 0.15rem;
		}

		.nav-link {
			font-size: 0.6rem;
			padding: 0.125rem 0.25rem;
			border-radius: 6px;
		}

		.nav-icon svg {
			width: 10px;
			height: 10px;
		}

		.dropdown-arrow {
			width: 10px;
			height: 10px;
		}
	}

	/* Ultra-compact for split-screen */
	@media (max-width: 680px) {
		:global(.header) {
			gap: 0.2rem;
			padding: 0.15rem 0.2rem;
		}

		.header-title {
			font-size: 0.75rem;
		}

		.header-content {
			gap: 0.15rem;
		}

		.header-nav {
			gap: 0.2rem;
		}

		.nav-link {
			font-size: 0.55rem;
			padding: 0.1rem 0.2rem;
		}

		.nav-row {
			gap: 0.1rem;
		}

		.nav-icon {
			width: 12px;
			height: 12px;
		}

		.nav-icon svg {
			width: 9px;
			height: 9px;
		}

		.nav-external {
			display: none;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		:global(.header)::before,
		.title-glow {
			animation: none;
		}
	}
</style>
