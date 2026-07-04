# Dependency Audit Notes

Last reviewed: 2026-07-04

## Current State

`npm.cmd audit fix` was run without `--force`.

It reduced the audit report from 67 vulnerabilities to 28 vulnerabilities and left the app passing:

```powershell
npm.cmd test -- --watchAll=false --cacheDirectory=.jest-cache
npm.cmd run build
```

## Remaining Issues

The remaining audit findings are tied mostly to `react-scripts@5.0.1` transitive tooling:

- Jest 27 / jsdom 16 chain: `@tootallnate/once`
- SVGR / SVGO chain: `nth-check`
- `resolve-url-loader` chain: `postcss@7`
- Workbox / rollup terser chain: `serialize-javascript`
- webpack dev server / sockjs chain: `uuid`
- `bfj` / jsonpath chain: `underscore`

`npm audit fix --force` is not currently safe. NPM recommends a breaking path involving `react-scripts@0.0.0`, which is not a real upgrade strategy for this app.

## Recommended Cleanup Path

1. Keep the safe audit lockfile update.
2. Do not run `npm audit fix --force`.
3. Treat remaining findings as CRA toolchain debt unless a targeted override can be proven with tests and build.
4. Prefer a planned migration from Create React App / `react-scripts` to Vite to remove the old webpack/Jest/dev-server dependency tree.
5. After migration, rerun `npm.cmd audit --audit-level=low` and address any remaining direct runtime dependencies.

## Validation Gate

After any dependency cleanup:

```powershell
npm.cmd test -- --watchAll=false --cacheDirectory=.jest-cache
npm.cmd run build
npm.cmd audit --audit-level=low
```
