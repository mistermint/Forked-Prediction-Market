import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await locals.getSession();
	if (!session) return json({ error: 'Unauthorized.' }, { status: 401 });

	const { code } = await request.json();
	if (!code || typeof code !== 'string') {
		return json({ error: 'Code is required.' }, { status: 400 });
	}

	// Check user's current role
	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('role')
		.eq('id', session.user.id)
		.single();

	if (!profile) return json({ error: 'Profile not found.' }, { status: 404 });

	if (profile.role === 'streamer' || profile.role === 'admin') {
		return json({ error: 'You already have creator access.' }, { status: 400 });
	}

	// Look up the code
	const { data: invite } = await locals.supabase
		.from('creator_invite_codes')
		.select('id, redeemed_by')
		.eq('code', code.toUpperCase().trim())
		.single();

	if (!invite) {
		return json({ error: 'Invalid invite code.' }, { status: 404 });
	}

	if (invite.redeemed_by) {
		return json({ error: 'This code has already been used.' }, { status: 409 });
	}

	// Mark redeemed and upgrade role atomically
	const [{ error: codeError }, { error: roleError }] = await Promise.all([
		locals.supabase
			.from('creator_invite_codes')
			.update({ redeemed_by: session.user.id, redeemed_at: new Date().toISOString() })
			.eq('id', invite.id),
		locals.supabase
			.from('profiles')
			.update({ role: 'streamer' })
			.eq('id', session.user.id)
	]);

	if (codeError || roleError) {
		return json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
	}

	return json({ success: true });
};
