import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await locals.getSession();
	if (!session) return json({ error: 'Unauthorized.' }, { status: 401 });

	// Only streamers and admins can create markets
	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('role')
		.eq('id', session.user.id)
		.single();

	if (!profile || !['streamer', 'admin'].includes(profile.role)) {
		return json({ error: 'Only streamers can create markets.' }, { status: 403 });
	}

	const body = await request.json();
	const { title, description, outcomes, lockMinutes } = body;

	if (!title || typeof title !== 'string' || title.trim().length < 5) {
		return json({ error: 'Title must be at least 5 characters.' }, { status: 400 });
	}

	const outcomeLabels: string[] = Array.isArray(outcomes) ? outcomes : [];
	if (outcomeLabels.length < 2) {
		return json({ error: 'At least 2 outcomes are required.' }, { status: 400 });
	}
	if (outcomeLabels.length > 10) {
		return json({ error: 'Maximum 10 outcomes allowed.' }, { status: 400 });
	}
	for (const label of outcomeLabels) {
		if (!label || typeof label !== 'string' || label.trim().length === 0) {
			return json({ error: 'All outcomes must have a label.' }, { status: 400 });
		}
	}

	const lockAt =
		lockMinutes && typeof lockMinutes === 'number' && lockMinutes > 0
			? new Date(Date.now() + lockMinutes * 60 * 1000).toISOString()
			: null;

	// Create market
	const { data: market, error: marketErr } = await locals.supabase
		.from('markets')
		.insert({
			creator_id: session.user.id,
			title: title.trim(),
			description: description?.trim() || null,
			status: 'open',
			pool_type: 'play',
			lock_at: lockAt
		})
		.select()
		.single();

	if (marketErr || !market) {
		return json({ error: 'Failed to create market.' }, { status: 500 });
	}

	// Insert outcomes
	const { error: outcomesErr } = await locals.supabase.from('outcomes').insert(
		outcomeLabels.map((label, i) => ({
			market_id: market.id,
			label: label.trim(),
			sort_order: i
		}))
	);

	if (outcomesErr) {
		// Clean up orphaned market
		await locals.supabase.from('markets').delete().eq('id', market.id);
		return json({ error: 'Failed to create outcomes.' }, { status: 500 });
	}

	// Activity: market created
	await locals.supabase.from('activity').insert({
		user_id: session.user.id,
		market_id: market.id,
		type: 'market_created',
		metadata: { market_title: market.title }
	});

	return json({ success: true, marketId: market.id });
};
