/*!
 * Copyright (c) 2026 Interop Alliance. All rights reserved.
 * Copyright (c) 2022 Digital Bazaar, Inc. All rights reserved.
 */

/**
 * Hashes a string of data using SHA-256 (browser variant, via WebCrypto).
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
  const bytes = new TextEncoder().encode(string)
  return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))
}
