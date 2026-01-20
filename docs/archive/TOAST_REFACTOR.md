# Toast System Refactor Plan

> **Purpose**: This document provides detailed instructions for an AI agent to refactor the toast notification system from "flashy" to "premium subtle" while maintaining all accessibility features.

---

## Overview

**Goal**: Transform the toast system to match premium app standards (Vercel, Linear, Stripe) - subtle, non-intrusive, sophisticated.

**Accessibility target**: WCAG 2.2 AAA is the baseline. WCAG 3.x is draft; do not block on draft criteria.

**Principle**: "Less is more" - toasts should inform without demanding attention.

**Files to modify**:

1. `src/lib/components/ui/ToastContainer.svelte` - Main component
2. `src/lib/stores/toast.svelte.ts` - Store logic

---

## Task 1: Simplify Entrance Animation

**File**: `src/lib/components/ui/ToastContainer.svelte`

**Current** (around line 60-70 in the template):

```svelte
in:fly={{
	x: prefersReducedMotion ? 0 : 120,
	duration: prefersReducedMotion ? 0 : 400,
	easing: backOut,
	delay: prefersReducedMotion ? 0 : index * 50
}}
out:scale={{
	duration: prefersReducedMotion ? 0 : 200,
	easing: quintOut,
	start: prefersReducedMotion ? 1 : 0.95
}}
```

**Change to**:

```svelte
in:fly={{
	x: prefersReducedMotion ? 0 : 24,
	duration: prefersReducedMotion ? 0 : 280,
	easing: quintOut,
	delay: prefersReducedMotion ? 0 : index * 40
}}
out:fly={{
	x: prefersReducedMotion ? 0 : 12,
	duration: prefersReducedMotion ? 0 : 150,
	easing: quintIn
}}
```

**Rationale**:

- Reduced travel distance (120px → 24px) for subtle appearance
- Faster, snappier timing (400ms → 280ms)
- Remove `backOut` bounce easing, use smooth `quintOut`
- Exit slides slightly right instead of scaling (more natural)

**Import change**: Add `quintIn` to imports if not present:

```svelte
import {fly} from 'svelte/transition'; import {(quintOut, quintIn)} from 'svelte/easing';
```

Remove `backOut` and `scale` imports if no longer used.

---

## Task 2: Remove Shine/Glow Animation

**File**: `src/lib/components/ui/ToastContainer.svelte`

**Remove from template** (the `.toast-glow` div inside each toast):

```svelte
<div class="toast-glow"></div>
```

**Remove from styles** (entire block):

```css
.toast-glow {
	position: absolute;
	inset: 0;
	background: linear-gradient(
		90deg,
		transparent 0%,
		rgba(255, 255, 255, 0.03) 50%,
		transparent 100%
	);
	animation: toastShine 3s ease-in-out infinite;
	pointer-events: none;
	border-radius: inherit;
}

@keyframes toastShine {
	0%,
	100% {
		transform: translateX(-50%);
		opacity: 0;
	}
	50% {
		transform: translateX(150%);
		opacity: 1;
	}
}
```

**Rationale**: Continuous animations are visual noise. Premium apps avoid them.

---

## Task 3: Remove or Minimize Icon Pulse

**File**: `src/lib/components/ui/ToastContainer.svelte`

**Option A - Remove entirely (recommended)**:

Remove the `::before` pseudo-element from `.toast-icon`:

```css
/* DELETE this entire block */
.toast-icon::before {
	content: '';
	position: absolute;
	inset: -4px;
	border-radius: 50%;
	background: currentColor;
	opacity: 0.15;
	animation: iconPulse 2s ease-in-out infinite;
}

/* DELETE this keyframes block */
@keyframes iconPulse {
	0%,
	100% {
		opacity: 0.15;
		transform: scale(1);
	}
	50% {
		opacity: 0.25;
		transform: scale(1.1);
	}
}
```

**Option B - Make very subtle (if pulse desired)**:

Replace with single subtle pulse on entry only:

