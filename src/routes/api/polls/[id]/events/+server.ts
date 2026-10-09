import { error } from '@sveltejs/kit';
import { getPoll } from '$lib/server/polls';
import { ensureRealtimeListener, refreshPoll, subscribeToPoll } from '$lib/server/realtime';
import type { RequestHandler } from './$types';

const encoder = new TextEncoder();

export const GET: RequestHandler = async ({ params, request }) => {
	const snapshot = await getPoll(params.id);
	if (!snapshot) error(404, 'Poll not found or expired.');
	try {
		await ensureRealtimeListener();
	} catch {
		return new Response(null, { status: 503, headers: { 'retry-after': '3' } });
	}
	let cleanup = () => {};
	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			let closed = false;
			const send = (message: string) => {
				if (closed) return;
				if ((controller.desiredSize ?? 0) <= 0) { cleanup(); return; }
				try { controller.enqueue(encoder.encode(message)); }
				catch { cleanup(); }
			};
			const unsubscribe = subscribeToPoll(params.id, {
				update: (poll) => {
					if (poll) send(`event: poll\ndata: ${JSON.stringify(poll)}\n\n`);
					else {
						send(`event: expired\ndata: ${JSON.stringify({ id: params.id })}\n\n`);
						cleanup();
					}
				},
				disconnect: () => cleanup()
			});
			const ping = setInterval(() => {
				if (Date.now() >= Date.parse(snapshot.poll.expiresAt)) {
					send(`event: expired\ndata: ${JSON.stringify({ id: params.id })}\n\n`);
					cleanup();
				} else send(': ping\n\n');
			}, 25_000);
			cleanup = () => {
				if (closed) return;
				closed = true;
				clearInterval(ping);
				unsubscribe();
				request.signal.removeEventListener('abort', cleanup);
				try { controller.close(); }
				catch { /* The browser may have already canceled the response. */ }
			};
			request.signal.addEventListener('abort', cleanup, { once: true });
			if (request.signal.aborted) cleanup();
			else void refreshPoll(params.id);
		},
		cancel() { cleanup(); }
	});
	return new Response(stream, {
		headers: {
			'content-type': 'text/event-stream; charset=utf-8',
			'cache-control': 'private, no-store, no-transform',
			'x-accel-buffering': 'no'
		}
	});
};
