# Maintainers

Release commands belong here rather than in the user-facing README.

1. Update package.json, package-lock.json, the Docker VERSION default, Compose image defaults, and the changelog. Keep the package manager version consistent with Docker.
2. Run `npm ci`, `npm test`, `npm run build`, `npm run test:e2e`, and `npm audit`. Also run `npm ci --prefix tools/npm-bundle --install-strategy=nested --ignore-scripts` and `npm audit --prefix tools/npm-bundle`. Scan the build stage, exported runtime and PostgreSQL separately. The runtime copies Node and its shared libraries into scratch; it still needs rebuilding when Node or Alpine publishes fixes.
3. Commit the reviewed files, create an annotated tag matching package.json (currently `v1.5.0`), and push the commit/tag to GitHub. Do not rebuild a release from an uncommitted working tree.
4. Create a docker-container builder once if needed:

   ```bash
   docker buildx create --name termincount-builder-node26 --driver docker-container --driver-opt image=moby/buildkit:v0.34.0
   docker buildx inspect termincount-builder-node26 --bootstrap
   ```

5. `npm run release -- --check` validates all target architectures without publishing. `npm run release` exports an OCI archive under artifacts/ with SBOM and max provenance. `npm run release -- --push` publishes the exact version, compatible minor-series tag, and latest tag. Publication requires the matching local release tag at HEAD and a clean tree.
6. Run the same command with `--database` to validate/export/publish the refreshed PostgreSQL image: `node tools/release.mjs --database --push`. It publishes `postgres-18.6-1.5.0` and `postgres-18.6`, never the app's latest tag. Scan both architectures and verify initialization/Secrets, a dump/restore and an existing data-directory restart before releasing it. `--no-cache` refreshes its APK packages on every release.

The script derives version and full Git revision from the repository, records a UTC build date, attaches OCI index annotations, and always fetches base metadata with `--pull`. It refreshes base/runtime-base layers so APK security updates are not hidden by an unchanged Docker tag and layer cache. The default platforms are amd64 and arm64; Node 26 has no official ARM32 image. Override TERMINCOUNT_BUILDER or TERMINCOUNT_PLATFORMS only for a deliberately different supported builder/platform set. Release exports and metadata files are ignored by Git and excluded from Docker build context. Inspect the actual BuildKit version: pulling a new image does not upgrade a previously created builder container.

Authenticate Docker Hub using `docker login` before publication. Credentials should stay in Docker's credential store, not in this repository. Check the pushed manifest, attestations, and per-architecture CVEs afterwards. Review Docker Scout policy results separately: missing base-image policy data is not the same as a passing policy, and a clean CVE scan is not a complete security audit.

On PowerShell you can also run `node tools/release.mjs --check` or `node tools/release.mjs --push` directly if your npm.ps1 wrapper does not forward the `--` arguments correctly.

The runtime uses Node 26 Current, npm 12, SvelteKit 3 and adapter-node 6. TypeScript 7 is the active checker through the official alias/--tsgo integration, alongside the required TypeScript 6 API bridge. Do not remove the bridge until the upstream consumers migrate their APIs. Node major updates must also update CI, engine/type definitions, runtime libraries and platform support. CI builds/boots the app and database images and exercises the patched node-gyp with a native addon (including its header download).

Never equate an up-to-date tag or a clean app scan with a clean stack. Review [Dependency review](DEPENDENCIES.md), keep the unresolved database findings visible, and rescan after an upstream fix. Both Dockerfiles are watched by Dependabot; versioned Node/PostgreSQL bases make new patches reviewable. Run build-stage and runtime scans after every rebuild, even without a package.json change.
