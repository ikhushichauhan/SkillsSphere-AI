import '@testing-library/jest-dom'
import { toHaveNoViolations } from 'jest-axe'
import { expect } from 'vitest'
import { vi } from 'vitest'

expect.extend(toHaveNoViolations)

// Mock import.meta.env
vi.mock('import.meta.env', () => ({
  VITE_API_URL: 'http://localhost:5000',
}))

// Mock fetch globally
globalThis.fetch = vi.fn()
