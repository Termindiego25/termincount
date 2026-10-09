# npm Bundled Dependency Fixes

npm 12.2.0 ships some bundled libraries with known vulnerabilities even though it is the latest npm release. This directory locks compatible fixes independently from application dependencies. It is monitored by Dependabot and audited in CI.

Install with `npm ci --prefix tools/npm-bundle --install-strategy=nested --ignore-scripts`. The nested strategy preserves each replacement's dependency closure without changing unrelated npm libraries. Run apply.mjs with the absolute installed npm package directory, for example `node tools/npm-bundle/apply.mjs "$(npm root -g)/npm"` on a controlled build/CI installation.

The helper only replaces older versions within the same major API. It validates the destination, refuses a different target package or major upgrade, and never downgrades a newer installed version. It does not use force/legacy-peer-deps or suppress scanner findings. Recheck and retire the corresponding fixes when upstream npm ships repaired libraries.

These files are used in the Docker build stage and CI, not included in the final scratch runtime. Scans of those surfaces must be reported separately. A package manager's latest version does not prove that its bundled dependencies are current or free of known vulnerabilities.
