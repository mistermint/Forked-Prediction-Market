<script lang="ts">
	import type { Outcome } from '$lib/types';
	import { formatBalance } from '$lib/utils';

	let {
		marketId,
		outcomes,
		totalPool,
		userBalance,
		onBetPlaced
	}: {
		marketId: string;
		outcomes: Outcome[];
		totalPool: number;
		userBalance: number;
		onBetPlaced: () => void;
	} = $props();

	let selectedOutcomeId = $state<string | null>(null);
	let amount = $state('');
	let status = $state<'idle' | 'loading' | 'success'>('idle');
	let error = $state('');

	const selectedOutcome = $derived(outcomes.find((o) => o.id === selectedOutcomeId));
	const numericAmount = $derived(parseInt(amount, 10));
	const isValid = $derived(
		!!selectedOutcomeId && !isNaN(numericAmount) && numericAmount >= 10 && numericAmount <= userBalance
	);

	// Estimated payout (rough — actual is determined at settlement)
	const estimatedPayout = $derived(() => {
		if (!selectedOutcome || isNaN(numericAmount) || numericAmount <= 0) return 0;
		const newTotal = totalPool + numericAmount;
		const newWinningSide = selectedOutcome.total_wagered + numericAmount;
		const share = (newWinningSide / newTotal) * 100;
		const rakePercent = share <= 50 ? 10 : share <= 75 ? 7 : share <= 89 ? 4 : 1;
		const netPool = newTotal * (1 - rakePercent / 100);
		return Math.floor((numericAmount / newWinningSide) * netPool);
	});

	function setPercent(pct: number) {
		amount = String(Math.floor((userBalance * pct) / 100));
	}

	async function placeBet(e: SubmitEvent) {
		e.preventDefault();
		if (!isValid || status === 'loading') return;

		status = 'loading';
		error = '';

		const res = await fetch('/api/bets', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ marketId, outcomeId: selectedOutcomeId, amount: numericAmount })
		});

		const data = await res.json();

		if (!res.ok || data.error) {
			error = data.error ?? 'Bet failed. Please try again.';
			status = 'idle';
			return;
		}

		status = 'success';
		onBetPlaced();
	}
</script>

<div class="card space-y-4">
	<p class="font-pixel text-pixel-xs text-forked-green">PLACE BET</p>

	<!-- Outcome selection -->
	<div class="space-y-1.5">
		<p class="text-text-muted text-xs font-mono">Choose your outcome</p>
		{#each outcomes as outcome (outcome.id)}
			<button
				onclick={() => (selectedOutcomeId = outcome.id)}
				class="w-full text-left px-3 py-2 rounded-retro border text-sm font-sans transition-all
					{selectedOutcomeId === outcome.id
						? 'border-forked-green bg-forked-green/10 text-text-primary shadow-retro-green'
						: 'border-surface-3 text-text-secondary hover:border-surface-4 hover:bg-surface-2'}"
			>
				{outcome.label}
			</button>
		{/each}
	</div>

	<!-- Amount -->
	<div class="space-y-2">
		<div class="flex items-center justify-between">
			<p class="text-text-muted text-xs font-mono">Amount</p>
			<p class="text-text-muted text-xs font-mono">
				Balance: <span class="text-forked-green">{formatBalance(userBalance)}</span>
			</p>
		</div>

		<input
			type="number"
			bind:value={amount}
			placeholder="Min. 10 coins"
			min="10"
			max={userBalance}
			class="input"
		/>

		<!-- Quick picks -->
		<div class="flex gap-2">
			{#each [25, 50, 100] as pct}
				<button onclick={() => setPercent(pct)} class="btn-secondary text-xs flex-1 py-1">
					{pct}%
				</button>
			{/each}
			<button onclick={() => setPercent(100)} class="btn-secondary text-xs flex-1 py-1">
				MAX
			</button>
		</div>
	</div>

	<!-- Estimated payout -->
	{#if selectedOutcomeId && !isNaN(numericAmount) && numericAmount >= 10}
		<div class="bg-surface-2 rounded-retro px-3 py-2 space-y-1">
			<div class="flex justify-between text-xs font-mono">
				<span class="text-text-muted">Estimated payout</span>
				<span class="text-forked-green">{formatBalance(estimatedPayout())} coins</span>
			</div>
			<p class="text-text-muted text-xs font-sans">
				Actual payout depends on final pool distribution at settlement.
			</p>
		</div>
	{/if}

	{#if error}
		<p class="text-accent-red text-xs font-mono">{error}</p>
	{/if}

	<form onsubmit={placeBet}>
		<button
			type="submit"
			class="btn-primary w-full text-center"
			disabled={!isValid || status === 'loading'}
		>
			{status === 'loading' ? 'PLACING BET...' : selectedOutcome ? `BET ON "${selectedOutcome.label.toUpperCase()}"` : 'SELECT AN OUTCOME'}
		</button>
	</form>
</div>
