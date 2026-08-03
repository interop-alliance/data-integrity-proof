# Agent Guidelines

## This Project

`@interop/data-integrity-proof` is a TypeScript, ESM-only, isomorphic
(Node.js / browser / React Native) Data Integrity Proof library for use with
`@interop/jsonld-signatures`. It is a fork of `@digitalbazaar/data-integrity`.

### Dependencies

- Runtime: `@interop/jsonld-signatures`, `@scure/base` (base58 / base64url
  encoding, via `src/baseX.ts`), and `@noble/hashes` (React Native SHA-256).
- Cryptosuite/key/loader packages used in tests come from the `@interop/` forks
  (`@interop/ed25519-verification-key`, `@interop/ed25519-signature`,
  `@interop/security-document-loader`). Shared interfaces (`ISigner`,
  `IVerifier`, `IVerificationResult`, `IDocumentLoader`, `IVerificationMethod`)
  are imported as types from `@interop/data-integrity-core`.

### Isomorphic SHA-256

`src/sha256digest.ts` (Node, `node:crypto`) is swapped at consumer build time
to `sha256digest-browser.ts` (WebCrypto) or `sha256digest-reactnative.ts`
(`@noble/hashes`) via the `browser` / `react-native` fields in `package.json`,
which map the compiled `./dist/sha256digest.js`. When adding new
environment-specific modules, follow this same three-variant + package.json-map
pattern.

### Note on `@interop/jsonld-signatures`

It ships a hand-written `index.d.ts` with named exports, but its runtime is
CommonJS that does not expose those as ESM named exports. Import it as a
**default** import (`import jsigs from '@interop/jsonld-signatures'`) and read
`jsigs.suites`, `jsigs.purposes`, `jsigs.sign`, etc. -- named imports compile
but fail at runtime.

## Toolchain & Project Layout

### Package Manager

Use `pnpm` (not `npm` or `yarn`). The lockfile is `pnpm-lock.yaml`. Install deps
with `pnpm install`; run scripts with `pnpm run <script>` or `pnpm <script>`.

### Build

The library is built with `tsc` (not `vite build`). `vite.config.ts` exists only
to configure Vitest and to run `vite dev` as a server for Playwright. Running
`pnpm run build` compiles `src/` to `dist/` via `tsconfig.json`.

### Two tsconfigs

- `tsconfig.json` — library build only; includes `src/**/*`
- `tsconfig.dev.json` — extends the above with `noEmit: true`; adds `test/**/*`, `vite.config.ts`, and
  `playwright.config.ts` so ESLint's type-aware rules cover all files

Do not add test files to `tsconfig.json` — they would be emitted into `dist/`.

### Tests

- `test/node/` — Vitest unit tests (`pnpm run test-node`); run in Node
- `test/browser/` — Playwright tests (`pnpm run test-browser`); run in real
  Chromium via a Vite dev server (`pnpm run dev`)

The `dev` script exists solely to give Playwright a server that can serve and
transform TypeScript source files on the fly. There is no browser app.

### ESM & import paths

The package is ESM-only (`"type": "module"`). Local imports must use the `.js`
extension even though source files are `.ts` — e.g.
`import { Example } from '../../src/index.js'`. TypeScript's `moduleResolution: Bundler`
resolves these to the `.ts` source at compile time.

## Conventions

Code style, refactoring, JSDoc, comment, and error-handling conventions live in @CONTRIBUTING.md -- follow them.
