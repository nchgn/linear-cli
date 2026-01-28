import {error, print} from './output.js'

/**
 * Standard error codes for the CLI.
 */
export const ErrorCodes = {
  // Auth errors
  NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
  INVALID_API_KEY: 'INVALID_API_KEY',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // Validation errors
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // API errors
  API_ERROR: 'API_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',

  // System errors
  CONFIG_ERROR: 'CONFIG_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

/**
 * CLI-specific error class that produces structured JSON output.
 */
export class CliError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'CliError'
  }

  toResponse() {
    return error(this.code, this.message, this.details)
  }

  print() {
    print(this.toResponse())
  }
}

/**
 * Map error message patterns to structured error responses.
 */
const ERROR_PATTERNS: Array<{
  test: (message: string) => boolean
  code: ErrorCode
  message: string | null
}> = [
  {
    test: (msg) => msg.includes('401') || msg.includes('Unauthorized'),
    code: ErrorCodes.INVALID_API_KEY,
    message: 'Invalid or expired API key',
  },
  {
    test: (msg) => msg.includes('404') || msg.includes('not found'),
    code: ErrorCodes.NOT_FOUND,
    message: null,
  },
  {
    test: (msg) => msg.includes('429') || msg.includes('rate limit'),
    code: ErrorCodes.RATE_LIMITED,
    message: 'Rate limit exceeded. Please wait before retrying.',
  },
]

/**
 * Handle any error and convert to structured output.
 */
export const handleError = (err: unknown): void => {
  if (err instanceof CliError) {
    err.print()
    return
  }

  if (err instanceof Error) {
    const matched = ERROR_PATTERNS.find((pattern) => pattern.test(err.message))
    if (matched) {
      print(error(matched.code, matched.message ?? err.message))
      return
    }

    print(error(ErrorCodes.API_ERROR, err.message))
    return
  }

  print(error(ErrorCodes.UNKNOWN_ERROR, 'An unexpected error occurred'))
}
