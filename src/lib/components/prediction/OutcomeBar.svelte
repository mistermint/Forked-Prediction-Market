<script lang="ts">
	import type { Outcome } from '$lib/types';
	import { formatBalance } from '$lib/utils';

	let {
		outcomes,
		totalPool,
		winningOutcomeId = null,
		selectedOutcomeId = null,
		onSelect = null
	}: {
		outcomes: Outcome[];
		totalPool: number;
		winningOutcomeId?: string | null;
		selectedOutcomeId?: string | null;
		onSelect?: ((id: string) => void) | null;
	} = $props();

	function percent(wagered: number) {
		if (totalPool === 0) return 0;
		return Math.round((wagered / totalPool) * 100);
	}

	function barColor(outcome: Outcome) {
		if (winningOutcomeId) {
			return outcome.id === winningOutcomeId ? 'bg-accent-green' : 'bg-surface-4';
		}
		if (selectedOutcomeId === outcome.id) return 'bg-forked-green';
		return 'bg-surface-4';
	}
</script>

<div class="space-y-2">
	{#each outcomes as outcome (outcome.id)}
		{@const pct = percent(outcome.total_wagered)}
		{@const isWinner = winningOutcomeId === outcome.id}
		{@const isSelected = selectedOutcomeId === outcome.id}

		<button
			onclick={() => onSelect?.(outcome.id)}
			disabled={!onSelect}
			class="w-full text-left group focus:outline-none"
		>
			<div
				class="relative rounded-retro border overflow-hidden transition-all
					{onSelect ? 'cursor-pointer hover:border-forked-green/60' : 'cursor-default'}
					{isSelected ? 'border-forked-green shadow-retro-green' : 'border-surface-3'}
					{isWinner ? 'border-accent-green/60' : ''}
					{winningOutcomeId && !isWinner ? 'opacity-50' : ''}"
			>
				<!-- Progress fill -->
				<div
					class="absolute inset-y-0 left-0 transition-all duration-500 {barColor(outcome)}"
					style="width: {pct}%; opacity: 0.2"
				></div>

				<!-- Content -->
				<div class="relative flex items-center justify-between px-3 py-2.5">
					<div class="flex items-center gap-2 min-w-0">
						{#if isWinner}
							<span class="text-accent-green text-xs">✓</span>
						{:else if isSelected}
							<span class="w-2 h-2 rounded-full bg-forked-green shrink-0 inline-block"></span>
						{/if}
						<span
							class="font-sans text-sm truncate
								{isWinner ? 'text-accent-green font-semibold' : isSelected ? 'text-text-primary' : 'text-text-secondary'}"
						>
							{outcome.label}
						</span>
					</div>

					<div class="text-right shrink-0 ml-3 space-x-2">
						<span class="font-mono text-xs text-text-muted">{formatBalance(outcome.total_wagered)}</span>
						<span
							class="font-pixel text-pixel-xs
								{isWinner ? 'text-accent-green' : isSelected ? 'text-forked-green' : 'text-text-muted'}"
						>
							{pct}%
						</span>
					</div>
				</div>
			</div>
		</button>
	{/each}
</div>
