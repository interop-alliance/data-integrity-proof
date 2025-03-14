/*
 * Copyright (c) 2025 Digital Credentials Consortium - React Native addition.
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
import * as Crypto from 'expo-crypto';
import 'fast-text-encoding';

/**
   * Hashes a string of data using SHA-256.
   *
   * @param {string} string - The string to hash.
   *
   * @returns {Uint8Array} The hash digest.
   */
export async function sha256digest({string}) {
  const bytes = new TextEncoder().encode(string);
  return new Uint8Array(
    await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, bytes));
}

