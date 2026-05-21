# Server Boundary

This folder contains server-only code for TerminCount:

- PostgreSQL connection and schema initialization
- session hashing and owner checks
- poll creation, voting, undo, and cleanup logic
- realtime fan-out through PostgreSQL `LISTEN` / `NOTIFY`

Files in `$lib/server` are intentionally unavailable to browser bundles, which keeps database credentials and session internals on the server side.
