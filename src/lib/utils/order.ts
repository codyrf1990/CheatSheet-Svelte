/**
 * Order utilities for drag-drop reordering
 */

/**
 * Apply stored order to items array.
 * Items in storedOrder come first (in that order), then remaining items.
 * @param items - The items to order
 * @param storedOrder - The stored order preference (can be undefined/empty)
 * @returns Ordered items array
 */
export function applyOrder(items: string[], storedOrder: string[] | undefined): string[] {
	if (!storedOrder || storedOrder.length === 0) return items;

	const ordered: string[] = [];
	const remaining = new Set(items);

	// Add items in stored order (if they still exist)
	for (const item of storedOrder) {
		if (remaining.has(item)) {
			ordered.push(item);
			remaining.delete(item);
		}
	}

	// Add any remaining items not in stored order
	for (const item of remaining) {
		ordered.push(item);
	}

	return ordered;
}
