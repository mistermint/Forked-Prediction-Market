import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.getSession();

	const { data: profile, error: err } = await locals.supabase
		.from('profiles')
		.select('*')
		.eq('id', session!.user.id)
		.single();

	if (err || !profile) {
		error(500, 'Could not load profile.');
	}

	const provider = session!.user.app_metadata?.provider ?? 'email';

	return { profile, provider };
};
