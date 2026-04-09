<script lang="ts">
	let email = $state('');
	let status = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
	let message = $state('');

	async function handleWaitlist(e: SubmitEvent) {
		e.preventDefault();
		if (status === 'loading') return;

		status = 'loading';
		message = '';

		const res = await fetch('/api/waitlist', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email })
		});

		const data = await res.json();

		if (res.ok) {
			status = 'success';
			email = '';
		} else {
			status = 'error';
			message = data.error ?? 'Something went wrong.';
		}
	}
</script>

<svelte:head>
	<title>Forked.gg — Streamer Prediction Markets</title>
	<meta
		name="description"
		content="Prediction markets for live streamers. Viewers bet, streamers win together. Join the waitlist."
	/>
</svelte:head>

<!-- Nav -->
<nav class="border-b border-surface-3 px-6 py-4">
	<div class="max-w-5xl mx-auto flex items-center justify-between">
		<span class="font-pixel text-pixel-base text-forked-green">FORKED.GG</span>
		<div class="flex items-center gap-3">
			<a href="/discover" class="text-text-muted text-sm font-mono hover:text-text-secondary transition-colors hidden sm:inline">
				Discover
			</a>
			<a href="/how-it-works" class="text-text-muted text-sm font-mono hover:text-text-secondary transition-colors hidden sm:inline">
				How It Works
			</a>
			<a href="/login" class="text-text-muted text-sm font-mono hover:text-text-secondary transition-colors hidden sm:inline">
				Log In
			</a>
			<a href="/signup" class="btn-secondary text-xs">
				Sign Up
			</a>
			<a
				href="https://discord.gg/forkedgg"
				target="_blank"
				rel="noopener noreferrer"
				class="btn-secondary text-xs hidden sm:inline-block"
			>
				Join Discord
			</a>
		</div>
	</div>
</nav>

<!-- Hero -->
<section class="px-6 py-24 md:py-36 text-center">
	<div class="max-w-3xl mx-auto space-y-8">
		<!-- Pixel badge -->
		<div class="inline-block">
			<span class="badge-pending font-pixel text-pixel-xs tracking-widest">EARLY ACCESS</span>
		</div>

		<h1 class="font-pixel text-pixel-lg md:text-pixel-xl text-forked-green leading-relaxed">
			PREDICTION MARKETS<br />FOR STREAMERS
		</h1>

		<p class="text-text-secondary font-sans text-base md:text-lg max-w-xl mx-auto leading-relaxed">
			Create live prediction pools. Your viewers bet play money on what happens next. Winners take
			the pot — you keep the crowd locked in.
		</p>

		<!-- Waitlist form -->
		<div class="max-w-md mx-auto">
			{#if status === 'success'}
				<div class="card border-accent-green/40 text-center space-y-2">
					<p class="font-pixel text-pixel-sm text-accent-green">YOU'RE IN!</p>
					<p class="text-text-secondary text-sm font-sans">We'll let you know when doors open.</p>
				</div>
			{:else}
				<form onsubmit={handleWaitlist} class="flex flex-col sm:flex-row gap-3">
					<input
						type="email"
						bind:value={email}
						placeholder="your@email.com"
						required
						class="input flex-1"
						disabled={status === 'loading'}
					/>
					<button
						type="submit"
						class="btn-primary whitespace-nowrap"
						disabled={status === 'loading'}
					>
						{status === 'loading' ? 'JOINING...' : 'JOIN WAITLIST'}
					</button>
				</form>
				{#if status === 'error'}
					<p class="text-accent-red text-xs font-mono mt-2">{message}</p>
				{/if}
			{/if}
		</div>

		<p class="text-text-muted text-xs font-mono">No spam. Just a launch ping when we're ready.</p>
	</div>
</section>

<!-- How it works -->
<section class="px-6 py-20 border-t border-surface-3">
	<div class="max-w-5xl mx-auto">
		<h2 class="font-pixel text-pixel-base text-forked-green text-center mb-16">HOW IT WORKS</h2>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<!-- Step 1 -->
			<div class="card space-y-4 relative">
				<div
					class="font-pixel text-pixel-lg text-forked-green/30 absolute top-4 right-4 select-none"
				>
					01
				</div>
				<div
					class="w-12 h-12 bg-surface-2 border border-surface-4 rounded-retro flex items-center justify-center shadow-retro-sm"
				>
					<span class="text-2xl">🎮</span>
				</div>
				<h3 class="font-pixel text-pixel-xs text-text-primary leading-relaxed">
					STREAMER OPENS A POOL
				</h3>
				<p class="text-text-secondary text-sm font-sans leading-relaxed">
					Ask a question about your stream — "Will I win this match?", "How many kills this round?"
					— and set the outcomes.
				</p>
			</div>

			<!-- Step 2 -->
			<div class="card space-y-4 relative">
				<div
					class="font-pixel text-pixel-lg text-forked-green/30 absolute top-4 right-4 select-none"
				>
					02
				</div>
				<div
					class="w-12 h-12 bg-surface-2 border border-surface-4 rounded-retro flex items-center justify-center shadow-retro-sm"
				>
					<span class="text-2xl">💰</span>
				</div>
				<h3 class="font-pixel text-pixel-xs text-text-primary leading-relaxed">
					VIEWERS PLACE BETS
				</h3>
				<p class="text-text-secondary text-sm font-sans leading-relaxed">
					Chat bets play money on the outcome they think is right. Betting closes when the action
					starts — no changing your mind.
				</p>
			</div>

			<!-- Step 3 -->
			<div class="card space-y-4 relative">
				<div
					class="font-pixel text-pixel-lg text-forked-green/30 absolute top-4 right-4 select-none"
				>
					03
				</div>
				<div
					class="w-12 h-12 bg-surface-2 border border-surface-4 rounded-retro flex items-center justify-center shadow-retro-sm"
				>
					<span class="text-2xl">🏆</span>
				</div>
				<h3 class="font-pixel text-pixel-xs text-text-primary leading-relaxed">
					WINNERS GET PAID
				</h3>
				<p class="text-text-secondary text-sm font-sans leading-relaxed">
					When you settle the outcome, winnings are split proportionally among the correct side.
					Climb the leaderboard. Build your legacy.
				</p>
			</div>
		</div>
	</div>
</section>

<!-- Discord CTA -->
<section class="px-6 py-20 border-t border-surface-3">
	<div class="max-w-2xl mx-auto text-center space-y-6">
		<h2 class="font-pixel text-pixel-base text-forked-green">JOIN THE COMMUNITY</h2>
		<p class="text-text-secondary font-sans text-base leading-relaxed">
			Get early access, shape the product, and connect with streamers already building on Forked.
			We're active in Discord daily.
		</p>
		<a
			href="https://discord.gg/forkedgg"
			target="_blank"
			rel="noopener noreferrer"
			class="btn-primary inline-block"
		>
			OPEN DISCORD
		</a>
		<p class="text-text-muted text-xs font-mono">Early members get priority access at launch.</p>
	</div>
</section>

<!-- Footer -->
<footer class="border-t border-surface-3 px-6 py-8">
	<div class="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
		<span class="font-pixel text-pixel-xs text-forked-green">FORKED.GG</span>
		<p class="text-text-muted text-xs font-mono">© 2025 Forked Games. All rights reserved.</p>
	</div>
</footer>
