<script lang="ts">
	import { formatBalance } from '$lib/utils';
	import { timeAgo } from '$lib/utils';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	let search = $state('');
	let selectedUserId = $state<string | null>(null);
	let adjustType = $state<'play' | 'bet'>('play');
	let adjustAmount = $state('');
	let adjustMode = $state<'add' | 'set'>('add');
	let adjusting = $state(false);
	let adjustError = $state('');
	let adjustSuccess = $state('');

	let filteredUsers = $derived(
		data.users.filter(
			(u) =>
				!search ||
				u.username.toLowerCase().includes(search.toLowerCase()) ||
				u.display_name.toLowerCase().includes(search.toLowerCase())
		)
	);

	let selectedUser = $derived(data.users.find((u) => u.id === selectedUserId) ?? null);

	function selectUser(id: string) {
		selectedUserId = selectedUserId === id ? null : id;
		adjustAmount = '';
		adjustError = '';
		adjustSuccess = '';
	}

	async function handleAdjust(e: SubmitEvent) {
		e.preventDefault();
		if (!selectedUserId || adjusting) return;

		const amount = parseInt(adjustAmount, 10);
		if (isNaN(amount)) {
			adjustError = 'Enter a valid number.';
			return;
		}

		adjusting = true;
		adjustError = '';
		adjustSuccess = '';

		const res = await fetch('/api/admin/adjust-balance', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				userId: selectedUserId,
				balanceType: adjustType,
				mode: adjustMode,
				amount
			})
		});

		const json = await res.json();

		if (!res.ok) {
			adjustError = json.error ?? 'Adjustment failed.';
		} else {
			adjustSuccess = `Balance updated.`;
			adjustAmount = '';
			await invalidateAll();
		}

		adjusting = false;
	}

	function roleClass(role: string) {
		return { admin: 'badge-pending', streamer: 'badge-info', user: 'badge-win' }[role] ?? 'badge-info';
	}
</script>

<svelte:head>
	<title>Admin — Forked.gg</title>
</svelte:head>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="font-pixel text-pixel-sm text-forked-green">ADMIN PANEL</h1>
			<p class="text-text-muted font-mono text-xs mt-1">{data.users.length} users total</p>
		</div>
	</div>

	<!-- Search -->
	<input
		type="text"
		bind:value={search}
		placeholder="Search by username or display name…"
		class="input max-w-sm"
	/>

	<!-- User table -->
	<div class="card p-0 overflow-hidden">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-surface-3 bg-surface-2">
					<th class="text-left px-4 py-3 text-text-muted font-mono text-xs">USER</th>
					<th class="text-left px-4 py-3 text-text-muted font-mono text-xs hidden sm:table-cell">ROLE</th>
					<th class="text-right px-4 py-3 text-text-muted font-mono text-xs">PLAY</th>
					<th class="text-right px-4 py-3 text-text-muted font-mono text-xs hidden md:table-cell">BET</th>
					<th class="text-right px-4 py-3 text-text-muted font-mono text-xs hidden lg:table-cell">JOINED</th>
					<th class="px-4 py-3"></th>
				</tr>
			</thead>
			<tbody>
				{#each filteredUsers as user (user.id)}
					<tr
						class="border-b border-surface-2 hover:bg-surface-2 transition-colors
							{selectedUserId === user.id ? 'bg-surface-2 border-forked-green/20' : ''}"
					>
						<td class="px-4 py-3">
							<div>
								<p class="text-text-primary font-sans text-sm">{user.display_name}</p>
								<p class="text-text-muted font-mono text-xs">@{user.username}</p>
							</div>
						</td>
						<td class="px-4 py-3 hidden sm:table-cell">
							<span class={roleClass(user.role)}>{user.role}</span>
						</td>
						<td class="px-4 py-3 text-right font-mono text-xs text-forked-green">
							{formatBalance(user.play_balance)}
						</td>
						<td class="px-4 py-3 text-right font-mono text-xs text-accent-yellow hidden md:table-cell">
							{formatBalance(user.bet_balance)}
						</td>
						<td class="px-4 py-3 text-right font-mono text-xs text-text-muted hidden lg:table-cell">
							{timeAgo(user.created_at)}
						</td>
						<td class="px-4 py-3 text-right">
							<button
								onclick={() => selectUser(user.id)}
								class="btn-secondary text-xs py-1 px-2"
							>
								{selectedUserId === user.id ? 'CLOSE' : 'ADJUST'}
							</button>
						</td>
					</tr>

					<!-- Inline adjustment panel -->
					{#if selectedUserId === user.id}
						<tr class="bg-surface-2 border-b border-surface-3">
							<td colspan="6" class="px-4 py-4">
								<form onsubmit={handleAdjust} class="space-y-3 max-w-md">
									<p class="font-pixel text-pixel-xs text-text-secondary">
										ADJUST BALANCE — {user.display_name}
									</p>

									<div class="flex gap-2">
										<!-- Balance type -->
										<select bind:value={adjustType} class="input flex-1">
											<option value="play">Play Balance</option>
											<option value="bet">BET Balance</option>
										</select>
										<!-- Mode -->
										<select bind:value={adjustMode} class="input flex-1">
											<option value="add">Add / Subtract</option>
											<option value="set">Set Absolute</option>
										</select>
									</div>

									<div class="flex gap-2">
										<input
											type="number"
											bind:value={adjustAmount}
											placeholder={adjustMode === 'add' ? 'e.g. 500 or -200' : 'e.g. 1000'}
											class="input flex-1"
											disabled={adjusting}
										/>
										<button type="submit" class="btn-primary whitespace-nowrap" disabled={adjusting}>
											{adjusting ? 'SAVING...' : 'APPLY'}
										</button>
									</div>

									{#if adjustError}
										<p class="text-accent-red text-xs font-mono">{adjustError}</p>
									{/if}
									{#if adjustSuccess}
										<p class="text-accent-green text-xs font-mono">{adjustSuccess}</p>
									{/if}

									<p class="text-text-muted text-xs font-mono">
										Current: <span class="text-forked-green">{formatBalance(user.play_balance)} play</span>
										· <span class="text-accent-yellow">{formatBalance(user.bet_balance)} BET</span>
									</p>
								</form>
							</td>
						</tr>
					{/if}
				{:else}
					<tr>
						<td colspan="6" class="px-4 py-10 text-center text-text-muted font-mono text-sm">
							No users found.
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
