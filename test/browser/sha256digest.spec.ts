import { test, expect } from '@playwright/test'

/**
 * Smoke test for the browser isomorphic code path: the WebCrypto-backed
 * SHA-256 digest and base58btc encoding, exercised in real Chromium via the
 * Vite dev server. The full sign/verify suite runs in Node (see test/node).
 */
test('browser sha256digest produces a 32-byte digest', async ({ page }) => {
  await page.goto('/test/index.html')
  const length = await page.evaluate(async () => {
    const { sha256digest } = await import('/src/sha256digest-browser.ts')
    const digest = await sha256digest({ string: 'hello world' })
    return digest.length
  })
  expect(length).toBe(32)
})

test('browser base58btc round-trips bytes', async ({ page }) => {
  await page.goto('/test/index.html')
  const result = await page.evaluate(async () => {
    const { base58btc } = await import('/src/baseX.ts')
    const bytes = new Uint8Array([1, 2, 3, 4, 5])
    const encoded = base58btc.encode(bytes)
    const decoded = base58btc.decode(encoded)
    return { encoded, matches: [...decoded].join(',') === [...bytes].join(',') }
  })
  expect(typeof result.encoded).toBe('string')
  expect(result.matches).toBe(true)
})
