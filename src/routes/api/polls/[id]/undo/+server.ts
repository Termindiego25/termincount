import { error } from '@sveltejs/kit';
import { undoLastVote } from '#lib/server/polls.js';
import { assertSameOrigin, getMutationKey } from '#lib/server/security.js';
import { getSessionHash } from '#lib/server/session.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	assertSameOrigin(event);

	const sessionHash = getSessionHash(event.cookies);
	if (!sessionHash) error(403, 'This session cannot modify the poll.');

	const poll = await undoLastVote(event.params.id, sessionHash, getMutationKey(event.request));
	return Response.json({ poll });
};
