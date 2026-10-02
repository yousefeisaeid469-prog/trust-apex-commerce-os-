# V228 Operations

Run `npm run reality-audit-v228` before release.

A production build requires `node_modules`; V228 will report the missing dependency state rather than treating source checks as a successful build.

For a real deployment, install dependencies with the locked package versions, run `npm run typecheck`, `npm run build`, then run the existing release/security checks.
