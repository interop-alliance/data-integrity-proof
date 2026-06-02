/*!
 * Copyright (c) 2026 Interop Alliance. All rights reserved.
 */
import type { ISigner } from '@interop/data-integrity-core'
import type { LinkedDataProof } from '@interop/jsonld-signatures'

/**
 * The constructor contract for a concrete, ready-to-instantiate Linked Data
 * signature suite class -- e.g. `Ed25519Signature2020`, or any
 * {@link DataIntegrityProof} subclass that bakes in its cryptosuite.
 *
 * This is the shape a *consumer* (such as an HTTP zcap client or `jsigs.sign`)
 * is handed and instantiates itself: `new SuiteClass({ signer })`. Unlike
 * {@link Cryptosuite} -- the *instance* configuration passed *into*
 * `new DataIntegrityProof({ cryptosuite })` -- this describes the *class*.
 *
 * The optional static `CONTEXT` / `CONTEXT_URL` fields are a convention added
 * by concrete suites so a consumer can auto-build a document loader from them.
 * The base `DataIntegrityProof` does not carry them, hence they are optional;
 * `CONTEXT` is typed `unknown` to match the suites (which type their static
 * `CONTEXT` that way) and is meant to be narrowed at its consumption site.
 */
export interface SignatureSuiteClass {
  new (options: { date?: Date; signer: ISigner }): LinkedDataProof
  /** Optional suite context document. */
  CONTEXT?: unknown
  /** Optional suite context URL. */
  CONTEXT_URL?: string
}
