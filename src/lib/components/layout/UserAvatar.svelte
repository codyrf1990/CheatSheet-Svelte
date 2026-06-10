<script lang="ts">
	import { browser } from '$app/environment';
	import { tick } from 'svelte';
	import { ChevronDown, LogOut } from 'lucide-svelte';
	import type { SyncStatus } from '$types';
	import { userPrefsStore } from '$stores/userPrefs.svelte';
	import { menuKeyNav } from '$lib/utils/menuKeyNav';

	interface Props {
		username: string | null;
		status: SyncStatus;
		onLogout: () => void;
	}

	let { username, status, onLogout }: Props = $props();

	let menuOpen = $state(false);
	let containerRef: HTMLDivElement | null = $state(null);

	function getInitials(name: string | null): string {
		if (!name) return '?';
		const parts = name.split(/[\s._-]+/).filter(Boolean);
		if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
		if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
		return '?';
	}

	const initials = $derived(getInitials(username));

	const statusLabel = $derived(
		{
			connected: 'Synced',
			syncing: 'Syncing…',
			connecting: 'Connecting…',
			error: 'Sync error',
			disconnected: 'Offline'
		}[status]
	);

	const backgroundVideoPaused = $derived(userPrefsStore.isBackgroundVideoPaused());

	function handleLogout() {
		menuOpen = false;
		onLogout();
	}

	// Standard menu-button keyboard behavior while focus is on the trigger:
	// ArrowDown/ArrowUp open the menu and focus the first/last item; Escape closes.
	async function handleTriggerKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			menuOpen = true;
			await tick();
			const items = containerRef?.querySelectorAll<HTMLElement>(
				'[role="menuitem"], [role="menuitemcheckbox"]'
			);
			if (!items?.length) return;
			(event.key === 'ArrowDown' ? items[0] : items[items.length - 1]).focus();
		} else if (event.key === 'Escape' && menuOpen) {
			menuOpen = false;
		}
	}

	// Close menu on outside click
	$effect(() => {
		if (!browser || !menuOpen) return;

		function handleOutsideClick(event: PointerEvent) {
			if (containerRef && event.target instanceof Node && !containerRef.contains(event.target)) {
				menuOpen = false;
			}
		}

		document.addEventListener('pointerdown', handleOutsideClick);
		return () => document.removeEventListener('pointerdown', handleOutsideClick);
	});
</script>

