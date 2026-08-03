# Data Integrity Proof library _(@interop/data-integrity-proof)_

[![Build status](https://img.shields.io/github/actions/workflow/status/interop-alliance/data-integrity-proof/ci.yml)](https://github.com/interop-alliance/data-integrity-proof/actions)
[![NPM Version](https://img.shields.io/npm/v/@interop/data-integrity-proof.svg)](https://npm.im/@interop/data-integrity-proof)

> DataIntegrity library for use with cryptosuites and jsonld-signatures.

This is a TypeScript, isomorphic (Node.js / browser / React Native) fork of
[`@digitalbazaar/data-integrity`](https://github.com/digitalbazaar/data-integrity).
It is written in TypeScript and builds to ESM, swaps the base-encoding and
SHA-256 implementations to per-environment variants (`node:crypto`, WebCrypto,
and `@noble/hashes` for React Native), and uses the `@interop/` forks of its
dependencies.

## Table of Contents

- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [Contribute](#contribute)
- [License](#license)

## Background

For use with [`@interop/jsonld-signatures`](https://github.com/interop-alliance/jsonld-signatures).

See also related specs:

- [Verifiable Credential Data Integrity](https://w3c.github.io/vc-data-integrity/)

## Install

- Node.js 24+, browsers, and React Native are supported.

To install from NPM:

```
pnpm add @interop/data-integrity-proof
```

To install locally (for development):

```
git clone https://github.com/interop-alliance/data-integrity-proof.git
cd data-integrity-proof
pnpm install
```

## Usage

The following code snippet provides a complete example of digitally signing
a verifiable credential using this library:

```typescript
import { Ed25519VerificationKey } from '@interop/ed25519-verification-key'
import { DataIntegrityProof } from '@interop/data-integrity-proof'
import { eddsaRdfc2022 } from '@interop/ed25519-signature'
import jsigs from '@interop/jsonld-signatures'
const {
  purposes: { AssertionProofPurpose }
} = jsigs

// create the unsigned credential
const unsignedCredential = {
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    {
      AlumniCredential: 'https://schema.org#AlumniCredential',
      alumniOf: 'https://schema.org#alumniOf'
    }
  ],
  id: 'http://example.edu/credentials/1872',
  type: ['VerifiableCredential', 'AlumniCredential'],
  issuer: 'https://example.edu/issuers/565049',
  issuanceDate: '2010-01-01T19:23:24Z',
  credentialSubject: {
    id: 'https://example.edu/students/alice',
    alumniOf: 'Example University'
  }
}

// create the keypair to use when signing
const controller = 'https://example.edu/issuers/565049'
const keyPair = await Ed25519VerificationKey.from({
  '@context': 'https://w3id.org/security/multikey/v1',
  type: 'Multikey',
  controller,
  id: controller + '#z6MkwXG2WjeQnNxSoynSGYU8V9j3QzP3JSqhdmkHc6SaVWoT',
  publicKeyMultibase: 'z6MkwXG2WjeQnNxSoynSGYU8V9j3QzP3JSqhdmkHc6SaVWoT',
  secretKeyMultibase:
    'zrv3rbPamVDGvrm7LkYPLWYJ35P9audujKKsWn3x29EUiGwwhdZQd' +
    '1iHhrsmZidtVALBQmhX3j9E5Fvx6Kr29DPt6LH'
})

// create suite
const suite = new DataIntegrityProof({
  signer: keyPair.signer(),
  cryptosuite: eddsaRdfc2022
})

// create signed credential (documentLoader must resolve the key's controller
// document and verification method; see test/node/documentLoader.ts)
const signedCredential = await jsigs.sign(unsignedCredential, {
  suite,
  purpose: new AssertionProofPurpose(),
  documentLoader
})
```

Note: To create or verify proofs using legacy draft data integrity suites, you
must pass `legacyContext: true` when creating a `DataIntegrityProof` instance;
this will cause the appropriate legacy data integrity context
(`https://w3id.org/security/data-integrity/v1`) to be used.

## Contribute

PRs accepted.

See [CONTRIBUTING.md](CONTRIBUTING.md) -- code style and contribution
conventions.

If editing the Readme, please conform to the
[standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License

[MIT License](LICENSE.md) © 2026 Interop Alliance.
