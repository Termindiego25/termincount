# Security Policy

Security fixes are provided for the current 1.3 release series. Install the latest patch release and rebuild/pull images regularly to receive runtime updates.

Report vulnerabilities through the repository's private GitHub vulnerability reporting facility when enabled, or email diego@diegosr.es. Do not include credentials, owner cookies, database dumps, or private poll links in public issues.

TerminCount is a manual counter, not an authenticated election system. Anyone who knows a public result URL can read it. Only the browser with the owner session cookie can change votes; clearing that cookie loses ownership. There is currently no recovery or account system.

Run behind HTTPS, keep PostgreSQL private, protect secret files and backups, and apply request limits at the edge for an Internet-facing installation. Browser writes require the matching Origin header. Do not enable Cloudflare Rocket Loader or cache HTML, API, or SSE responses.

Dependency audits and container scans report known issues at the time of scanning; they are not a guarantee that the application is free of vulnerabilities.
