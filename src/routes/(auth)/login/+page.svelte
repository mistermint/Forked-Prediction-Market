<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let email = $state('');
	let password = $state('');
	let status = $state<'idle' | 'loading'>('idle');
	let error = $state('');

	const authError = $derived($page.url.searchParams.get('error') === 'auth');

	async function handleLogin(e: SubmitEvent) {
		e.preventDefault();
		status = 'loading';
		error = '';

		const { error: err } = await supabase.auth.signInWithPassword({ email, password });

		if (err) {
			error = err.message;
			status = 'idle';
			return;
		}

		goto('/dashboard');
	}

	async function handleGoogle() {
		status = 'loading';
		error = '';

		const { error: err } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: { redirectTo: `${window.location.origin}/auth/callback` }
		});

		if (err) {
			error = err.message;
			status = 'idle';
		}
	}
</script>

<svelte:head>
	<title>Log In — Forked.gg</title>
</svelte:head>

<div class="card space-y-6 border border-surface-3 shadow-retro">
	<!-- Header -->
	<div class="space-y-1">
		<h1 class="font-pixel text-pixel-sm text-forked-green">WELCOME BACK</h1>
		<p class="text-text-muted text-xs font-mono">Log in to your account</p>
	</div>

	{#if authError}
		<div class="bg-accent-red/10 border border-accent-red/30 rounded-retro px-3 py-2">
			<p class="text-accent-red text-xs font-mono">Authentication failed. Please try again.</p>
		</div>
	{/if}

	<!-- Google -->
	<button
		onclick={handleGoogle}
		class="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-surface-2 hover:bg-surface-3 border border-surface-4 rounded-retro transition-colors font-sans text-sm text-text-primary"
		disabled={status === 'loading'}
	>
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
			<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
			<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
			<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
		</svg>
		Continue with Google
	</button>

	<!-- Divider -->
	<div class="flex items-center gap-3">
		<div class="flex-1 border-t border-surface-3"></div>
		<span class="text-text-muted text-xs font-mono px-1">OR</span>
		<div class="flex-1 border-t border-surface-3"></div>
	</div>

	<!-- Email form -->
	<form onsubmit={handleLogin} class="space-y-4">
		<div class="space-y-1.5">
			<label for="email" class="text-text-muted text-xs font-mono">EMAIL</label>
			<input
				id="email"
				type="email"
				bind:value={email}
				placeholder="you@example.com"
				required
				class="input w-full"
				disabled={status === 'loading'}
			/>
		</div>

		<div class="space-y-1.5">
			<label for="password" class="text-text-muted text-xs font-mono">PASSWORD</label>
			<input
				id="password"
				type="password"
				bind:value={password}
				placeholder="••••••••"
				required
				class="input w-full"
				disabled={status === 'loading'}
			/>
		</div>

		{#if error}
			<p class="text-accent-red text-xs font-mono">{error}</p>
		{/if}

		<button type="submit" class="btn-primary w-full text-center" disabled={status === 'loading'}>
			{status === 'loading' ? 'LOGGING IN...' : 'LOG IN'}
		</button>
	</form>

	<p class="text-center text-text-muted text-xs font-mono">
		No account?
		<a href="/signup" class="text-forked-green hover:text-forked-green-light transition-colors">
			Sign up free
		</a>
	</p>
</div>
