import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import {success, successList, error, print, printRaw} from '../output.js'

describe('output utilities', () => {
  describe('success', () => {
    it('returns success response with data', () => {
      const data = {id: '123', name: 'Test'}
      const result = success(data)

      expect(result).toEqual({
        success: true,
        data: {id: '123', name: 'Test'},
      })
    })

    it('handles null data', () => {
      const result = success(null)

      expect(result).toEqual({
        success: true,
        data: null,
      })
    })

    it('handles array data', () => {
      const result = success([1, 2, 3])

      expect(result).toEqual({
        success: true,
        data: [1, 2, 3],
      })
    })
  })

  describe('successList', () => {
    it('returns list response without pageInfo', () => {
      const data = [{id: '1'}, {id: '2'}]
      const result = successList(data)

      expect(result).toEqual({
        success: true,
        data: [{id: '1'}, {id: '2'}],
      })
    })

    it('returns list response with pageInfo', () => {
      const data = [{id: '1'}]
      const pageInfo = {hasNextPage: true, hasPreviousPage: false, endCursor: 'cursor123'}
      const result = successList(data, pageInfo)

      expect(result).toEqual({
        success: true,
        data: [{id: '1'}],
        pageInfo: {hasNextPage: true, hasPreviousPage: false, endCursor: 'cursor123'},
      })
    })

    it('handles empty array', () => {
      const result = successList([])

      expect(result).toEqual({
        success: true,
        data: [],
      })
    })
  })

  describe('error', () => {
    it('returns error response with code and message', () => {
      const result = error('NOT_FOUND', 'Issue not found')

      expect(result).toEqual({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Issue not found',
        },
      })
    })

    it('returns error response with details', () => {
      const details = {field: 'title', reason: 'required'}
      const result = error('INVALID_INPUT', 'Validation failed', details)

      expect(result).toEqual({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Validation failed',
          details: {field: 'title', reason: 'required'},
        },
      })
    })
  })

  describe('print', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    })

    afterEach(() => {
      consoleSpy.mockRestore()
    })

    it('prints success response as formatted JSON', () => {
      const response = success({id: '123'})
      print(response)

      expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify(response, null, 2))
    })

    it('prints error response as formatted JSON', () => {
      const response = error('NOT_FOUND', 'Not found')
      print(response)

      expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify(response, null, 2))
    })
  })

  describe('printRaw', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    })

    afterEach(() => {
      consoleSpy.mockRestore()
    })

    it('prints raw data as formatted JSON', () => {
      const data = {key: 'value', nested: {a: 1}}
      printRaw(data)

      expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify(data, null, 2))
    })
  })
})
