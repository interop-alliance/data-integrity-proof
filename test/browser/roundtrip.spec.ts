import { test, expect } from '@playwright/test'

/**
 * Exercises the full sign + verify path in real Chromium, to confirm the
 * library and its dependency chain actually work in a browser bundle. The Vite
 * dev server applies the package.json `browser` field swap (Node `node:crypto`
 * SHA-256 to the WebCrypto variant), as downstream browser bundlers do.
 */
test('full sign/verify roundtrip works in the browser', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', err => errors.push(String(err)))

  await page.goto('/test/index.html')
  const result = await page.evaluate(async () => {
    const { runRoundtrip } = await import('/test/browser/roundtrip.entry.ts')
    return runRoundtrip()
  })

  expect(errors, errors.join('\n')).toHaveLength(0)
  expect(result.proofValue).toMatch(/^z/)
  expect(result.verified).toBe(true)
})
