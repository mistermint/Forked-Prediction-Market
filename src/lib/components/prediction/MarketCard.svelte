<script lang="ts">
	import type { Market } from '$lib/types';
	import { formatBalance, timeAgo } from '$lib/utils';

	let { market }: { market: Market & { creator?: { username: string } } } = $props();

	let timeLeft = $state('');

	$effect(() => {
		if (!market.lock_at || market.status !== 'open') return;

		function tick() {
			const diff = new Date(market.lock_at!).getTime() - Date.now();
			if (diff <= 0) {
				timeLeft = 'LOCKED';
				return;
			}
			const m = Math.floor(diff / 60000);
			const s = Math.floor((diff % 60000) / 1000);
			timeLeft = `${m}:${s.toString().padStart(2, '0')}`;
		}

		tick();
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
	});

	function statusBadge(status: string) {
		return {
			open: 'badge-pending',
			locked: 'badge-info',
			settled: 'badge-win',
			cancelled: 'badge-loss',
			draft: 'badge-info'
		}[status] ?? 'badge-info';
	}

	const totalPool = $derived(market.total_pool);
	const outcomes = $derived(market.outcomes ?? []);
	const topOutcome = $derived(
		[...outcomes].sort((a, b) => b.total_wagered - a.total_wagered)[0]
	);
</script>

<a
	href="/market/{market.id}"
	class="card block hover:border-forked-green/40 hover:shadow-retro-green transition-all space-y-4 group"
>
	<!-- Header -->
	<div class="flex items-start justify-between gap-2">
		<h3
			class="font-sans font-semibold text-sm text-text-primary group-hover:text-forked-green transition-colors leading-snug"
		>
			{market.title}
		</h3>
		<span class="{statusBadge(market.status)} shrink-0 capitalize">{market.status}</span>
	</div>

	<!-- Outcome preview -->
	{#if outcomes.length > 0}
		<div class="space-y-1">
			{#each outcomes.slice(0, 3) as outcome (outcome.id)}
				{@const pct = totalPool > 0 ? Math.round((outcome.total_wagered / totalPool) * 100) : 0}
				<div class="flex items-center gap-2 text-xs">
					<div class="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
						<div
							class="h-full rounded-full transition-all duration-500
								{market.winning_outcome_id === outcome.id ? 'bg-accent-green' : 'bg-forked-green/60'}"
							style="width: {pct}%"
						></div>
					</div>
					<span class="text-text-muted font-mono w-12 text-right">{outcome.label.slice(0, 8)}</span>
					<span class="font-pixel text-pixel-xs text-text-muted w-8 text-right">{pct}%</span>
				</div>
			{/each}
			{#if outcomes.length > 3}
				<p class="text-text-muted text-xs font-mono">+{outcomes.length - 3} more outcomes</p>
			{/if}
		</div>
	{/if}

	<!-- Footer -->
	<div class="flex items-center justify-between text-xs font-mono">
		<div class="space-x-3">
			<span class="text-forked-green">{formatBalance(totalPool)} pool</span>
			{#if market.creator}
				<span class="text-text-muted">@{market.creator.username}</span>
			{/if}
		</div>

		<div class="text-right">
			{#if market.status === 'open' && timeLeft}
				<span class="text-accent-yellow font-pixel text-pixel-xs animate-pulse-slow"
					>{timeLeft}</span
				>
			{:else if market.status === 'settled'}
				<span class="text-text-muted">{timeAgo(market.updated_at)}</span>
			{/if}
		</div>
	</div>
</a>
