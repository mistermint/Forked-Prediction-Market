<script lang="ts">
	let { children } = $props();
</script>

<!-- Subtle grid background -->
<div class="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
	<!-- Background grid pattern -->
	<div class="absolute inset-0 opacity-[0.03]" style="background-image: linear-gradient(#8BA446 1px, transparent 1px), linear-gradient(90deg, #8BA446 1px, transparent 1px); background-size: 32px 32px;"></div>

	<!-- Subtle glow -->
	<div class="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-forked-green/5 rounded-full blur-3xl pointer-events-none"></div>

	<div class="w-full max-w-sm space-y-8 relative z-10">
		<!-- Logo -->
		<div class="text-center space-y-2">
			<a href="/" class="font-pixel text-pixel-base text-forked-green hover:text-forked-green-light transition-colors inline-block">
				FORKED.GG
			</a>
			<p class="text-text-muted text-xs font-mono">Streamer Prediction Markets</p>
		</div>

		{@render children()}
	</div>
</div>
