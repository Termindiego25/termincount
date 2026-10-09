import { cp, readFile, realpath, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const sourceRoot = path.dirname(fileURLToPath(import.meta.url));
const npmRoot = await realpath(process.argv[2]);
const npmPackage = JSON.parse(await readFile(path.join(npmRoot, 'package.json'), 'utf8'));
if (npmPackage.name !== 'npm') throw new Error('Target must be the installed npm package.');
const { gte } = createRequire(path.join(npmRoot, 'package.json'))('semver');
const fixes = JSON.parse(await readFile(path.join(sourceRoot, 'package.json'), 'utf8'));

for (const [name, version] of Object.entries(fixes.dependencies)) {
	if (!/^[a-z0-9-]+$/.test(name)) throw new Error('Unsafe package name.');
	const source = path.join(sourceRoot, 'node_modules', name);
	const target = path.resolve(npmRoot, 'node_modules', name);
	if (!target.startsWith(npmRoot + path.sep)) throw new Error('Target escapes npm.');
	const installed = JSON.parse(await readFile(path.join(target, 'package.json'), 'utf8'));
	if (gte(installed.version, version)) continue;
	if (installed.version.split('.')[0] !== version.split('.')[0]) {
		throw new Error(`Review npm's ${name} API compatibility before changing its major version.`);
	}
	await rm(target, { recursive: true, force: true });
	await cp(source, target, { recursive: true });
	console.log(`npm bundled dependency: ${name} ${installed.version} -> ${version}`);
}
