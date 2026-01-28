/**
 * Standard output types for all CLI commands.
 * All outputs are JSON-formatted for easy parsing by LLMs.
 */

export interface PageInfo {
  hasNextPage: boolean
  hasPreviousPage: boolean
  startCursor?: string
  endCursor?: string
}

export interface SuccessResponse<T> {
  success: true
  data: T
}

export interface SuccessListResponse<T> {
  success: true
  data: T[]
  pageInfo?: PageInfo
}

export interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

export type CommandResponse<T> = SuccessResponse<T> | ErrorResponse
export type CommandListResponse<T> = SuccessListResponse<T> | ErrorResponse

export interface ConfigFile {
  apiKey?: string
  defaultTeamId?: string
}
