import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const session = await locals.getSession();

	if (!session) {
		redirect(303, '/login');
	}

	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('role')
		.eq('id', session.user.id)
		.single();

	if (profile?.role !== 'admin') {
		error(403, 'Access denied.');
	}
};
