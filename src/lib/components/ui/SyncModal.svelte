<script lang="ts">
	import Modal from './Modal.svelte';
	import Button from './Button.svelte';
	import Input from './Input.svelte';
	import { syncStore } from '$stores/sync.svelte';

	interface Props {
		open: boolean;
		onclose: () => void;
	}

	let { open = $bindable(), onclose }: Props = $props();

	let usernameInput = $state('');
	let isLoading = $state(false);
	let validationError = $state<string | null>(null);

	// Reactive status from store
	let isConnected = $derived(syncStore.isConnected);
	let currentUsername = $derived(syncStore.username);
	let syncStatus = $derived(syncStore.status);
	let syncError = $derived(syncStore.error);
	let lastSync = $derived(syncStore.lastSync);

	// Format last sync time
	let lastSyncFormatted = $derived(() => {
		if (!lastSync) return null;
		const date = new Date(lastSync);
		return date.toLocaleString();
	});

	function validateInput(): boolean {
		if (!usernameInput.trim()) {
			validationError = 'Username is required';
			return false;
		}

		if (!syncStore.validateUsername(usernameInput)) {
			validationError = 'Invalid username. Use 2-50 characters: letters, numbers, spaces, - or _';
			return false;
		}

		validationError = null;
		return true;
	}

	async function handleConnect() {
		if (!validateInput()) return;

		isLoading = true;
		validationError = null;

		try {
			const success = await syncStore.connect(usernameInput);
			if (success) {
				usernameInput = '';
				// Don't close - show connected state
			}
		} finally {
			isLoading = false;
		}
	}

	async function handleDisconnect() {
		isLoading = true;
		try {
			await syncStore.disconnect();
		} finally {
			isLoading = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !isConnected) {
			handleConnect();
		}
	}
</script>

<Modal {open} {onclose} title="Cloud Sync">
	{#if isConnected}
		<!-- Connected state -->
		<div class="sync-connected">
			<div class="status-indicator connected">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
					<polyline points="22 4 12 14.01 9 11.01" />
				</svg>
				<span>Connected</span>
			</div>

			<div class="connected-info">
				<div class="info-row">
					<span class="info-label">Username:</span>
					<span class="info-value">{currentUsername}</span>
				</div>
				{#if lastSyncFormatted()}
					<div class="info-row">
						<span class="info-label">Last sync:</span>
						<span class="info-value">{lastSyncFormatted()}</span>
					</div>
				{/if}
			</div>

			{#if syncStatus === 'syncing'}
				<div class="sync-status syncing">
					<svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 12a9 9 0 11-6.219-8.56" />
					</svg>
					<span>Syncing...</span>
				</div>
			{/if}

			{#if syncError}
				<div class="sync-error">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10" />
						<line x1="12" y1="8" x2="12" y2="12" />
						<line x1="12" y1="16" x2="12.01" y2="16" />
					</svg>
					<span>{syncError}</span>
				</div>
			{/if}

			<div class="actions">
				<Button variant="danger" onclick={handleDisconnect} disabled={isLoading}>
					{isLoading ? 'Disconnecting...' : 'Disconnect'}
				</Button>
			</div>
		</div>
	{:else}
		<!-- Disconnected state -->
		<div class="sync-disconnected">
			<p class="description">
				Enter a username to sync your data to the cloud. Your selections will be saved and accessible from any device.
			</p>

			<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="input-area" onkeydown={handleKeydown}>
				<Input
					label="Username"
					placeholder="Enter your username"
					bind:value={usernameInput}
					error={validationError || syncError || undefined}
					disabled={isLoading}
					autocomplete="username"
				/>
			</div>

			{#if syncStatus === 'connecting'}
				<div class="sync-status connecting">
					<svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 12a9 9 0 11-6.219-8.56" />
					</svg>
					<span>Connecting...</span>
				</div>
			{/if}

			<div class="actions">
				<Button variant="ghost" onclick={onclose} disabled={isLoading}>
					Cancel
				</Button>
				<Button variant="gold" onclick={handleConnect} disabled={isLoading || !usernameInput.trim()}>
					{isLoading ? 'Connecting...' : 'Connect'}
				</Button>
			</div>
		</div>
	{/if}
</Modal>

<style>
	.sync-connected,
	.sync-disconnected {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.description {
		color: rgba(255, 255, 255, 0.7);
		font-size: 0.9375rem;
		line-height: 1.5;
		margin: 0;
	}

	.status-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 600;
		font-size: 1rem;
	}

	.status-indicator svg {
		width: 20px;
		height: 20px;
	}

	.status-indicator.connected {
		color: #22c55e;
	}

	.connected-info {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 8px;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.info-label {
		color: rgba(255, 255, 255, 0.5);
		font-size: 0.875rem;
	}

	.info-value {
		color: rgba(255, 255, 255, 0.9);
		font-size: 0.875rem;
		font-family: 'JetBrains Mono', monospace;
	}

	.sync-status {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
	}

	.sync-status svg {
		width: 16px;
		height: 16px;
	}

	.sync-status.syncing,
	.sync-status.connecting {
		color: var(--color-solidcam-gold, #d4af37);
	}

	.spinner {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.sync-error {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 8px;
		color: #ef4444;
		font-size: 0.875rem;
	}

	.sync-error svg {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
	}

	.input-area {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}
</style>
