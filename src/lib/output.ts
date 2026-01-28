import type {CommandResponse, CommandListResponse, PageInfo, ErrorResponse, OutputFormat} from './types.js'
import {formatOutput, formatTable, formatKeyValue, colors, type ColumnDef} from './formatter.js'

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

/**
 * Print a list of items in the specified format.
 */
export const printList = <T extends object>(
  data: T[],
  format: OutputFormat,
  options: {
    columns?: ColumnDef<T>[]
    primaryKey?: keyof T
    secondaryKey?: keyof T
    pageInfo?: PageInfo
  } = {},
): void => {
  if (format === 'json') {
    print(successList(data, options.pageInfo))
    return
  }

  if (format === 'table' && options.columns) {
    console.log(
      formatTable(
        data as unknown as Record<string, unknown>[],
        options.columns as unknown as ColumnDef<Record<string, unknown>>[],
      ),
    )
    if (options.pageInfo?.hasNextPage) {
      console.log(colors.dim(`\nMore results available. Use --after ${options.pageInfo.endCursor}`))
    }
    return
  }

  if (format === 'plain') {
    console.log(
      formatOutput(format, data as unknown as Record<string, unknown>[], {
        primaryKey: options.primaryKey as keyof Record<string, unknown>,
        secondaryKey: options.secondaryKey as keyof Record<string, unknown>,
      }),
    )
    return
  }

  print(successList(data, options.pageInfo))
}

/**
 * Print a single item in the specified format.
 */
export const printItem = <T extends Record<string, unknown>>(
  data: T,
  format: OutputFormat,
  options: {
    primaryKey?: keyof T
  } = {},
): void => {
  if (format === 'json') {
    print(success(data))
    return
  }

  if (format === 'table') {
    console.log(formatKeyValue(data))
    return
  }

  if (format === 'plain') {
    console.log(String(data[options.primaryKey ?? ('id' as keyof T)] ?? ''))
    return
  }

  print(success(data))
}
