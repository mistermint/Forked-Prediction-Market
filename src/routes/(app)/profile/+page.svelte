<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { formatBalance } from '$lib/utils';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();
	let { profile, provider } = $derived(data);

	const isSSO = provider !== 'email';

	let copied = $state(false);
	function copyReferral() {
		const link = `${window.location.origin}/signup?ref=${profile?.referral_code ?? ''}`;
		navigator.clipboard.writeText(link);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	// ─── Profile editing ───────────────────────────────────────────────
	let displayName = $state(profile?.display_name ?? '');
	let username = $state(profile?.username ?? '');
	let profileSaving = $state(false);
	let profileError = $state('');
	let profileSuccess = $state('');

	async function saveProfile(e: SubmitEvent) {
		e.preventDefault();
		if (profileSaving) return;
		profileSaving = true;
		profileError = '';
		profileSuccess = '';

		const res = await fetch('/api/profile', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ display_name: displayName, username })
		});
		const json = await res.json();

		if (!res.ok) {
			profileError = json.error ?? 'Save failed.';
		} else {
			profileSuccess = 'Profile updated.';
			await invalidateAll();
		}
		profileSaving = false;
	}

	// ─── Avatar upload ─────────────────────────────────────────────────
	let avatarUploading = $state(false);
	let avatarError = $state('');
	let avatarPreview = $state<string | null>(null);

	async function handleAvatarChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		avatarUploading = true;
		avatarError = '';
		avatarPreview = URL.createObjectURL(file);

		const form = new FormData();
		form.append('avatar', file);

		const res = await fetch('/api/profile/avatar', { method: 'POST', body: form });
		const json = await res.json();

		if (!res.ok) {
			avatarError = json.error ?? 'Upload failed.';
			avatarPreview = null;
		} else {
			await invalidateAll();
		}
		avatarUploading = false;
	}

	// ─── Password change ───────────────────────────────────────────────
	let newPassword = $state('');
	let confirmPassword = $state('');
	let passwordSaving = $state(false);
	let passwordError = $state('');
	let passwordSuccess = $state('');

	async function savePassword(e: SubmitEvent) {
		e.preventDefault();
		if (passwordSaving) return;
		passwordError = '';
		passwordSuccess = '';

		if (newPassword.length < 8) {
			passwordError = 'Password must be at least 8 characters.';
			return;
		}
		if (newPassword !== confirmPassword) {
			passwordError = 'Passwords do not match.';
			return;
		}

		passwordSaving = true;
		const { error } = await supabase.auth.updateUser({ password: newPassword });

		if (error) {
			passwordError = error.message;
		} else {
			passwordSuccess = 'Password updated.';
			newPassword = '';
			confirmPassword = '';
		}
		passwordSaving = false;
	}

	// ─── Email change ──────────────────────────────────────────────────
	let newEmail = $state('');
	let emailSaving = $state(false);
	let emailError = $state('');
	let emailSuccess = $state('');

	async function saveEmail(e: SubmitEvent) {
		e.preventDefault();
		if (emailSaving) return;
		emailError = '';
		emailSuccess = '';

		if (!newEmail.includes('@')) {
			emailError = 'Enter a valid email address.';
			return;
		}

		emailSaving = true;
		const { error } = await supabase.auth.updateUser({ email: newEmail });

		if (error) {
			emailError = error.message;
		} else {
			emailSuccess = 'Confirmation sent to new email address.';
			newEmail = '';
		}
		emailSaving = false;
	}

	// ─── Invite code redemption ────────────────────────────────────────
	let inviteCode = $state('');
	let redeemStatus = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
	let redeemMessage = $state('');

	async function redeemCode(e: SubmitEvent) {
		e.preventDefault();
		if (redeemStatus === 'loading') return;
		redeemStatus = 'loading';
		redeemMessage = '';

		const res = await fetch('/api/invite/redeem', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ code: inviteCode })
		});
		const json = await res.json();

		if (!res.ok) {
			redeemStatus = 'error';
			redeemMessage = json.error ?? 'Redemption failed.';
		} else {
			redeemStatus = 'success';
			redeemMessage = 'Code redeemed! You now have creator access.';
			await invalidateAll();
		}
	}

	// ─── Send coins ────────────────────────────────────────────────────
	let sendTo = $state('');
	let sendAmount = $state('');
	let sendStatus = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
	let sendMessage = $state('');

	async function sendCoins(e: SubmitEvent) {
		e.preventDefault();
		if (sendStatus === 'loading') return;
		sendStatus = 'loading';
		sendMessage = '';

		const res = await fetch('/api/transfer', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ toUsername: sendTo, amount: parseInt(sendAmount, 10) })
		});
		const json = await res.json();

		if (!res.ok) {
			sendStatus = 'error';
			sendMessage = json.error ?? 'Transfer failed.';
		} else {
			sendStatus = 'success';
			sendMessage = `Sent ${sendAmount} coins to @${sendTo.replace(/^@/, '')}.`;
			sendTo = '';
			sendAmount = '';
			await invalidateAll();
		}
	}

	let avatarSrc = $derived(avatarPreview ?? profile?.avatar_url ?? null);
	let avatarInitial = $derived(profile?.display_name?.charAt(0).toUpperCase() ?? '?');
