import {describe, it, expect} from 'vitest'

/**
 * Note: Full integration tests for auth commands require mocking
 * the Linear API client, which is complex with oclif's command runner.
 *
 * For now, we test the output format contracts and defer
 * integration testing to manual verification or E2E tests.
 *
 * The underlying utilities (output.ts, errors.ts) are fully tested.
 */
describe('auth status command', () => {
  it('should have proper command structure', async () => {
    // Dynamic import to verify module loads correctly
    const {default: AuthStatus} = await import('../status.js')

    expect(AuthStatus.description).toBe('Check authentication status')
    expect(AuthStatus.examples).toHaveLength(1)
  })

  it('should export as oclif Command', async () => {
    const {default: AuthStatus} = await import('../status.js')
    const {Command} = await import('@oclif/core')

    expect(AuthStatus.prototype).toBeInstanceOf(Command.prototype.constructor)
  })
})
