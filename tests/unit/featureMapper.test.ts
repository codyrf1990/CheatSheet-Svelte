import { describe, it, expect } from 'vitest';
import { mapFeatures, groupByPackage, getUniqueSkus, SKU_MAP } from '$lib/utils/featureMapper';

describe('mapFeatures', () => {
	it('maps known features to bits and tracks unmapped ones', () => {
		const result = mapFeatures(['SolidCAM Mill 2D', 'Totally Made Up Feature']);
		expect(result.mappedFeatures.some((f) => f.bit === 'SolidCAM Mill 2D')).toBe(true);
		expect(result.unmappedFeatures).toContain('Totally Made Up Feature');
	});

	it('maps maintenance-SKU features like Sim. Turning', () => {
		expect(SKU_MAP['Sim. Turning']).toBe('SimTurn-Maint');
		const result = mapFeatures(['Sim. Turning']);
		expect(result.mappedSkus.some((s) => s.sku === 'SimTurn-Maint')).toBe(true);
	});

	it('handles alternate spellings that target the same bit', () => {
		const a = mapFeatures(['Chamfer recognition']);
		const b = mapFeatures(['Chamfer Recognition']);
		expect(a.mappedFeatures[0]?.bit).toBe(b.mappedFeatures[0]?.bit);
	});
});

describe('groupByPackage / getUniqueSkus', () => {
	it('groups mapped bits under their package', () => {
		const result = mapFeatures(['SolidCAM Mill 2D', 'SolidCAM Turning', 'Pocket Recognition']);
		const grouped = groupByPackage(result.mappedFeatures);
		expect(grouped['SC-Mill']).toContain('SolidCAM Mill 2D');
		expect(grouped['SC-Mill']).toContain('Pocket Recognition');
		expect(grouped['SC-Turn']).toContain('SolidCAM Turning');
	});

	it('deduplicates SKUs from alternate feature spellings', () => {
		const result = mapFeatures(['Sim. Turning', 'Sim. Turning']);
		const skus = getUniqueSkus(result.mappedSkus);
		expect(skus.filter((s) => s === 'SimTurn-Maint')).toHaveLength(1);
	});
});
