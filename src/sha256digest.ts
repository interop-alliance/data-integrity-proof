/*!
 * Copyright (c) 2026 Interop Alliance. All rights reserved.
 * Copyright (c) 2022 Digital Bazaar, Inc. All rights reserved.
 */
import { createHash } from 'node:crypto'

/**
 * Hashes a string of data using SHA-256 (Node.js variant).
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
  return new Uint8Array(createHash('sha256').update(string).digest())
}
