import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseSalesforceText } from '../src/lib/utils/salesforceParser';
import {
	isSolidWorksText,
	parseSolidWorksText,
	solidworksMaintSku
} from '../src/lib/utils/solidworksParser';
import {
	getLicenseSelections,
	getPageNameForLicense,
	PACKAGE_BIT_SKUS
} from '../src/lib/utils/licenseSelections';

function usage(): void {
	console.error('Usage: pnpm exec tsx scripts/salesforce-regression.ts [path-to-text]');
	console.error('If no path is provided, paste data and press Ctrl+D to finish.');
}

async function readStdin(): Promise<string> {
	return await new Promise((resolveText, reject) => {
		let data = '';
		process.stdin.setEncoding('utf8');
		process.stdin.on('data', (chunk) => {
			data += chunk;
		});
		process.stdin.on('end', () => resolveText(data));
		process.stdin.on('error', reject);
	});
}

async function run(): Promise<void> {
	const filePath = process.argv[2];
	let text = '';

	if (filePath) {
		text = readFileSync(resolve(filePath), 'utf8');
	} else {
		if (process.stdin.isTTY) {
			console.error('Paste Salesforce text now, then press Ctrl+D...');
		}
		text = await readStdin();
	}

	if (!text.trim()) {
		usage();
		process.exit(1);
	}

	if (isSolidWorksText(text)) {
		const swResult = parseSolidWorksText(text);
		if (!swResult.license) {
			console.error(swResult.parseError || 'SolidWorks parse failed');
			process.exit(1);
		}
		const lic = swResult.license;
		console.log('-- SolidWorks license --');
		console.log(`Account: ${lic.account}`);
		console.log(`Product: ${lic.product}  (raw: ${lic.productRaw})`);
		console.log(`Serial: ${lic.serialNumber}`);
		console.log(`Customer ID: ${lic.customerId || '(none)'}`);
		console.log(`Subscription: ${lic.subscriptionStart || '?'} -> ${lic.subscriptionEnd || '?'}`);
		console.log(`Termination Date: ${lic.subscriptionTermination || '(none)'}`);
		console.log(`Users: ${lic.users}`);
		console.log(`Network: ${lic.isNetworkLicense ? 'yes' : 'no'}`);
		console.log(`Term: ${lic.isTermLicense ? 'yes' : 'no'}`);
		console.log(`Termination of Support: ${lic.terminationOfSupport ? 'yes' : 'no'}`);
		console.log(`PO Number: ${lic.poNumber || '(none)'}`);
		console.log(`Maint SKU: ${solidworksMaintSku(lic) ?? '(none — Other product)'}`);
		return;
	}

	const result = parseSalesforceText(text);
	if (!result.license) {
		console.error(result.parseError || 'Parse failed');
		process.exit(1);
	}

	const license = result.license;
	const selections = getLicenseSelections(license);
	const pageName = getPageNameForLicense(license);
	const skusToAdd = selections.skus.filter((sku) => !PACKAGE_BIT_SKUS.has(sku));
	const sim5xBits = selections.bitsByPackage['SC-Mill-5Axis'] ?? [];
	const hasSim5x = license.features.some((feature) => {
		const normalized = feature.replace(/\s+/g, ' ').trim().toLowerCase();
		return (
			normalized === 'sim 5x' ||
			normalized === 'sim5x' ||
			normalized === 'simultaneous 5x' ||
			normalized === 'simultanous 5x'
		);
	});

	console.log(`Customer: ${license.customer}`);
	console.log(`Page name: ${pageName}`);
	console.log(`Profile: ${license.isProfile ? 'yes' : 'no'}`);
	console.log(`Sim 5x checked: ${hasSim5x ? 'yes' : 'no'}`);
	console.log(`Sim 5x level: ${license.sim5xLevel || '(blank)'}`);
	console.log(`SC-Mill-5Axis bits: ${sim5xBits.length ? sim5xBits.join(', ') : '(none)'}`);
	console.log(`Maintenance SKUs to add: ${skusToAdd.length ? skusToAdd.join(', ') : '(none)'}`);
	console.log(
		`Mapping counts: ${selections.mappingResult.mappedFeatures.length} mapped, ` +
			`${selections.mappingResult.mappedSkus.length} sku, ` +
			`${selections.mappingResult.unmappedFeatures.length} unmapped, ` +
			`${selections.mappingResult.ignoredFeatures.length} ignored`
	);
}

run().catch((error) => {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
});
