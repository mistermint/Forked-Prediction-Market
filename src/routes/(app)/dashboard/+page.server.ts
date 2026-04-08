import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.getSession();

	const [{ data: markets }, { data: recentActivity }, { data: profileFull }] = await Promise.all([
		locals.supabase
			.from('markets')
			.select('*, outcomes(*), creator:profiles!creator_id(username)')
			.in('status', ['open', 'locked'])
			.order('created_at', { ascending: false })
			.limit(6),

		locals.supabase
			.from('activity')
			.select('*')
			.eq('user_id', session!.user.id)
			.order('created_at', { ascending: false })
			.limit(10),

		locals.supabase
			.from('profiles')
			.select('role')
			.eq('id', session!.user.id)
			.single()
	]);

	// Streamer analytics — only fetched if user is a streamer or admin
	let streamerStats = null;
	if (profileFull?.role === 'streamer' || profileFull?.role === 'admin') {
		const { data: createdMarkets } = await locals.supabase
			.from('markets')
			.select('id, title, status, total_pool, rake_amount, created_at')
			.eq('creator_id', session!.user.id)
			.order('created_at', { ascending: false })
			.limit(10);

		const all = createdMarkets ?? [];
		streamerStats = {
			markets: all,
			totalCreated: all.length,
			totalVolume: all.reduce((s, m) => s + m.total_pool, 0),
			totalRake: all.filter((m) => m.status === 'settled').reduce((s, m) => s + m.rake_amount, 0),
			openCount: all.filter((m) => m.status === 'open').length
		};
	}

	return {
		activeMarkets: markets ?? [],
		recentActivity: recentActivity ?? [],
		streamerStats
	};
};
