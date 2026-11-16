import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
// Resolve the replacement through its actual consumer, not a test-only import.
const pluginRequire = createRequire(require.resolve('@sveltejs/vite-plugin-svelte'));
const merge = pluginRequire('deepmerge');

test('the Svelte plugin resolves the reviewed merge implementation', () => {
	assert.equal(pluginRequire('deepmerge/package.json').name, '@stackline/deepmerge');
	assert.equal(pluginRequire('deepmerge/package.json').version, '1.1.2');
});

test('merge cannot poison a returned object through null or primitive placeholders', () => {
	const source = JSON.parse('{"session":{"__proto__":{"admin":true},"theme":"dark"}}');
	for (const placeholder of [null, undefined, false, 0, '']) {
		const target = { session: placeholder };
		const result = merge(target, source);
		assert.equal(Object.getPrototypeOf(result.session), Object.prototype);
		assert.equal(result.session.admin, undefined);
		assert.equal(result.session.theme, 'dark');
		assert.equal(target.session, placeholder);
	}
	assert.equal({}.admin, undefined);
});

test('merge rejects own prototype keys on both the target and source', () => {
	const malicious = JSON.parse('{"__proto__":{"admin":true},"nested":{"__proto__":{"admin":true}}}');
	for (const [target, source] of [[malicious, {}], [{}, malicious], [Object.create(null), malicious]]) {
		const result = merge(target, source);
		assert.equal(Object.getPrototypeOf(result), Object.prototype);
		assert.equal(Object.getPrototypeOf(result.nested), Object.prototype);
		assert.equal(result.admin, undefined);
		assert.equal(result.nested.admin, undefined);
		assert.equal(Object.hasOwn(result, '__proto__'), false);
	}
});

test('Svelte configuration preserves callbacks, nested values and array replacement', () => {
	const preprocess = () => 'preprocessed';
	const first = { compilerOptions: { dev: true, css: 'external' }, preprocess: [preprocess], include: ['old'] };
	const second = { compilerOptions: { dev: false }, preprocess: [preprocess, preprocess], include: ['new'] };
	const result = merge(first, second, { arrayMerge: (target, source) => source ?? target });
	assert.deepEqual(result.compilerOptions, { dev: false, css: 'external' });
	assert.deepEqual(result.include, ['new']);
	assert.deepEqual(result.preprocess, [preprocess, preprocess]);
	assert.equal(result.preprocess[0](), 'preprocessed');
	assert.deepEqual(first.include, ['old']);
	assert.equal(first.compilerOptions.dev, true);
});

test('default merge and merge.all retain array concatenation, symbols and special values', () => {
	const symbol = Symbol('option');
	const date = new Date('2026-01-01T00:00:00Z');
	const expression = /svelte/;
	const result = merge.all([{ values: [1], [symbol]: { first: true } }, { values: [2], [symbol]: { second: true }, date, expression }]);
	assert.deepEqual(result.values, [1, 2]);
	assert.deepEqual(result[symbol], { first: true, second: true });
	assert.equal(result.date, date);
	assert.equal(result.expression, expression);
});
