import { ensureDatabase } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	await ensureDatabase();
	return new Response(null, { status: 204 });
};
