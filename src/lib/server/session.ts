import { createHash, randomBytes } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';

const cookieName = 'tc_session';
const tokenBytes = 32;
const sessionMaxAgeSeconds = 60 * 60 * 24 * 400;

function isValidToken(value: string | undefined): value is string {
	return Boolean(value && /^[A-Za-z0-9_-]{32,128}$/.test(value));
}

function createToken(): string {
	return randomBytes(tokenBytes).toString('base64url');
}

export function hashSessionToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

export function getSessionHash(cookies: Cookies): string | null {
	const token = cookies.get(cookieName);
	return isValidToken(token) ? hashSessionToken(token) : null;
}

export function ensureSessionHash(cookies: Cookies, secure: boolean): string {
	const existing = cookies.get(cookieName);
	const token = isValidToken(existing) ? existing : createToken();

	if (token !== existing) {
		cookies.set(cookieName, token, {
			httpOnly: true,
			path: '/',
			sameSite: 'strict',
			secure,
			maxAge: sessionMaxAgeSeconds
		});
	}

	return hashSessionToken(token);
}
