import { readFile, mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const allowed = new Set(['--push', '--check']);
const args = process.argv.slice(2);
if (args.some((arg) => !allowed.has(arg)) || args.length > 1) throw new Error('Usage: npm run release -- [--check|--push]');

function run(command, arguments_, capture = false) {
	const result = spawnSync(command, arguments_, {
		cwd: root, encoding: 'utf8', stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit'
	});
	if (result.error) throw result.error;
	if (result.status !== 0) throw new Error(`${command} failed: ${capture ? result.stderr.trim() : result.status}`);
	return result.stdout?.trim() ?? '';
}

if (!/^\d+\.\d+\.\d+$/.test(pkg.version)) throw new Error('Release version must be a stable semver.');
if (run('git', ['status', '--porcelain'], true)) throw new Error('Commit the reviewed release files before building.');
const revision = run('git', ['rev-parse', 'HEAD'], true);
const builder = process.env.TERMINCOUNT_BUILDER || 'termincount-builder-node26';
const platforms = process.env.TERMINCOUNT_PLATFORMS || 'linux/amd64,linux/arm64';
const repository = 'termindiego25/termincount';
const tags = [pkg.version, pkg.version.split('.').slice(0, 2).join('.'), 'latest'];
run('docker', ['buildx', 'inspect', builder, '--bootstrap']);
await mkdir(path.join(root, 'artifacts'), { recursive: true });
const buildArgs = [
	'buildx', 'build', '--builder', builder, '--platform', platforms, '--pull',
	'--no-cache-filter', 'base,runtime-base',
	'--build-arg', `VERSION=${pkg.version}`, '--build-arg', `VCS_REF=${revision}`,
	'--build-arg', `BUILD_DATE=${new Date().toISOString()}`,
	'--sbom=true', '--provenance=mode=max',
	'--annotation', `index:org.opencontainers.image.version=${pkg.version}`,
	'--annotation', `index:org.opencontainers.image.revision=${revision}`,
	'--metadata-file', `artifacts/release-${pkg.version}.json`,
	...tags.flatMap((tag) => ['--tag', `${repository}:${tag}`])
];
if (args.includes('--push')) {
	const taggedRevision = run('git', ['rev-parse', `v${pkg.version}^{commit}`], true);
	if (taggedRevision !== revision) throw new Error(`Tag v${pkg.version} must point to HEAD before publication.`);
	buildArgs.push('--push');
} else if (args.includes('--check')) buildArgs.push('--output=type=cacheonly');
else buildArgs.push('--output', `type=oci,dest=artifacts/termincount-${pkg.version}.oci.tar`);
run('docker', [...buildArgs, '.']);
console.log(args.includes('--push') ? `Published ${repository}:${pkg.version} (${revision})` : `Verified ${pkg.version}. Docker Hub was not changed.`);
