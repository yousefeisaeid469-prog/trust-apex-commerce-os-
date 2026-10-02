# Production Verification Gate

## Local/networked environment

The repository cannot honestly claim a verified Next.js build when dependencies are unavailable. Run the following on a machine/CI runner with network access to npm:

```bash
npm install
npm run typecheck
npm run build
npm test
```

For a clean, reproducible install **after the lockfile has been regenerated and committed**, use:

```bash
rm -rf node_modules
npm ci
npm run typecheck
npm run build
npm test
```

## Current repository state

- `node_modules/` is intentionally not committed.
- The checked-in `package-lock.json` currently contains the root package metadata but does not contain the resolved dependency tree.
- Therefore `npm ci` cannot be truthfully reported as verified from this offline environment.
- `scripts/verify-production.mjs` fails closed when `node_modules` is absent instead of reporting a false PASS.

## Required release evidence

A production release is only considered build-verified when all four commands below exit with code 0:

1. `npm ci` (or `npm install` during lockfile bootstrap)
2. `npm run typecheck`
3. `npm run build`
4. `npm test`

The CI workflow performs this verification on an Ubuntu runner with Node 20.
