<script lang="ts">
	import type { CalculatorState } from '$types';
	import { toastStore } from '$stores/toast.svelte';

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
			state = { ...newState, firstOperand: inputValue, operator: nextOperator, waitingForSecondOperand: true };
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

		try {
			await navigator.clipboard.writeText(textToCopy);
			toastStore.success(`Copied: ${textToCopy}`, 1500);
		} catch {
			toastStore.error('Failed to copy');
		}
	}

	// Double-click copy (full value)
	async function handleDisplayDoubleClick() {
		if (state.error) return;

		try {
			await navigator.clipboard.writeText(state.displayValue);
			toastStore.success(`Copied: ${state.displayValue}`, 1500);
		} catch {
			toastStore.error('Failed to copy');
		}
	}
</script>

<section class="panel calculator-panel" data-panel="calculator">
	<div class="panel-head">
		<h2 class="panel-title">Calculator</h2>
	</div>
	<div class="calculator-shell">
		<div class="calculator">
			<button
				type="button"
				class="calculator-display"
				onclick={handleDisplayClick}
				ondblclick={handleDisplayDoubleClick}
			>
				{displayText}
			</button>
			<div class="calculator-buttons">
				<button type="button" class="calc-btn clear" onclick={handleClear}>AC</button>
				<button type="button" class="calc-btn" onclick={handleDelete}>DEL</button>
				<button type="button" class="calc-btn operation" onclick={handlePercent}>%</button>
				<button type="button" class="calc-btn operation" onclick={() => handleOperator('/')}>÷</button>

				<button type="button" class="calc-btn" onclick={() => inputDigit('7')}>7</button>
				<button type="button" class="calc-btn" onclick={() => inputDigit('8')}>8</button>
				<button type="button" class="calc-btn" onclick={() => inputDigit('9')}>9</button>
				<button type="button" class="calc-btn operation" onclick={() => handleOperator('*')}>×</button>

				<button type="button" class="calc-btn" onclick={() => inputDigit('4')}>4</button>
				<button type="button" class="calc-btn" onclick={() => inputDigit('5')}>5</button>
				<button type="button" class="calc-btn" onclick={() => inputDigit('6')}>6</button>
				<button type="button" class="calc-btn operation" onclick={() => handleOperator('-')}>−</button>

				<button type="button" class="calc-btn" onclick={() => inputDigit('1')}>1</button>
				<button type="button" class="calc-btn" onclick={() => inputDigit('2')}>2</button>
				<button type="button" class="calc-btn" onclick={() => inputDigit('3')}>3</button>
				<button type="button" class="calc-btn operation" onclick={() => handleOperator('+')}>+</button>

				<button type="button" class="calc-btn" onclick={handleToggleSign}>+/−</button>
				<button type="button" class="calc-btn" onclick={() => inputDigit('0')}>0</button>
				<button type="button" class="calc-btn" onclick={inputDecimal}>.</button>
				<button type="button" class="calc-btn equals" onclick={handleEquals}>=</button>
			</div>
			<div class="calculator-quick-row">
				{#each quickPercents as pct}
					<button
						type="button"
						class="calc-btn quick-percent"
						onclick={() => handleQuickPercent(pct)}
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
		/* Smoked glass styling */
		background: linear-gradient(135deg, rgba(28, 28, 28, 0.94) 0%, rgba(12, 12, 12, 0.92) 100%);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.04);
		border-radius: 12px;
		box-shadow:
			0 25px 50px rgba(0, 0, 0, 0.4),
			0 10px 20px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.03);
		overflow: hidden;
	}

	.panel-head {
		display: flex;
		align-items: center;
		padding: 0.4rem 0.6rem;
		background: rgba(255, 255, 255, 0.03);
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.panel-title {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
	}

	.calculator-shell {
		padding: 0.5rem;
	}

	.calculator {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.calculator-display {
		width: 100%;
		padding: 0.5rem 0.75rem;
		background: rgba(0, 0, 0, 0.4);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-solidcam-gold, #d4af37);
		text-align: right;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.calculator-display:hover {
		background: rgba(0, 0, 0, 0.5);
		border-color: rgba(212, 175, 55, 0.3);
	}

	.calculator-buttons {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.35rem;
	}

	.calc-btn {
		padding: 0.65rem;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		font-family: inherit;
		font-size: 0.9rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.9);
		cursor: pointer;
		transition: all 150ms ease;
	}

	.calc-btn:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	.calc-btn:active {
		transform: scale(0.95);
	}

	.calc-btn.clear {
		background: rgba(200, 16, 46, 0.2);
		border-color: rgba(200, 16, 46, 0.3);
		color: #ff6666;
	}

	.calc-btn.clear:hover {
		background: rgba(200, 16, 46, 0.3);
	}

	.calc-btn.operation {
		background: rgba(212, 175, 55, 0.15);
		border-color: rgba(212, 175, 55, 0.25);
		color: var(--color-solidcam-gold, #d4af37);
	}

	.calc-btn.operation:hover {
		background: rgba(212, 175, 55, 0.25);
	}

	.calc-btn.equals {
		background: var(--color-solidcam-gold, #d4af37);
		border-color: var(--color-solidcam-gold, #d4af37);
		color: #1a1a1a;
		font-weight: 600;
	}

	.calc-btn.equals:hover {
		background: #e5c55a;
		border-color: #e5c55a;
	}

	.calculator-quick-row {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 0.25rem;
		margin-top: 0.25rem;
	}

	.calc-btn.quick-percent {
		padding: 0.35rem;
		font-size: 0.75rem;
		background: rgba(212, 175, 55, 0.1);
		border-color: rgba(212, 175, 55, 0.15);
		color: rgba(212, 175, 55, 0.9);
	}

	.calc-btn.quick-percent:hover {
		background: rgba(212, 175, 55, 0.2);
	}
</style>
