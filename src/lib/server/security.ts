import { error, isHttpError, type RequestEvent } from '@sveltejs/kit';
import { getPublicOrigin } from './public-origin';

export function assertSameOrigin(event: RequestEvent): void {
	const origin = event.request.headers.get('origin');
	if (origin !== getPublicOrigin(event.url)) {
		error(403, 'Cross-origin requests are not allowed.');
	}
}

export async function readJsonBody(request: Request): Promise<unknown> {
	if (Number(request.headers.get('content-length')) > 16 * 1024) error(413, 'Payload too large.');
	if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
		error(415, 'Expected a JSON request.');
	}
	try {
		return await request.json();
	} catch (caught) {
		if (isHttpError(caught)) throw caught;
		if (caught && typeof caught === 'object' && 'status' in caught && caught.status === 413) {
			error(413, 'Payload too large.');
		}
		error(400, 'Invalid JSON payload.');
	}
}
