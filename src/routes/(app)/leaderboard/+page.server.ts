import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const session = await locals.getSession();
	const period = (url.searchParams.get('period') ?? 'all') as 'all' | 'monthly' | 'weekly';

	// For time-filtered periods, filter bets by created_at
	let query = locals.supabase
		.from('leaderboard_stats')
		.select('*')
		.order('net_profit', { ascending: false })
		.limit(100);

	// Note: time filtering on the view requires a different approach for weekly/monthly.
	// For MVP we use the global view for all periods and filter in JS.
	// A future optimisation is parameterised views or a function.
	const { data: entries } = await query;

	// For per-market leaderboard on the market detail, we use market_leaderboard view.
	// Here we just show global.

	return {
		entries: entries ?? [],
		period,
		currentUserId: session!.user.id
	};
};
