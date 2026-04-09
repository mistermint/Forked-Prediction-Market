<script lang="ts">
	import type { Activity } from '$lib/types';
	import { supabase } from '$lib/supabase';
	import { formatBalance, timeAgo } from '$lib/utils';
	import { onDestroy } from 'svelte';

	let {
		marketId,
		initialActivity = []
	}: {
		marketId: string;
		initialActivity?: Activity[];
	} = $props();

	let activities = $state<Activity[]>(initialActivity);

	// Subscribe to new activity on this market via Realtime
	const channel = supabase
		.channel(`activity-${marketId}`)
		.on(
			'postgres_changes',
			{ event: 'INSERT', schema: 'public', table: 'activity', filter: `market_id=eq.${marketId}` },
			(payload) => {
				activities = [payload.new as Activity, ...activities].slice(0, 30);
			}
		)
		.subscribe();

	onDestroy(() => {
		supabase.removeChannel(channel);
	});

	function activityLabel(item: Activity) {
		switch (item.type) {
			case 'bet_placed':
				return `bet ${formatBalance((item.metadata as Record<string, number>).amount ?? 0)} coins`;
			case 'payout':
				return `won ${formatBalance((item.metadata as Record<string, number>).payout ?? 0)} coins`;
			case 'market_settled':
				return 'settled the market';
			default:
				return item.type.replace(/_/g, ' ');
		}
	}

	function activityColor(type: string) {
		return {
			bet_placed: 'text-text-secondary',
			payout: 'text-accent-green',
			market_settled: 'text-forked-green',
			market_created: 'text-accent-blue'
		}[type] ?? 'text-text-muted';
	}
</script>

<div class="space-y-1 max-h-64 overflow-y-auto">
	{#if activities.length === 0}
		<p class="text-text-muted text-xs font-mono text-center py-6">No activity yet.</p>
	{:else}
		{#each activities as item (item.id)}
			<div class="flex items-center justify-between py-1.5 border-b border-surface-2 last:border-0">
				<span class="text-xs font-mono {activityColor(item.type)}">
					{activityLabel(item)}
				</span>
				<span class="text-text-muted text-xs font-mono shrink-0 ml-4">{timeAgo(item.created_at)}</span>
			</div>
		{/each}
	{/if}
</div>
