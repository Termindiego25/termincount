import { error } from '@sveltejs/kit';
import { getPoll } from '$lib/server/polls';
import { getSessionHash } from '$lib/server/session';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, params, url }) => {
	const snapshot = await getPoll(params.id);
	if (!snapshot) error(404, 'Poll not found or expired.');

	const sessionHash = getSessionHash(cookies);

	return {
		poll: snapshot.poll,
		canManage: Boolean(sessionHash && sessionHash === snapshot.ownerSessionHash),
		shareUrl: `${url.origin}/p/${snapshot.poll.id}`
	};
};
