<script lang="ts">
	let { children } = $props();
</script>

<div class="min-h-screen flex items-center justify-center px-4 py-12">
	<div class="w-full max-w-sm space-y-8">
		<div class="text-center">
			<a href="/" class="font-pixel text-pixel-base text-forked-green hover:text-forked-green-light transition-colors">
				FORKED.GG
			</a>
		</div>
		{@render children()}
	</div>
</div>
