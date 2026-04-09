<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { formatBalance, timeAgo } from '$lib/utils';
	import OutcomeBar from '$components/prediction/OutcomeBar.svelte';
	import BetSlip from '$components/prediction/BetSlip.svelte';
	import ActivityFeed from '$components/prediction/ActivityFeed.svelte';
	import { invalidateAll } from '$app/navigation';
	import { onDestroy } from 'svelte';

	let { data } = $props();

	let market = $state(data.market);
	let userBet = $state(data.userBet);
	let profile = $derived(data.profile);

	const isCreator = $derived(market.creator?.id === profile?.id || profile?.role === 'admin');
	const canBet = $derived(market.status === 'open' && !userBet);
	const canSettle = $derived(isCreator && ['open', 'locked'].includes(market.status));

	let settlingOutcomeId = $state<string | null>(null);
	let settling = $state(false);
	let settleError = $state('');
	let settleResult = $state<{ rake: number; netPool: number } | null>(null);

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

	// Subscribe to live market + outcome updates
	const channel = supabase
		.channel(`market-${market.id}`)
		.on(
			'postgres_changes',
			{ event: 'UPDATE', schema: 'public', table: 'markets', filter: `id=eq.${market.id}` },
			(payload) => {
				market = { ...market, ...(payload.new as typeof market) };
			}
		)
		.on(
			'postgres_changes',
			{ event: 'UPDATE', schema: 'public', table: 'outcomes', filter: `market_id=eq.${market.id}` },
			(payload) => {
				market = {
					...market,
					outcomes: market.outcomes.map((o: { id: string }) =>
						o.id === (payload.new as { id: string }).id ? { ...o, ...payload.new } : o
					)
				};
			}
		)
		.subscribe();

	onDestroy(() => supabase.removeChannel(channel));

	async function handleSettle(e: SubmitEvent) {
		e.preventDefault();
		if (!settlingOutcomeId || settling) return;

		settling = true;
		settleError = '';

		const res = await fetch(`/api/markets/${market.id}/settle`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ winningOutcomeId: settlingOutcomeId })
		});

		const json = await res.json();

		if (!res.ok || json.error) {
			settleError = json.error ?? 'Settlement failed.';
			settling = false;
			return;
		}

		settleResult = { rake: json.rake, netPool: json.netPool };
		settling = false;
		await invalidateAll();
	}

	function statusBadge(status: string) {
		return (
			{
				open: 'badge-pending',
				locked: 'badge-info',
				settled: 'badge-win',
				cancelled: 'badge-loss'
			}[status] ?? 'badge-info'
		);
	}
</script>

<svelte:head>
	<title>{market.title} — Forked.gg</title>
</svelte:head>

