import { error, json } from '@sveltejs/kit';
import { recordVote } from '$lib/server/polls';
import { assertSameOrigin } from '$lib/server/security';
import { getSessionHash } from '$lib/server/session';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	assertSameOrigin(event);

	const sessionHash = getSessionHash(event.cookies);
	if (!sessionHash) error(403, 'This session cannot modify the poll.');

	const body = await event.request.json().catch(() => null);
	const index = Number.parseInt(String((body as { index?: unknown } | null)?.index ?? ''), 10);
	if (!Number.isInteger(index)) error(400, 'Invalid vote option.');

	const poll = await recordVote(event.params.id, index, sessionHash);
	return json({ poll });
};
