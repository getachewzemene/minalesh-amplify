import { describe, it, expect } from 'vitest'
import { ErrorBoundary } from '@/components/error-boundary'

describe('ErrorBoundary', () => {
  it('exports ErrorBoundary component', () => {
    expect(ErrorBoundary).toBeDefined()
    expect(typeof ErrorBoundary).toBe('function')
  })

  it('has getDerivedStateFromError static method', () => {
    expect(ErrorBoundary.getDerivedStateFromError).toBeDefined()
    const error = new Error('Test error')
    const state = ErrorBoundary.getDerivedStateFromError(error)
    expect(state.hasError).toBe(true)
    expect(state.error).toBe(error)
  })

  it('initial state has no error', () => {
    const instance = new ErrorBoundary({ children: null })
    expect(instance.state.hasError).toBe(false)
    expect(instance.state.error).toBe(null)
  })
})
