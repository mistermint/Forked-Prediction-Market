import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	const marketId = url.searchParams.get('market');

	if (!marketId) return { market: null };

	const { data: market } = await locals.supabase
		.from('markets')
		.select('*, outcomes(*)')
		.eq('id', marketId)
		.in('status', ['open', 'locked', 'settled'])
		.single();

	if (market?.outcomes) {
		market.outcomes.sort(
			(a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
		);
	}

	return { market: market ?? null };
};
