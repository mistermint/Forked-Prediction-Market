<script lang="ts">
	import { formatBalance } from '$lib/utils';

	let { data } = $props();

	function pct(wagered: number, total: number) {
		if (total === 0) return 0;
		return Math.round((wagered / total) * 100);
	}
</script>

<svelte:head>
	<title>Discover Markets — Forked.gg</title>
	<meta name="description" content="Browse live streamer prediction markets on Forked.gg" />
</svelte:head>

<div class="max-w-5xl mx-auto px-6 py-12 space-y-10">
	<!-- Header -->
	<div class="text-center space-y-3">
		<h1 class="font-pixel text-pixel-lg text-forked-green">LIVE MARKETS</h1>
		<p class="text-text-secondary font-sans text-base">
			Browse open prediction pools from streamers right now.
		</p>
		<a href="/signup" class="btn-primary inline-block">Sign Up to Bet</a>
	</div>

	<!-- Market grid -->
	{#if data.markets.length === 0}
		<div class="card py-16 text-center space-y-3">
			<p class="font-pixel text-pixel-xs text-text-muted">NO LIVE MARKETS RIGHT NOW</p>
			<p class="text-text-muted font-sans text-sm">Check back when streamers go live.</p>
			<a href="/signup" class="btn-secondary inline-block mt-2">Join the Waitlist</a>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
			{#each data.markets as market (market.id)}
				<div class="card space-y-4">
					<!-- Header -->
					<div class="flex items-start justify-between gap-2">
						<h3 class="font-sans font-semibold text-sm text-text-primary leading-snug">
							{market.title}
						</h3>
						<span class="badge-pending shrink-0 capitalize">{market.status}</span>
					</div>

					<!-- Creator -->
					{#if market.creator}
						<p class="text-text-muted text-xs font-mono">@{market.creator.username}</p>
					{/if}

					<!-- Outcome bars (simplified, no interaction) -->
					<div class="space-y-1.5">
						{#each (market.outcomes ?? []).slice(0, 3) as outcome (outcome.id)}
							{@const p = pct(outcome.total_wagered, market.total_pool)}
							<div class="flex items-center gap-2 text-xs">
								<div class="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
									<div class="h-full rounded-full bg-forked-green/60" style="width: {p}%"></div>
								</div>
								<span class="text-text-muted font-mono w-20 truncate text-right">{outcome.label}</span>
								<span class="font-pixel text-pixel-xs text-text-muted w-8 text-right">{p}%</span>
							</div>
						{/each}
					</div>

					<!-- Footer -->
					<div class="flex items-center justify-between">
						<span class="font-mono text-xs text-forked-green">{formatBalance(market.total_pool)} pool</span>
						<a href="/signup" class="btn-secondary text-xs py-1 px-3">Bet Now</a>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- CTA -->
	<div class="card text-center space-y-4 py-10">
		<h2 class="font-pixel text-pixel-base text-forked-green">ARE YOU A STREAMER?</h2>
		<p class="text-text-secondary font-sans text-sm max-w-md mx-auto">
			Create prediction pools for your stream in seconds. Keep your viewers locked in and earn from
			every pool you run.
		</p>
		<a href="/signup" class="btn-primary inline-block">Get Started Free</a>
	</div>
</div>
