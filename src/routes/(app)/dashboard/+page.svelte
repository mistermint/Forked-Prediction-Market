<script lang="ts">
	import { formatBalance } from '$lib/utils';

	let { data } = $props();
	let { profile } = $derived(data);
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
	<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
		<div class="card space-y-3">
			<p class="text-text-muted text-xs font-mono uppercase tracking-widest">Play Balance</p>
			<p class="font-pixel text-pixel-lg text-forked-green">
				{formatBalance(profile?.play_balance ?? 0)}
			</p>
			<p class="text-text-muted text-xs font-mono">coins · play money only</p>
		</div>

		<div class="card space-y-3">
			<p class="text-text-muted text-xs font-mono uppercase tracking-widest">BET Balance</p>
			<p class="font-pixel text-pixel-lg text-accent-yellow">
				{formatBalance(profile?.bet_balance ?? 0)}
			</p>
			<p class="text-text-muted text-xs font-mono">BET · coming soon</p>
		</div>
	</div>

	<!-- Quick links -->
	<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
		<a href="/profile" class="card hover:border-forked-green/40 transition-colors group text-center py-5 space-y-2">
			<p class="font-pixel text-pixel-xs text-text-secondary group-hover:text-forked-green transition-colors">PROFILE</p>
			<p class="text-text-muted text-xs font-mono">Edit your info</p>
		</a>
		<div class="card opacity-40 text-center py-5 space-y-2">
			<p class="font-pixel text-pixel-xs text-text-muted">MARKETS</p>
			<p class="text-text-muted text-xs font-mono">Coming soon</p>
		</div>
		<div class="card opacity-40 text-center py-5 space-y-2">
			<p class="font-pixel text-pixel-xs text-text-muted">LEADERBOARD</p>
			<p class="text-text-muted text-xs font-mono">Coming soon</p>
		</div>
	</div>

	<!-- Active markets -->
	<div class="space-y-3">
		<div class="flex items-center justify-between">
			<h2 class="font-pixel text-pixel-xs text-text-secondary">ACTIVE MARKETS</h2>
		</div>
		<div class="card py-10 text-center space-y-2">
			<p class="font-pixel text-pixel-xs text-text-muted">NO ACTIVE MARKETS</p>
			<p class="text-text-muted font-sans text-sm">
				Prediction pools will appear here when streamers go live.
			</p>
		</div>
	</div>

	<!-- Recent activity -->
	<div class="space-y-3">
		<h2 class="font-pixel text-pixel-xs text-text-secondary">RECENT ACTIVITY</h2>
		<div class="card py-10 text-center space-y-2">
			<p class="font-pixel text-pixel-xs text-text-muted">NO ACTIVITY YET</p>
			<p class="text-text-muted font-sans text-sm">
				Your bets and payouts will appear here once markets go live.
			</p>
		</div>
	</div>
</div>
