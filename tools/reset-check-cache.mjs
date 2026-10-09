import { rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cache = path.resolve(root, '.svelte-kit', '.svelte-check');
if (!cache.startsWith(root + path.sep)) throw new Error('Checker cache escapes the project.');
// svelte-check --tsgo can leave virtual files for deleted/renamed components.
await rm(cache, { recursive: true, force: true });
