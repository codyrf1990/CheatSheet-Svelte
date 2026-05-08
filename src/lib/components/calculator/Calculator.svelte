<script lang="ts">
	import type { CalculatorState } from '$types';
	import { Tooltip } from '$components/ui';
	import { copyToClipboard } from '$lib/utils/clipboard';

	// Calculator state
	let state = $state<CalculatorState>({
		displayValue: '0',
		firstOperand: null,
		waitingForSecondOperand: false,
		operator: null,
		error: false,
		justEvaluated: false
	});

	// Currency formatter
	const currencyFormatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});

	// Quick percent buttons
	const quickPercents = [5, 10, 15, 20, 25, 30];

	// Derived display text
	let displayText = $derived(formatCurrencyDisplay(state.displayValue, state.error));

	// Format for currency display
	function formatCurrencyDisplay(value: string, isError: boolean): string {
		if (isError) return 'Error';
		if (value === null || value === undefined) return '$0.00';

		const numericValue = Number(value);
		if (!Number.isFinite(numericValue)) {
			return currencyFormatter.format(0);
		}

		return currencyFormatter.format(numericValue);
	}

	// Format result for internal calculations
	function formatResult(value: number | null): string {
		if (value === null || !Number.isFinite(value)) {
			return 'Error';
		}

		const rounded = Math.round((value + Number.EPSILON) * 1e12) / 1e12;
		let text = rounded.toString();

		if (text.includes('e')) {
			return text;
		}

		if (text.includes('.')) {
			text = text.replace(/\.?0+$/, '');
		}

		return text;
	}

	// Perform calculation
	function performCalculation(
		operator: string,
		firstOperand: number,
		secondOperand: number
	): number | null {
		switch (operator) {
			case '+':
				return firstOperand + secondOperand;
			case '-':
				return firstOperand - secondOperand;
			case '*':
				return firstOperand * secondOperand;
			case '/':
				return secondOperand === 0 ? null : firstOperand / secondOperand;
			default:
				return secondOperand;
		}
	}

	// Reset state
	function resetState() {
		state = {
			displayValue: '0',
			firstOperand: null,
			waitingForSecondOperand: false,
			operator: null,
			error: false,
			justEvaluated: false
		};
	}

	// Set error state
	function setError() {
		state = {
			displayValue: 'Error',
			firstOperand: null,
			waitingForSecondOperand: false,
			operator: null,
			error: true,
			justEvaluated: false
		};
	}

	// Input a digit
	function inputDigit(digit: string) {
		if (state.error) {
			resetState();
		}

		if (state.justEvaluated) {
			state = {
				...state,
				displayValue: digit,
				firstOperand: null,
				operator: null,
				waitingForSecondOperand: false,
				error: false,
				justEvaluated: false
			};
			return;
		}

		if (state.waitingForSecondOperand) {
			state = { ...state, displayValue: digit, waitingForSecondOperand: false };
		} else {
			if (state.displayValue === '0') {
				state = { ...state, displayValue: digit };
			} else if (state.displayValue === '-0') {
				state = { ...state, displayValue: '-' + digit };
			} else {
				state = { ...state, displayValue: state.displayValue + digit };
			}
		}
	}

	// Input decimal
	function inputDecimal() {
		if (state.error) {
			resetState();
		}

		if (state.justEvaluated) {
			state = {
				...state,
				displayValue: '0.',
				firstOperand: null,
				operator: null,
				waitingForSecondOperand: false,
				error: false,
				justEvaluated: false
			};
			return;
		}

		if (state.waitingForSecondOperand) {
			state = { ...state, displayValue: '0.', waitingForSecondOperand: false };
			return;
		}

		if (!state.displayValue.includes('.')) {
			state = { ...state, displayValue: state.displayValue + '.' };
		}
	}

	// Handle operator
	function handleOperator(nextOperator: string) {
		if (state.error) return;

		let newState = { ...state };
		if (state.justEvaluated) {
			newState.justEvaluated = false;
		}

		const inputValue = parseFloat(newState.displayValue);
		if (Number.isNaN(inputValue)) return;

		if (newState.operator && newState.waitingForSecondOperand) {
			state = { ...newState, operator: nextOperator };
			return;
		}

		if (newState.firstOperand === null) {
			state = {
				...newState,
				firstOperand: inputValue,
				operator: nextOperator,
				waitingForSecondOperand: true
			};
		} else if (newState.operator) {
			const result = performCalculation(newState.operator, newState.firstOperand, inputValue);
			if (result === null) {
				setError();
				return;
			}
			const formatted = formatResult(result);
			if (formatted === 'Error') {
				setError();
				return;
			}
			state = {
				...newState,
				displayValue: formatted,
				firstOperand: result,
				operator: nextOperator,
				waitingForSecondOperand: true,
				error: false
			};
		}
	}

	// Handle equals
	function handleEquals() {
		if (state.error || state.operator === null || state.waitingForSecondOperand) return;

		const inputValue = parseFloat(state.displayValue);
		if (Number.isNaN(inputValue)) return;

		const result = performCalculation(state.operator, state.firstOperand!, inputValue);
		if (result === null) {
			setError();
			return;
		}

		const formatted = formatResult(result);
		if (formatted === 'Error') {
			setError();
			return;
		}

		state = {
			displayValue: formatted,
			firstOperand: null,
			operator: null,
			waitingForSecondOperand: false,
			error: false,
			justEvaluated: true
		};
	}

	// Handle clear
	function handleClear() {
		resetState();
	}

	// Handle delete
	function handleDelete() {
		if (state.error) {
			resetState();
			return;
		}

		if (state.waitingForSecondOperand) return;

		let newValue: string;
		if (state.displayValue.length > 1) {
			newValue = state.displayValue.slice(0, -1);
			if (newValue === '-' || newValue === '-0' || newValue === '') {
				newValue = '0';
			}
		} else {
			newValue = '0';
		}
		state = { ...state, displayValue: newValue };
	}

	// Handle toggle sign
	function handleToggleSign() {
		if (state.error) return;

		if (state.waitingForSecondOperand) {
			state = { ...state, displayValue: '-0', waitingForSecondOperand: false };
			return;
		}

		if (state.displayValue === '0' || state.displayValue === '-0') {
			state = {
				...state,
				displayValue: state.displayValue.startsWith('-') ? '0' : '-0'
			};
			return;
		}

		const value = parseFloat(state.displayValue);
		if (Number.isNaN(value)) return;

		const formatted = formatResult(-value);
		if (formatted === 'Error') {
			setError();
			return;
		}
		state = { ...state, displayValue: formatted, error: false };
	}

	// Handle percent
	function handlePercent() {
		if (state.error) return;

		const value = parseFloat(state.displayValue);
		if (Number.isNaN(value)) return;

		let result = value / 100;
		if (state.operator && state.firstOperand !== null && !state.waitingForSecondOperand) {
			result = (state.firstOperand * value) / 100;
		}

		const formatted = formatResult(result);
		if (formatted === 'Error') {
			setError();
			return;
		}

		state = {
			...state,
			displayValue: formatted,
			waitingForSecondOperand: false,
			error: false,
			justEvaluated: true
		};
	}

	// Handle quick percent
	function handleQuickPercent(percent: number) {
		if (!Number.isFinite(percent) || Number.isNaN(percent)) return;
		if (state.error) return;

		let baseValue: number;
		let usedAsSecondOperand = false;

		if (state.waitingForSecondOperand && state.firstOperand !== null) {
			baseValue = state.firstOperand;
			usedAsSecondOperand = true;
		} else {
			baseValue = parseFloat(state.displayValue);
		}

		if (Number.isNaN(baseValue)) return;

		const result = (baseValue * percent) / 100;
		const formatted = formatResult(result);
		if (formatted === 'Error') {
			setError();
			return;
		}

		if (usedAsSecondOperand) {
			state = {
				...state,
				displayValue: formatted,
				error: false,
				waitingForSecondOperand: false,
				justEvaluated: false
			};
		} else {
			state = {
				...state,
				displayValue: formatted,
				firstOperand: null,
				operator: null,
				waitingForSecondOperand: false,
				error: false,
				justEvaluated: true
			};
		}
	}

	// Single-click copy (negated truncated value for discounts)
	async function handleDisplayClick() {
		if (state.error) return;

		const numericValue = Number(state.displayValue);
		if (!Number.isFinite(numericValue)) return;

		const truncatedValue = Math.trunc(numericValue);
		let textToCopy: string;

		if (Object.is(truncatedValue, 0) || truncatedValue === 0) {
			textToCopy = '-0';
		} else if (truncatedValue > 0) {
			textToCopy = (-truncatedValue).toString();
		} else {
			textToCopy = truncatedValue.toString();
		}

		await copyToClipboard(textToCopy, `Copied: ${textToCopy}`);
	}

	// Double-click copy (full value)
	async function handleDisplayDoubleClick() {
		if (state.error) return;

		await copyToClipboard(state.displayValue, `Copied: ${state.displayValue}`);
	}
