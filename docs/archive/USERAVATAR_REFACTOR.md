# UserAvatar Premium Redesign Plan

> **Purpose**: This document provides detailed instructions for an AI agent to refactor the UserAvatar component from functional to premium polish, matching the quality of the toast system and login screen.

---

## Overview

**Goal**: Transform the UserAvatar into a premium component with glass effects, status-aware visuals, and sophisticated animations matching Vercel/Linear/Stripe standards.

**Principle**: Subtle sophistication - enhance without overwhelming.

**Decisions locked**:
- Breathing animation stays
- Sign-out and settings buttons appear on hover (desktop)
- On touch devices, tap to reveal actions
- Settings panel toggles background video play/pause
- Preference is per device (localStorage)
- Background video plays by default

**Files to modify**:
1. `src/lib/components/layout/UserAvatar.svelte`
2. `src/lib/stores/userPrefs.svelte.ts`
3. `src/routes/+layout.svelte`

**Best practices applied** (2026):

- GPU-accelerated properties only (`transform`, `opacity`) for 60fps animations
- Use `translateZ(0)` sparingly to trigger GPU compositing
- Avoid animating layout properties (`width`, `height`, `left`)
- Respect `prefers-reduced-motion`

---

## Task 1: Add Glass Container Effect

**File**: `src/lib/components/layout/UserAvatar.svelte`

**Current** (lines 41-52):

```css
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
```

**Change to**:

```css
.user-container {
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
```

**Rationale**:

- Glass effect matches premium design language
- Hover lift (`translateY(-2px)`) is GPU-accelerated
- Gold glow on hover ties to brand colors
- Specific transitions (not `all`) for better performance

---

## Task 2: Add Status-Aware Container Styles

**File**: `src/lib/components/layout/UserAvatar.svelte`

**Add after `.user-container:hover`**:

```css
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
	0%, 100% {
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
```

**Update template** (line 13):

```svelte
<!-- Current -->
<div class="user-container">

<!-- Change to -->
<div class="user-container status-{status}">
```

**Rationale**: Visual feedback for connection state improves UX significantly.

---

## Task 3: Enhance Avatar Ring with Status Awareness

**File**: `src/lib/components/layout/UserAvatar.svelte`

**Current** (lines 61-68):

```css
.avatar-ring {
	position: absolute;
	inset: -2px;
	border-radius: 50%;
	background: conic-gradient(from 0deg, #d4af37, #c8102e, #d4af37);
	animation: avatarRingSpin 8s linear infinite;
	opacity: 0.6;
}
```

**Change to**:

```css
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
```

**Rationale**:

- Ring responds to connection state
- Faster spin during sync draws attention
- Paused/dimmed when disconnected
- Red gradient for error state

---

## Task 4: Add Breathing Animation to Avatar

**File**: `src/lib/components/layout/UserAvatar.svelte`

**Update `.avatar-inner`** (lines 76-86):

```css
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
	transition: color 200ms ease, transform 200ms ease;
}

.status-connected .avatar-inner {
	animation: avatarBreathe 4s ease-in-out infinite;
}

.user-container:hover .avatar-inner {
	color: rgba(212, 175, 55, 0.9);
	transform: scale(1.02);
}

@keyframes avatarBreathe {
	0%, 100% {
		transform: scale(1);
	}
	50% {
		transform: scale(1.03);
	}
}
```

**Rationale**:

- Subtle breathing indicates "alive" connected state
- Gold icon color on hover matches brand
- Scale is GPU-accelerated

---

## Task 5: Add Icon Glow Effect

**File**: `src/lib/components/layout/UserAvatar.svelte`

**Update `.avatar-inner svg`** (lines 88-91):

```css
.avatar-inner svg {
	width: 18px;
	height: 18px;
	transition: filter 200ms ease;
}

.user-container:hover .avatar-inner svg {
	filter: drop-shadow(0 0 4px rgba(212, 175, 55, 0.4));
}
```

**Rationale**: Subtle glow on hover adds premium feel without continuous animation.

---

## Task 6: Enhance Sign-Out Button

**File**: `src/lib/components/layout/UserAvatar.svelte`

**Update `.change-link`** (lines 111-139):

```css
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

.user-container:hover .change-link {
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
```

**Rationale**:

- Hover background provides better click target visibility
- Icon slides right on hover (premium micro-interaction)
- Active state feedback

---

## Task 7: Enhance Sync Indicator

**File**: `src/lib/components/layout/UserAvatar.svelte`

**Update sync indicator styles** (lines 141-165):

```css
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
```

**Rationale**:

- Scale animation on appear (GPU-accelerated)
- Subtle glow on spinner matches premium feel

---

## Task 8: Update Reduced Motion Support

**File**: `src/lib/components/layout/UserAvatar.svelte`

**Update reduced motion block** (lines 167-173):

```css
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
```

**Rationale**: WCAG compliance - disable all animations for users who prefer reduced motion.

---

## Task 9: Add Settings Button + Popover Panel (Hover + Tap Reveal)

**File**: `src/lib/components/layout/UserAvatar.svelte`

