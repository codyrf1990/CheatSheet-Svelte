<script lang="ts">
	import {
		ArrowUpRight,
		BookOpen,
		ChevronDown,
		LifeBuoy,
		MessageCircle,
		Settings,
		Ticket,
		Wrench,
		GraduationCap
	} from 'lucide-svelte';
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

	const navLinks = [
		{
			label: 'Main Support',
			href: 'https://us.solidcam.com/contact-support/',
			color: 'red' as const,
			Icon: LifeBuoy
		},
		{
			label: 'Ticket Site',
			href: 'https://solidcamsupport.com/',
			color: 'red' as const,
			Icon: Ticket
		},
		{
			label: 'University',
			href: 'https://www.youtube.com/c/SolidCAMUniversity',
			color: 'purple' as const,
			Icon: GraduationCap
		},
		{
			label: 'Academy',
			href: 'https://elearning-solidcam.talentlms.com/',
			color: 'blue' as const,
			Icon: BookOpen
		},
		{
			label: 'ChatBot',
			href: 'https://www.solidcamchat.com/',
			color: 'orange' as const,
			Icon: MessageCircle
		}
	];

	function handleOperationsClick(e: MouseEvent) {
		const button = e.currentTarget as HTMLElement;
		const rect = button.getBoundingClientRect();
		onOperationsClick?.({ top: rect.bottom + 8, left: rect.left });
	}

	function handleOperationsKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			const button = e.currentTarget as HTMLElement;
			const rect = button.getBoundingClientRect();
			onOperationsClick?.({ top: rect.bottom + 8, left: rect.left });
		}
	}

	function handleCFToolsClick(e: MouseEvent) {
		const button = e.currentTarget as HTMLElement;
		const rect = button.getBoundingClientRect();
		onCFToolsClick?.({ top: rect.bottom + 8, left: rect.left });
	}

	function handleCFToolsKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			const button = e.currentTarget as HTMLElement;
			const rect = button.getBoundingClientRect();
			onCFToolsClick?.({ top: rect.bottom + 8, left: rect.left });
		}
	}
</script>