</script>

<svelte:head>
	<title>Profile — Forked.gg</title>
</svelte:head>

<div class="max-w-2xl space-y-8">

	<!-- ─── Identity ──────────────────────────────────────────────────── -->
	<div class="card space-y-6">
		<h2 class="font-pixel text-pixel-xs text-text-secondary">PROFILE</h2>

		<div class="flex items-center gap-4">
			<!-- Avatar with upload -->
			<label class="relative cursor-pointer group shrink-0">
				{#if avatarSrc}
					<img
						src={avatarSrc}
						alt={profile?.display_name}
						class="w-16 h-16 rounded-retro border-2 border-surface-4 object-cover"
					/>
				{:else}
					<div class="w-16 h-16 rounded-retro border-2 border-surface-4 bg-surface-3 flex items-center justify-center">
						<span class="font-pixel text-pixel-base text-text-muted">{avatarInitial}</span>
					</div>
				{/if}
				<div class="absolute inset-0 bg-black/50 rounded-retro flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
					<span class="text-white text-xs font-mono">{avatarUploading ? '...' : 'CHANGE'}</span>
				</div>
				<input
					type="file"
					accept="image/jpeg,image/png,image/webp,image/gif"
					class="sr-only"
					onchange={handleAvatarChange}
					disabled={avatarUploading}
				/>
			</label>

			<div class="space-y-0.5">
				<p class="text-text-primary font-sans font-semibold">{profile?.display_name}</p>
				<p class="text-text-muted font-mono text-sm">@{profile?.username}</p>
				<span class="badge-info text-xs capitalize">{profile?.role}</span>
			</div>
		</div>

		{#if avatarError}
			<p class="text-accent-red text-xs font-mono">{avatarError}</p>
		{/if}

		<!-- Edit identity -->
		<form onsubmit={saveProfile} class="space-y-4">
			<div class="space-y-1">
				<label class="text-text-muted text-xs font-mono" for="display-name">DISPLAY NAME</label>
				<input
					id="display-name"
					type="text"
					bind:value={displayName}
					class="input w-full"
					maxlength="50"
					disabled={profileSaving}
				/>
			</div>
			<div class="space-y-1">
				<label class="text-text-muted text-xs font-mono" for="username">USERNAME</label>
				<div class="flex items-center">
					<span class="text-text-muted font-mono text-sm px-3 py-2 bg-surface-2 border border-surface-4 border-r-0 rounded-l-retro">@</span>
					<input
						id="username"
						type="text"
						bind:value={username}
						class="input flex-1 rounded-l-none"
						maxlength="30"
						disabled={profileSaving}
					/>
				</div>
				<p class="text-text-muted text-xs font-mono">Letters, numbers, underscores. 3–30 characters.</p>
			</div>

			{#if profileError}
				<p class="text-accent-red text-xs font-mono">{profileError}</p>
			{/if}
			{#if profileSuccess}
				<p class="text-accent-green text-xs font-mono">{profileSuccess}</p>
			{/if}

			<button type="submit" class="btn-primary text-xs" disabled={profileSaving}>
				{profileSaving ? 'SAVING...' : 'SAVE CHANGES'}
			</button>
		</form>
	</div>

	<!-- ─── Balances ──────────────────────────────────────────────────── -->
	<div class="grid grid-cols-2 gap-4">
		<div class="card space-y-2">
			<p class="text-text-muted text-xs font-mono uppercase tracking-widest">Play Balance</p>
			<p class="font-pixel text-pixel-lg text-forked-green">{formatBalance(profile?.play_balance ?? 0)}</p>
			<p class="text-text-muted text-xs font-mono">coins</p>
		</div>
		<div class="card space-y-2">
			<p class="text-text-muted text-xs font-mono uppercase tracking-widest">BET Balance</p>
			<p class="font-pixel text-pixel-lg text-accent-yellow">{formatBalance(profile?.bet_balance ?? 0)}</p>
			<p class="text-text-muted text-xs font-mono">BET</p>
		</div>
	</div>

	<!-- ─── Send coins ─────────────────────────────────────────────────── -->
	<div class="card space-y-4">
		<h2 class="font-pixel text-pixel-xs text-text-secondary">SEND COINS</h2>
		<form onsubmit={sendCoins} class="space-y-3">
			<div class="space-y-1">
				<label class="text-text-muted text-xs font-mono" for="send-to">RECIPIENT</label>
				<input
					id="send-to"
					type="text"
					bind:value={sendTo}
					placeholder="@username"
					class="input w-full"
					disabled={sendStatus === 'loading'}
				/>
			</div>
			<div class="space-y-1">
				<label class="text-text-muted text-xs font-mono" for="send-amount">AMOUNT</label>
				<input
					id="send-amount"
					type="number"
					bind:value={sendAmount}
					placeholder="100"
					min="1"
					class="input w-full"
					disabled={sendStatus === 'loading'}
				/>
			</div>
			{#if sendStatus === 'error'}
				<p class="text-accent-red text-xs font-mono">{sendMessage}</p>
			{/if}
			{#if sendStatus === 'success'}
				<p class="text-accent-green text-xs font-mono">{sendMessage}</p>
			{/if}
			<button type="submit" class="btn-secondary text-xs" disabled={sendStatus === 'loading'}>
				{sendStatus === 'loading' ? 'SENDING...' : 'SEND COINS'}
			</button>
		</form>
	</div>

	<!-- ─── Referral ───────────────────────────────────────────────────── -->
	<div class="card space-y-3">
		<h2 class="font-pixel text-pixel-xs text-text-secondary">REFERRAL LINK</h2>
		<p class="text-text-muted text-sm font-sans">Share this link to invite friends.</p>
		<div class="flex items-center gap-2">
			<input
				type="text"
				value="{typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref={profile?.referral_code ?? ''}"
				readonly
				class="input flex-1 text-xs font-mono"
			/>
			<button onclick={copyReferral} class="btn-secondary text-xs whitespace-nowrap">
				{copied ? 'COPIED!' : 'COPY'}
			</button>
		</div>
	</div>

	<!-- ─── Become a Creator ──────────────────────────────────────────── -->
	{#if profile?.role === 'user'}
		<div class="card space-y-4 border border-accent-blue/20">
			<div>
				<h2 class="font-pixel text-pixel-xs text-accent-blue">BECOME A CREATOR</h2>
				<p class="text-text-muted text-sm font-sans mt-1">
					Have an invite code? Redeem it to unlock market creation.
				</p>
			</div>

			{#if redeemStatus === 'success'}
				<p class="text-accent-green text-sm font-mono">{redeemMessage}</p>
			{:else}
				<form onsubmit={redeemCode} class="flex gap-2">
					<input
						type="text"
						bind:value={inviteCode}
						placeholder="INVITE CODE"
						class="input flex-1 font-mono tracking-widest uppercase"
						maxlength="10"
						disabled={redeemStatus === 'loading'}
					/>
					<button type="submit" class="btn-primary text-xs whitespace-nowrap" disabled={redeemStatus === 'loading'}>
						{redeemStatus === 'loading' ? 'REDEEMING...' : 'REDEEM'}
					</button>
				</form>
				{#if redeemStatus === 'error'}
					<p class="text-accent-red text-xs font-mono">{redeemMessage}</p>
				{/if}
			{/if}
		</div>
	{/if}

	<!-- ─── Account settings (non-SSO only) ──────────────────────────── -->
	{#if !isSSO}
		<div class="card space-y-6">
			<h2 class="font-pixel text-pixel-xs text-text-secondary">ACCOUNT SETTINGS</h2>

			<form onsubmit={saveEmail} class="space-y-3">
				<p class="text-text-muted text-xs font-mono uppercase tracking-wider">Change Email</p>
				<input
					type="email"
					bind:value={newEmail}
					placeholder="new@email.com"
					class="input w-full"
					disabled={emailSaving}
				/>
				{#if emailError}
					<p class="text-accent-red text-xs font-mono">{emailError}</p>
				{/if}
				{#if emailSuccess}
					<p class="text-accent-green text-xs font-mono">{emailSuccess}</p>
				{/if}
				<button type="submit" class="btn-secondary text-xs" disabled={emailSaving}>
					{emailSaving ? 'UPDATING...' : 'UPDATE EMAIL'}
				</button>
			</form>

			<div class="border-t border-surface-3"></div>

			<form onsubmit={savePassword} class="space-y-3">
				<p class="text-text-muted text-xs font-mono uppercase tracking-wider">Change Password</p>
				<input
					type="password"
					bind:value={newPassword}
					placeholder="New password (min 8 chars)"
					class="input w-full"
					disabled={passwordSaving}
				/>
				<input
					type="password"
					bind:value={confirmPassword}
					placeholder="Confirm new password"
					class="input w-full"
					disabled={passwordSaving}
				/>
				{#if passwordError}
					<p class="text-accent-red text-xs font-mono">{passwordError}</p>
				{/if}
				{#if passwordSuccess}
					<p class="text-accent-green text-xs font-mono">{passwordSuccess}</p>
				{/if}
				<button type="submit" class="btn-secondary text-xs" disabled={passwordSaving}>
					{passwordSaving ? 'UPDATING...' : 'UPDATE PASSWORD'}
				</button>
			</form>
		</div>
	{/if}

</div>
