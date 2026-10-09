import { checkDatabase } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		await checkDatabase();
		return new Response(null, { status: 204 });
	} catch {
		return new Response(null, { status: 503 });
	}
};
