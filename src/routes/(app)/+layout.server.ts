import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const session = await locals.getSession();

	if (!session) {
		redirect(303, '/login');
	}

	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('username, display_name, avatar_url, role, play_balance, bet_balance')
		.eq('id', session.user.id)
		.single();

	return { session, profile };
};
