import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fromRoot = (...parts) => path.join(root, ...parts);
const failures = [];

function check(condition, message) {
	if (!condition) failures.push(message);
}

async function exists(filePath) {
	try {
		await access(filePath);
		return true;
	} catch {
		return false;
	}
}

const packageJson = JSON.parse(await readFile(fromRoot('package.json'), 'utf8'));
const appHtml = await readFile(fromRoot('src', 'app.html'), 'utf8');
const svelteConfig = await readFile(fromRoot('vite.config.ts'), 'utf8');
const page = await readFile(fromRoot('src', 'routes', '+page.svelte'), 'utf8');
const shell = await readFile(fromRoot('src', 'lib', 'AppShell.svelte'), 'utf8');
const pollPage = await readFile(fromRoot('src', 'routes', 'p', '[id]', 'PollResultView.svelte'), 'utf8');
const i18n = await readFile(fromRoot('src', 'lib', 'i18n.ts'), 'utf8');
const voting = await readFile(fromRoot('src', 'lib', 'voting.ts'), 'utf8');
const css = await readFile(fromRoot('src', 'app.css'), 'utf8');
const dockerfile = await readFile(fromRoot('Dockerfile'), 'utf8');
const compose = await readFile(fromRoot('docker-compose.yaml'), 'utf8');
const composeEnvExample = await readFile(fromRoot('termincount.env.example'), 'utf8');
const appEnv = parseEnv(composeEnvExample);
const databaseEnv = parseEnv(await readFile(fromRoot('postgresql.env.example'), 'utf8'));
const traefikCompose = await readFile(fromRoot('deploy', 'compose.traefik.yaml'), 'utf8');
const manifest = JSON.parse(await readFile(fromRoot('static', 'images', 'favicon', 'manifest.json'), 'utf8'));
const source = [appHtml, page, shell, pollPage, i18n, voting, css].join('\n');

const lock = JSON.parse(await readFile(fromRoot('package-lock.json'), 'utf8'));
check(lock.version === packageJson.version, 'Lockfile and package versions should match.');
check(dockerfile.includes(`ARG VERSION=${packageJson.version}`), 'Docker and package versions should match.');
check(Boolean(packageJson.devDependencies?.['@sveltejs/kit']), 'SvelteKit should be installed.');
check(Boolean(packageJson.devDependencies?.['@sveltejs/adapter-node']), 'SvelteKit adapter-node should be installed.');
check(!packageJson.devDependencies?.['@sveltejs/adapter-static'], 'SvelteKit adapter-static should not be installed.');
check(Boolean(packageJson.devDependencies?.typescript), 'TypeScript should be installed.');
check(Boolean(packageJson.devDependencies?.['@playwright/test']), 'Playwright should be installed.');
check(Boolean(packageJson.dependencies?.bootstrap), 'Bootstrap CSS should be a managed dependency.');
check(Boolean(packageJson.dependencies?.pg), 'PostgreSQL client should be installed.');
check(Boolean(packageJson.dependencies?.qrcode), 'QR code generation should be installed.');
check(Boolean(packageJson.author), 'package.json should include author metadata.');
check(packageJson.license === 'GPL-3.0', 'package.json should include GPL-3.0 license metadata.');
check(dockerfile.includes(`ARG NPM_VERSION=${packageJson.packageManager.replace('npm@', '')}`), 'Docker and package npm versions should match.');

