import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// The Playwright tests run against the `vite` dev server, which serves raw
// `src/` TypeScript. The package.json `browser` field only remaps the compiled
// `dist/` paths, so the dev server would otherwise load the Node `node:crypto`
// SHA-256 variant in the browser. Mirror the `browser` field here so the dev
// server swaps in the WebCrypto variant -- exactly as downstream browser
// bundlers (Vite, webpack, esbuild, Rollup) do for real consumers of `dist/`.
// This alias is intentionally NOT applied under Vitest, so Node tests continue
// to exercise the real `node:crypto` implementation.
const isVitest = !!process.env.VITEST

export default defineConfig({
  resolve: {
    alias: isVitest
      ? []
      : [
          {
            find: /^\.\/sha256digest\.js$/,
            replacement: fileURLToPath(
              new URL('./src/sha256digest-browser.ts', import.meta.url)
            )
          }
        ]
  },
  test: {
    include: ['test/node/**/*.test.ts', 'src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts']
    }
  }
})
