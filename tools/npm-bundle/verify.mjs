import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

const npmRoot = await realpath(process.argv[2]);
const npmRequire = createRequire(path.join(npmRoot, 'package.json'));
const expected = JSON.parse(await readFile(new URL('./package.json', import.meta.url), 'utf8'));
const { gte } = npmRequire('semver');
for (const [name, version] of Object.entries(expected.dependencies)) {
	const installed = npmRequire(`${name}/package.json`);
	assert.equal(installed.name, name);
	assert.ok(gte(installed.version, version), `npm must load the reviewed ${name} repair`);
}

const { glob, globSync, hasMagic } = npmRequire('glob');
const { minimatch, Minimatch, match, filter } = npmRequire('minimatch');
assert.ok(hasMagic('src/**/*.js'));
assert.ok(minimatch('src/index.js', '**/*.js'));
assert.equal(minimatch('src/510', 'src/*({1..100})'), false);
assert.equal(minimatch('src/55', 'src/*({1..100})'), true);
assert.deepEqual(match(['a.js', 'b.ts'], '*.js'), ['a.js']);
assert.deepEqual(['a.js', 'b.ts'].filter(filter('*.ts')), ['b.ts']);
assert.ok(new Minimatch('**/test-@(a|b).js', { dot: true, optimizationLevel: 2 }).match('.hidden/test-a.js'));

const temporary = await realpath(os.tmpdir());
const fixture = await mkdtemp(path.join(temporary, 'termincount-npm-contract-'));
try {
	await mkdir(path.join(fixture, 'src'));
	await writeFile(path.join(fixture, 'src/index.js'), 'module.exports = 42;\n');
	await writeFile(path.join(fixture, 'ignored.txt'), 'not included\n');
	await writeFile(path.join(fixture, 'package.json'), JSON.stringify({
		name: 'termincount-npm-contract', version: '1.0.0', files: ['src'],
		workspaces: ['packages/*'], dependencies: {}
	}));
	await mkdir(path.join(fixture, 'packages/child'), { recursive: true });
	await writeFile(path.join(fixture, 'packages/child/package.json'), JSON.stringify({ name: 'fixture-child', version: '1.0.0' }));
	assert.deepEqual((await glob('**/*.js', { cwd: fixture })).map((name) => name.split(path.sep).join('/')), ['src/index.js']);
	assert.deepEqual(globSync('**/*.js', { cwd: fixture, ignore: ['src/**'] }), []);
	const signal = AbortSignal.abort(new Error('fixture cancellation'));
	await assert.rejects(glob('**/*', { cwd: fixture, signal }), /fixture cancellation/);
	const run = (...args) => execFileSync(process.execPath, [path.join(npmRoot, 'bin/npm-cli.js'), ...args], {
		cwd: fixture, encoding: 'utf8', timeout: 30_000,
		env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' }
	});
	run('install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund');
	run('ci', '--ignore-scripts', '--no-audit', '--no-fund');
	const packages = JSON.parse(run('ls', '--workspaces', '--json'));
	assert.equal(packages.dependencies['fixture-child'].version, '1.0.0');
	const pack = JSON.parse(run('pack', '--dry-run', '--json'))['termincount-npm-contract'];
	assert.ok(pack.files.some(({ path: name }) => name === 'src/index.js'));
	assert.ok(!pack.files.some(({ path: name }) => name === 'ignored.txt'));
	const list = JSON.parse(run('ls', '--json'));
	assert.equal(list.name, 'termincount-npm-contract');
	console.log('Installed npm repairs passed: module identity, glob/minimatch APIs, cancellation, workspace install/ci, tree and packaging.');
} finally {
	if (path.dirname(await realpath(fixture)) !== temporary) throw new Error('Unsafe npm fixture cleanup path');
	await rm(fixture, { recursive: true, force: true });
}