check(!/code\.jquery\.com|jquery-3|window\.jQuery/i.test(source), 'jQuery should not be used.');
check(!/bootstrap(?:\.bundle)?\.min\.js/i.test(source), 'Bootstrap JavaScript should not be loaded.');
check(!/bootstrap-icons/i.test(source), 'Bootstrap Icons font CSS should not be loaded.');
check(/csp:\s*\{/.test(svelteConfig), 'SvelteKit CSP should be configured.');
check(/mode:\s*'auto'/.test(svelteConfig), 'SvelteKit CSP should use auto mode.');
check(/'script-src':\s*\[\s*'self'\s*\]/.test(svelteConfig), 'CSP should restrict scripts to self.');
check(/'style-src':\s*\[\s*'self'\s*\]/.test(svelteConfig), 'CSP should restrict styles to self.');
check(!/unsafe-inline/.test(appHtml + svelteConfig), 'CSP should not allow unsafe-inline.');
check(!/\sstyle=/.test(appHtml + page), 'Markup should not rely on inline styles.');
check(!/id="addEntrie"|byId\('addEntrie'\)/.test(source), 'Legacy addEntrie id should not be used.');
check(!/data-action="toggle-theme"|data-action="auto-theme"/.test(page), 'Legacy theme buttons should not be used.');
check(/data-action="theme-menu"/.test(shell), 'Theme menu trigger should exist.');
check(/select-shell/.test(shell), 'Language selector should include its visual shell.');
check(!/innerHTML/.test(source), 'Runtime code should not use innerHTML.');
check(/\{yearRange\}/.test(i18n), 'Translated footer text should include the dynamic year range placeholder.');
check(/copyrightStartYear = 2025/.test(shell), 'Footer copyright should keep 2025 as the start year.');
check(/new Date\(\)\.getFullYear\(\)/.test(shell), 'Footer copyright should derive the current year automatically.');
check((css.match(/^:root\s*\{/gm) || []).length === 1, 'app.css should not contain duplicated root blocks.');
check(/EventSource/.test(pollPage), 'Poll page should use SSE live updates.');
check(/execCommand\('copy'\)/.test(pollPage), 'Share link copy should include a browser fallback.');
check(/\/api\/polls/.test(page), 'Home page should create polls through the API.');
check(!(await exists(fromRoot('tools', 'static-server', 'main.go'))), 'Legacy Go static server should not remain in tools.');

check(manifest.name === 'TerminCount', 'Manifest name should be TerminCount.');
check(Array.isArray(manifest.icons) && manifest.icons.length > 0, 'Manifest should include icons.');

for (const icon of manifest.icons || []) {
	const iconPath = fromRoot('static', icon.src.replace(/^\//, ''));
	check(await exists(iconPath), `Manifest icon is missing: ${icon.src}`);
}

check(/FROM --platform=\$BUILDPLATFORM node:26\.11\.1-alpine3\.24 AS base/.test(dockerfile), 'Dockerfile should use the reviewed Node 26 Alpine for multi-arch builds.');
check(/FROM node:26\.11\.1-alpine3\.24 AS runtime-base/.test(dockerfile), 'Dockerfile should use a target-platform Node runtime base.');
check(dockerfile.includes('/usr/lib/libatomic.so.1*'), 'Node 26 runtime should include libatomic.');
check(!(await exists(fromRoot('svelte.config.js'))), 'Kit 3 should keep configuration in the Vite plugin.');
check(/FROM scratch AS runtime/.test(dockerfile), 'Dockerfile should use a minimal scratch runtime image.');
check(/COPY --from=runtime-base \/usr\/local\/bin\/node \/usr\/local\/bin\/node/.test(dockerfile), 'Dockerfile should copy the target-platform Node runtime into the final image.');
check(/COPY --from=build \/app\/build \.\/build/.test(dockerfile), 'Dockerfile should copy the SvelteKit server build output.');
check(/PORT=3000/.test(dockerfile), 'Dockerfile should use a non-privileged runtime port.');
check(/EXPOSE 3000/.test(dockerfile), 'Dockerfile should expose the non-privileged runtime port.');
check(/USER 10001:10001/.test(dockerfile), 'Dockerfile should run the runtime image as a non-root user.');
check(/CMD \["\/usr\/local\/bin\/node", "tools\/server.mjs"\]/.test(dockerfile), 'Dockerfile should use the runtime-origin server entrypoint.');
check(/org\.opencontainers\.image\.version="\$\{VERSION\}"/.test(dockerfile), 'Dockerfile should expose OCI version metadata.');
check(/org\.opencontainers\.image\.authors=/.test(dockerfile), 'Dockerfile should expose OCI author metadata.');
check(compose.includes(`termindiego25/termincount:postgres-18.6-${packageJson.version}`), 'Docker Compose should use the reviewed PostgreSQL image.');
check(/@typescript\/native/.test(JSON.stringify(packageJson.devDependencies)) && /--tsgo/.test(packageJson.scripts.check), 'TypeScript 7 should be the active checker with its compatibility alias.');
check(databaseEnv.POSTGRES_PASSWORD_FILE === '/run/secrets/db_password', 'PostgreSQL env file should use the password secret.');
check(appEnv.DB_PASSWORD_FILE === '/run/secrets/db_password', 'App env file should use the password secret.');
for (const deployment of [compose, traefikCompose]) {
	check(/container_name: termincount_app/.test(deployment) && /container_name: termincount_db/.test(deployment), 'Service container names should use the termincount_ prefix.');
	check(!/^\s+environment:/m.test(deployment), 'Runtime settings should stay in service env files.');
	check(!/^\s+init:\s*true/m.test(deployment), 'The single-process Node server should not depend on an external Docker init executable.');
	check(/- postgresql\.env/.test(deployment) && /- termincount\.env/.test(deployment), 'Compose should load both service env files.');
	check((deployment.match(/- db_password/g) || []).length === 2, 'Both services should mount the database password secret.');
}
check(/\.\/data\/postgres:\/var\/lib\/postgresql/.test(compose), 'Docker Compose should store PostgreSQL data in the project data folder.');
check(/127\.0\.0\.1:\$\{TERMINCOUNT_PORT:-8080\}:3000/.test(compose), 'Docker Compose should bind the app port to loopback.');
check(appEnv.DB_HOST === 'termincount_db', 'The default app env file should name the Compose database service.');
check(/ORIGIN=http:\/\/localhost:8080/.test(composeEnvExample), 'TerminCount env example should include a local ORIGIN.');
check(
	/TERMINCOUNT_DB_POOL_SIZE=10/.test(composeEnvExample),
	'TerminCount env example should document the default database pool size.'
);

if (failures.length > 0) {
	console.error(failures.map((failure) => `- ${failure}`).join('\n'));
	process.exit(1);
}

console.log('Smoke checks passed.');
