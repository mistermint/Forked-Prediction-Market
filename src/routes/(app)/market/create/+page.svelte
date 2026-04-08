<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();

	// Only streamers and admins can access
	const canCreate = $derived(
		data.profile?.role === 'streamer' || data.profile?.role === 'admin'
	);

	let title = $state('');
	let description = $state('');
	let outcomes = $state(['', '']);
	let lockEnabled = $state(false);
	let lockMinutes = $state(10);
	let status = $state<'idle' | 'loading'>('idle');
	let error = $state('');

	function addOutcome() {
		if (outcomes.length < 10) outcomes = [...outcomes, ''];
	}

	function removeOutcome(i: number) {
		if (outcomes.length > 2) outcomes = outcomes.filter((_, idx) => idx !== i);
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (status === 'loading') return;

		const filled = outcomes.filter((o) => o.trim().length > 0);
		if (filled.length < 2) {
			error = 'At least 2 outcomes are required.';
			return;
		}

		status = 'loading';
		error = '';

		const res = await fetch('/api/markets', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				title: title.trim(),
				description: description.trim() || null,
				outcomes: filled,
				lockMinutes: lockEnabled ? lockMinutes : null
			})
		});

		const data_res = await res.json();

		if (!res.ok || data_res.error) {
			error = data_res.error ?? 'Failed to create market.';
			status = 'idle';
			return;
		}

		goto(`/market/${data_res.marketId}`);
	}
</script>

<svelte:head>
	<title>Create Market — Forked.gg</title>
</svelte:head>

{#if !canCreate}
	<div class="card text-center py-12 space-y-3">
		<p class="font-pixel text-pixel-xs text-accent-red">ACCESS DENIED</p>
		<p class="text-text-muted font-sans text-sm">Only streamers can create prediction markets.</p>
		<a href="/market" class="btn-secondary inline-block">Back to Markets</a>
	</div>
{:else}
	<div class="max-w-xl space-y-8">
		<div>
			<h1 class="font-pixel text-pixel-sm text-forked-green">CREATE MARKET</h1>
			<p class="text-text-muted font-mono text-xs mt-1">Opens immediately for betting</p>
		</div>

		<form onsubmit={handleSubmit} class="space-y-6">
			<!-- Title -->
			<div class="space-y-1.5">
				<label for="title" class="text-text-secondary text-xs font-mono">QUESTION *</label>
				<input
					id="title"
					type="text"
					bind:value={title}
					placeholder="Will I win this match?"
					required
					maxlength="200"
					class="input"
					disabled={status === 'loading'}
				/>
			</div>

			<!-- Description -->
			<div class="space-y-1.5">
				<label for="desc" class="text-text-secondary text-xs font-mono">
					DESCRIPTION <span class="text-text-muted">(optional)</span>
				</label>
				<textarea
					id="desc"
					bind:value={description}
					placeholder="Any additional context for viewers…"
					rows="2"
					maxlength="500"
					class="input resize-none"
					disabled={status === 'loading'}
				></textarea>
			</div>

			<!-- Outcomes -->
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<label class="text-text-secondary text-xs font-mono">OUTCOMES *</label>
					<span class="text-text-muted text-xs font-mono">{outcomes.length}/10</span>
				</div>

				<div class="space-y-2">
					{#each outcomes as _, i}
						<div class="flex gap-2">
							<input
								type="text"
								bind:value={outcomes[i]}
								placeholder="Outcome {i + 1}"
								maxlength="100"
								class="input flex-1"
								disabled={status === 'loading'}
							/>
							{#if outcomes.length > 2}
								<button
									type="button"
									onclick={() => removeOutcome(i)}
									class="btn-secondary px-3 text-accent-red hover:bg-accent-red/10"
									disabled={status === 'loading'}
								>
									✕
								</button>
							{/if}
						</div>
					{/each}
				</div>

				{#if outcomes.length < 10}
					<button
						type="button"
						onclick={addOutcome}
						class="btn-secondary text-xs w-full"
						disabled={status === 'loading'}
					>
						+ ADD OUTCOME
					</button>
				{/if}
			</div>

			<!-- Lock timer -->
			<div class="space-y-2">
				<label class="flex items-center gap-2 cursor-pointer">
					<input type="checkbox" bind:checked={lockEnabled} class="w-4 h-4 accent-forked-green" />
					<span class="text-text-secondary text-xs font-mono">AUTO-LOCK BETTING</span>
				</label>

				{#if lockEnabled}
					<div class="flex items-center gap-3 pl-6">
						<input
							type="number"
							bind:value={lockMinutes}
							min="1"
							max="1440"
							class="input w-24"
							disabled={status === 'loading'}
						/>
						<span class="text-text-muted text-xs font-mono">minutes from now</span>
					</div>
				{/if}
			</div>

			{#if error}
				<p class="text-accent-red text-xs font-mono">{error}</p>
			{/if}

			<div class="flex gap-3">
				<button type="submit" class="btn-primary flex-1 text-center" disabled={status === 'loading'}>
					{status === 'loading' ? 'CREATING...' : 'CREATE & OPEN'}
				</button>
				<a href="/market" class="btn-secondary text-center px-4">CANCEL</a>
			</div>
		</form>
	</div>
{/if}
