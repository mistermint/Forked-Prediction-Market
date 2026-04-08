<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { session } from '$lib/stores/auth';
	import { goto } from '$app/navigation';

	let { children, data } = $props();

	// Keep the auth store in sync with the server session
	session.set(data.session);

	async function handleLogout() {
		await supabase.auth.signOut();
		goto('/');
	}
</script>

<!-- Minimal app shell — full nav/sidebar built in Block 3 -->
<div class="min-h-screen flex flex-col">
	<header class="border-b border-surface-3 px-6 py-4">
		<div class="max-w-5xl mx-auto flex items-center justify-between">
			<a href="/dashboard" class="font-pixel text-pixel-base text-forked-green hover:text-forked-green-light transition-colors">
				FORKED.GG
			</a>
			<nav class="flex items-center gap-4">
				<a href="/dashboard" class="text-text-secondary hover:text-text-primary text-sm font-mono transition-colors">Dashboard</a>
				<a href="/profile" class="text-text-secondary hover:text-text-primary text-sm font-mono transition-colors">Profile</a>
				<button onclick={handleLogout} class="btn-secondary text-xs">Log Out</button>
			</nav>
		</div>
	</header>

	<main class="flex-1 px-6 py-8">
		<div class="max-w-5xl mx-auto">
			{@render children()}
		</div>
	</main>
</div>
