import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const session = await locals.getSession();
	if (!session) return json({ error: 'Unauthorized.' }, { status: 401 });

	const { winningOutcomeId } = await request.json();

	if (!winningOutcomeId) {
		return json({ error: 'Winning outcome is required.' }, { status: 400 });
	}

	const { data, error } = await locals.supabase.rpc('settle_market', {
		p_market_id: params.id,
		p_winning_outcome_id: winningOutcomeId,
		p_caller_id: session.user.id
	});

	if (error) return json({ error: error.message }, { status: 500 });

	const result = data as { success?: boolean; error?: string; rake?: number; net_pool?: number };
	if (result.error) return json({ error: result.error }, { status: 400 });

	return json({ success: true, rake: result.rake, netPool: result.net_pool });
};
