<script lang="ts">
	import type { SyncStatus } from '$types';

	interface Props {
		username: string | null;
		status: SyncStatus;
		onLogout: () => void;
	}

	let { username, status, onLogout }: Props = $props();
</script>

<div class="user-container">
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
		<button class="change-link" onclick={onLogout}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
				<polyline points="16 17 21 12 16 7" />
				<line x1="21" y1="12" x2="9" y2="12" />
			</svg>
			Sign out
		</button>
	</div>
	{#if status === 'syncing'}
		<div class="sync-indicator">
			<div class="sync-spinner"></div>
		</div>
	{/if}
</div>

<style>
	.user-container {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.625rem;
		border-radius: 10px;
		transition: all 200ms ease;
	}

	.user-container:hover {
		background: rgba(255, 255, 255, 0.05);
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
	}

	.avatar-inner svg {
		width: 18px;
		height: 18px;
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
		padding: 0;
		transition: all 150ms ease;
		max-height: 0;
		opacity: 0;
		overflow: hidden;
	}

	.user-container:hover .change-link {
		max-height: 1.5rem;
		opacity: 1;
	}

	.change-link svg {
		width: 10px;
		height: 10px;
	}

	.change-link:hover {
		color: #d4af37;
	}

	.sync-indicator {
		margin-left: 0.25rem;
		flex-shrink: 0;
	}

	.sync-spinner {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(212, 175, 55, 0.2);
		border-top-color: #d4af37;
		border-radius: 50%;
		animation: spin 1s linear infinite;
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
	}
</style>
