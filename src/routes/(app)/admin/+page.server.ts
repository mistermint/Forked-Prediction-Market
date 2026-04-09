import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: users } = await locals.supabase
		.from('profiles')
		.select('id, username, display_name, avatar_url, role, play_balance, bet_balance, created_at')
		.order('created_at', { ascending: false });

	return { users: users ?? [] };
};
