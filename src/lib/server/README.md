# Future Server Boundary

This folder is intentionally empty for version 1.2.

When TerminCount grows beyond local/manual counting, keep server-only code here:

- database clients and migrations
- poll/result persistence
- share-token validation
- vote ingestion and anti-abuse checks
- realtime adapters or server-sent event helpers

SvelteKit excludes `$lib/server` modules from client bundles, which makes this the right boundary for future database-backed features.
