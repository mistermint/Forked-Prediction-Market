<script lang="ts">
	import { formatBalance, timeAgo } from '$lib/utils';
	import MarketCard from '$components/prediction/MarketCard.svelte';

	let { data } = $props();
	let { profile, activeMarkets, recentActivity } = $derived(data);

	function activityLabel(type: string, metadata: Record<string, unknown>) {
		switch (type) {
			case 'bet_placed':
				return `You bet ${formatBalance(metadata.amount as number)} coins on "${metadata.market_title}"`;
			case 'payout':
				return `You won ${formatBalance(metadata.payout as number)} coins from "${metadata.market_title}"`;
			case 'market_created':
				return `You created "${metadata.market_title}"`;
			case 'market_settled':
				return `"${metadata.market_title}" was settled`;
			default:
				return type.replace(/_/g, ' ');
		}
	}

	function activityColor(type: string) {
		return (
			{
				bet_placed: 'text-text-secondary',
				payout: 'text-accent-green',
				market_settled: 'text-forked-green',
				market_created: 'text-accent-blue'
			}[type] ?? 'text-text-muted'
		);
	}
</script>

<svelte:head>
	<title>Dashboard — Forked.gg</title>
</svelte:head>

<div class="space-y-8">
	<!-- Greeting -->
	<div>
		<p class="text-text-muted font-mono text-xs mb-1">WELCOME BACK</p>
		<h1 class="font-pixel text-pixel-sm text-forked-green">
			{profile?.display_name?.toUpperCase() ?? 'PLAYER'}
		</h1>
	</div>

	<!-- Balance cards -->
	<div class="grid grid-cols-2 gap-4">
		<div class="card space-y-2">
			<p class="text-text-muted text-xs font-mono uppercase tracking-widest">Play Balance</p>
			<p class="font-pixel text-pixel-lg text-forked-green">
				{formatBalance(profile?.play_balance ?? 0)}
			</p>
			<p class="text-text-muted text-xs font-mono">coins</p>
		</div>
		<div class="card space-y-2">
			<p class="text-text-muted text-xs font-mono uppercase tracking-widest">BET Balance</p>
			<p class="font-pixel text-pixel-lg text-accent-yellow">
				{formatBalance(profile?.bet_balance ?? 0)}
			</p>
			<p class="text-text-muted text-xs font-mono">BET</p>
		</div>
	</div>

	<!-- Active markets -->
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<h2 class="font-pixel text-pixel-xs text-text-secondary">ACTIVE MARKETS</h2>
			<a href="/market" class="text-forked-green text-xs font-mono hover:text-forked-green-light transition-colors">
				View all →
			</a>
		</div>

		{#if activeMarkets.length === 0}
			<div class="card py-10 text-center space-y-2">
				<p class="font-pixel text-pixel-xs text-text-muted">NO ACTIVE MARKETS</p>
				<p class="text-text-muted font-sans text-sm">
					Check back when a streamer opens a prediction pool.
				</p>
				<a href="/market" class="btn-secondary inline-block text-xs mt-2">Browse Markets</a>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				{#each activeMarkets as market (market.id)}
					<MarketCard {market} />
				{/each}
			</div>
		{/if}
	</div>

	<!-- Recent activity -->
	<div class="space-y-4">
		<h2 class="font-pixel text-pixel-xs text-text-secondary">RECENT ACTIVITY</h2>

		{#if recentActivity.length === 0}
			<div class="card py-10 text-center space-y-2">
				<p class="font-pixel text-pixel-xs text-text-muted">NO ACTIVITY YET</p>
				<p class="text-text-muted font-sans text-sm">
					Place a bet to get started.
				</p>
			</div>
		{:else}
			<div class="card divide-y divide-surface-2 p-0 overflow-hidden">
				{#each recentActivity as item (item.id)}
					<div class="flex items-center justify-between px-4 py-3">
						<span class="text-xs font-sans {activityColor(item.type)} truncate">
							{activityLabel(item.type, item.metadata as Record<string, unknown>)}
						</span>
						<span class="text-text-muted text-xs font-mono shrink-0 ml-4">
							{timeAgo(item.created_at)}
						</span>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
