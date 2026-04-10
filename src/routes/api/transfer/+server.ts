import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await locals.getSession();
	if (!session) return json({ error: 'Unauthorized.' }, { status: 401 });

	const body = await request.json();
	const { toUsername, amount } = body;

	if (!toUsername || typeof toUsername !== 'string') {
		return json({ error: 'Recipient username is required.' }, { status: 400 });
	}

	const numericAmount = parseInt(String(amount), 10);
	if (isNaN(numericAmount) || numericAmount <= 0) {
		return json({ error: 'Amount must be a positive number.' }, { status: 400 });
	}

	const cleanUsername = toUsername.replace(/^@/, '').trim().toLowerCase();

	const { error } = await locals.supabase.rpc('transfer_coins', {
		sender_id: session.user.id,
		recipient_username: cleanUsername,
		amount: numericAmount
	});

	if (error) {
		const msg = error.message.includes('not found')
			? 'User not found.'
			: error.message.includes('Insufficient')
				? 'Insufficient balance.'
				: error.message.includes('yourself')
					? 'You cannot send coins to yourself.'
					: 'Transfer failed. Please try again.';
		return json({ error: msg }, { status: 400 });
	}

	return json({ success: true });
};
