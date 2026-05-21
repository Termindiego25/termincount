import { error, json } from '@sveltejs/kit';
import { undoLastVote } from '$lib/server/polls';
import { assertSameOrigin } from '$lib/server/security';
import { getSessionHash } from '$lib/server/session';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	assertSameOrigin(event);

	const sessionHash = getSessionHash(event.cookies);
	if (!sessionHash) error(403, 'This session cannot modify the poll.');

	const poll = await undoLastVote(event.params.id, sessionHash);
	return json({ poll });
};
