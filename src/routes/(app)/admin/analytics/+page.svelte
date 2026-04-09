<script lang="ts">
	import { formatBalance, timeAgo } from '$lib/utils';

	let { data } = $props();
	let { stats, markets } = $derived(data);
</script>

<svelte:head>
	<title>Analytics — Admin — Forked.gg</title>
</svelte:head>

<div class="space-y-8">
	<div class="flex items-center gap-4">
		<a href="/admin" class="text-text-muted text-xs font-mono hover:text-text-secondary transition-colors">← Users</a>
		<h1 class="font-pixel text-pixel-sm text-forked-green">RAKE ANALYTICS</h1>
	</div>

	<!-- Platform stats -->
	<div class="grid grid-cols-2 md:grid-cols-3 gap-4">
		<div class="card space-y-2 text-center">
			<p class="text-text-muted text-xs font-mono">TOTAL RAKE</p>
			<p class="font-pixel text-pixel-base text-forked-green">{formatBalance(stats.totalRake)}</p>
			<p class="text-text-muted text-xs font-mono">coins collected</p>
		</div>
		<div class="card space-y-2 text-center">
			<p class="text-text-muted text-xs font-mono">TOTAL VOLUME</p>
			<p class="font-pixel text-pixel-base text-text-primary">{formatBalance(stats.totalVolume)}</p>
			<p class="text-text-muted text-xs font-mono">coins wagered</p>
		</div>
		<div class="card space-y-2 text-center">
			<p class="text-text-muted text-xs font-mono">RAKE RATE</p>
			<p class="font-pixel text-pixel-base text-accent-yellow">
				{stats.totalVolume > 0 ? ((stats.totalRake / stats.totalVolume) * 100).toFixed(1) : '0.0'}%
			</p>
			<p class="text-text-muted text-xs font-mono">effective rate</p>
		</div>
		<div class="card space-y-2 text-center">
			<p class="text-text-muted text-xs font-mono">MARKETS</p>
			<p class="font-pixel text-pixel-base text-text-primary">{stats.totalMarkets}</p>
			<p class="text-text-muted text-xs font-mono">total created</p>
		</div>
		<div class="card space-y-2 text-center">
			<p class="text-text-muted text-xs font-mono">OPEN</p>
			<p class="font-pixel text-pixel-base text-accent-yellow">{stats.openMarkets}</p>
			<p class="text-text-muted text-xs font-mono">active now</p>
		</div>
		<div class="card space-y-2 text-center">
			<p class="text-text-muted text-xs font-mono">SETTLED</p>
			<p class="font-pixel text-pixel-base text-accent-green">{stats.settledMarkets}</p>
			<p class="text-text-muted text-xs font-mono">completed</p>
		</div>
	</div>

	<!-- Per-market rake breakdown -->
	<div class="space-y-3">
		<h2 class="font-pixel text-pixel-xs text-text-secondary">RAKE BY MARKET (settled)</h2>

		{#if markets.length === 0}
			<div class="card py-10 text-center">
				<p class="text-text-muted font-mono text-sm">No settled markets yet.</p>
			</div>
		{:else}
			<div class="card p-0 overflow-hidden">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-surface-3 bg-surface-2">
							<th class="text-left px-4 py-3 text-text-muted font-mono text-xs">MARKET</th>
							<th class="text-right px-4 py-3 text-text-muted font-mono text-xs hidden sm:table-cell">CREATOR</th>
							<th class="text-right px-4 py-3 text-text-muted font-mono text-xs">POOL</th>
							<th class="text-right px-4 py-3 text-text-muted font-mono text-xs">RAKE</th>
							<th class="text-right px-4 py-3 text-text-muted font-mono text-xs hidden md:table-cell">RATE</th>
							<th class="text-right px-4 py-3 text-text-muted font-mono text-xs hidden lg:table-cell">SETTLED</th>
						</tr>
					</thead>
					<tbody>
						{#each markets as market (market.id)}
							{@const rate = market.total_pool > 0
								? ((market.rake_amount / market.total_pool) * 100).toFixed(1)
								: '0.0'}
							<tr class="border-b border-surface-2 hover:bg-surface-2 transition-colors">
								<td class="px-4 py-3">
									<a href="/market/{market.id}" class="text-text-primary hover:text-forked-green transition-colors font-sans text-sm line-clamp-1">
										{market.title}
									</a>
								</td>
								<td class="px-4 py-3 text-right font-mono text-xs text-text-muted hidden sm:table-cell">
									@{market.creator?.username ?? '—'}
								</td>
								<td class="px-4 py-3 text-right font-mono text-xs text-text-primary">
									{formatBalance(market.total_pool)}
								</td>
								<td class="px-4 py-3 text-right font-pixel text-pixel-xs text-forked-green">
									{formatBalance(market.rake_amount)}
								</td>
								<td class="px-4 py-3 text-right font-mono text-xs text-text-muted hidden md:table-cell">
									{rate}%
								</td>
								<td class="px-4 py-3 text-right font-mono text-xs text-text-muted hidden lg:table-cell">
									{timeAgo(market.created_at)}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
