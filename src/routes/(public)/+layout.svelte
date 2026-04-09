<script lang="ts">
	let { children } = $props();
</script>

<nav class="border-b border-surface-3 px-6 py-4">
	<div class="max-w-5xl mx-auto flex items-center justify-between gap-4">
		<a href="/" class="font-pixel text-pixel-base text-forked-green hover:text-forked-green-light transition-colors shrink-0">
			FORKED.GG
		</a>
		<div class="flex items-center gap-3 text-sm">
			<a href="/discover" class="text-text-muted font-mono hover:text-text-secondary transition-colors hidden sm:inline">Discover</a>
			<a href="/how-it-works" class="text-text-muted font-mono hover:text-text-secondary transition-colors hidden sm:inline">How It Works</a>
			<a href="/login" class="btn-secondary text-xs">Log In</a>
			<a href="/signup" class="btn-primary text-xs">Sign Up</a>
		</div>
	</div>
</nav>

{@render children()}