<div class="space-y-6 max-w-2xl">
	<!-- Back -->
	<a href="/market" class="text-text-muted text-xs font-mono hover:text-text-secondary transition-colors">
		← Markets
	</a>

	<!-- Header -->
	<div class="space-y-3">
		<div class="flex items-start gap-3 justify-between">
			<h1 class="font-sans font-bold text-lg text-text-primary leading-snug">{market.title}</h1>
			<span class="{statusBadge(market.status)} shrink-0 capitalize">{market.status}</span>
		</div>

		{#if market.description}
			<p class="text-text-secondary font-sans text-sm leading-relaxed">{market.description}</p>
		{/if}

		<div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-text-muted">
			{#if market.creator}
				<span>by @{market.creator.username}</span>
			{/if}
			<span>{timeAgo(market.created_at)}</span>
			{#if market.status === 'open' && timeLeft}
				<span class="text-accent-yellow font-pixel text-pixel-xs animate-pulse-slow">
					{timeLeft === 'LOCKED' ? 'LOCKED' : `closes in ${timeLeft}`}
				</span>
			{/if}
		</div>
	</div>

	<!-- Pool stats -->
	<div class="grid grid-cols-2 gap-3">
		<div class="card space-y-1 text-center">
			<p class="text-text-muted text-xs font-mono">TOTAL POOL</p>
			<p class="font-pixel text-pixel-base text-forked-green">{formatBalance(market.total_pool)}</p>
		</div>
		<div class="card space-y-1 text-center">
			<p class="text-text-muted text-xs font-mono">OUTCOMES</p>
			<p class="font-pixel text-pixel-base text-text-primary">{market.outcomes?.length ?? 0}</p>
		</div>
	</div>

	<!-- Outcomes distribution -->
	<div class="card space-y-3">
		<p class="font-pixel text-pixel-xs text-text-secondary">OUTCOME DISTRIBUTION</p>
		<OutcomeBar
			outcomes={market.outcomes ?? []}
			totalPool={market.total_pool}
			winningOutcomeId={market.winning_outcome_id}
		/>
	</div>

	<!-- Overlay URL (creator/admin only, market not settled) -->
	{#if isCreator && market.status !== 'settled' && market.status !== 'cancelled'}
		<div class="card border-accent-blue/20 space-y-2">
			<p class="font-pixel text-pixel-xs text-accent-blue">OBS OVERLAY</p>
			<p class="text-text-muted text-xs font-sans">
				Add this as a Browser Source in OBS. Recommended size: 400×220px (standard) or 280×180px
				with <code class="font-mono">?compact=1</code>.
			</p>
			<div class="flex items-center gap-2">
				<code class="input flex-1 text-xs text-text-muted select-all cursor-text">
					{typeof window !== 'undefined' ? window.location.origin : ''}/overlay?market={market.id}
				</code>
				<button
					onclick={async () => {
						await navigator.clipboard.writeText(
							`${window.location.origin}/overlay?market=${market.id}`
						);
					}}
					class="btn-secondary text-xs whitespace-nowrap">COPY</button
				>
			</div>
		</div>
	{/if}

	<!-- User's bet -->
	{#if userBet}
		{@const betOutcome = market.outcomes?.find((o: { id: string }) => o.id === userBet!.outcome_id)}
		<div class="card border-forked-green/30 space-y-2">
			<p class="font-pixel text-pixel-xs text-forked-green">YOUR BET</p>
			<div class="flex items-center justify-between">
				<span class="text-text-primary font-sans text-sm">{betOutcome?.label ?? 'Unknown outcome'}</span>
				<span class="font-pixel text-pixel-xs text-forked-green">{formatBalance(userBet.amount)} coins</span>
			</div>
			{#if userBet.payout !== null && userBet.payout !== undefined}
				<div class="flex items-center justify-between border-t border-surface-3 pt-2">
					<span class="text-text-muted text-xs font-mono">Payout</span>
					<span class="font-pixel text-pixel-xs {userBet.payout > 0 ? 'text-accent-green' : 'text-accent-red'}">
						{userBet.payout > 0 ? `+${formatBalance(userBet.payout)}` : 'LOST'}
					</span>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Bet slip -->
	{#if canBet && profile}
		<BetSlip
			marketId={market.id}
			outcomes={market.outcomes ?? []}
			totalPool={market.total_pool}
			userBalance={profile.play_balance}
			onBetPlaced={async () => {
				await invalidateAll();
			}}
		/>
	{/if}

	<!-- Settlement panel (creator/admin only) -->
	{#if canSettle}
		<div class="card border-accent-yellow/20 space-y-4">
			<p class="font-pixel text-pixel-xs text-accent-yellow">SETTLE MARKET</p>
			<p class="text-text-muted text-xs font-sans">
				Select the winning outcome. This cannot be undone.
			</p>

			<form onsubmit={handleSettle} class="space-y-3">
				<div class="space-y-1.5">
					{#each market.outcomes ?? [] as outcome (outcome.id)}
						<label class="flex items-center gap-2 cursor-pointer group">
							<input
								type="radio"
								bind:group={settlingOutcomeId}
								value={outcome.id}
								class="accent-forked-green"
							/>
							<span class="text-text-secondary text-sm font-sans group-hover:text-text-primary transition-colors">
								{outcome.label}
							</span>
							<span class="text-text-muted text-xs font-mono ml-auto">
								{formatBalance(outcome.total_wagered)} coins
							</span>
						</label>
					{/each}
				</div>

				{#if settleError}
					<p class="text-accent-red text-xs font-mono">{settleError}</p>
				{/if}

				{#if settleResult}
					<div class="bg-surface-2 rounded-retro px-3 py-2 space-y-1 text-xs font-mono">
						<p class="text-accent-green">✓ Market settled</p>
						<p class="text-text-muted">Net pool: {formatBalance(settleResult.netPool)} · Rake: {formatBalance(settleResult.rake)}</p>
					</div>
				{/if}

				<button
					type="submit"
					class="btn-primary w-full text-center"
					disabled={!settlingOutcomeId || settling}
				>
					{settling ? 'SETTLING...' : 'CONFIRM SETTLEMENT'}
				</button>
			</form>
		</div>
	{/if}

	<!-- Activity feed -->
	<div class="card space-y-3">
		<p class="font-pixel text-pixel-xs text-text-secondary">LIVE ACTIVITY</p>
		<ActivityFeed marketId={market.id} initialActivity={data.recentActivity} />
	</div>
</div>
