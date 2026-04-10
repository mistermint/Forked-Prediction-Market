import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const session = await locals.getSession();

	const [
		{ data: market, error: marketError },
		{ data: userBet },
		{ data: recentActivity }
	] = await Promise.all([
		locals.supabase
			.from('markets')
			.select('*, outcomes(*), creator:profiles!creator_id(id, username, display_name)')
			.eq('id', params.id)
			.single(),

		locals.supabase
			.from('bets')
			.select('*')
			.eq('market_id', params.id)
			.eq('user_id', session?.user.id ?? '')
			.maybeSingle(),

		locals.supabase
			.from('activity')
			.select('*, profile:profiles!user_id(username, display_name, avatar_url)')
			.eq('market_id', params.id)
			.order('created_at', { ascending: false })
			.limit(20)
	]);

	if (marketError) {
		// PGRST116 = 0 rows from .single() → legitimate 404
		if (marketError.code !== 'PGRST116') {
			console.error('[market/[id]] query error:', JSON.stringify(marketError));
			error(500, `Failed to load market: ${marketError.message}`);
		}
	}
	if (!market) error(404, 'Market not found.');

	// Sort outcomes by sort_order
	if (market.outcomes) {
		market.outcomes.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);
	}

	return {
		market,
		userBet: userBet ?? null,
		recentActivity: recentActivity ?? []
	};
};
