<script lang="ts">
	import { formatBalance } from '$lib/utils';

	let { data } = $props();
	let { profile } = $derived(data);

	let copied = $state(false);

	async function copyReferralLink() {
		const link = `${window.location.origin}/signup?ref=${profile.referral_code}`;
		await navigator.clipboard.writeText(link);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function roleLabel(role: string) {
		return { user: 'Viewer', streamer: 'Streamer', admin: 'Admin' }[role] ?? role;
	}
</script>

<svelte:head>
	<title>Profile — Forked.gg</title>
</svelte:head>

<div class="space-y-8 max-w-2xl">
	<div>
		<h1 class="font-pixel text-pixel-sm text-forked-green">YOUR PROFILE</h1>
	</div>

	<!-- Identity card -->
	<div class="card space-y-4">
		<div class="flex items-start gap-4">
			{#if profile.avatar_url}
				<img
					src={profile.avatar_url}
					alt={profile.display_name}
					class="w-14 h-14 rounded-retro border border-surface-4 object-cover"
				/>
			{:else}
				<div
					class="w-14 h-14 rounded-retro border border-surface-4 bg-surface-3 flex items-center justify-center"
				>
					<span class="font-pixel text-pixel-lg text-text-muted">
						{profile.display_name.charAt(0).toUpperCase()}
					</span>
				</div>
			{/if}

			<div class="space-y-1">
				<p class="text-text-primary font-sans font-semibold text-lg">{profile.display_name}</p>
				<p class="text-text-muted font-mono text-sm">@{profile.username}</p>
				<span class="badge-info">{roleLabel(profile.role)}</span>
			</div>
		</div>

		<p class="text-text-muted text-xs font-mono">
			Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
		</p>
	</div>

	<!-- Balances -->
	<div class="grid grid-cols-2 gap-4">
		<div class="card space-y-2">
			<p class="text-text-muted text-xs font-mono uppercase tracking-widest">Play Balance</p>
			<p class="font-pixel text-pixel-base text-forked-green">
				{formatBalance(profile.play_balance)}
			</p>
			<p class="text-text-muted text-xs font-mono">coins</p>
		</div>
		<div class="card space-y-2">
			<p class="text-text-muted text-xs font-mono uppercase tracking-widest">BET Balance</p>
			<p class="font-pixel text-pixel-base text-accent-yellow">
				{formatBalance(profile.bet_balance)}
			</p>
			<p class="text-text-muted text-xs font-mono">BET</p>
		</div>
	</div>

	<!-- Referral code -->
	<div class="card space-y-3">
		<div>
			<p class="text-text-secondary text-xs font-mono uppercase tracking-widest mb-1">Your Referral Link</p>
			<p class="text-text-muted text-xs font-sans">Share this link — friends who sign up get credited to you.</p>
		</div>

		<div class="flex items-center gap-2">
			<div class="input flex-1 text-text-muted select-all cursor-text" style="user-select: all">
				{typeof window !== 'undefined'
					? `${window.location.origin}/signup?ref=${profile.referral_code}`
					: `/signup?ref=${profile.referral_code}`}
			</div>
			<button onclick={copyReferralLink} class="btn-secondary whitespace-nowrap text-xs">
				{copied ? 'COPIED!' : 'COPY'}
			</button>
		</div>

		<p class="text-text-muted text-xs font-mono">
			Code: <span class="text-forked-green font-pixel text-pixel-xs">{profile.referral_code}</span>
		</p>
	</div>

	<!-- Placeholder for recent activity — built in Block 4 -->
	<div class="card space-y-3">
		<p class="text-text-secondary text-xs font-mono uppercase tracking-widest">Recent Activity</p>
		<p class="text-text-muted text-sm font-sans">Your bet history will appear here once markets go live.</p>
	</div>
</div>
