/**
 * Singleton Tooltip Engine
 *
 * One tooltip DOM element shared across the entire app.
 * Both the <Tooltip> component and use:tooltip action call into this.
 *
 * Timing:
 *   - Show delay: 500ms on first hover
 *   - Warm-up: 150ms when moving between elements within 300ms
 *   - Hide: instant (no delay)
 *   - Fade: 120ms CSS opacity transition
 */

let tipEl: HTMLDivElement | null = null;
let showTimer: ReturnType<typeof setTimeout> | null = null;
let lastHideTime = 0;
let currentNode: HTMLElement | null = null;
let lastNode: HTMLElement | null = null;

const SHOW_DELAY = 500;
const WARMUP_DELAY = 150;
const WARMUP_WINDOW = 300;
const VIEWPORT_PAD = 8;

function ensureTipEl(): HTMLDivElement {
	if (!tipEl) {
		tipEl = document.createElement('div');
		tipEl.className = 'app-tooltip';
		tipEl.role = 'tooltip';
		tipEl.id = 'app-tooltip-singleton';
		document.body.appendChild(tipEl);
	}
	return tipEl;
}

function positionTip(node: HTMLElement, position: 'top' | 'bottom'): void {
	const tip = ensureTipEl();
	const rect = node.getBoundingClientRect();
	const x = rect.left + rect.width / 2;

	if (position === 'bottom') {
		tip.style.cssText = `left:${x}px;top:${rect.bottom + 6}px;transform:translateX(-50%)`;
	} else {
		tip.style.cssText = `left:${x}px;top:${rect.top - 6}px;transform:translateX(-50%) translateY(-100%)`;
	}

	// Clamp horizontally so the tooltip doesn't overflow the viewport
	const tipWidth = tip.offsetWidth;
	const half = tipWidth / 2;
	const min = VIEWPORT_PAD + half;
	const max = window.innerWidth - VIEWPORT_PAD - half;
	if (x < min || x > max) {
		tip.style.left = `${Math.max(min, Math.min(max, x))}px`;
	}
}

export function showTooltip(
	node: HTMLElement,
	text: string,
	position: 'top' | 'bottom' = 'top'
): void {
	if (!text) return;

	// Clear any pending show from a previous hover
	if (showTimer) {
		clearTimeout(showTimer);
		showTimer = null;
	}

	// Hide current tooltip instantly if switching targets
	if (tipEl) {
		tipEl.classList.remove('visible');
	}

	const tip = ensureTipEl();
	tip.textContent = text;

	// Clean up previous node's aria link
	if (currentNode && currentNode !== node) {
		currentNode.removeAttribute('aria-describedby');
	}
	currentNode = node;
	node.setAttribute('aria-describedby', 'app-tooltip-singleton');

	// Warm-up: shorter (but non-zero) delay when quickly moving between elements.
	// Re-hovering the same element always gets the full delay.
	const isSameTarget = node === lastNode;
	const elapsed = Date.now() - lastHideTime;
	const delay = !isSameTarget && elapsed < WARMUP_WINDOW ? WARMUP_DELAY : SHOW_DELAY;

	showTimer = setTimeout(() => {
		positionTip(node, position);
		tip.classList.add('visible');
		showTimer = null;
	}, delay);
}

export function hideTooltip(): void {
	// Cancel pending show
	if (showTimer) {
		clearTimeout(showTimer);
		showTimer = null;
	}

	// Hide immediately
	if (tipEl) {
		tipEl.classList.remove('visible');
	}

	// Remember which node we just left (for warm-up check)
	lastNode = currentNode;

	// Clean up aria link
	if (currentNode) {
		currentNode.removeAttribute('aria-describedby');
		currentNode = null;
	}

	lastHideTime = Date.now();
}
