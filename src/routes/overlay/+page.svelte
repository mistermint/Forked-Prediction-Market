<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { formatBalance } from '$lib/utils';
	import { onDestroy } from 'svelte';
	import { page } from '$app/stores';

	let { data } = $props();
	let market = $state(data.market);

	const compact = $derived($page.url.searchParams.get('compact') === '1');

	let timeLeft = $state('');

	$effect(() => {
		if (!market?.lock_at || market.status !== 'open') return;

		function tick() {
			const diff = new Date(market!.lock_at!).getTime() - Date.now();
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

	// Live updates — works with anon key after migration 005
	$effect(() => {
		if (!market) return;

		const channel = supabase
			.channel(`overlay-${market.id}`)
			.on(
				'postgres_changes',
				{ event: 'UPDATE', schema: 'public', table: 'markets', filter: `id=eq.${market.id}` },
				(payload) => {
					market = { ...market!, ...(payload.new as typeof market) };
				}
			)
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'outcomes',
					filter: `market_id=eq.${market!.id}`
				},
				(payload) => {
					market = {
						...market!,
						outcomes: market!.outcomes.map((o: { id: string }) =>
							o.id === (payload.new as { id: string }).id ? { ...o, ...payload.new } : o
						)
					};
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	});

	function pct(wagered: number) {
		if (!market || market.total_pool === 0) return 0;
		return Math.round((wagered / market.total_pool) * 100);
	}
</script>

<svelte:head>
	<title>Forked.gg Overlay</title>
</svelte:head>

<!-- Transparent background for OBS browser source -->
<style>
	:global(html, body) {
		background: transparent !important;
		margin: 0;
		padding: 0;
		overflow: hidden;
	}
</style>

{#if !market}
	<div class="p-4">
		<p class="font-pixel text-pixel-xs text-forked-green opacity-60">
			No market selected. Add ?market=ID to the URL.
		</p>
	</div>
{:else}
	<div
		class="p-3 rounded-retro shadow-retro"
		style="background: rgba(26,26,26,0.88); border: 1px solid rgba(139,164,70,0.3);"
		class:max-w-xs={compact}
		class:max-w-sm={!compact}
	>
		<!-- Header row -->
		<div class="flex items-start justify-between gap-2 mb-2">
			<div class="flex-1 min-w-0">
				<p class="font-pixel text-pixel-xs text-forked-green leading-tight truncate">
					FORKED.GG
				</p>
				{#if !compact}
					<p class="font-sans text-sm font-semibold text-text-primary leading-snug mt-0.5 line-clamp-2">
						{market.title}
					</p>
				{:else}
					<p class="font-sans text-xs font-semibold text-text-primary leading-snug mt-0.5 line-clamp-1">
						{market.title}
					</p>
				{/if}
			</div>

			<!-- Status / timer -->
			<div class="shrink-0 text-right">
				{#if market.status === 'open' && timeLeft && timeLeft !== 'LOCKED'}
					<p class="font-pixel text-pixel-xs text-accent-yellow animate-pulse-slow">{timeLeft}</p>
				{:else if market.status === 'open'}
					<p class="font-pixel text-pixel-xs text-accent-yellow">OPEN</p>
				{:else if market.status === 'locked'}
					<p class="font-pixel text-pixel-xs text-accent-blue">LOCKED</p>
				{:else if market.status === 'settled'}
					<p class="font-pixel text-pixel-xs text-accent-green">SETTLED</p>
				{/if}
				{#if !compact}
					<p class="font-mono text-xs text-forked-green mt-0.5">
						{formatBalance(market.total_pool)} pool
					</p>
				{/if}
			</div>
		</div>

		<!-- Outcome bars -->
		<div class="space-y-1.5">
			{#each market.outcomes ?? [] as outcome (outcome.id)}
				{@const p = pct(outcome.total_wagered)}
				{@const isWinner = market.winning_outcome_id === outcome.id}
				<div class="relative rounded overflow-hidden" style="background: rgba(42,42,42,0.9);">
					<!-- Fill bar -->
					<div
						class="absolute inset-y-0 left-0 transition-all duration-700"
						style="width: {p}%; background: {isWinner
							? 'rgba(76,175,80,0.35)'
							: 'rgba(139,164,70,0.2)'};"
					></div>
					<!-- Label row -->
					<div class="relative flex items-center justify-between px-2 py-1.5">
						<span
							class="font-sans text-xs truncate"
							class:text-accent-green={isWinner}
							class:font-semibold={isWinner}
							class:text-text-secondary={!isWinner}
						>
							{#if isWinner}✓ {/if}{outcome.label}
						</span>
						<span
							class="font-pixel text-pixel-xs shrink-0 ml-2"
							class:text-accent-green={isWinner}
							class:text-text-muted={!isWinner}
						>
							{p}%
						</span>
					</div>
				</div>
			{/each}
		</div>

		{#if compact}
			<p class="text-right font-mono text-xs text-text-muted mt-1.5">
				{formatBalance(market.total_pool)} pool
			</p>
		{/if}
	</div>
{/if}
