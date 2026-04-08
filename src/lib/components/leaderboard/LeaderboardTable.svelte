<script lang="ts">
	import { formatBalance } from '$lib/utils';

	let {
		entries,
		highlightUserId = null
	}: {
		entries: {
			user_id: string;
			username: string;
			display_name: string;
			avatar_url: string | null;
			total_bets: number;
			total_wins: number;
			net_profit: number;
			accuracy: number;
			volume: number;
		}[];
		highlightUserId?: string | null;
	} = $props();

	// Sort by net_profit and assign ranks
	const ranked = $derived(
		[...entries]
			.sort((a, b) => b.net_profit - a.net_profit)
			.map((e, i) => ({ ...e, rank: i + 1 }))
	);

	function rankBadge(rank: number) {
		if (rank === 1) return 'text-accent-yellow font-pixel text-pixel-sm';
		if (rank === 2) return 'text-text-secondary font-pixel text-pixel-xs';
		if (rank === 3) return 'text-amber-600 font-pixel text-pixel-xs';
		return 'text-text-muted font-mono text-xs';
	}

	function rankLabel(rank: number) {
		if (rank === 1) return '🥇';
		if (rank === 2) return '🥈';
		if (rank === 3) return '🥉';
		return `#${rank}`;
	}
</script>

{#if entries.length === 0}
	<div class="card py-12 text-center space-y-2">
		<p class="font-pixel text-pixel-xs text-text-muted">NO ENTRIES YET</p>
		<p class="text-text-muted font-sans text-sm">Place bets to appear on the leaderboard.</p>
	</div>
{:else}
	<div class="card p-0 overflow-hidden">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-surface-3 bg-surface-2">
					<th class="text-left px-4 py-3 text-text-muted font-mono text-xs w-10">#</th>
					<th class="text-left px-4 py-3 text-text-muted font-mono text-xs">PLAYER</th>
					<th class="text-right px-4 py-3 text-text-muted font-mono text-xs">NET</th>
					<th class="text-right px-4 py-3 text-text-muted font-mono text-xs hidden sm:table-cell">WIN %</th>
					<th class="text-right px-4 py-3 text-text-muted font-mono text-xs hidden md:table-cell">BETS</th>
					<th class="text-right px-4 py-3 text-text-muted font-mono text-xs hidden lg:table-cell">VOLUME</th>
				</tr>
			</thead>
			<tbody>
				{#each ranked as entry (entry.user_id)}
					<tr
						class="border-b border-surface-2 transition-colors
							{entry.user_id === highlightUserId ? 'bg-forked-green/5 border-forked-green/20' : 'hover:bg-surface-2'}"
					>
						<td class="px-4 py-3">
							<span class={rankBadge(entry.rank)}>{rankLabel(entry.rank)}</span>
						</td>
						<td class="px-4 py-3">
							<div class="flex items-center gap-2">
								{#if entry.avatar_url}
									<img
										src={entry.avatar_url}
										alt={entry.display_name}
										class="w-6 h-6 rounded-retro border border-surface-4 object-cover shrink-0"
									/>
								{:else}
									<div
										class="w-6 h-6 rounded-retro border border-surface-4 bg-surface-3
											flex items-center justify-center shrink-0"
									>
										<span class="font-pixel text-pixel-xs text-text-muted">
											{entry.display_name.charAt(0).toUpperCase()}
										</span>
									</div>
								{/if}
								<div class="min-w-0">
									<p class="text-text-primary font-sans text-sm truncate">{entry.display_name}</p>
									<p class="text-text-muted font-mono text-xs truncate">@{entry.username}</p>
								</div>
								{#if entry.user_id === highlightUserId}
									<span class="badge-pending text-pixel-xs font-pixel px-1 ml-1">YOU</span>
								{/if}
							</div>
						</td>
						<td class="px-4 py-3 text-right">
							<span
								class="font-pixel text-pixel-xs
									{entry.net_profit > 0 ? 'text-accent-green' : entry.net_profit < 0 ? 'text-accent-red' : 'text-text-muted'}"
							>
								{entry.net_profit > 0 ? '+' : ''}{formatBalance(entry.net_profit)}
							</span>
						</td>
						<td class="px-4 py-3 text-right font-mono text-xs text-text-secondary hidden sm:table-cell">
							{entry.accuracy}%
						</td>
						<td class="px-4 py-3 text-right font-mono text-xs text-text-muted hidden md:table-cell">
							{entry.total_wins}/{entry.total_bets}
						</td>
						<td class="px-4 py-3 text-right font-mono text-xs text-text-muted hidden lg:table-cell">
							{formatBalance(entry.volume)}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
