/**
 * Svelte action for keyboard navigation inside dropdown menus and listboxes.
 * Usage: <div role="menu" use:menuKeyNav={{ onClose }}>...</div>
 *
 * Provides ArrowUp/ArrowDown/Home/End roving focus across items marked
 * role="menuitem" or role="option", and Escape to close. Focus returns to the
 * element that was focused before the menu opened (usually the trigger).
 */

export interface MenuKeyNavOptions {
	onClose?: () => void;
}

const ITEM_SELECTOR = '[role="menuitem"], [role="option"]';

export function menuKeyNav(node: HTMLElement, options: MenuKeyNavOptions = {}) {
	let currentOptions = options;
	// Captured at mount — the menu just opened, so this is the trigger
	const triggerElement =
		document.activeElement instanceof HTMLElement ? document.activeElement : null;

	function getItems(): HTMLElement[] {
		return Array.from(node.querySelectorAll<HTMLElement>(ITEM_SELECTOR)).filter(
			(el) => !el.hasAttribute('disabled') && el.getAttribute('aria-disabled') !== 'true'
		);
	}

	function focusItem(index: number): void {
		const items = getItems();
		if (items.length === 0) return;
		const clamped = ((index % items.length) + items.length) % items.length;
		items[clamped].focus();
	}

	function handleKeydown(event: KeyboardEvent): void {
		const items = getItems();

		switch (event.key) {
			case 'ArrowDown': {
				event.preventDefault();
				const current = items.indexOf(document.activeElement as HTMLElement);
				focusItem(current + 1);
				break;
			}
			case 'ArrowUp': {
				event.preventDefault();
				const current = items.indexOf(document.activeElement as HTMLElement);
				focusItem(current === -1 ? items.length - 1 : current - 1);
				break;
			}
			case 'Home':
				event.preventDefault();
				focusItem(0);
				break;
			case 'End':
				event.preventDefault();
				focusItem(items.length - 1);
				break;
			case 'Escape':
				event.preventDefault();
				event.stopPropagation();
				currentOptions.onClose?.();
				triggerElement?.focus();
				break;
		}
	}

	node.addEventListener('keydown', handleKeydown);

	return {
		update(newOptions: MenuKeyNavOptions) {
			currentOptions = newOptions;
		},
		destroy() {
			node.removeEventListener('keydown', handleKeydown);
		}
	};
}
