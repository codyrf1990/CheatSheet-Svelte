/**
 * Svelte action for tooltips.
 * Usage: <button use:tooltip={'Click to copy'}>...</button>
 *
 * Delegates to the shared singleton tooltipEngine.
 */

import { showTooltip, hideTooltip } from './tooltipEngine';

export function tooltip(node: HTMLElement, text: string) {
	let currentText = text;

	const show = () => showTooltip(node, currentText);
	const hide = () => hideTooltip();

	node.addEventListener('mouseenter', show);
	node.addEventListener('mouseleave', hide);
	node.addEventListener('focusin', show);
	node.addEventListener('focusout', hide);

	return {
		update(newText: string) {
			currentText = newText;
		},
		destroy() {
			node.removeEventListener('mouseenter', show);
			node.removeEventListener('mouseleave', hide);
			node.removeEventListener('focusin', show);
			node.removeEventListener('focusout', hide);
			hideTooltip();
		}
	};
}
