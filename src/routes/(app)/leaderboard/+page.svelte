<script lang="ts">
	import LeaderboardTable from '$components/leaderboard/LeaderboardTable.svelte';

	let { data } = $props();

	const periods = [
		{ id: 'all', label: 'ALL TIME' },
		{ id: 'monthly', label: 'THIS MONTH' },
		{ id: 'weekly', label: 'THIS WEEK' }
	];
</script>

<svelte:head>
	<title>Leaderboard — Forked.gg</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="font-pixel text-pixel-sm text-forked-green">LEADERBOARD</h1>
		<p class="text-text-muted font-mono text-xs mt-1">Ranked by net profit from settled markets</p>
	</div>

	<!-- Period tabs -->
	<div class="flex gap-1 border-b border-surface-3">
		{#each periods as p}
			<a
				href="/leaderboard?period={p.id}"
				class="px-4 py-2 font-pixel text-pixel-xs transition-colors border-b-2 -mb-px
					{data.period === p.id
						? 'text-forked-green border-forked-green'
						: 'text-text-muted border-transparent hover:text-text-secondary'}"
			>
				{p.label}
			</a>
		{/each}
	</div>

	<!-- Your rank callout -->
	{#if data.entries.length > 0}
		{@const myEntry = [...data.entries]
			.sort((a, b) => b.net_profit - a.net_profit)
			.findIndex((e) => e.user_id === data.currentUserId)}
		{#if myEntry >= 0}
			<div class="card border-forked-green/30 flex items-center justify-between">
				<span class="text-text-muted text-xs font-mono">Your rank</span>
				<span class="font-pixel text-pixel-base text-forked-green">#{myEntry + 1}</span>
			</div>
		{/if}
	{/if}

	<LeaderboardTable entries={data.entries} highlightUserId={data.currentUserId} />
</div>
