import type { Handle } from '@sveltejs/kit/hooks';
import { closeDatabase } from '#lib/server/db.js';
import { closeRealtimeListener } from '#lib/server/realtime.js';

process.once('sveltekit:shutdown', async () => {
	await closeRealtimeListener();
	await closeDatabase();
});

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	response.headers.set('x-content-type-options', 'nosniff');
	response.headers.set('referrer-policy', 'same-origin');
	if (!response.headers.has('cache-control')) response.headers.set('cache-control', 'private, no-store');
	if (event.url.pathname.startsWith('/p/') || event.url.pathname.startsWith('/api/')) {
		response.headers.set('x-robots-tag', 'noindex, nofollow');
	}
	return response;
};
