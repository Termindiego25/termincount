import { cp, readFile, realpath, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const sourceRoot = path.dirname(fileURLToPath(import.meta.url));
const npmRoot = await realpath(process.argv[2]);
const npmPackage = JSON.parse(await readFile(path.join(npmRoot, 'package.json'), 'utf8'));
if (npmPackage.name !== 'npm') throw new Error('Target must be the installed npm package.');
const { gte, satisfies } = createRequire(path.join(npmRoot, 'package.json'))('semver');
const fixes = JSON.parse(await readFile(path.join(sourceRoot, 'package.json'), 'utf8'));
// These two npm 12.2.2 adaptations are covered by the installed-CLI regression
// suite and native addon fixture. Other major replacements still fail closed.
const reviewedMajors = {
	glob: { from: '13', to: '14.0.6' },
	minimatch: { from: '10', to: '11.0.8' }
};

const replacements = Object.entries(fixes.dependencies).sort(([a], [b]) => {
	if (a === 'node-gyp') return -1;
	if (b === 'node-gyp') return 1;
	return a.localeCompare(b);
});
for (const [name, version] of replacements) {
	if (!/^[a-z0-9-]+$/.test(name)) throw new Error('Unsafe package name.');
	const source = path.join(sourceRoot, 'node_modules', name);
	const target = path.resolve(npmRoot, 'node_modules', name);
	if (!target.startsWith(npmRoot + path.sep)) throw new Error('Target escapes npm.');
	const installed = JSON.parse(await readFile(path.join(target, 'package.json'), 'utf8'));
	if (gte(installed.version, version)) continue;
	if (name === 'node-gyp' && !satisfies(version, npmPackage.dependencies?.['node-gyp'] ?? '')) {
		throw new Error('The node-gyp replacement must satisfy npm\'s declared range.');
	}
	if (installed.version.split('.')[0] !== version.split('.')[0]) {
		const parent = JSON.parse(await readFile(path.join(npmRoot, 'node_modules/node-gyp/package.json'), 'utf8'));
		const reviewed = reviewedMajors[name];
		const reviewedNpmAdaptation = npmPackage.version === '12.2.2' && reviewed
			&& installed.version.split('.')[0] === reviewed.from && version === reviewed.to;
		if (!reviewedNpmAdaptation && (name !== 'undici' || !satisfies(version, parent.dependencies?.undici ?? ''))) {
			throw new Error(`Review npm's ${name} API compatibility before changing its major version.`);
		}
	}
	await rm(target, { recursive: true, force: true });
	await cp(source, target, { recursive: true });
	console.log(`npm bundled dependency: ${name} ${installed.version} -> ${version}`);
}
