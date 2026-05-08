<script lang="ts">
	import { browser } from '$app/environment';
	import { LogOut, Settings, User } from 'lucide-svelte';
	import type { SyncStatus } from '$types';
	import { userPrefsStore } from '$stores/userPrefs.svelte';
	import { tooltip } from '$lib/utils/tooltipAction';

	interface Props {
		username: string | null;
		status: SyncStatus;
		onLogout: () => void;
	}

	let { username, status, onLogout }: Props = $props();

	// Local state for settings panel
	let actionsVisible = $state(false);
	let settingsOpen = $state(false);
	let isTouch = $state(false);
	let containerRef: HTMLDivElement | null = $state(null);

	// Detect touch devices
	$effect(() => {
		if (browser) {
			isTouch = window.matchMedia('(hover: none)').matches;
		}
	});

	// Get video paused state
	const backgroundVideoPaused = $derived(userPrefsStore.isBackgroundVideoPaused());

	function handleContainerClick() {
		if (isTouch) {
			actionsVisible = !actionsVisible;
		}
	}

	function toggleSettings(event: MouseEvent) {
		event.stopPropagation();
		settingsOpen = !settingsOpen;
	}

	function toggleBackgroundVideo() {
		userPrefsStore.toggleBackgroundVideoPaused();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && settingsOpen) {
			settingsOpen = false;
		}
	}

	// Close panel on outside click
	$effect(() => {
		if (!browser || !settingsOpen) return;

		function handleOutsideClick(event: PointerEvent) {
			if (containerRef && !containerRef.contains(event.target as Node)) {
				settingsOpen = false;
				actionsVisible = false;
			}
		}

		document.addEventListener('pointerdown', handleOutsideClick);
		return () => document.removeEventListener('pointerdown', handleOutsideClick);
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={containerRef}
	class="user-container status-{status}"
	class:actions-visible={actionsVisible}
	onclick={handleContainerClick}
	onkeydown={handleKeydown}
>
	<div class="user-avatar">
		<div class="avatar-ring"></div>
		<div class="avatar-inner">
			<User size={18} strokeWidth={2} />
		</div>
		<span class="avatar-status-dot" aria-hidden="true"></span>
	</div>
	<div class="user-details">
		<span class="user-name" use:tooltip={username || 'User'}>{username || 'User'}</span>
		<div class="user-actions">
			<button
				class="settings-button"
				onclick={toggleSettings}
				aria-expanded={settingsOpen}
				aria-controls="user-settings-panel"
				aria-label="User settings"
			>
				<Settings size={10} strokeWidth={2} />
				Settings
			</button>
			<button class="change-link" onclick={onLogout}>
				<LogOut size={10} strokeWidth={2} />
				Sign out
			</button>
		</div>
	</div>
	<!-- Sync status is now indicated by the container's animated outer edge —
	     see the .user-container::after rule for the rotating gold comet. -->
	{#if status === 'syncing'}
		<span class="sr-only" use:tooltip={'Syncing...'}>Syncing</span>
	{/if}

	{#if settingsOpen}
		<div
			id="user-settings-panel"
			class="settings-panel"
			role="dialog"
			aria-modal="true"
			aria-label="User settings"
		>
			<div class="settings-header">Settings</div>
			<label class="settings-toggle">
				<span class="toggle-label">Pause background</span>
				<button
					type="button"
					class="toggle-switch"
					class:active={backgroundVideoPaused}
					onclick={toggleBackgroundVideo}
					aria-pressed={backgroundVideoPaused}
					aria-label="Toggle background video"
				>
					<span class="toggle-thumb"></span>
				</button>
			</label>
		</div>
	{/if}
</div>

<style>
	/* Animated angle for the syncing comet that runs around the container border */
	@property --user-sync-angle {
		syntax: '<angle>';
		initial-value: 0deg;
		inherits: false;
	}

	.user-container {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 0.7rem;
		border-radius: 12px;
		background: linear-gradient(135deg, rgba(28, 28, 32, 0.7) 0%, rgba(16, 16, 20, 0.65) 100%);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		box-shadow:
			0 6px 18px rgba(0, 0, 0, 0.28),
			0 1px 3px rgba(0, 0, 0, 0.12),
			inset 0 1px 0 rgba(255, 255, 255, 0.05),
			inset 0 -1px 0 rgba(0, 0, 0, 0.25);
		transition:
			transform 220ms var(--ease-out-quart),
			box-shadow 280ms var(--ease-out-expo),
			background 220ms var(--ease-out-quart);
	}

	/* ::before — static gradient stroke (gold → red), the resting "frame" */
	.user-container::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		padding: 1.5px;
		background: linear-gradient(
			135deg,
			rgba(212, 175, 55, 0.55) 0%,
			rgba(255, 255, 255, 0.08) 35%,
			rgba(255, 255, 255, 0.02) 65%,
			rgba(200, 16, 46, 0.4) 100%
		);
		-webkit-mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		-webkit-mask-composite: xor;
		mask-composite: exclude;
		pointer-events: none;
		transition: background 350ms var(--ease-out-expo);
	}

	/* ::after — the sync "comet": a bright arc that rotates around the perimeter */
	.user-container::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		padding: 1.5px;
		background: conic-gradient(
			from var(--user-sync-angle, 0deg),
			transparent 0deg,
			transparent 250deg,
			rgba(212, 175, 55, 0.4) 290deg,
			rgba(212, 175, 55, 1) 320deg,
			rgba(212, 175, 55, 0.5) 345deg,
			transparent 360deg
		);
		-webkit-mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		-webkit-mask-composite: xor;
		mask-composite: exclude;
		pointer-events: none;
		opacity: 0;
		transition: opacity 250ms var(--ease-out-quart);
		filter: drop-shadow(0 0 6px rgba(212, 175, 55, 0.45));
	}

	.user-container:hover {
		transform: translateY(-2px);
		background: linear-gradient(135deg, rgba(34, 34, 40, 0.78) 0%, rgba(20, 20, 26, 0.72) 100%);
		box-shadow:
			0 12px 28px rgba(0, 0, 0, 0.35),
			0 2px 6px rgba(0, 0, 0, 0.18),
			0 0 26px rgba(212, 175, 55, 0.18),
			inset 0 1px 0 rgba(255, 255, 255, 0.07),
			inset 0 -1px 0 rgba(0, 0, 0, 0.3);
	}

	/* ======== Status states ======== */

	/* Syncing — comet sweep around the perimeter, faster avatar ring */
	.user-container.status-syncing::after {
		opacity: 1;
		animation: userSyncSweep 1.4s linear infinite;
	}

	@keyframes userSyncSweep {
		to {
			--user-sync-angle: 360deg;
		}
	}

	/* Error — swap the resting border to red and add a soft red halo */
	.user-container.status-error::before {
		background: linear-gradient(
			135deg,
			rgba(200, 16, 46, 0.55) 0%,
			rgba(255, 90, 100, 0.15) 35%,
			rgba(200, 16, 46, 0.55) 100%
		);
	}

	.user-container.status-error {
		box-shadow:
			0 6px 18px rgba(0, 0, 0, 0.28),
			0 1px 3px rgba(0, 0, 0, 0.12),
			0 0 22px rgba(200, 16, 46, 0.18),
			inset 0 1px 0 rgba(255, 255, 255, 0.05),
			inset 0 -1px 0 rgba(0, 0, 0, 0.25);
	}

	/* Disconnected — muted */
	.user-container.status-disconnected {
		opacity: 0.65;
	}

	.user-container.status-disconnected::before {
		background: linear-gradient(
			135deg,
			rgba(255, 255, 255, 0.18) 0%,
			rgba(255, 255, 255, 0.04) 50%,
			rgba(255, 255, 255, 0.18) 100%
		);
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

	.user-avatar {
		position: relative;
		width: 34px;
		height: 34px;
		flex-shrink: 0;
	}

	.avatar-ring {
		position: absolute;
		inset: -2px;
		border-radius: 50%;
		background: conic-gradient(from 135deg, #d4af37, #c8102e, #8a6d1f, #d4af37);
		opacity: 0.55;
		transition:
			opacity 300ms var(--ease-out-quart),
			background 350ms var(--ease-out-expo),
			animation 300ms var(--ease-out-quart);
	}

	/* Status-aware ring — animation only kicks in for syncing */
	.status-connected .avatar-ring {
		opacity: 0.7;
	}

	.status-syncing .avatar-ring {
		opacity: 0.95;
		animation: avatarRingSpin 3s linear infinite;
	}

	.status-disconnected .avatar-ring {
		opacity: 0.25;
		background: conic-gradient(from 135deg, #555, #333, #555);
	}

	.status-error .avatar-ring {
		background: conic-gradient(from 135deg, #c8102e, #8b0000, #c8102e);
		opacity: 0.85;
	}

	@keyframes avatarRingSpin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Status dot — small bottom-right indicator on the avatar */
	.avatar-status-dot {
		position: absolute;
		bottom: -2px;
		right: -2px;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		border: 2px solid rgba(20, 20, 25, 1);
		background: rgba(120, 120, 130, 0.9);
		z-index: 2;
		transition:
			background 250ms var(--ease-out-quart),
			box-shadow 300ms var(--ease-out-expo);
	}

	.status-connected .avatar-status-dot {
		background: #22c55e;
		box-shadow: 0 0 8px rgba(34, 197, 94, 0.55);
	}

	.status-syncing .avatar-status-dot {
		background: var(--color-solidcam-gold);
		box-shadow: 0 0 10px rgba(212, 175, 55, 0.7);
		animation: dotPulse 1.4s ease-in-out infinite;
	}

	.status-error .avatar-status-dot {
		background: #ef4444;
		box-shadow: 0 0 10px rgba(239, 68, 68, 0.6);
	}

	.status-disconnected .avatar-status-dot {
		background: rgba(120, 120, 130, 0.6);
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

	.avatar-inner {
		position: relative;
		width: 100%;
		height: 100%;
		background: linear-gradient(145deg, rgba(30, 30, 35, 1), rgba(20, 20, 25, 1));
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(255, 255, 255, 0.7);
		transition:
			color 200ms ease,
			transform 200ms ease;
	}

	.status-connected .avatar-inner {
		animation: avatarBreathe 4s ease-in-out infinite;
	}

	.user-container:hover .avatar-inner {
		color: rgba(212, 175, 55, 0.9);
		transform: scale(1.02);
	}

	@keyframes avatarBreathe {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.03);
		}
	}

	.avatar-inner :global(svg) {
		width: 18px;
		height: 18px;
		transition: filter 200ms ease;
	}

	.user-container:hover .avatar-inner :global(svg) {
		filter: drop-shadow(0 0 4px rgba(212, 175, 55, 0.4));
	}

	.user-details {
		display: flex;
		flex-direction: column;
		gap: 0;
		overflow: hidden;
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

	.change-link {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.65rem;
		color: rgba(255, 255, 255, 0.4);
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.125rem 0.25rem;
		margin: -0.125rem -0.25rem;
		border-radius: 4px;
		transition:
			color 150ms ease,
			background 150ms ease,
			max-height 150ms ease,
			opacity 150ms ease;
		max-height: 0;
		opacity: 0;
		overflow: hidden;
	}

	.user-container:hover .change-link,
	.user-container:focus-within .change-link {
		max-height: 1.5rem;
		opacity: 1;
	}

	.change-link:hover {
		color: var(--color-solidcam-gold);
		background: rgba(212, 175, 55, 0.1);
	}

	.change-link:active {
		transform: scale(0.95);
	}

	.change-link :global(svg) {
		width: 10px;
		height: 10px;
		transition: transform 150ms ease;
	}

	.change-link:hover :global(svg) {
		transform: translateX(2px);
	}

	/* User actions container */
	.user-actions {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	/* Settings button - mirrors change-link behavior */
	.settings-button {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.65rem;
		color: rgba(255, 255, 255, 0.4);
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.125rem 0.25rem;
		margin: -0.125rem -0.25rem;
		border-radius: 4px;
		transition:
			color 150ms ease,
			background 150ms ease,
			max-height 150ms ease,
			opacity 150ms ease;
		max-height: 0;
		opacity: 0;
		overflow: hidden;
	}

	.user-container:hover .settings-button,
	.user-container:focus-within .settings-button,
	.user-container.actions-visible .settings-button {
		max-height: 1.5rem;
		opacity: 1;
	}

	.user-container.actions-visible .change-link {
		max-height: 1.5rem;
		opacity: 1;
	}

	.settings-button:hover {
		color: var(--color-solidcam-gold);
		background: rgba(212, 175, 55, 0.1);
	}

	.settings-button:active {
		transform: scale(0.95);
	}

	.settings-button :global(svg) {
		width: 10px;
		height: 10px;
		transition: transform 150ms ease;
	}

	.settings-button:hover :global(svg) {
		transform: rotate(45deg);
	}

	/* Settings panel */
	.settings-panel {
		position: absolute;
		top: calc(100% + 0.5rem);
		right: 0;
		min-width: 180px;
		padding: 0.75rem;
		background: rgba(28, 28, 34, 0.95);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 10px;
		box-shadow:
			0 8px 24px rgba(0, 0, 0, 0.3),
			0 2px 8px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.04);
		z-index: 1000;
		animation: panelSlideIn 150ms ease;
	}

	/* Invisible bridge covers the gap between container and panel so hover isn't lost */
	.settings-panel::before {
		content: '';
		position: absolute;
		top: -0.5rem;
		left: 0;
		right: 0;
		height: 0.5rem;
	}

	@keyframes panelSlideIn {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.settings-header {
		font-size: 0.7rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.5);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.625rem;
	}

	.settings-toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		cursor: pointer;
	}

	.toggle-label {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.8);
	}

	.toggle-switch {
		position: relative;
		width: 36px;
		height: 20px;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		cursor: pointer;
		transition:
			background 150ms ease,
			border-color 150ms ease;
		padding: 0;
	}

	.toggle-switch.active {
		background: rgba(212, 175, 55, 0.3);
		border-color: rgba(212, 175, 55, 0.4);
		box-shadow: 0 0 12px rgba(212, 175, 55, 0.25);
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

	.sync-indicator {
		margin-left: 0.25rem;
		flex-shrink: 0;
		opacity: 0;
		transform: scale(0.8);
		transition:
			opacity 200ms ease,
			transform 200ms ease;
	}

	.sync-indicator.visible {
		opacity: 1;
		transform: scale(1);
	}

	.sync-indicator :global(.sync-spinner) {
		color: var(--color-solidcam-gold);
		filter: drop-shadow(0 0 6px rgba(212, 175, 55, 0.35));
		animation: spin 0.85s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
