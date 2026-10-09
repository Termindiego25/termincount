import { getPublicOrigin } from '../src/lib/server/public-origin.ts';

let configuredOrigin;
if (process.env.ORIGIN?.trim()) {
	configuredOrigin = new URL(getPublicOrigin(new URL('http://localhost')));
	process.env.PROTOCOL_HEADER = 'x-termincount-protocol';
	process.env.HOST_HEADER = 'x-termincount-host';
	process.env.PORT_HEADER = '';
}

const { server } = await import('../build/index.js');
if (configuredOrigin) {
	// Keep runtime ORIGIN without trusting origin headers supplied by clients.
	server.prependListener('request', (request) => {
		request.headers['x-termincount-protocol'] = configuredOrigin.protocol.slice(0, -1);
		request.headers['x-termincount-host'] = configuredOrigin.host;
	});
}
