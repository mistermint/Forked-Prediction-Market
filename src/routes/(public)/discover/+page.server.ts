import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: markets } = await locals.supabase
		.from('markets')
		.select('*, outcomes!market_id(*), creator:profiles!creator_id(username, display_name)')
		.in('status', ['open', 'locked'])
		.order('total_pool', { ascending: false })
		.limit(18);

	return { markets: markets ?? [] };
};