</script>

<section class="panel calculator-panel tile" data-panel="calculator" aria-label="Price calculator">
	<div class="panel-head">
		<h2 class="panel-title">Calculator</h2>
	</div>
	<div class="calculator-shell">
		<div class="calculator" role="application" aria-label="Calculator">
			<Tooltip text="Click to copy discount value • Double-click to copy full value">
				<button
					type="button"
					class="calculator-display"
					onclick={handleDisplayClick}
					ondblclick={handleDisplayDoubleClick}
					aria-label="Display: {displayText}. Click to copy discount, double-click to copy full value"
					aria-live="polite"
				>
					{displayText}
				</button>
			</Tooltip>
			{#if state.error}
				<p class="error-hint">Press AC to clear</p>
			{/if}
			<div class="calculator-buttons">
				<button type="button" class="calc-btn clear" onclick={handleClear} aria-label="All clear"
					>AC</button
				>
				<button type="button" class="calc-btn" onclick={handleDelete} aria-label="Delete last digit"
					>DEL</button
				>
				<button
					type="button"
					class="calc-btn operation"
					onclick={handlePercent}
					aria-label="Percent">%</button
				>
				<button
					type="button"
					class="calc-btn operation"
					onclick={() => handleOperator('/')}
					aria-label="Divide">÷</button
				>

				<button type="button" class="calc-btn" onclick={() => inputDigit('7')} aria-label="7"
					>7</button
				>
				<button type="button" class="calc-btn" onclick={() => inputDigit('8')} aria-label="8"
					>8</button
				>
				<button type="button" class="calc-btn" onclick={() => inputDigit('9')} aria-label="9"
					>9</button
				>
				<button
					type="button"
					class="calc-btn operation"
					onclick={() => handleOperator('*')}
					aria-label="Multiply">×</button
				>

				<button type="button" class="calc-btn" onclick={() => inputDigit('4')} aria-label="4"
					>4</button
				>
				<button type="button" class="calc-btn" onclick={() => inputDigit('5')} aria-label="5"
					>5</button
				>
				<button type="button" class="calc-btn" onclick={() => inputDigit('6')} aria-label="6"
					>6</button
				>
				<button
					type="button"
					class="calc-btn operation"
					onclick={() => handleOperator('-')}
					aria-label="Subtract">−</button
				>

				<button type="button" class="calc-btn" onclick={() => inputDigit('1')} aria-label="1"
					>1</button
				>
				<button type="button" class="calc-btn" onclick={() => inputDigit('2')} aria-label="2"
					>2</button
				>
				<button type="button" class="calc-btn" onclick={() => inputDigit('3')} aria-label="3"
					>3</button
				>
				<button
					type="button"
					class="calc-btn operation"
					onclick={() => handleOperator('+')}
					aria-label="Add">+</button
				>

				<button
					type="button"
					class="calc-btn"
					onclick={handleToggleSign}
					aria-label="Toggle positive/negative">+/−</button
				>
				<button type="button" class="calc-btn" onclick={() => inputDigit('0')} aria-label="0"
					>0</button
				>
				<button type="button" class="calc-btn" onclick={inputDecimal} aria-label="Decimal point"
					>.</button
				>
				<button type="button" class="calc-btn equals" onclick={handleEquals} aria-label="Equals"
					>=</button
				>
			</div>
			<div class="calculator-quick-row" aria-label="Quick discount percentages">
				{#each quickPercents as pct (pct)}
					<button
						type="button"
						class="calc-btn quick-percent"
						onclick={() => handleQuickPercent(pct)}
						aria-label="Calculate {pct} percent discount"
					>
						{pct}%
					</button>
				{/each}
			</div>
		</div>
	</div>
</section>

<style>
	.calculator-panel {
		overflow: hidden;
	}

	.panel-head {
		display: flex;
		align-items: center;
		padding: 0.3rem 0.5rem;
		background: var(--tile-header-bg);
		border-bottom: var(--tile-header-border);
	}

	.panel-title {
		margin: 0;
		font-size: var(--tile-title-size);
		font-weight: var(--tile-title-weight);
		letter-spacing: var(--tile-title-tracking);
		text-transform: uppercase;
		color: var(--tile-title-color);
	}

	.calculator-shell {
		padding: 0.375rem;
	}

	.calculator {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.calculator-display {
		width: 100%;
		padding: 0.45rem 0.6rem;
		background:
			linear-gradient(180deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.35) 100%);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: var(--radius-sm);
		font-family: 'JetBrains Mono Variable', 'JetBrains Mono', monospace;
		font-size: 1.125rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.005em;
		color: var(--color-solidcam-gold, #d4af37);
		text-align: right;
		cursor: pointer;
		text-shadow: 0 0 12px rgba(212, 175, 55, 0.25);
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.4),
			inset 0 -1px 0 rgba(255, 255, 255, 0.04);
		transition:
			background 200ms var(--ease-out-quart),
			border-color 200ms var(--ease-out-quart),
			box-shadow 280ms var(--ease-out-expo);
	}

	.calculator-display:hover {
		border-color: var(--gold-a30);
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.4),
			inset 0 -1px 0 rgba(255, 255, 255, 0.05),
			0 0 18px rgba(212, 175, 55, 0.18);
	}

	.calculator-display:active {
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.5),
			inset 0 0 12px rgba(212, 175, 55, 0.15);
	}

	.error-hint {
		margin: 0;
		padding: 0.125rem 0;
		font-size: 0.65rem;
		color: rgba(255, 102, 102, 0.7);
		text-align: center;
	}

	.calculator-buttons {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.25rem;
	}

	.calc-btn {
		padding: 0.5rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: var(--radius-sm);
		font-family: inherit;
		font-size: 0.85rem;
		font-weight: 540;
		color: rgba(255, 255, 255, 0.9);
		cursor: pointer;
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
		transition:
			background 150ms var(--ease-out-quart),
			border-color 150ms var(--ease-out-quart),
			color 150ms var(--ease-out-quart),
			transform 100ms var(--ease-out-quart),
			box-shadow 200ms var(--ease-out-expo);
	}

	.calc-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.16);
	}

	.calc-btn:active {
		transform: scale(0.96);
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.25);
	}

	.calc-btn.clear {
		background: var(--red-a20);
		border-color: var(--red-a30);
		color: #fca5a5;
	}

	.calc-btn.clear:hover {
		background: rgba(200, 16, 46, 0.28);
		border-color: rgba(200, 16, 46, 0.45);
		color: #fecaca;
	}

	.calc-btn.operation {
		background: var(--gold-a10);
		border-color: var(--gold-a30);
		color: var(--color-solidcam-gold, #d4af37);
	}

	.calc-btn.operation:hover {
		background: var(--gold-a20);
		border-color: var(--gold-a45);
	}

	.calc-btn.equals {
		background: linear-gradient(135deg, #e8c547 0%, #d4af37 100%);
		border-color: var(--color-solidcam-gold, #d4af37);
		color: #1a1a1a;
		font-weight: 700;
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.4),
			0 4px 12px rgba(212, 175, 55, 0.25);
	}

	.calc-btn.equals:hover {
		background: linear-gradient(135deg, #f0cc52 0%, #e3bd44 100%);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.45),
			0 6px 18px rgba(212, 175, 55, 0.4);
	}

	.calculator-quick-row {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 0.1875rem;
		margin-top: 0.1875rem;
	}

	.calc-btn.quick-percent {
		padding: 0.25rem;
		font-size: 0.7rem;
		background: var(--gold-a05);
		border-color: var(--gold-a20);
		color: rgba(212, 175, 55, 0.85);
		box-shadow: none;
	}

	.calc-btn.quick-percent:hover {
		background: var(--gold-a20);
		border-color: var(--gold-a30);
		color: var(--color-solidcam-gold);
	}

	/* Narrow viewport compaction */
	@media (max-width: 768px) {
		.panel-head {
			padding: 0.2rem 0.35rem;
		}

		.panel-title {
			font-size: var(--text-xs);
		}

		.calculator-shell {
			padding: 0.25rem;
		}

		.calculator {
			gap: 0.2rem;
		}

		.calculator-display {
			padding: 0.25rem 0.35rem;
			font-size: 0.9rem;
		}

		.calculator-buttons {
			gap: 0.2rem;
		}

		.calc-btn {
			padding: 0.35rem;
			font-size: 0.7rem;
		}

		.calculator-quick-row {
			gap: 0.125rem;
			margin-top: 0.125rem;
		}

		.calc-btn.quick-percent {
			padding: 0.15rem;
			font-size: 0.55rem;
		}
	}

	@media (max-width: 640px) {
		.panel-head {
			padding: 0.15rem 0.25rem;
		}

		.panel-title {
			font-size: var(--text-xs);
		}

		.calculator-shell {
			padding: 0.15rem;
		}

		.calculator {
			gap: 0.15rem;
		}

		.calculator-display {
			padding: 0.2rem 0.25rem;
			font-size: 0.75rem;
		}

		.calculator-buttons {
			gap: 0.15rem;
		}

		.calc-btn {
			padding: 0.25rem;
			font-size: 0.6rem;
		}

		.calculator-quick-row {
			gap: 0.1rem;
		}

		.calc-btn.quick-percent {
			padding: 0.1rem;
			font-size: 0.5rem;
		}
	}
</style>
