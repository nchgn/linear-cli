import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import {CliError, ErrorCodes, handleError} from '../errors.js'

describe('errors utilities', () => {
  describe('CliError', () => {
    it('creates error with code and message', () => {
      const err = new CliError(ErrorCodes.NOT_FOUND, 'Issue not found')

      expect(err.code).toBe('NOT_FOUND')
      expect(err.message).toBe('Issue not found')
      expect(err.details).toBeUndefined()
      expect(err.name).toBe('CliError')
    })

    it('creates error with details', () => {
      const details = {issueId: 'ENG-123'}
      const err = new CliError(ErrorCodes.NOT_FOUND, 'Issue not found', details)

      expect(err.details).toEqual({issueId: 'ENG-123'})
    })

    it('toResponse returns error response format', () => {
      const err = new CliError(ErrorCodes.INVALID_INPUT, 'Bad input', {
        field: 'title',
      })
      const response = err.toResponse()

      expect(response).toEqual({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Bad input',
          details: {field: 'title'},
        },
      })
    })
  })

  describe('handleError', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    })

    afterEach(() => {
      consoleSpy.mockRestore()
    })

    it('handles CliError', () => {
      const err = new CliError(ErrorCodes.NOT_FOUND, 'Not found')
      handleError(err)

      expect(consoleSpy).toHaveBeenCalled()
      const output = JSON.parse(consoleSpy.mock.calls[0][0] as string)
      expect(output.success).toBe(false)
      expect(output.error.code).toBe('NOT_FOUND')
    })

    it('handles 401 unauthorized errors', () => {
      const err = new Error('Request failed with status 401')
      handleError(err)

      expect(consoleSpy).toHaveBeenCalled()
      const output = JSON.parse(consoleSpy.mock.calls[0][0] as string)
      expect(output.error.code).toBe('INVALID_API_KEY')
    })

    it('handles 404 not found errors', () => {
      const err = new Error('Resource not found')
      handleError(err)

      expect(consoleSpy).toHaveBeenCalled()
      const output = JSON.parse(consoleSpy.mock.calls[0][0] as string)
      expect(output.error.code).toBe('NOT_FOUND')
    })

    it('handles rate limit errors', () => {
      const err = new Error('rate limit exceeded')
      handleError(err)

      expect(consoleSpy).toHaveBeenCalled()
      const output = JSON.parse(consoleSpy.mock.calls[0][0] as string)
      expect(output.error.code).toBe('RATE_LIMITED')
    })

    it('handles generic Error as API_ERROR', () => {
      const err = new Error('Something went wrong')
      handleError(err)

      expect(consoleSpy).toHaveBeenCalled()
      const output = JSON.parse(consoleSpy.mock.calls[0][0] as string)
      expect(output.error.code).toBe('API_ERROR')
      expect(output.error.message).toBe('Something went wrong')
    })

    it('handles unknown error types', () => {
      handleError('string error')

      expect(consoleSpy).toHaveBeenCalled()
      const output = JSON.parse(consoleSpy.mock.calls[0][0] as string)
      expect(output.error.code).toBe('UNKNOWN_ERROR')
    })
  })

  describe('ErrorCodes', () => {
    it('has all expected error codes', () => {
      expect(ErrorCodes.NOT_AUTHENTICATED).toBe('NOT_AUTHENTICATED')
      expect(ErrorCodes.INVALID_API_KEY).toBe('INVALID_API_KEY')
      expect(ErrorCodes.NOT_FOUND).toBe('NOT_FOUND')
      expect(ErrorCodes.ALREADY_EXISTS).toBe('ALREADY_EXISTS')
      expect(ErrorCodes.INVALID_INPUT).toBe('INVALID_INPUT')
      expect(ErrorCodes.MISSING_REQUIRED_FIELD).toBe('MISSING_REQUIRED_FIELD')
      expect(ErrorCodes.API_ERROR).toBe('API_ERROR')
      expect(ErrorCodes.RATE_LIMITED).toBe('RATE_LIMITED')
      expect(ErrorCodes.CONFIG_ERROR).toBe('CONFIG_ERROR')
      expect(ErrorCodes.UNKNOWN_ERROR).toBe('UNKNOWN_ERROR')
    })
  })
})
