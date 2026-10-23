# npm Bundled Dependency Fixes

npm 12.2.1 still ships older bundled libraries independently of the application's dependencies. This directory locks reviewed, compatible repairs and updates for that build toolchain. It is monitored by Dependabot and audited in CI; neither the npm version nor application-only audit covers the whole installed build toolchain.

Install with `npm ci --prefix tools/npm-bundle --install-strategy=nested --ignore-scripts`. The nested strategy preserves each replacement's dependency closure without changing unrelated npm libraries. Run apply.mjs with the absolute installed npm package directory, for example `node tools/npm-bundle/apply.mjs "$(npm root -g)/npm"` on a controlled build/CI installation.

The helper validates the destination, never downgrades a newer version, and normally requires the same major API. The one reviewed exception updates node-gyp to 13.1.0 first (within npm's declared range), then installs Undici 8 only when that parent's dependency range accepts it. It does not use force/legacy-peer-deps or suppress scanner findings. Recheck and retire the corresponding fixes when upstream npm ships repaired libraries.

These files are used in the Docker build stage and CI, not included in the final scratch runtime. Scans of those surfaces must be reported separately. A package manager's latest version does not prove that its bundled dependencies are current or free of known vulnerabilities.
