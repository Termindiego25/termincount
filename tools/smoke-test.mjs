import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
const svelteConfig = await readFile(fromRoot('svelte.config.js'), 'utf8');
const page = await readFile(fromRoot('src', 'routes', '+page.svelte'), 'utf8');
const shell = await readFile(fromRoot('src', 'lib', 'AppShell.svelte'), 'utf8');
const pollPage = await readFile(fromRoot('src', 'routes', 'p', '[id]', '+page.svelte'), 'utf8');
const i18n = await readFile(fromRoot('src', 'lib', 'i18n.ts'), 'utf8');
const voting = await readFile(fromRoot('src', 'lib', 'voting.ts'), 'utf8');
const css = await readFile(fromRoot('src', 'app.css'), 'utf8');
const dockerfile = await readFile(fromRoot('Dockerfile'), 'utf8');
const compose = await readFile(fromRoot('docker-compose.yaml'), 'utf8');
const composeEnvExample = await readFile(fromRoot('termincount.env.example'), 'utf8');
const manifest = JSON.parse(await readFile(fromRoot('static', 'images', 'favicon', 'manifest.json'), 'utf8'));
const source = [appHtml, page, shell, pollPage, i18n, voting, css].join('\n');

check(packageJson.version === '1.3.0', 'package.json version should be 1.3.0.');
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
check(packageJson.packageManager === 'npm@11.15.0', 'package.json should pin the npm package manager version.');

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
check(/2025-2026/.test(i18n), 'Translated footer text should include the 2025-2026 year range.');
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

check(/FROM --platform=\$BUILDPLATFORM node:22-alpine AS base/.test(dockerfile), 'Dockerfile should use Node 22 Alpine for multi-arch builds.');
check(/FROM node:22-alpine AS runtime-base/.test(dockerfile), 'Dockerfile should use a target-platform Node runtime base.');
check(/ARG NPM_VERSION=11\.15\.0/.test(dockerfile), 'Dockerfile should pin the current npm version in the build stage.');
check(/FROM scratch AS runtime/.test(dockerfile), 'Dockerfile should use a minimal scratch runtime image.');
check(/COPY --from=runtime-base \/usr\/local\/bin\/node \/usr\/local\/bin\/node/.test(dockerfile), 'Dockerfile should copy the target-platform Node runtime into the final image.');
check(/COPY --from=build \/app\/build \.\/build/.test(dockerfile), 'Dockerfile should copy the SvelteKit server build output.');
check(/PORT=3000/.test(dockerfile), 'Dockerfile should use a non-privileged runtime port.');
check(/EXPOSE 3000/.test(dockerfile), 'Dockerfile should expose the non-privileged runtime port.');
check(/USER 10001:10001/.test(dockerfile), 'Dockerfile should run the runtime image as a non-root user.');
check(/CMD \["\/usr\/local\/bin\/node", "build"\]/.test(dockerfile), 'Dockerfile should run the SvelteKit Node server.');
check(/org\.opencontainers\.image\.version="\$\{VERSION\}"/.test(dockerfile), 'Dockerfile should expose OCI version metadata.');
check(/org\.opencontainers\.image\.authors=/.test(dockerfile), 'Dockerfile should expose OCI author metadata.');
check(/postgres:18-alpine/.test(compose), 'Docker Compose should include PostgreSQL 18 Alpine.');
check(!/container_name:/.test(compose), 'Docker Compose should not pin container names, so services remain scalable.');
check(/POSTGRES_PASSWORD_FILE: \/run\/secrets\/db_password/.test(compose), 'Docker Compose should pass the PostgreSQL password through Docker Secrets.');
check(/DB_PASSWORD_FILE: \/run\/secrets\/db_password/.test(compose), 'Docker Compose should pass the app database password through Docker Secrets.');
check(/\.\/data\/postgres:\/var\/lib\/postgresql/.test(compose), 'Docker Compose should store PostgreSQL data in the project data folder.');
check(/\$\{TERMINCOUNT_PORT:-8080\}:3000/.test(compose), 'Docker Compose should map the host app port to the non-privileged container port.');
check(/DB_HOST: db/.test(compose), 'Docker Compose should wire the app to the PostgreSQL service.');
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
