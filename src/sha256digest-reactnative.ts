/*!
 * Copyright (c) 2026 Interop Alliance. All rights reserved.
 * Copyright (c) 2022 Digital Bazaar, Inc. All rights reserved.
 */
import { sha256 } from '@noble/hashes/sha2.js'

/**
 * Hashes a string of data using SHA-256 (React Native variant, pure JS via
 * @noble/hashes -- no WebCrypto or native crypto module needed).
 *
 * @param options {object} - The options to use.
 * @param options.string {string} - The string to hash.
 *
 * @returns {Promise<Uint8Array>} The hash digest.
 */
export async function sha256digest({
  string
}: {
  string: string
}): Promise<Uint8Array> {
  return sha256(new TextEncoder().encode(string))
}
