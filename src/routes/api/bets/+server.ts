import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await locals.getSession();
	if (!session) return json({ error: 'Unauthorized.' }, { status: 401 });

	const body = await request.json();
	const { marketId, outcomeId, amount } = body;

	if (!marketId || !outcomeId) {
		return json({ error: 'Missing market or outcome.' }, { status: 400 });
	}

	const numericAmount = parseInt(String(amount), 10);
	if (isNaN(numericAmount) || numericAmount < 10) {
		return json({ error: 'Minimum bet is 10 coins.' }, { status: 400 });
	}

	// Delegate to the atomic PG function
	const { data, error } = await locals.supabase.rpc('place_bet', {
		p_user_id: session.user.id,
		p_market_id: marketId,
		p_outcome_id: outcomeId,
		p_amount: numericAmount
	});

	if (error) return json({ error: error.message }, { status: 500 });

	const result = data as { success?: boolean; error?: string };
	if (result.error) return json({ error: result.error }, { status: 400 });

	return json({ success: true });
};
