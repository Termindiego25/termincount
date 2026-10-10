import type { Handle } from '@sveltejs/kit/hooks';
import { dev } from '$app/env';
import { closeDatabase } from '#lib/server/db.js';
import { closeRealtimeListener } from '#lib/server/realtime.js';

let realtimeShutdown: Promise<void> | undefined;
const stopRealtime = () => realtimeShutdown ??= closeRealtimeListener();
if (!dev) {
	for (const signal of ['SIGTERM', 'SIGINT'] as const) {
		// Close streams before HTTP draining, without accumulating handlers during Vite HMR.
		process.once(signal, () => {
			void stopRealtime().catch((error) => console.error('Realtime shutdown failed', error.message));
		});
	}
	process.once('sveltekit:shutdown', async () => {
		await stopRealtime();
		await closeDatabase();
	});
}

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
