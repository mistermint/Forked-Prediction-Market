import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const tab = (url.searchParams.get('tab') ?? 'open') as 'open' | 'locked' | 'settled';

	const statusMap: Record<string, string[]> = {
		open: ['open'],
		locked: ['locked'],
		settled: ['settled']
	};
	const statuses = statusMap[tab] ?? ['open'];

	const { data: markets } = await locals.supabase
		.from('markets')
		.select('*, outcomes!market_id(*), creator:profiles!creator_id(username)')
		.in('status', statuses)
		.order('created_at', { ascending: false });

	return { markets: markets ?? [], tab };
};
