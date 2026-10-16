import './fetch-runtime.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { once } from 'node:events';
import test from 'node:test';
import * as undici from 'undici';

test('installs matching patched fetch, body and streaming web APIs', () => {
	for (const name of ['fetch', 'Headers', 'Request', 'Response', 'FormData', 'WebSocket', 'EventSource']) {
		assert.equal(globalThis[name], undici[name], name);
	}
});

test('validates integrity with lowercase and uppercase algorithm tokens', async () => {
	const body = 'TerminCount integrity fixture';
	const server = createServer((_request, response) => response.end(body));
	server.listen(0, '127.0.0.1');
	await once(server, 'listening');
	const url = `http://127.0.0.1:${server.address().port}`;
	const digest = createHash('sha256').update(body).digest('base64');
	const mismatch = Buffer.alloc(32).toString('base64');
	try {
		for (const algorithm of ['sha256', 'SHA256']) {
			const response = await fetch(url, {
				integrity: `${algorithm}-${digest}`,
				signal: AbortSignal.timeout(5_000)
			});
			assert.equal(await response.text(), body);
			await assert.rejects(fetch(url, {
				integrity: `${algorithm}-${mismatch}`,
				signal: AbortSignal.timeout(5_000)
			}), TypeError);
		}
	} finally {
		server.closeAllConnections();
		await new Promise((resolve) => server.close(resolve));
	}
});
