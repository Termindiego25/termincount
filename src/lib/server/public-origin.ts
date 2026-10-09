export function getPublicOrigin(requestUrl: URL): string {
	const configured = process.env.ORIGIN?.trim();
	if (!configured) return requestUrl.origin;
	const url = new URL(configured);
	if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
		url.pathname !== '/' || url.search || url.hash) {
		throw new Error('ORIGIN must be an HTTP(S) origin without credentials, path, query, or fragment.');
	}
	return url.origin;
}
