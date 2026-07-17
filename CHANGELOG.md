# @interop/data-integrity-proof Changelog

## 3.4.2 -

### Changed

- Update to `@interop/data-integrity-core@8.3.0` and related.

## 3.4.1 - 2026-06-28

### Changed

- Update to latest jsigs and `@interop/data-integrity-core@8.1.0` (json content
  type detection fix).

## 3.4.0 - 2026-06-13

### Changed

- Update to `@interop/data-integrity-core@8.0.0` and related.

## 3.3.1 - 2026-06-09

### Changed

- Update to latest `@interop/jsonld-signatures`.

## 3.3.0 - 2026-06-09

### Changed

- Update to `@interop/data-integrity-core@7.0.0`.

## 3.2.2 - 2026-06-06

### Added

- Add default export to `package.json`.

## 3.2.1 - 2026-06-02

### Changed

- Update to newest `@interop/jsonld-signatures`, add `.vscode/` config,
  fix some test linting issues.

## 3.2.0 - 2026-06-01

### Added

- Export `SignatureSuiteClass`: the constructor contract for a concrete,
  ready-to-instantiate Linked Data signature suite class (e.g.
  `Ed25519Signature2020`), with optional static `CONTEXT` / `CONTEXT_URL`.
  This is the suite-agnostic type consumers (such as `@interop/ezcap`) use to
  accept a `SuiteClass`; it complements `Cryptosuite` (the _instance_ config
  passed into `DataIntegrityProof`).

## 3.1.0 - 2026-06-01

### Changed

- Make `Cryptosuite.name` optional (and `DataIntegrityProof.cryptosuite`
  `string | undefined`). A cryptosuite may omit `name` so the emitted proof
  carries no `cryptosuite` field -- e.g. the legacy `Ed25519Signature2020`
  relabeling, where `matchProof` compares `undefined === undefined`.
- Type proof parameters/returns with `IProofDescription` from
  `@interop/data-integrity-core` (was `any`), except `verifyProof`'s `proof`
  param, kept wide (`any`) to remain assignable to the jsigs `LinkedDataProof`
  base (whose `verifyProof` declares `proof: object`).
- Require `@interop/data-integrity-core` `^6.1.0`.

## 3.0.0 - 2026-06-01

### Changed

- **BREAKING**: Forked from `@digitalcredentials/data-integrity` and renamed to
  `@interop/data-integrity-proof`.
- **BREAKING**: Rewritten in TypeScript; ships ESM only and builds to `dist/`
  via `tsc`. Removed the CommonJS/Karma/Mocha toolchain.
- **BREAKING**: Minimum Node.js version is now 24.
- Switched the package manager to pnpm and the test stack to Vitest (Node) plus
  Playwright (browser).
- Replaced `base58-universal` / `base64url-universal` with `@scure/base`.
- Replaced the React Native SHA-256 implementation (`expo-crypto` +
  `fast-text-encoding`) with `@noble/hashes`; the browser variant continues to
  use WebCrypto and the Node variant continues to use `node:crypto`.
- Swapped dependencies to the `@interop/` forks: `@interop/jsonld-signatures`,
  `@interop/ed25519-verification-key`, `@interop/ed25519-signature`, and
  `@interop/security-document-loader`. Type definitions are reused from
  `@interop/data-integrity-core`.

## 2.6.0 - 2025-04-30

### Added

- adds support for react native

## 2.5.0 - 2024-09-06

### Added

- `verifyProof()` now checks that `expires`, if present, is properly
  formatted.

## 2.4.0 - 2024-09-05

### Added

- `verifyProof()` now checks that `created`, if present, is properly
  formatted.

## 2.3.0 - 2024-08-26

### Changed

- Ensure `verificationMethod` is passed to `createVerifyData`.

## 2.2.0 - 2024-08-01

### Changed

- Improve default canonize options (adding `safe: true` and `base: null`).
- Use `jsonld-signatures@11.3`.

## 2.1.0 - 2024-02-13

### Added

- Add option to pass `date: null` to the `DataIntegrityProof`
  constructor, preventing an auto-generated date from being
  set as the value of the `proof.created` property.

## 2.0.0 - 2023-11-13

### Added

- Add `legacyContext` flag to allow use of legacy context
  `https://w3id.org/security/data-integrity/v1`.

### Changed

- **BREAKING**: Update default `this.contextUrl` to point to
  `https://w3id.org/security/data-integrity/v2`.
- **BREAKING**: Drop support for Node.js < 18.

## 1.5.0 - 2023-11-06

### Changed

- Refactor algorithm check to accommodate `requiredAlgorithm` represented as
  array.

## 1.4.1 - 2023-08-02

### Fixed

- Change JSON-LD context fallback in `canonizeProof` to the document's
  `@context`, adding the suite context only if necessary. This ensures that
  the canonicalized proof is identical in both issuance and verification.

## 1.4.0 - 2023-05-21

### Added

- Allow the VCDM 2.0 context to be used as an alternative to the
  data integrity context for simpler usage with 2.0 VCs.

## 1.3.1 - 2023-05-17

### Fixed

- Ensure custom `createVerifyData` is called in `verifyProof`.

## 1.3.0 - 2023-05-13

### Added

- Add support for `derive` function to be implemented by the given
  `cryptosuite`. The `derive` function is used to derive a new document with
  a new `proof` based on an existing `document` (and `proof`). The `derive`
  function will be used when calling `derive` from `jsonld-signatures`.
- Enable `cryptosuite` to provide custom `createVerifyData`. If provided,
  the cryptosuite's function will be called passing the `cryptosuite` instance
  (that was given to the `DataIntegrityProof` constructor) and the
  `dataIntegrityProof` instance along with the usual parameters for that
  function. The resulting verify data may be either a `Uint8Array` or an
  `object` that will be understood by a compatible `signer`, `verifier`, or
  `createProofValue` custom function.
- Enable `cryptosuite` to provide custom `createProofValue`. If provided,
  the cryptosuite's function will be called passing the `cryptosuite` instance
  (that was given to the `DataIntegrityProof` constructor) and the
  `dataIntegrityProof` instance along with the created `verifyData`, `document`,
  `proof`, `proofSet`, and `documentLoader`. The `verifyData` will be either a
  `Uint8Array` or an `object` based on the default `createVerifyData` function
  or a custom one if the cryptosuite also provides it.

## 1.2.0 - 2023-04-14

### Added

- Add `matchProof()` to override the one in `LinkedDataProof` to check
  cryptosuite value.

## 1.1.0 - 2022-09-20

### Added

- Assertion method validation is to be handled by cryptosuites that
  are responsible for creating verifier interfaces. This assertion
  work was being duplicated in this library but it must already be
  done by the cryptosuite responsible for converting a verification
  method to a verifier interface so it has been removed. Additionally,
  the assertion work being done in this library was too restrictive;
  not allowing cryptosuites to convert key types as needed. This
  library now relinquishes all validation to the
  `cryptosuite.createVerifier` method provided.

## 1.0.0 - 2022-09-08

### Added

- Initial version.