Add a settings button that appears alongside Sign out on hover. The settings panel is a small popover anchored to the settings button (not a full modal).

**Behavior**:
- Desktop: actions appear on hover, settings panel opens on click
- Touch: tap avatar to reveal actions, tap settings to open panel
- Close panel on outside click or Escape
- Use `aria-expanded`, `aria-controls`, and `aria-label`

**Implementation notes**:
- Keep component public API unchanged (use `userPrefsStore` inside)
- Add local state: `actionsVisible`, `settingsOpen`, `isTouch`
- Detect touch with `window.matchMedia('(hover: none)')`
- Add a document `pointerdown` listener to close the panel when clicking outside (cleanup on destroy)

**Suggested structure**:
```svelte
<div class="user-container" class:actions-visible={actionsVisible}>
  ...
  <div class="user-actions">
    <button class="settings-button" aria-expanded={settingsOpen} aria-controls="user-settings-panel">
      Settings
    </button>
    <button class="change-link" onclick={onLogout}>Sign out</button>
  </div>
  {#if settingsOpen}
    <div id="user-settings-panel" class="settings-panel" role="dialog" aria-label="User settings">
      <!-- Toggle goes here -->
    </div>
  {/if}
</div>
```

**CSS**:
- Mirror hover reveal behavior for `.settings-button` alongside `.change-link`
- `.actions-visible` should also reveal actions (for touch)
- Keep transitions on `opacity` and `transform` only

---

## Task 10: Persist Background Video Preference (Per Device)

**File**: `src/lib/stores/userPrefs.svelte.ts`

Extend `UserPrefs` to include:
```typescript
backgroundVideoPaused: boolean;
```

Default: `false` (video plays by default).

Add getters/setters:
```typescript
function isBackgroundVideoPaused(): boolean
function setBackgroundVideoPaused(paused: boolean): void
function toggleBackgroundVideoPaused(): void
```

Make sure `loadPrefs()` and `save()` include this property.

---

## Task 11: Wire Settings Toggle to Video Playback

**File**: `src/routes/+layout.svelte`

The background video lives here. Add:
- `bind:this` for the `<video>` element
- `const backgroundVideoPaused = $derived(userPrefsStore.isBackgroundVideoPaused())`
- `$effect` to `pause()`/`play()` when the preference changes

**Important**:
- `video.play()` returns a Promise; catch errors to avoid unhandled rejections
- Keep `muted` for autoplay compatibility

Example effect logic:
```typescript
$effect(() => {
  if (!videoRef) return;
  if (backgroundVideoPaused) {
    videoRef.pause();
  } else {
    videoRef.play().catch(() => {});
  }
});
```

---

## Validation Checklist

After implementing all changes, verify:

- [ ] Glass container visible with subtle blur
- [ ] Hover lift effect works (translateY -2px)
- [ ] Gold glow appears on hover
- [ ] Status classes apply correctly (connected/syncing/disconnected/error)
- [ ] Ring spins faster during sync
- [ ] Ring pauses when disconnected
- [ ] Ring turns red on error
- [ ] Avatar breathes when connected
- [ ] Icon glows gold on hover
- [ ] Sign-out button has hover background
- [ ] Sign-out icon slides right on hover
- [ ] Settings button appears with Sign out (hover on desktop, tap reveal on touch)
- [ ] Settings panel opens/closes correctly and is keyboard accessible
- [ ] Background video toggles play/pause from settings
- [ ] Preference persists per device (localStorage)
- [ ] Sync spinner scales in on appear
- [ ] Reduced motion disables all animations
- [ ] `pnpm check` passes

---

## Testing Steps

1. Run `pnpm dev` and open the app
2. Log in to see the UserAvatar
3. Test hover states on the container
4. Simulate different sync states:
   - Connected: Normal state after login
   - Syncing: Trigger a sync operation
   - Disconnected: Disable network
   - Error: Cause a sync error
5. Test with browser devtools `prefers-reduced-motion: reduce`
6. Run `pnpm check` for type safety

---

## Implementation Order

1. Task 1: Glass container (foundational)
2. Task 2: Status classes on container
3. Task 3: Ring status awareness
4. Task 4: Avatar breathing
5. Task 5: Icon glow
6. Task 6: Sign-out button enhancements
7. Task 7: Sync indicator polish
8. Task 8: Reduced motion updates
9. Task 9: Settings button + popover panel
10. Task 10: Persist preference in userPrefsStore
11. Task 11: Wire preference to video playback

---

## Notes for AI Agent

1. Read the file fully before making changes
2. Make changes incrementally - one task at a time
3. Preserve all accessibility features (ARIA, reduced motion)
4. Do not modify the component's public API
5. Test that `pnpm check` passes after changes
6. The app uses Svelte 5 runes - do not introduce legacy syntax

---

## Sources

- [Svelte animate docs](https://svelte.dev/docs/svelte/animate)
- [CSS GPU Animation Best Practices](https://www.smashingmagazine.com/2016/12/gpu-animation-doing-it-right/)
- [60 FPS Performance Guide](https://ipixel.com.sg/web-development/how-to-achieve-smooth-css-animations-60-fps-performance-guide/)
