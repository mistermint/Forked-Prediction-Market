<script lang="ts">
	import MarketCard from '$components/prediction/MarketCard.svelte';

	let { data } = $props();

	const tabs = [
		{ id: 'open', label: 'OPEN' },
		{ id: 'locked', label: 'LOCKED' },
		{ id: 'settled', label: 'SETTLED' }
	];

	const canCreate = $derived(
		data.profile?.role === 'streamer' || data.profile?.role === 'admin'
	);
</script>

<svelte:head>
	<title>Markets — Forked.gg</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h1 class="font-pixel text-pixel-sm text-forked-green">MARKETS</h1>
		{#if canCreate}
			<a href="/market/create" class="btn-primary">+ CREATE</a>
		{/if}
	</div>

	<!-- Tabs -->
	<div class="flex gap-1 border-b border-surface-3">
		{#each tabs as tab}
			<a
				href="/market?tab={tab.id}"
				class="px-4 py-2 font-pixel text-pixel-xs transition-colors border-b-2 -mb-px
					{data.tab === tab.id
						? 'text-forked-green border-forked-green'
						: 'text-text-muted border-transparent hover:text-text-secondary'}"
			>
				{tab.label}
			</a>
		{/each}
	</div>

	<!-- Market grid -->
	{#if data.markets.length === 0}
		<div class="card py-16 text-center space-y-2">
			<p class="font-pixel text-pixel-xs text-text-muted">NO MARKETS</p>
			<p class="text-text-muted font-sans text-sm">
				{data.tab === 'open' ? 'No prediction pools are open right now.' : `No ${data.tab} markets.`}
			</p>
			{#if canCreate && data.tab === 'open'}
				<a href="/market/create" class="btn-primary inline-block mt-4">CREATE FIRST MARKET</a>
			{/if}
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
			{#each data.markets as market (market.id)}
				<MarketCard {market} />
			{/each}
		</div>
	{/if}
</div>
