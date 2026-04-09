import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [{ data: markets }, { data: totals }] = await Promise.all([
		// Per-market rake breakdown
		locals.supabase
			.from('markets')
			.select('id, title, status, total_pool, rake_amount, created_at, creator:profiles!creator_id(username)')
			.eq('status', 'settled')
			.order('rake_amount', { ascending: false })
			.limit(50),

		// Aggregate stats
		locals.supabase
			.from('markets')
			.select('total_pool, rake_amount, status')
	]);

	const allMarkets = totals ?? [];
	const settled = allMarkets.filter((m) => m.status === 'settled');

	const stats = {
		totalMarkets: allMarkets.length,
		settledMarkets: settled.length,
		totalVolume: allMarkets.reduce((sum, m) => sum + (m.total_pool ?? 0), 0),
		totalRake: settled.reduce((sum, m) => sum + (m.rake_amount ?? 0), 0),
		openMarkets: allMarkets.filter((m) => m.status === 'open').length,
		lockedMarkets: allMarkets.filter((m) => m.status === 'locked').length
	};

	return { markets: markets ?? [], stats };
};
