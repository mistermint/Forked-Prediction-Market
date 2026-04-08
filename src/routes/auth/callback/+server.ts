import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Handles the OAuth redirect from Supabase (Google SSO, etc.)
// Set the redirect URL in Supabase Dashboard → Authentication → URL Configuration:
//   http://localhost:5173/auth/callback  (development)
//   https://forked.gg/auth/callback      (production)
export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') ?? '/dashboard';

	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			redirect(303, next);
		}
	}

	// Something went wrong — send them back to login with an error flag
	redirect(303, '/login?error=auth');
};
