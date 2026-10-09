import { getPublicOrigin } from '#lib/server/public-origin.js';
import { createPoll, normalizeCreatePollPayload } from '#lib/server/polls.js';
import { assertSameOrigin, readJsonBody } from '#lib/server/security.js';
import { ensureSessionHash } from '#lib/server/session.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	assertSameOrigin(event);

	const payload = normalizeCreatePollPayload(await readJsonBody(event.request));
	const origin = getPublicOrigin(event.url);
	const ownerSessionHash = ensureSessionHash(event.cookies, origin.startsWith('https:'));
	const poll = await createPoll(payload, ownerSessionHash);

	return Response.json(
		{
			poll,
			url: `${origin}/p/${poll.id}`
		},
		{ status: 201 }
	);
};
