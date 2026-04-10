import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

function generateCode(): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let code = '';
	for (let i = 0; i < 10; i++) {
		code += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return code;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await locals.getSession();
	if (!session) return json({ error: 'Unauthorized.' }, { status: 401 });

	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('role')
		.eq('id', session.user.id)
		.single();

	if (profile?.role !== 'admin') {
		return json({ error: 'Access denied.' }, { status: 403 });
	}

	const body = await request.json();
	const quantity = Math.min(Math.max(parseInt(String(body.quantity ?? 1), 10), 1), 20);

	const codes = Array.from({ length: quantity }, () => ({
		code: generateCode(),
		created_by: session.user.id
	}));

	const { data, error } = await locals.supabase
		.from('creator_invite_codes')
		.insert(codes)
		.select('code');

	if (error) return json({ error: error.message }, { status: 500 });

	return json({ codes: data.map((r) => r.code) });
};
