import { error, json } from '@sveltejs/kit';
import { recordVote } from '$lib/server/polls';
import { assertSameOrigin, readJsonBody } from '$lib/server/security';
import { getSessionHash } from '$lib/server/session';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	assertSameOrigin(event);

	const sessionHash = getSessionHash(event.cookies);
	if (!sessionHash) error(403, 'This session cannot modify the poll.');

	const body = await readJsonBody(event.request);
	const index = (body as { index?: unknown } | null)?.index;
	if (typeof index !== 'number' || !Number.isInteger(index) || index < 0 || index >= 9) {
		error(400, 'Invalid vote option.');
	}

	const poll = await recordVote(event.params.id, index, sessionHash);
	return json({ poll });
};
