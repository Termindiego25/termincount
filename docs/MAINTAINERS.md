# Maintainers

Release commands belong here rather than in the user-facing README.

1. Update package.json, package-lock.json, the Docker VERSION default, Compose image defaults, and the changelog. Keep the package manager version consistent with Docker.
2. Run `npm ci`, `npm test`, `npm run build`, `npm run test:e2e`, and `npm audit`. Review container scan results for the exported runtime image. The runtime copies Node and its shared libraries into scratch; it still needs rebuilding when Node or Alpine publishes fixes.
3. Commit the reviewed files, create an annotated tag matching package.json (currently `v1.3.2`), and push the commit/tag to GitHub. Do not rebuild a release from an uncommitted working tree.
4. Create a docker-container builder once if needed:

   ```bash
   docker buildx create --name termincount-builder --driver docker-container
   docker buildx inspect termincount-builder --bootstrap
   ```

5. `npm run release -- --check` validates all target architectures without publishing. `npm run release` exports an OCI archive under artifacts/ with SBOM and max provenance. `npm run release -- --push` publishes the exact version, compatible minor-series tag, and latest tag. Publication requires the matching local release tag at HEAD and a clean tree.

The script derives version and full Git revision from the repository, records a UTC build date, attaches OCI index annotations, and always fetches base metadata with `--pull`. Override TERMINCOUNT_BUILDER or TERMINCOUNT_PLATFORMS only for a deliberately different builder/platform set. Release exports and metadata files are ignored by Git and excluded from Docker build context.

Authenticate Docker Hub using `docker login` before publication. Credentials should stay in Docker's credential store, not in this repository. Check the pushed manifest, attestations, and per-architecture CVEs afterwards. Review Docker Scout policy results separately: missing base-image policy data is not the same as a passing policy, and a clean CVE scan is not a complete security audit.

On PowerShell you can also run `node tools/release.mjs --check` or `node tools/release.mjs --push` directly if your npm.ps1 wrapper does not forward the `--` arguments correctly.

The current runtime stays on patched Node 22 to retain linux/arm/v7 support. SvelteKit 2, adapter-node 5, and TypeScript 6 are the compatible stable combination used here; adapter-node 6 targets SvelteKit 3 and TypeScript 7 is outside the installed SvelteKit/checker peer ranges. Revisit these together in a future migration.
