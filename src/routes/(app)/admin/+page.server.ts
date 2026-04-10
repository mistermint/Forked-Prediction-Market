import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [{ data: users }, { data: inviteCodes }] = await Promise.all([
		locals.supabase
			.from('profiles')
			.select('id, username, display_name, avatar_url, role, play_balance, bet_balance, created_at')
			.order('created_at', { ascending: false }),

		locals.supabase
			.from('creator_invite_codes')
			.select('id, code, created_at, redeemed_at, redeemed_by, redeemer:profiles!redeemed_by(username)')
			.order('created_at', { ascending: false })
	]);

	return {
		users: users ?? [],
		inviteCodes: inviteCodes ?? []
	};
};
