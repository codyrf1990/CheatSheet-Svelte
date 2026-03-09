<script lang="ts">
	import { browser } from '$app/environment';
	import type { SyncStatus } from '$types';

	interface Props {
		username: string | null;
		status: SyncStatus;
		onLogout: () => void;
	}

	let { username, status, onLogout }: Props = $props();

	// Local state
	let actionsVisible = $state(false);
	let isTouch = $state(false);
	let containerRef: HTMLDivElement | null = $state(null);

	// Detect touch devices
	$effect(() => {
		if (browser) {
			isTouch = window.matchMedia('(hover: none)').matches;
		}
	});

	function handleContainerClick() {
		if (isTouch) {
			actionsVisible = !actionsVisible;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && actionsVisible) {
			actionsVisible = false;
		}
	}

	// Close on outside click
	$effect(() => {
		if (!browser || !actionsVisible) return;

		function handleOutsideClick(event: PointerEvent) {
			if (containerRef && !containerRef.contains(event.target as Node)) {
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
			<svg viewBox="0 0 24 24" fill="currentColor">
				<path
					d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
				/>
			</svg>
		</div>
	</div>
	<div class="user-details">
		<span class="user-name">{username || 'User'}</span>
		<div class="user-actions">
			<button class="change-link" onclick={onLogout}>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
					<polyline points="16 17 21 12 16 7" />
					<line x1="21" y1="12" x2="9" y2="12" />
				</svg>
				Sign out
			</button>
		</div>
	</div>
	<div class="sync-indicator" class:visible={status === 'syncing'}>
		<div class="sync-spinner"></div>
	</div>
</div>

<style>
	.user-container {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.625rem;
		border-radius: 10px;
		background: rgba(32, 32, 38, 0.3);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.06);
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.15),
			0 1px 3px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.04);
		transition:
			transform 200ms ease,
			box-shadow 200ms ease,
			background 200ms ease;
	}

	.user-container:hover {
		background: rgba(40, 40, 48, 0.5);
		transform: translateY(-2px);
		box-shadow:
			0 8px 20px rgba(0, 0, 0, 0.2),
			0 2px 6px rgba(0, 0, 0, 0.15),
			0 0 20px rgba(212, 175, 55, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.06);
	}

	/* Status-aware container styles */
	.user-container.status-connected {
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.15),
			0 1px 3px rgba(0, 0, 0, 0.1),
			0 0 0 1px rgba(212, 175, 55, 0.15),
			inset 0 1px 0 rgba(255, 255, 255, 0.04);
	}

	.user-container.status-syncing {
		animation: containerPulse 2s ease-in-out infinite;
	}

	.user-container.status-error {
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.15),
			0 1px 3px rgba(0, 0, 0, 0.1),
			0 0 0 1px rgba(200, 16, 46, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.04);
	}

	.user-container.status-disconnected {
		opacity: 0.7;
	}

	@keyframes containerPulse {
		0%,
		100% {
			box-shadow:
				0 4px 12px rgba(0, 0, 0, 0.15),
				0 1px 3px rgba(0, 0, 0, 0.1),
				0 0 0 1px rgba(212, 175, 55, 0.15),
				inset 0 1px 0 rgba(255, 255, 255, 0.04);
		}
		50% {
			box-shadow:
				0 4px 12px rgba(0, 0, 0, 0.15),
				0 1px 3px rgba(0, 0, 0, 0.1),
				0 0 0 2px rgba(212, 175, 55, 0.25),
				0 0 12px rgba(212, 175, 55, 0.15),
				inset 0 1px 0 rgba(255, 255, 255, 0.04);
		}
	}

	.user-avatar {
		position: relative;
		width: 32px;
		height: 32px;
		flex-shrink: 0;
	}

	.avatar-ring {
		position: absolute;
		inset: -2px;
		border-radius: 50%;
		background: conic-gradient(from 0deg, #d4af37, #c8102e, #d4af37);
		animation: avatarRingSpin 8s linear infinite;
		opacity: 0.6;
		transition: opacity 300ms ease;
	}

	/* Status-aware ring */
	.status-connected .avatar-ring {
		opacity: 0.8;
	}

	.status-syncing .avatar-ring {
		animation: avatarRingSpin 3s linear infinite;
		opacity: 0.9;
	}

	.status-disconnected .avatar-ring {
		opacity: 0.3;
		animation-play-state: paused;
	}

	.status-error .avatar-ring {
		background: conic-gradient(from 0deg, #c8102e, #8b0000, #c8102e);
		opacity: 0.8;
	}

	@keyframes avatarRingSpin {
		to {
			transform: rotate(360deg);
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

	.avatar-inner svg {
		width: 18px;
		height: 18px;
		transition: filter 200ms ease;
	}

	.user-container:hover .avatar-inner svg {
		filter: drop-shadow(0 0 4px rgba(212, 175, 55, 0.4));
	}

	.user-details {
		display: flex;
		flex-direction: column;
		gap: 0;
		overflow: hidden;
	}

	.user-name {
		font-size: 0.8rem;
		font-weight: 600;
		color: #f5f5f5;
		line-height: 1.3;
		max-width: 100px;
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
		color: #d4af37;
		background: rgba(212, 175, 55, 0.1);
	}

	.change-link:active {
		transform: scale(0.95);
	}

	.change-link svg {
		width: 10px;
		height: 10px;
		transition: transform 150ms ease;
	}

	.change-link:hover svg {
		transform: translateX(2px);
	}

	/* User actions container */
	.user-actions {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.user-container.actions-visible .change-link {
		max-height: 1.5rem;
		opacity: 1;
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

	.sync-spinner {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(212, 175, 55, 0.2);
		border-top-color: #d4af37;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		box-shadow: 0 0 8px rgba(212, 175, 55, 0.2);
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.avatar-ring,
		.sync-spinner {
			animation: none;
		}

		.status-connected .avatar-inner {
			animation: none;
		}

		.user-container,
		.avatar-inner,
		.change-link,
		.sync-indicator {
			transition: none;
		}

		.user-container:hover {
			transform: none;
		}

		.user-container.status-syncing {
			animation: none;
		}
	}
</style>
