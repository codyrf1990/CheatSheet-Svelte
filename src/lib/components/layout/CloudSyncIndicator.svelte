<script lang="ts">
	import type { SyncStatus } from '$types';

	interface Props {
		username: string | null;
		status: SyncStatus;
		onSettingsClick: () => void;
	}

	let { username, status, onSettingsClick }: Props = $props();

	let isConnected = $derived(username && status !== 'disconnected');
	let isSyncing = $derived(status === 'syncing');
	let buttonLabel = $derived(isConnected ? 'Account' : 'Sign In');
</script>

<div class="cloud-indicator" data-status={status}>
	{#if isConnected}
		<span
			class="status-dot"
			class:connected={status === 'connected'}
			class:syncing={isSyncing}
			class:error={status === 'error'}
		></span>
		<span class="user-icon">👤</span>
		<span class="username">{username}</span>
		{#if isSyncing}
			<span class="sync-spinner"></span>
		{/if}
	{:else}
		<span class="status-label">Not signed in</span>
	{/if}
	<button class="settings-btn" onclick={onSettingsClick} type="button">
		{buttonLabel}
	</button>
</div>

<style>
	.cloud-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.75rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 9999px;
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #6b7280;
	}

	.status-dot.connected {
		background: #22c55e;
		box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
	}

	.status-dot.syncing {
		background: #d4af37;
		box-shadow: 0 0 8px rgba(212, 175, 55, 0.5);
		animation: pulse 1.5s ease-in-out infinite;
	}

	.status-dot.error {
		background: #ef4444;
		box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
	}

	.user-icon {
		font-size: 0.875rem;
	}

	.username {
		font-size: 0.8125rem;
		color: rgba(255, 255, 255, 0.8);
		max-width: 120px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.status-label {
		font-size: 0.8125rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.sync-spinner {
		width: 12px;
		height: 12px;
		border: 2px solid rgba(212, 175, 55, 0.3);
		border-top-color: #d4af37;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	.settings-btn {
		padding: 0.25rem 0.625rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: #d4af37;
		background: transparent;
		border: 1px solid rgba(212, 175, 55, 0.3);
		border-radius: 9999px;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.settings-btn:hover {
		background: rgba(212, 175, 55, 0.1);
		border-color: rgba(212, 175, 55, 0.5);
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
</style>