```css
.toast-icon::before {
	content: '';
	position: absolute;
	inset: -3px;
	border-radius: 50%;
	background: currentColor;
	opacity: 0;
	animation: iconFadeIn 0.4s ease-out 0.2s forwards;
}

@keyframes iconFadeIn {
	to {
		opacity: 0.1;
	}
}
```

---

## Task 4: Refine Progress Bar

**File**: `src/lib/components/ui/ToastContainer.svelte`

**Change height from 3px to 2px**:

```css
/* Current */
.toast-progress {
	height: 3px;
	/* ... */
}

/* Change to */
.toast-progress {
	height: 2px;
	/* ... */
}
```

**Reduce fill opacity** - update each progress type gradient.

**IMPORTANT**: The type class is directly ON the fill element (e.g., `class="toast-progress-fill toast-progress-success"`), NOT a parent wrapper. Current selectors are correct - just update the colors:

```css
/* Current */
.toast-progress-success {
	background: linear-gradient(90deg, #22c55e, #4ade80);
}

/* Change to (add opacity) */
.toast-progress-success {
	background: linear-gradient(90deg, rgba(34, 197, 94, 0.7), rgba(74, 222, 128, 0.7));
}

.toast-progress-error {
	background: linear-gradient(90deg, rgba(239, 68, 68, 0.7), rgba(248, 113, 113, 0.7));
}

.toast-progress-warning {
	background: linear-gradient(90deg, rgba(245, 158, 11, 0.7), rgba(251, 191, 36, 0.7));
}

.toast-progress-info {
	background: linear-gradient(90deg, rgba(212, 175, 55, 0.7), rgba(232, 197, 71, 0.7));
}
```

---

## Task 5: Update Default Durations (Single Source of Truth)

**File**: `src/lib/stores/toast.svelte.ts`

