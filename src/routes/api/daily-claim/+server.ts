import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const CLAIM_AMOUNT = 1000;
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export const POST: RequestHandler = async ({ locals }) => {
	const session = await locals.getSession();
	if (!session) return json({ error: 'Unauthorized.' }, { status: 401 });

	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('play_balance, last_daily_claim')
		.eq('id', session.user.id)
		.single();

	if (!profile) return json({ error: 'Profile not found.' }, { status: 404 });

	const now = new Date();

	if (profile.last_daily_claim) {
		const lastClaim = new Date(profile.last_daily_claim);
		const elapsed = now.getTime() - lastClaim.getTime();

		if (elapsed < COOLDOWN_MS) {
			const secondsRemaining = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
			return json({ error: 'Already claimed.', secondsRemaining }, { status: 429 });
		}
	}

	const newBalance = profile.play_balance + CLAIM_AMOUNT;
	const { error } = await locals.supabase
		.from('profiles')
		.update({ play_balance: newBalance, last_daily_claim: now.toISOString() })
		.eq('id', session.user.id);

	if (error) return json({ error: error.message }, { status: 500 });

	const nextClaimAt = new Date(now.getTime() + COOLDOWN_MS).toISOString();
	return json({ success: true, newBalance, nextClaimAt });
};
