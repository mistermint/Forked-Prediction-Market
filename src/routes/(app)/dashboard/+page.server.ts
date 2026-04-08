import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.getSession();

	const [{ data: markets }, { data: recentActivity }] = await Promise.all([
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
			.limit(10)
	]);

	return {
		activeMarkets: markets ?? [],
		recentActivity: recentActivity ?? []
	};
};
