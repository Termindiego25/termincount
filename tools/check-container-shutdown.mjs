import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const [container, origin] = process.argv.slice(2);
if (!['termincount-ci', 'termincount_compose_review_app'].includes(container)) {
	throw new Error('Only dedicated TerminCount test containers may be stopped.');
}
const base = new URL(origin);
if (base.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(base.hostname)) {
	throw new Error('Use a local fixture URL.');
}
const run = promisify(execFile);
const created = await fetch(new URL('/api/polls', base), {
	method: 'POST', headers: { origin: base.origin, 'content-type': 'application/json' },
	body: JSON.stringify({ title: 'Graceful shutdown fixture' }), signal: AbortSignal.timeout(10_000)
});
if (!created.ok) throw new Error('Could not create the shutdown fixture.');
const { poll } = await created.json();
const response = await fetch(new URL(`/api/polls/${poll.id}/events`, base), { signal: AbortSignal.timeout(15_000) });
if (!response.ok) throw new Error('Could not open the fixture stream.');
const reader = response.body.getReader();
await reader.read();
const start = performance.now();
await run('docker', ['stop', '--timeout', '10', container]);
while (!(await reader.read()).done) { /* Drain remaining snapshot bytes and require a clean stream end. */ }
const { stdout } = await run('docker', ['inspect', container, '--format', '{{.State.ExitCode}}']);
if (stdout.trim() !== '0' || performance.now() - start >= 10_000) throw new Error('Container shutdown was forced or delayed.');
console.log('Graceful shutdown passed: active SSE closed, clean exit, no external init.');