<div class="user-menu" bind:this={containerRef}>
	<button
		type="button"
		class="user-trigger status-{status}"
		onclick={() => (menuOpen = !menuOpen)}
		onkeydown={handleTriggerKeydown}
		aria-haspopup="menu"
		aria-expanded={menuOpen}
		aria-label="User menu"
	>
		<span class="avatar">
			<span class="avatar-initials">{initials}</span>
			<span class="status-dot" aria-hidden="true"></span>
		</span>
		<span class="user-name">{username || 'User'}</span>
		<span class="dropdown-arrow" class:open={menuOpen} aria-hidden="true">
			<ChevronDown size={12} strokeWidth={2} />
		</span>
	</button>

	{#if status === 'syncing'}
		<span class="sr-only" role="status">Syncing</span>
	{/if}

	{#if menuOpen}
		<div
			class="user-dropdown"
			role="menu"
			aria-label="User menu"
			use:menuKeyNav={{ onClose: () => (menuOpen = false) }}
		>
			<div class="menu-header">
				<span class="avatar avatar-lg">
					<span class="avatar-initials">{initials}</span>
					<span class="status-dot status-{status}" aria-hidden="true"></span>
				</span>
				<div class="menu-header-text">
					<span class="menu-username">{username || 'User'}</span>
					<span class="menu-status menu-status-{status}">{statusLabel}</span>
				</div>
			</div>
			<hr class="menu-divider" />
			<button
				type="button"
				role="menuitemcheckbox"
				class="menu-row"
				onclick={() => userPrefsStore.toggleBackgroundVideoPaused()}
				aria-checked={backgroundVideoPaused}
			>
				<span>Pause background video</span>
				<span class="toggle-switch" class:active={backgroundVideoPaused} aria-hidden="true">
					<span class="toggle-thumb"></span>
				</span>
			</button>
			<hr class="menu-divider" />
			<button type="button" role="menuitem" class="menu-row danger" onclick={handleLogout}>
				<LogOut size={13} strokeWidth={2} />
				Sign out
			</button>
		</div>
	{/if}
</div>

<style>
	.user-menu {
		position: relative;
	}

	/* Trigger pill — same quiet idle language as the header nav links */
	.user-trigger {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0.55rem 0.25rem 0.3rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 999px;
		cursor: pointer;
		transition:
			background 200ms var(--ease-out-quart),
			border-color 200ms var(--ease-out-quart);
	}

	.user-trigger:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.16);
	}

	.user-trigger:focus-visible {
		outline: 2px solid var(--color-solidcam-gold);
		outline-offset: 2px;
	}

	.user-trigger[aria-expanded='true'] {
		background: var(--gold-a10);
		border-color: var(--gold-a30);
	}

	/* Error stays visible without opening the menu; offline reads muted */
	.user-trigger.status-error {
		border-color: rgba(239, 68, 68, 0.45);
	}

	.user-trigger.status-disconnected {
		opacity: 0.75;
	}

	.avatar {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		flex-shrink: 0;
		background: rgba(255, 255, 255, 0.08);
		border-radius: 50%;
	}

	.avatar-lg {
		width: 32px;
		height: 32px;
	}

	.avatar-initials {
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		color: rgba(255, 255, 255, 0.85);
		text-shadow: var(--text-engraved);
		user-select: none;
	}

	.avatar-lg .avatar-initials {
		font-size: 0.8125rem;
	}

	/* Status dot — flat solid colors, the at-a-glance sync indicator */
	.status-dot {
		position: absolute;
		bottom: -1px;
		right: -1px;
		width: 9px;
		height: 9px;
		border-radius: 50%;
		border: 2px solid rgba(20, 20, 25, 1);
		background: rgba(120, 120, 130, 0.9);
		transition: background 250ms var(--ease-out-quart);
	}

	.status-connected .status-dot,
	.status-dot.status-connected {
		background: var(--color-success);
	}

	.status-syncing .status-dot,
	.status-connecting .status-dot,
	.status-dot.status-syncing,
	.status-dot.status-connecting {
		background: var(--color-solidcam-gold);
		animation: dotPulse 1.4s ease-in-out infinite;
	}

	.status-error .status-dot,
	.status-dot.status-error {
		background: var(--color-error);
	}

	@keyframes dotPulse {
		0%,
		100% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.2);
			opacity: 0.85;
		}
	}

	.user-name {
		font-size: 0.8125rem;
		font-weight: 540;
		letter-spacing: -0.012em;
		color: var(--color-text-primary);
		line-height: 1.25;
		max-width: 110px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.dropdown-arrow {
		display: inline-flex;
		opacity: 0.6;
		transition: transform 250ms var(--ease-out-expo);
	}

	.dropdown-arrow.open {
		transform: rotate(180deg);
	}

	/* Dropdown — same recipe as the other app menus */
	.user-dropdown {
		position: absolute;
		top: calc(100% + 0.5rem);
		right: 0;
		min-width: 248px;
		padding: 0.3rem;
		background: var(--menu-bg);
		border: var(--menu-border);
		border-radius: var(--radius-sm);
		box-shadow: var(--menu-shadow);
		z-index: 1000;
		overflow: hidden;
		animation: userMenuFadeIn 150ms var(--ease-out-quart);
	}

	@keyframes userMenuFadeIn {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.menu-header {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.45rem 0.5rem;
	}

	.menu-header-text {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		overflow: hidden;
	}

	.menu-username {
		font-size: 0.8125rem;
		font-weight: 560;
		color: var(--color-text-primary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.menu-status {
		font-size: 0.6875rem;
		color: rgba(255, 255, 255, 0.45);
	}

	.menu-status-connected {
		color: var(--color-success);
	}

	.menu-status-syncing,
	.menu-status-connecting {
		color: var(--color-solidcam-gold);
	}

	.menu-status-error {
		color: var(--color-error);
	}

	.menu-divider {
		margin: 0.25rem 0;
		border: none;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.menu-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		width: 100%;
		padding: 0.45rem 0.5rem;
		font-size: 0.8125rem;
		color: rgba(255, 255, 255, 0.85);
		background: transparent;
		border: none;
		border-left: 2px solid transparent;
		border-radius: 4px;
		cursor: pointer;
		text-align: left;
		transition:
			background 150ms ease,
			border-color 150ms ease,
			color 150ms ease;
	}

	.menu-row:hover,
	.menu-row:focus-visible {
		background: rgba(255, 255, 255, 0.06);
		border-left-color: var(--gold-a45);
	}

	.menu-row:focus-visible {
		outline: none;
	}

	.menu-row.danger {
		justify-content: flex-start;
	}

	.menu-row.danger:hover,
	.menu-row.danger:focus-visible {
		background: rgba(239, 68, 68, 0.12);
		border-left-color: var(--color-error);
		color: #fca5a5;
	}

	/* Toggle switch (reused look from the old settings popover, minus the glow) */
	.toggle-switch {
		position: relative;
		flex-shrink: 0;
		width: 36px;
		height: 20px;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		transition:
			background 150ms ease,
			border-color 150ms ease;
	}

	.toggle-switch.active {
		background: rgba(212, 175, 55, 0.3);
		border-color: rgba(212, 175, 55, 0.4);
	}

	.toggle-thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 14px;
		height: 14px;
		background: rgba(255, 255, 255, 0.7);
		border-radius: 50%;
		transition: transform 150ms ease;
	}

	.toggle-switch.active .toggle-thumb {
		transform: translateX(16px);
		background: var(--color-solidcam-gold);
	}

	/* Screen-reader only utility (used for the "Syncing" announcement) */
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
