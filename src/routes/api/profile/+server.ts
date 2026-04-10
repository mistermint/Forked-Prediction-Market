import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, locals }) => {
	const session = await locals.getSession();
	if (!session) return json({ error: 'Unauthorized.' }, { status: 401 });

	const body = await request.json();
	const { display_name, username } = body;

	const updates: Record<string, string> = {};

	if (display_name !== undefined) {
		const trimmed = String(display_name).trim();
		if (trimmed.length < 1 || trimmed.length > 50) {
			return json({ error: 'Display name must be 1–50 characters.' }, { status: 400 });
		}
		updates.display_name = trimmed;
	}

	if (username !== undefined) {
		const trimmed = String(username).trim().toLowerCase();
		if (!/^[a-z0-9_]{3,30}$/.test(trimmed)) {
			return json(
				{ error: 'Username must be 3–30 characters: letters, numbers, underscores only.' },
				{ status: 400 }
			);
		}

		// Check uniqueness
		const { data: existing } = await locals.supabase
			.from('profiles')
			.select('id')
			.eq('username', trimmed)
			.neq('id', session.user.id)
			.single();

		if (existing) {
			return json({ error: 'Username is already taken.' }, { status: 409 });
		}

		updates.username = trimmed;
	}

	if (Object.keys(updates).length === 0) {
		return json({ error: 'No fields to update.' }, { status: 400 });
	}

	const { data, error } = await locals.supabase
		.from('profiles')
		.update(updates)
		.eq('id', session.user.id)
		.select('username, display_name, avatar_url')
		.single();

	if (error) return json({ error: error.message }, { status: 500 });

	return json({ success: true, profile: data });
};
