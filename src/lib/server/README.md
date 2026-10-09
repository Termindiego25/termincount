# Server Boundary

This folder contains server-only code for TerminCount:

- PostgreSQL connection and schema initialization
- session hashing and owner checks
- poll creation, voting, undo, and cleanup logic
- realtime fan-out through PostgreSQL `LISTEN` / `NOTIFY`
- transactional mutation receipts for retry-safe vote/undo (including no-op undo)

Files in `#lib/server` are intentionally unavailable to browser bundles, which keeps database credentials and session internals on the server side.

Vote/undo locks the parent poll before checking ownership/expiry and claiming an optional `Idempotency-Key`. Keys must contain 16-128 ASCII letters, digits, hyphens or underscores. Repeated keys with the same action return a current snapshot without repeating the mutation; a changed action/index returns 409. A receipt and its mutation commit atomically. Receipts expire through the poll's cascading cleanup. Requests without a key retain legacy behavior and must not be retried automatically.
