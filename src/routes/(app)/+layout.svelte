<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { session } from '$lib/stores/auth';
	import { formatBalance } from '$lib/utils';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { children, data } = $props();

	session.set(data.session);

	let menuOpen = $state(false);

	// Close sidebar on route change (mobile)
	$effect(() => {
		$page.url.pathname;
		menuOpen = false;
	});

	async function handleLogout() {
		await supabase.auth.signOut();
		goto('/');
	}

	function isActive(href: string) {
		return (
			$page.url.pathname === href || $page.url.pathname.startsWith(href + '/')
		);
	}

	const navItems = [
		{ href: '/dashboard', label: 'DASHBOARD' },
		{ href: '/market', label: 'MARKETS' },
		{ href: '/leaderboard', label: 'LEADERBOARD' },
		{ href: '/profile', label: 'PROFILE' }
	];
</script>

<!-- Mobile overlay -->
{#if menuOpen}
	<div
		class="fixed inset-0 bg-black/60 z-40 lg:hidden"
		onclick={() => (menuOpen = false)}
		role="presentation"
	></div>
{/if}

<!-- Sidebar -->
<aside
	class="fixed top-0 left-0 h-full w-60 bg-surface-1 border-r border-surface-3 z-50
		flex flex-col transition-transform duration-200 ease-in-out
		{menuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0"
>
	<!-- Logo -->
	<div class="h-14 flex items-center px-4 border-b border-surface-3 shrink-0">
		<a href="/dashboard" class="font-pixel text-pixel-xs text-forked-green hover:text-forked-green-light transition-colors">
			FORKED.GG
		</a>
	</div>

	<!-- Nav links -->
	<nav class="flex-1 overflow-y-auto p-3 space-y-0.5">
		{#each navItems as item}
			<a
				href={item.soon ? undefined : item.href}
				class="flex items-center justify-between px-3 py-2.5 rounded-retro text-xs font-mono transition-colors
					{isActive(item.href) && !item.soon
						? 'bg-surface-3 text-text-primary shadow-retro-sm'
						: 'text-text-muted hover:bg-surface-2 hover:text-text-secondary'}
					{item.soon ? 'opacity-40 cursor-not-allowed' : ''}"
				aria-disabled={item.soon}
			>
				{item.label}
				{#if item.soon}
					<span class="badge-pending text-pixel-xs font-pixel px-1 py-0">SOON</span>
				{/if}
			</a>
		{/each}

		{#if data.profile?.role === 'streamer' || data.profile?.role === 'admin'}
			<a
				class="flex items-center justify-between px-3 py-2.5 rounded-retro text-xs font-mono
					opacity-40 cursor-not-allowed text-text-muted"
				aria-disabled="true"
			>
				OVERLAY
				<span class="badge-pending text-pixel-xs font-pixel px-1 py-0">SOON</span>
			</a>
		{/if}

		{#if data.profile?.role === 'admin'}
			<div class="pt-2 pb-1">
				<p class="px-3 text-text-muted text-pixel-xs font-pixel mb-1">ADMIN</p>
			</div>
			<a
				href="/admin"
				class="flex items-center px-3 py-2.5 rounded-retro text-xs font-mono transition-colors
					{$page.url.pathname === '/admin'
						? 'bg-surface-3 text-text-primary shadow-retro-sm'
						: 'text-text-muted hover:bg-surface-2 hover:text-text-secondary'}"
			>
				USERS
			</a>
			<a
				href="/admin/analytics"
				class="flex items-center px-3 py-2.5 rounded-retro text-xs font-mono transition-colors
					{isActive('/admin/analytics')
						? 'bg-surface-3 text-text-primary shadow-retro-sm'
						: 'text-text-muted hover:bg-surface-2 hover:text-text-secondary'}"
			>
				ANALYTICS
			</a>
		{/if}
	</nav>

	<!-- User info + logout -->
	<div class="p-3 border-t border-surface-3 space-y-3 shrink-0">
		<!-- Balance chip -->
		<div class="px-3 py-2 bg-surface-2 rounded-retro border border-surface-3 flex items-center justify-between">
			<span class="text-text-muted text-xs font-mono">Balance</span>
			<span class="font-pixel text-pixel-xs text-forked-green">
				{formatBalance(data.profile?.play_balance ?? 0)}
			</span>
		</div>

		<!-- User identity -->
		<div class="flex items-center gap-2 px-1">
			{#if data.profile?.avatar_url}
				<img
					src={data.profile.avatar_url}
					alt={data.profile.display_name}
					class="w-7 h-7 rounded-retro border border-surface-4 object-cover shrink-0"
				/>
			{:else}
				<div
					class="w-7 h-7 rounded-retro border border-surface-4 bg-surface-3 flex items-center justify-center shrink-0"
				>
					<span class="font-pixel text-pixel-xs text-text-muted">
						{data.profile?.display_name?.charAt(0).toUpperCase() ?? '?'}
					</span>
				</div>
			{/if}
			<div class="min-w-0 flex-1">
				<p class="text-text-primary text-xs font-sans truncate leading-tight">
					{data.profile?.display_name ?? ''}
				</p>
				<p class="text-text-muted text-xs font-mono truncate leading-tight">
					@{data.profile?.username ?? ''}
				</p>
			</div>
		</div>

		<button onclick={handleLogout} class="btn-secondary w-full text-xs text-center py-1.5">
			LOG OUT
		</button>
	</div>
</aside>

<!-- Page wrapper (offset by sidebar on desktop) -->
<div class="lg:pl-60 min-h-screen flex flex-col">
	<!-- Top bar -->
	<header
		class="h-14 sticky top-0 z-30 bg-surface border-b border-surface-3
			flex items-center justify-between px-4"
	>
		<!-- Hamburger (mobile only) -->
		<button
			onclick={() => (menuOpen = !menuOpen)}
			class="lg:hidden p-1.5 rounded-retro text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
			aria-label="Toggle menu"
		>
			<svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
				<rect y="2" width="18" height="2" rx="1" />
				<rect y="8" width="18" height="2" rx="1" />
				<rect y="14" width="18" height="2" rx="1" />
			</svg>
		</button>

		<!-- Mobile logo -->
		<span class="lg:hidden font-pixel text-pixel-xs text-forked-green">FORKED.GG</span>

		<!-- Right side: balance (mobile) -->
		<span class="lg:hidden font-pixel text-pixel-xs text-forked-green">
			{formatBalance(data.profile?.play_balance ?? 0)}
		</span>

		<!-- Desktop: page breadcrumb or empty -->
		<div class="hidden lg:block"></div>
	</header>

	<!-- Main content -->
	<main class="flex-1 px-4 py-6 md:px-8 md:py-8">
		{@render children()}
	</main>
</div>
