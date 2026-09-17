import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// vitest.config.ts sets `globals: false`, so @testing-library/react's
// built-in auto-cleanup (which checks for a global `afterEach`) never
// registers itself — every test in a file would otherwise render into
// the same unmounted DOM, causing duplicate-element query failures in
// any file with more than one test that calls render(). Register it
// explicitly here instead.
afterEach(() => {
  cleanup()
})
