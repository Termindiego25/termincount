import { getPoll } from '$lib/server/polls';
import { ensureRealtimeListener, subscribeToPoll } from '$lib/server/realtime';
import type { RequestHandler } from './$types';

const encoder = new TextEncoder();

export const GET: RequestHandler = async ({ params, request }) => {
	await ensureRealtimeListener();

	const stream = new ReadableStream({
		async start(controller) {
			let closed = false;

			const send = (event: string, data: unknown) => {
				if (closed) return;
				controller.enqueue(
					encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
				);
			};

			const sendSnapshot = async () => {
				const snapshot = await getPoll(params.id);
				if (!snapshot) {
					send('expired', { id: params.id });
					cleanup();
					return;
				}

				send('poll', snapshot.poll);
			};

			const unsubscribe = subscribeToPoll(params.id, () => {
				sendSnapshot().catch(() => cleanup());
			});

			const ping = setInterval(() => {
				if (!closed) controller.enqueue(encoder.encode(': ping\n\n'));
			}, 25_000);

			const cleanup = () => {
				if (closed) return;
				closed = true;
				clearInterval(ping);
				unsubscribe();
				request.signal.removeEventListener('abort', cleanup);
				try {
					controller.close();
				} catch {
					// The browser may already have closed the stream.
				}
			};

			request.signal.addEventListener('abort', cleanup);
			await sendSnapshot();
		}
	});

	return new Response(stream, {
		headers: {
			'content-type': 'text/event-stream; charset=utf-8',
			'cache-control': 'no-cache, no-transform',
			'x-accel-buffering': 'no'
		}
	});
};
