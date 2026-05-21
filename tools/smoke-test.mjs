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
const i18n = await readFile(fromRoot('src', 'lib', 'i18n.ts'), 'utf8');
const voting = await readFile(fromRoot('src', 'lib', 'voting.ts'), 'utf8');
const css = await readFile(fromRoot('src', 'app.css'), 'utf8');
const dockerfile = await readFile(fromRoot('Dockerfile'), 'utf8');
const manifest = JSON.parse(await readFile(fromRoot('static', 'images', 'favicon', 'manifest.json'), 'utf8'));
const source = [appHtml, page, i18n, voting, css].join('\n');

check(packageJson.version === '1.2.0', 'package.json version should be 1.2.0.');
check(Boolean(packageJson.devDependencies?.['@sveltejs/kit']), 'SvelteKit should be installed.');
check(Boolean(packageJson.devDependencies?.typescript), 'TypeScript should be installed.');
check(Boolean(packageJson.devDependencies?.['@playwright/test']), 'Playwright should be installed.');
check(Boolean(packageJson.dependencies?.bootstrap), 'Bootstrap CSS should be a managed dependency.');
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
check(/data-action="theme-menu"/.test(page), 'Theme menu trigger should exist.');
check(/select-shell/.test(page), 'Language selector should include its visual shell.');
check(!/innerHTML/.test(source), 'Runtime code should not use innerHTML.');
check(/2025-2026/.test(i18n), 'Translated footer text should include the 2025-2026 year range.');
check((css.match(/^:root\s*\{/gm) || []).length === 1, 'app.css should not contain duplicated root blocks.');

check(manifest.name === 'TerminCount', 'Manifest name should be TerminCount.');
check(Array.isArray(manifest.icons) && manifest.icons.length > 0, 'Manifest should include icons.');

for (const icon of manifest.icons || []) {
	const iconPath = fromRoot('static', icon.src.replace(/^\//, ''));
	check(await exists(iconPath), `Manifest icon is missing: ${icon.src}`);
}

check(/FROM --platform=\$BUILDPLATFORM node:lts-alpine AS build/.test(dockerfile), 'Dockerfile should use the active Node LTS Alpine build stage.');
check(/ARG NPM_VERSION=11\.15\.0/.test(dockerfile), 'Dockerfile should pin the current npm version in the build stage.');
check(/FROM --platform=\$BUILDPLATFORM golang:alpine AS static-server/.test(dockerfile), 'Dockerfile should compile the static runtime with a Go Alpine build stage.');
check(/ARG TARGETARCH/.test(dockerfile), 'Dockerfile should cross-compile the static runtime for the target platform.');
check(/FROM scratch/.test(dockerfile), 'Dockerfile should use a scratch runtime image.');
check(/COPY --from=build \/app\/build \/srv\/termincount/.test(dockerfile), 'Dockerfile should copy the SvelteKit build output.');
check(/org\.opencontainers\.image\.version="\$\{VERSION\}"/.test(dockerfile), 'Dockerfile should expose OCI version metadata.');
check(/org\.opencontainers\.image\.authors=/.test(dockerfile), 'Dockerfile should expose OCI author metadata.');

if (failures.length > 0) {
	console.error(failures.map((failure) => `- ${failure}`).join('\n'));
	process.exit(1);
}

console.log('Smoke checks passed.');
