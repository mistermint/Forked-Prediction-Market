import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await locals.getSession();
	if (!session) return json({ error: 'Unauthorized.' }, { status: 401 });

	const formData = await request.formData();
	const file = formData.get('avatar');

	if (!(file instanceof File)) {
		return json({ error: 'No file provided.' }, { status: 400 });
	}

	if (!ALLOWED_TYPES.includes(file.type)) {
		return json({ error: 'File must be JPEG, PNG, WebP, or GIF.' }, { status: 400 });
	}

	if (file.size > MAX_SIZE) {
		return json({ error: 'File must be under 2MB.' }, { status: 400 });
	}

	const ext = file.type.split('/')[1].replace('jpeg', 'jpg');
	const path = `${session.user.id}/avatar.${ext}`;

	const arrayBuffer = await file.arrayBuffer();
	const { error: uploadError } = await locals.supabase.storage
		.from('avatars')
		.upload(path, arrayBuffer, { contentType: file.type, upsert: true });

	if (uploadError) return json({ error: uploadError.message }, { status: 500 });

	const { data: urlData } = locals.supabase.storage.from('avatars').getPublicUrl(path);
	const avatarUrl = urlData.publicUrl + `?t=${Date.now()}`;

	const { error: updateError } = await locals.supabase
		.from('profiles')
		.update({ avatar_url: avatarUrl })
		.eq('id', session.user.id);

	if (updateError) return json({ error: updateError.message }, { status: 500 });

	return json({ success: true, avatarUrl });
};
