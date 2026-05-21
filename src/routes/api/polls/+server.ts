import { json } from '@sveltejs/kit';
import { createPoll, normalizeCreatePollPayload } from '$lib/server/polls';
import { assertSameOrigin } from '$lib/server/security';
import { ensureSessionHash } from '$lib/server/session';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	assertSameOrigin(event);

	const payload = normalizeCreatePollPayload(await event.request.json().catch(() => null));
	const ownerSessionHash = ensureSessionHash(event.cookies, event.url.protocol === 'https:');
	const poll = await createPoll(payload, ownerSessionHash);

	return json(
		{
			poll,
			url: `${event.url.origin}/p/${poll.id}`
		},
		{ status: 201 }
	);
};
