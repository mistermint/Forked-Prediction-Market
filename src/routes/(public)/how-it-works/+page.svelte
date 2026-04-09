<svelte:head>
	<title>How It Works — Forked.gg</title>
</svelte:head>

<div class="max-w-3xl mx-auto px-6 py-12 space-y-16">
	<div class="text-center space-y-3">
		<h1 class="font-pixel text-pixel-lg text-forked-green">HOW IT WORKS</h1>
		<p class="text-text-secondary font-sans text-base">Everything you need to get started.</p>
	</div>

	<!-- For Viewers -->
	<section class="space-y-6">
		<h2 class="font-pixel text-pixel-base text-text-primary border-b border-surface-3 pb-3">
			FOR VIEWERS
		</h2>

		<div class="space-y-4">
			{#each [
				{
					n: '01',
					title: 'Create an account',
					body: 'Sign up with email or Google. You start with 1,000 free play coins — no real money required.'
				},
				{
					n: '02',
					title: 'Find a live market',
					body: "Browse open prediction pools from streamers you follow. Each market has a question and a set of outcomes to bet on."
				},
				{
					n: '03',
					title: 'Place your bet',
					body: 'Pick an outcome and wager your coins. You can only bet once per market, so choose wisely. Betting closes when the streamer locks the pool.'
				},
				{
					n: '04',
					title: 'Wait for settlement',
					body: 'When the outcome is known, the streamer settles the market. Winners split the pool proportionally — the more contrarian your bet, the bigger your payout.'
				},
				{
					n: '05',
					title: 'Climb the leaderboard',
					body: 'Your net profit and win rate are tracked globally. Compete for the top spot across all markets and streamers.'
				}
			] as step}
				<div class="card flex gap-4">
					<span class="font-pixel text-pixel-lg text-forked-green/30 shrink-0 w-8">{step.n}</span>
					<div class="space-y-1">
						<h3 class="font-sans font-semibold text-text-primary text-sm">{step.title}</h3>
						<p class="text-text-secondary font-sans text-sm leading-relaxed">{step.body}</p>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- For Streamers -->
	<section class="space-y-6">
		<h2 class="font-pixel text-pixel-base text-text-primary border-b border-surface-3 pb-3">
			FOR STREAMERS
		</h2>

		<div class="space-y-4">
			{#each [
				{
					n: '01',
					title: 'Sign up as a streamer',
					body: 'Create your account and contact us to get your account upgraded to streamer status. This unlocks market creation.'
				},
				{
					n: '02',
					title: 'Create a prediction market',
					body: 'Go to Markets → Create. Write your question, add 2–10 outcomes, and optionally set a countdown timer. The market opens immediately.'
				},
				{
					n: '03',
					title: 'Add the OBS overlay',
					body: 'From the market detail page, copy the Browser Source URL and paste it into OBS. The widget shows your viewers the live pool distribution in real time.'
				},
				{
					n: '04',
					title: 'Lock betting at the right moment',
					body: 'Use the auto-lock timer, or lock manually. Once locked, no new bets are accepted — this is usually right before the outcome is determined.'
				},
				{
					n: '05',
					title: 'Settle the market',
					body: 'Select the winning outcome. Payouts are distributed automatically. The platform takes a small dynamic rake (1–10%) based on how many people picked the winning side.'
				}
			] as step}
				<div class="card flex gap-4">
					<span class="font-pixel text-pixel-lg text-forked-green/30 shrink-0 w-8">{step.n}</span>
					<div class="space-y-1">
						<h3 class="font-sans font-semibold text-text-primary text-sm">{step.title}</h3>
						<p class="text-text-secondary font-sans text-sm leading-relaxed">{step.body}</p>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- Rake explainer -->
	<section class="space-y-4">
		<h2 class="font-pixel text-pixel-base text-text-primary border-b border-surface-3 pb-3">
			THE DYNAMIC RAKE
		</h2>
		<p class="text-text-secondary font-sans text-sm leading-relaxed">
			The platform takes a small percentage of each settled pool. The rake is lower when the
			outcome was hard to predict (i.e., when fewer people bet on the winning side), rewarding
			contrarian calls.
		</p>
		<div class="card p-0 overflow-hidden">
			<table class="w-full text-sm">
				<thead>
					<tr class="bg-surface-2 border-b border-surface-3">
						<th class="text-left px-4 py-3 text-text-muted font-mono text-xs">WINNING SIDE SHARE</th>
						<th class="text-right px-4 py-3 text-text-muted font-mono text-xs">RAKE</th>
					</tr>
				</thead>
				<tbody>
					{#each [
						{ range: '0 – 50%', rake: '10%', note: 'Surprising outcome' },
						{ range: '51 – 75%', rake: '7%', note: 'Slight consensus' },
						{ range: '76 – 89%', rake: '4%', note: 'Strong consensus' },
						{ range: '90 – 100%', rake: '1%', note: 'Near-obvious outcome' }
					] as row}
						<tr class="border-b border-surface-2">
							<td class="px-4 py-3">
								<span class="font-mono text-sm text-text-primary">{row.range}</span>
								<span class="text-text-muted text-xs font-sans ml-2">— {row.note}</span>
							</td>
							<td class="px-4 py-3 text-right font-pixel text-pixel-xs text-forked-green">{row.rake}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<div class="text-center space-y-3 pt-4">
		<a href="/signup" class="btn-primary inline-block">Get Started</a>
		<p class="text-text-muted text-xs font-mono">Free to join. No real money required for MVP.</p>
	</div>
</div>