**Problem**: Current code has inconsistent defaults. `success()` and `info()` pass `duration` directly (falls to addToast's 3000ms default), while `error()` and `warning()` use `??` for explicit defaults.

**Current code (lines 84-87)**:

```typescript
success: (message: string, duration?: number) => addToast(message, 'success', duration),        // ❌ falls to 3000
error: (message: string, duration?: number) => addToast(message, 'error', duration ?? 5000),    // ✓ explicit
warning: (message: string, duration?: number) => addToast(message, 'warning', duration ?? 4000),// ✓ explicit
info: (message: string, duration?: number) => addToast(message, 'info', duration),              // ❌ falls to 3000
```

**Fix - update ALL methods to use nullish coalescing**:

```typescript
success: (message: string, duration?: number) => addToast(message, 'success', duration ?? 4000),
error: (message: string, duration?: number) => addToast(message, 'error', duration ?? 6000),
warning: (message: string, duration?: number) => addToast(message, 'warning', duration ?? 5000),
info: (message: string, duration?: number) => addToast(message, 'info', duration ?? 4000),
```

**Also update `addToast` default (line 21)**:

```typescript
// Current
function addToast(message: string, type: ToastType = 'info', duration: number = 3000);

// Change to
function addToast(message: string, type: ToastType = 'info', duration: number = 4000);
```

**Why both?** The `??` in store methods handles explicit calls. The `addToast` default is a safety net if called directly.

**Rationale**: Longer display time improves readability and accessibility. WCAG recommends ~100ms per character minimum.

---

## Task 6: Add Toast Limit (No Notification Center)

**File**: `src/lib/stores/toast.svelte.ts`

**Add constant at top of file**:

```typescript
const MAX_TOASTS = 3;
```

**Modify `addToast` function** - add limit check before pushing:

```typescript
function addToast(message: string, type: ToastType, duration: number) {
	const id = crypto.randomUUID();

	// Remove oldest toast if at limit
	if (toasts.length >= MAX_TOASTS) {
		// Prefer dropping non-error toasts first; otherwise drop the oldest
		const nonError = toasts.find((toast) => toast.type !== 'error');
		const oldest = nonError ?? toasts[0];
		remove(oldest.id);
	}

	toasts = [...toasts, { id, message, type }];

	// ... rest of timer logic
}
```

**Rationale**: Prevents toast stacking from overwhelming the UI. No history/center is planned.

---

## Task 7: Mute Icon Background Colors

**File**: `src/lib/components/ui/ToastContainer.svelte`

**Current icon backgrounds** (in CSS):

```css
.toast-success .toast-icon {
	background: rgba(34, 197, 94, 0.2);
}
.toast-error .toast-icon {
	background: rgba(239, 68, 68, 0.2);
}
.toast-warning .toast-icon {
	background: rgba(249, 115, 22, 0.2);
}
.toast-info .toast-icon {
	background: rgba(212, 175, 55, 0.2);
}
```

**Change to (reduce opacity)**:

```css
.toast-success .toast-icon {
	background: rgba(34, 197, 94, 0.12);
}
.toast-error .toast-icon {
	background: rgba(239, 68, 68, 0.12);
}
.toast-warning .toast-icon {
	background: rgba(249, 115, 22, 0.12);
}
.toast-info .toast-icon {
	background: rgba(212, 175, 55, 0.12);
}
```

---

## Task 8: Reduce Box Shadow Intensity

**File**: `src/lib/components/ui/ToastContainer.svelte`

**Current shadow**:

```css
.toast {
	box-shadow:
		0 12px 40px rgba(0, 0, 0, 0.5),
		0 4px 12px rgba(0, 0, 0, 0.3),
		inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
```

**Change to (softer)**:

```css
.toast {
	box-shadow:
		0 8px 24px rgba(0, 0, 0, 0.35),
		0 2px 8px rgba(0, 0, 0, 0.2),
		inset 0 1px 0 rgba(255, 255, 255, 0.04);
}
```

---

## Task 9: Sync Progress Bar Animation Duration

**File**: `src/lib/components/ui/ToastContainer.svelte`

The progress bar animation is currently hardcoded to 5s. It should match the toast duration on each toast, including custom durations.

**Current**:

```css
@keyframes progressShrink {
	from {
		transform: scaleX(1);
	}
	to {
		transform: scaleX(0);
	}
}

.toast-progress-fill {
	animation: progressShrink 5s linear forwards;
}
```

**Solution**: Use inline style to set animation duration dynamically.

**In the template**, change the progress fill div:

```svelte
<!-- Current -->
<div class="toast-progress-fill toast-progress-{t.type}"></div>

<!-- Change to -->
<div
	class="toast-progress-fill toast-progress-{t.type}"
	style="animation-duration: {t.duration}ms"
></div>
```

**Update CSS** - remove hardcoded duration:

```css
.toast-progress-fill {
	/* Remove: animation: progressShrink 5s linear forwards; */
	animation: progressShrink linear forwards;
	/* duration set via inline style */
}
```

**Also fix class targeting**: the type class is on the fill element (e.g., `toast-progress-success`), so update the CSS selectors accordingly:

```css
.toast-progress-success {
	/* ... */
}
.toast-progress-error {
	/* ... */
}
.toast-progress-warning {
	/* ... */
}
.toast-progress-info {
	/* ... */
}
```

---

## Task 10: Simplify Toast Padding

**File**: `src/lib/components/ui/ToastContainer.svelte`

**Current**:

```css
.toast {
	padding: 1rem 1.125rem;
	padding-bottom: 1.25rem; /* Extra space for progress bar */
}
```

**Change to (uniform, slightly smaller)**:

```css
.toast {
	padding: 0.875rem 1rem;
}
```

Also adjust progress bar position:

```css
.toast-progress {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	/* ... */
}
```

## Task 11: Pause Progress Bar Animation When Toast Is Paused

**File**: `src/lib/components/ui/ToastContainer.svelte`

The timers already pause on hover/focus for WCAG timing. The progress bar animation should pause in the same conditions for visual consistency.

**Add CSS**:

```css
.toast:hover .toast-progress-fill,
.toast:focus-within .toast-progress-fill {
	animation-play-state: paused;
}
```

---

## Task 12: Tab Visibility Handling (2026 Best Practice)

**File**: `src/lib/stores/toast.svelte.ts`

When the user switches tabs, toasts should pause so they don't miss notifications. This is a Sonner-style pattern adopted widely in 2025-2026.

**Add at the end of the file, before the export**:

```typescript
// Pause all toasts when tab is hidden (2026 best practice)
if (typeof document !== 'undefined') {
	document.addEventListener('visibilitychange', () => {
		if (document.hidden) {
			document.documentElement.classList.add('toast-paused');
			toasts.forEach((t) => pause(t.id));
		} else {
			document.documentElement.classList.remove('toast-paused');
			toasts.forEach((t) => resume(t.id));
		}
	});
}
```

**Add CSS** (in `ToastContainer.svelte`) to pause the progress bar when the tab is hidden:

```css
.toast-paused .toast-progress-fill {
	animation-play-state: paused;
}
```

**Rationale**: Users switching tabs shouldn't miss important toasts. Pausing the progress bar keeps visual timing aligned.

---

## Task 13: Use CSS Transitions for Interruptible Animations (2026 Best Practice)

**File**: `src/lib/components/ui/ToastContainer.svelte`

Modern toast libraries use **interruptible** animations so existing toasts smoothly reposition instead of jumping.

**Preferred (minimal change)**: Add Svelte's `animate:flip` to the toast element. It animates layout changes and is interruptible:

```svelte
<div class="toast" animate:flip>
```

**Advanced optional**: Replace Svelte transitions with CSS transitions for entry. If you do this:

1. Remove `in:fly`/`out:fly` from the toast div
2. Use CSS classes with `transition: transform 280ms cubic-bezier(0.22, 1, 0.36, 1)`
3. Add/remove a `.mounted` class on mount
4. Add a `prefers-reduced-motion` override to disable transitions

**Example approach**:

```svelte
<script>
	import { onMount } from 'svelte';
	let mounted = $state(false);
	onMount(() => { mounted = true; });
</script>

<div class="toast" class:mounted>
```

```css
.toast {
	transform: translateX(24px);
	opacity: 0;
	transition:
		transform 280ms cubic-bezier(0.22, 1, 0.36, 1),
		opacity 280ms ease-out;
}

.toast.mounted {
	transform: translateX(0);
	opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
	.toast {
		transition: none;
		transform: none;
		opacity: 1;
	}
}
```

**Skip this task if time-constrained** - Svelte transitions are acceptable.

---

## Validation Checklist

After implementing all changes, verify:

- [ ] Toasts appear with subtle slide (24px, 280ms)
- [ ] No continuous animations (shine/pulse removed)
- [ ] Progress bar is thinner (2px) and muted
- [ ] Default duration is 4s (success/info), 5s (warning), 6s (error)
- [ ] Maximum 3 toasts visible at once
- [ ] Reduced motion still works (test with browser setting)
- [ ] ARIA attributes unchanged (`role`, `aria-live`)
- [ ] Pause on hover still works
- [ ] Close button still works
- [ ] All toast types render correctly (success, error, warning, info)
- [ ] Progress bar timing uses `Toast.duration` and pauses with hover/focus
- [ ] Toasts pause when switching browser tabs (Task 12)
- [ ] Duration defaults use `??` consistently in all store methods (Task 5)

---

## Files Summary

| File                    | Changes                                                                                      |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| `ToastContainer.svelte` | Animation (1,13), glow/pulse (2,3), progress (4,9,11), shadows (8), colors (7), padding (10) |
| `toast.svelte.ts`       | Durations fix (5), toast limit (6), tab visibility (12)                                      |

---

## Notes for AI Agent

1. Read each file fully before making changes
2. Make changes incrementally - one task at a time
3. Preserve all accessibility features (ARIA, pause/resume, reduced motion)
4. Do not modify the store's public API - only internal implementation
5. Test that `pnpm check` passes after changes
6. The app uses Svelte 5 runes - do not introduce legacy syntax
