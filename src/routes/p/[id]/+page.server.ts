import { error } from '@sveltejs/kit';
import { getPublicOrigin } from '#lib/server/public-origin.js';
import { getPoll } from '#lib/server/polls.js';
import { getSessionHash } from '#lib/server/session.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, params, url }) => {
	const snapshot = await getPoll(params.id);
	if (!snapshot) error(404, 'Poll not found or expired.');

	const sessionHash = getSessionHash(cookies);

	return {
		poll: snapshot.poll,
		canManage: Boolean(sessionHash && sessionHash === snapshot.ownerSessionHash),
		shareUrl: `${getPublicOrigin(url)}/p/${snapshot.poll.id}`
	};
};