<header class="header-shell">
	<SmokedGlassCard padding="none" class="header">
		<!-- Column 1: Logo -->
		<div class="header-logo">
			<Logo />
		</div>

		<!-- Column 2: Title and Nav (centered) -->
		<div class="header-content">
			<div class="title-container">
				<h1 class="header-title">
					Packages <span class="title-amp">&amp;</span> Maintenance Cheat Sheet
				</h1>
				<div class="title-underline" aria-hidden="true"></div>
			</div>

			<nav class="header-nav" aria-label="Main navigation">
				<!-- Row 1: External links -->
				<div class="nav-row">
					{#each navLinks as link (link.href)}
						{@const Icon = link.Icon}
						<a
							href={link.href}
							target="_blank"
							rel="noopener noreferrer"
							class="nav-link nav-{link.color}"
							aria-label="{link.label} (opens in new window)"
						>
							<span class="nav-icon" aria-hidden="true">
								<Icon size={12} strokeWidth={2} />
							</span>
							<span class="nav-label">{link.label}</span>
							<span class="nav-external" aria-hidden="true">
								<ArrowUpRight size={10} strokeWidth={2} />
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
							aria-haspopup="menu"
							aria-expanded={showOperationsDropdown}
							aria-label="Operations menu"
						>
							<span class="nav-icon" aria-hidden="true">
								<Settings size={12} strokeWidth={2} />
							</span>
							<span class="nav-label">Operations</span>
							<span class="dropdown-arrow" class:open={showOperationsDropdown} aria-hidden="true">
								<ChevronDown size={12} strokeWidth={2} />
							</span>
						</button>
					</div>

					<div class="cf-tools-dropdown">
						<button
							class="nav-link nav-gray cf-tools-btn"
							class:active={showCFToolsDropdown}
							onclick={handleCFToolsClick}
							onkeydown={handleCFToolsKeydown}
							aria-haspopup="menu"
							aria-expanded={showCFToolsDropdown}
							aria-label="CF Tools menu"
						>
							<span class="nav-icon" aria-hidden="true">
								<Wrench size={12} strokeWidth={2} />
							</span>
							<span class="nav-label">CF Tools</span>
							<span class="dropdown-arrow" class:open={showCFToolsDropdown} aria-hidden="true">
								<ChevronDown size={12} strokeWidth={2} />
							</span>
						</button>
					</div>
				</div>
			</nav>
		</div>

		<!-- Column 3: User -->
		<div class="header-user">
			<UserAvatar username={syncUsername} status={syncStatus} {onLogout} />
		</div>
	</SmokedGlassCard>
</header>

<style>
	:global(.header) {
		position: relative;
		z-index: 100; /* Above content below so settings popover isn't clipped */
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		gap: clamp(0.4rem, 1.5vw, 0.75rem);
		align-items: center;
		padding: clamp(0.2rem, 0.5vw, 0.4rem);
	}

	/* Match the re-lit tile surfaces below (the card's own bg is darker) */
	.header-shell :global(.header) {
		background: var(--tile-bg);
		border: var(--tile-border);
		box-shadow: var(--tile-shadow);
		backdrop-filter: blur(var(--glass-blur));
		-webkit-backdrop-filter: blur(var(--glass-blur));
	}

	/* Subtle animated border glow - very slow */
	:global(.header)::before {
		content: '';
		position: absolute;
		inset: -1px;
		background: linear-gradient(
			90deg,
			transparent 0%,
			var(--gold-a20) 25%,
			rgba(200, 16, 46, 0.15) 50%,
			var(--gold-a20) 75%,
			transparent 100%
		);
		background-size: 200% 100%;
		animation: borderShimmer 25s linear infinite;
		border-radius: inherit;
		z-index: -1;
		opacity: 0.35;
	}

	/* Brand strip — glowing SolidCAM-red edge along the bottom of the header */
	:global(.header)::after {
		content: '';
		position: absolute;
		left: 4%;
		right: 4%;
		bottom: -2px;
		height: 2px;
		border-radius: 2px;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(200, 16, 46, 0.7) 18%,
			rgba(255, 80, 100, 0.9) 50%,
			rgba(200, 16, 46, 0.7) 82%,
			transparent 100%
		);
		box-shadow:
			0 0 14px rgba(200, 16, 46, 0.55),
			0 4px 24px rgba(200, 16, 46, 0.3);
		pointer-events: none;
		animation: brandStripPulse 5s ease-in-out infinite;
	}

	@keyframes brandStripPulse {
		0%,
		100% {
			opacity: 0.75;
		}
		50% {
			opacity: 1;
		}
	}

	@keyframes borderShimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	.header-logo {
		display: flex;
		align-items: center;
	}

	.header-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
	}

	.title-container {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0;
	}

	/* Clean, confident title. The excitement is a specular glint — a narrow
	   band of light that sweeps across the text every few seconds, like a
	   reflection passing over embossed metal. The fill is white the rest of
	   the time; no static yellow. */
	.header-title {
		font-size: clamp(0.85rem, 1.5vw, 1.25rem);
		font-weight: 640;
		margin: 0;
		line-height: 1.25;
		text-align: center;
		letter-spacing: -0.012em;
		background: linear-gradient(
			105deg,
			#f1f1f3 0%,
			#f1f1f3 42%,
			#ffffff 47%,
			#ffe9a8 50%,
			#ffffff 53%,
			#f1f1f3 58%,
			#f1f1f3 100%
		);
		background-size: 320% 100%;
		background-position: 130% 0;
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.55));
		animation: titleGlint 7s var(--ease-smooth-curve) infinite;
	}

	/* Sweep occupies ~a quarter of the cycle; the rest is calm white */
	@keyframes titleGlint {
		0% {
			background-position: 130% 0;
		}
		22% {
			background-position: -130% 0;
		}
		100% {
			background-position: -130% 0;
		}
	}

	.title-amp {
		-webkit-text-fill-color: var(--color-solidcam-gold);
		font-weight: 540;
	}

	/* Gold hairline with a comet that runs its length after each text glint */
	.title-underline {
		position: relative;
		height: 1px;
		width: clamp(80px, 38%, 180px);
		margin-top: 1px;
		background: linear-gradient(90deg, transparent, var(--gold-a45), transparent);
		overflow: visible;
	}

	.title-underline::after {
		content: '';
		position: absolute;
		top: -1px;
		left: 0;
		width: 34px;
		height: 3px;
		border-radius: 3px;
		background: linear-gradient(90deg, transparent, #ffe9a8, transparent);
		box-shadow: 0 0 8px rgba(212, 175, 55, 0.7);
		opacity: 0;
		animation: underlineComet 7s var(--ease-smooth-curve) infinite;
	}

	@keyframes underlineComet {
		0%,
		18% {
			left: 0;
			opacity: 0;
		}
		24% {
			opacity: 1;
		}
		42% {
			left: calc(100% - 34px);
			opacity: 0;
		}
		100% {
			left: calc(100% - 34px);
			opacity: 0;
		}
	}

	.header-nav {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		align-items: center;
	}

	.nav-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-0-5);
		align-items: center;
		justify-content: center;
	}

	/* ======== Nav link base ========
	   Idle state is uniform glass — subtle white-tint bg, neutral border, light hairline.
	   Only the icon carries the per-link colour at rest. Hover lights up the full link
	   in the link's colour for identity. */
	.nav-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-0-5);
		padding: 0.18rem 0.45rem;
		font-size: var(--text-xs);
		font-weight: 500;
		color: rgba(255, 255, 255, 0.78);
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 6px;
		text-decoration: none;
		transition:
			background 200ms var(--ease-out-quart),
			border-color 200ms var(--ease-out-quart),
			color 200ms var(--ease-out-quart),
			box-shadow 250ms var(--ease-out-expo),
			transform 200ms var(--ease-out-quart);
		cursor: pointer;
		position: relative;
		overflow: hidden;
	}

	.nav-link::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
		opacity: 0;
		transition: opacity 200ms var(--ease-out-quart);
		pointer-events: none;
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
		transition: transform 200ms var(--ease-out-quart);
	}

	.nav-link:hover .nav-icon {
		transform: scale(1.08);
	}

	.nav-label {
		position: relative;
	}

	.nav-external {
		display: flex;
		align-items: center;
		opacity: 0;
		transform: translateX(-3px);
		transition:
			opacity 200ms var(--ease-out-quart),
			transform 200ms var(--ease-out-quart);
	}

	.nav-link:hover .nav-external {
		opacity: 0.65;
		transform: translateX(0);
	}

	/* Per-link colour — backlit at rest (tinted glass + colored under-edge),
	   full glow on hover */
	.nav-red {
		background: rgba(200, 16, 46, 0.08);
		border-color: rgba(200, 16, 46, 0.18);
		box-shadow: inset 0 -1px 0 rgba(200, 16, 46, 0.3);
	}
	.nav-purple {
		background: rgba(147, 51, 234, 0.08);
		border-color: rgba(147, 51, 234, 0.18);
		box-shadow: inset 0 -1px 0 rgba(147, 51, 234, 0.3);
	}
	.nav-blue {
		background: rgba(59, 130, 246, 0.08);
		border-color: rgba(59, 130, 246, 0.18);
		box-shadow: inset 0 -1px 0 rgba(59, 130, 246, 0.3);
	}
	.nav-orange {
		background: rgba(249, 115, 22, 0.08);
		border-color: rgba(249, 115, 22, 0.18);
		box-shadow: inset 0 -1px 0 rgba(249, 115, 22, 0.3);
	}

	.nav-red .nav-icon {
		color: var(--accent-rose);
	}
	.nav-red:hover {
		background: rgba(200, 16, 46, 0.18);
		border-color: rgba(200, 16, 46, 0.32);
		color: #fca5a5;
		box-shadow:
			0 4px 18px rgba(200, 16, 46, 0.18),
			inset 0 1px 0 rgba(255, 255, 255, 0.08);
		transform: translateY(-2px);
	}

	.nav-purple .nav-icon {
		color: var(--accent-violet);
	}
	.nav-purple:hover {
		background: rgba(147, 51, 234, 0.18);
		border-color: rgba(147, 51, 234, 0.32);
		color: #d8b4fe;
		box-shadow:
			0 4px 18px rgba(147, 51, 234, 0.18),
			inset 0 1px 0 rgba(255, 255, 255, 0.08);
		transform: translateY(-2px);
	}

	.nav-blue .nav-icon {
		color: var(--accent-sky);
	}
	.nav-blue:hover {
		background: rgba(59, 130, 246, 0.18);
		border-color: rgba(59, 130, 246, 0.32);
		color: #93c5fd;
		box-shadow:
			0 4px 18px rgba(59, 130, 246, 0.18),
			inset 0 1px 0 rgba(255, 255, 255, 0.08);
		transform: translateY(-2px);
	}

	.nav-orange .nav-icon {
		color: var(--accent-amber);
	}
	.nav-orange:hover {
		background: rgba(249, 115, 22, 0.18);
		border-color: rgba(249, 115, 22, 0.32);
		color: #fdba74;
		box-shadow:
			0 4px 18px rgba(249, 115, 22, 0.18),
			inset 0 1px 0 rgba(255, 255, 255, 0.08);
		transform: translateY(-2px);
	}

	/* Tool buttons (Operations, CF Tools) — neutral, gold accent on hover/active */
	.nav-gray .nav-icon {
		color: rgba(255, 255, 255, 0.7);
	}
	.nav-gray:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.16);
		color: rgba(255, 255, 255, 0.92);
		box-shadow:
			0 4px 18px rgba(0, 0, 0, 0.28),
			inset 0 1px 0 rgba(255, 255, 255, 0.08);
		transform: translateY(-2px);
	}

	.nav-gray.active {
		background: var(--gold-a20);
		border-color: var(--gold-a30);
		color: var(--color-solidcam-gold);
	}

	.nav-gray.active .nav-icon {
		color: var(--color-solidcam-gold);
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
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 250ms var(--ease-out-expo);
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

		.nav-link {
			font-size: 0.65rem;
			padding: 0.15rem 0.35rem;
		}
	}

	/* Ultra-compact at narrow - still keep 3-column grid */
	@media (max-width: 768px) {
		:global(.header) {
			gap: 0.3rem;
			padding: 0.2rem 0.25rem;
		}

		.nav-row {
			gap: 0.15rem;
		}

		.nav-link {
			font-size: 0.6rem;
			padding: 0.125rem 0.25rem;
			border-radius: 6px;
		}
	}

	/* Ultra-compact for split-screen */
	@media (max-width: 680px) {
		:global(.header) {
			gap: 0.2rem;
			padding: 0.15rem 0.2rem;
		}

		.header-content {
			gap: 0.15rem;
		}

		.header-nav {
			gap: 0.2rem;
		}

		.nav-link {
			font-size: 0.6875rem;
			padding: 0.1rem 0.2rem;
		}

		.nav-row {
			gap: 0.1rem;
		}

		.nav-icon {
			width: 12px;
			height: 12px;
		}

		.nav-external {
			display: none;
		}
	}
</style>
