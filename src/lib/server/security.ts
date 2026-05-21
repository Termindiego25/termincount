import { error, type RequestEvent } from '@sveltejs/kit';

export function assertSameOrigin(event: RequestEvent): void {
	const origin = event.request.headers.get('origin');
	if (origin && origin !== event.url.origin) {
		error(403, 'Cross-origin requests are not allowed.');
	}
}
