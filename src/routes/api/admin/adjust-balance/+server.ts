import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await locals.getSession();
	if (!session) return json({ error: 'Unauthorized.' }, { status: 401 });

	// Verify the requesting user is an admin
	const { data: requestingProfile } = await locals.supabase
		.from('profiles')
		.select('role')
		.eq('id', session.user.id)
		.single();

	if (requestingProfile?.role !== 'admin') {
		return json({ error: 'Access denied.' }, { status: 403 });
	}

	const body = await request.json();
	const { userId, balanceType, mode, amount } = body;

	if (!userId || !balanceType || !mode || amount === undefined) {
		return json({ error: 'Missing required fields.' }, { status: 400 });
	}

	if (!['play', 'bet'].includes(balanceType)) {
		return json({ error: 'Invalid balance type.' }, { status: 400 });
	}

	if (!['add', 'set'].includes(mode)) {
		return json({ error: 'Invalid mode.' }, { status: 400 });
	}

	const numericAmount = parseInt(String(amount), 10);
	if (isNaN(numericAmount)) {
		return json({ error: 'Amount must be a number.' }, { status: 400 });
	}

	const column = balanceType === 'play' ? 'play_balance' : 'bet_balance';

	if (mode === 'set') {
		if (numericAmount < 0) {
			return json({ error: 'Absolute balance cannot be negative.' }, { status: 400 });
		}

		const { error } = await locals.supabase
			.from('profiles')
			.update({ [column]: numericAmount })
			.eq('id', userId);

		if (error) return json({ error: error.message }, { status: 500 });
	} else {
		// Add mode: fetch current balance then compute new value
		const { data: target, error: fetchErr } = await locals.supabase
			.from('profiles')
			.select(column)
			.eq('id', userId)
			.single();

		if (fetchErr || !target) return json({ error: 'User not found.' }, { status: 404 });

		const current = target[column] as number;
		const updated = current + numericAmount;

		if (updated < 0) {
			return json({ error: `Balance cannot go below 0. Current: ${current}.` }, { status: 400 });
		}

		const { error } = await locals.supabase
			.from('profiles')
			.update({ [column]: updated })
			.eq('id', userId);

		if (error) return json({ error: error.message }, { status: 500 });
	}

	return json({ success: true });
};
