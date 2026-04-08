import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { email } = await request.json();

	if (!email || typeof email !== 'string') {
		return json({ error: 'Email is required.' }, { status: 400 });
	}

	const normalized = email.trim().toLowerCase();
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(normalized)) {
		return json({ error: 'Please enter a valid email address.' }, { status: 400 });
	}

	const { error } = await supabase.from('waitlist').insert({ email: normalized });

	if (error) {
		if (error.code === '23505') {
			// Unique violation — already on the list
			return json({ error: "You're already on the list!" }, { status: 409 });
		}
		return json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
	}

	return json({ success: true });
};
