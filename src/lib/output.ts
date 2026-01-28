import type {CommandResponse, CommandListResponse, PageInfo, ErrorResponse} from './types.js'

/**
 * Output utilities for consistent JSON formatting.
 * All CLI output goes through these functions for parseable responses.
 */

export const success = <T>(data: T): CommandResponse<T> => ({
  success: true,
  data,
})

export const successList = <T>(data: T[], pageInfo?: PageInfo): CommandListResponse<T> => ({
  success: true,
  data,
  ...(pageInfo && {pageInfo}),
})

export const error = (code: string, message: string, details?: Record<string, unknown>): ErrorResponse => ({
  success: false,
  error: {
    code,
    message,
    ...(details && {details}),
  },
})

/**
 * Print a response as formatted JSON to stdout.
 */
export const print = <T>(response: CommandResponse<T> | CommandListResponse<T>): void => {
  console.log(JSON.stringify(response, null, 2))
}

/**
 * Print raw data as formatted JSON to stdout.
 */
export const printRaw = (data: unknown): void => {
  console.log(JSON.stringify(data, null, 2))
}
