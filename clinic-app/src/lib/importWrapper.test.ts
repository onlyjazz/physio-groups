import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isImportSupported, importExcelFileWrapper } from './importWrapper'
import type { Db } from './db'

describe('importWrapper', () => {
  describe('isImportSupported', () => {
    let originalWindow: Window | undefined

    beforeEach(() => {
      originalWindow = global.window
    })

    afterEach(() => {
      // Restore original window
      if (originalWindow === undefined) {
        // @ts-ignore
        delete global.window
      } else {
        global.window = originalWindow
      }
    })

    it('should return true when dynamic imports are available in browser environment', () => {
      // Mock browser environment with File API
      global.window = {
        File: class File {}
      } as any

      const result = isImportSupported()
      
      expect(result).toBe(true)
    })

    it('should return false when window is undefined (Node.js environment)', () => {
      // @ts-ignore
      delete global.window

      const result = isImportSupported()
      
      expect(result).toBe(false)
    })

    it('should return false when File API is not available', () => {
      // Mock browser without File API
      global.window = {} as any

      const result = isImportSupported()
      
      expect(result).toBe(false)
    })

    it('should handle exceptions and return false', () => {
      // Save original descriptor if it exists
      const originalDescriptor = Object.getOwnPropertyDescriptor(global, 'window')
      
      // Mock window that throws error when accessed
      Object.defineProperty(global, 'window', {
        get() {
          throw new Error('Cannot access window')
        },
        configurable: true
      })

      const result = isImportSupported()
      
      expect(result).toBe(false)
      
      // Restore original descriptor
      if (originalDescriptor) {
        Object.defineProperty(global, 'window', originalDescriptor)
      } else {
        // @ts-ignore
        delete global.window
      }
    })
  })

  describe('importExcelFileWrapper', () => {
    let mockDb: Db

    beforeEach(() => {
      vi.clearAllMocks()
      
      // Initialize mock database
      mockDb = {
        groups: [],
        patients: [],
        patientPayments: [],
        patientsInGroups: [],
        therapists: [],
        therapistsInGroups: [],
        groupStatuses: [],
        therapistStatuses: [],
        patientStatuses: [],
        waitlist: [],
        attendance: []
      }
    })

    it('should correctly invoke the underlying import function when supported', async () => {
      const mockFile = new File(['test content'], 'TestGroup.xlsx')
      const mockImportResult = {
        success: true,
        message: 'Successfully imported 5 payment records',
        importedCount: 5
      }

      // Mock the dynamic import
      vi.doMock('./excelImport', () => ({
        importExcelFile: vi.fn().mockResolvedValue(mockImportResult)
      }))

      const result = await importExcelFileWrapper(mockFile, mockDb)

      expect(result).toEqual(mockImportResult)
      expect(result.success).toBe(true)
      expect(result.message).toBe('Successfully imported 5 payment records')
      expect(result.importedCount).toBe(5)
    })

    it('should return appropriate message when import is not supported', async () => {
      const mockFile = new File(['test content'], 'TestGroup.xlsx')
      
      // Mock dynamic import failure
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      vi.doMock('./excelImport', () => {
        throw new Error('Module not found')
      })

      const result = await importExcelFileWrapper(mockFile, mockDb)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Excel import is not available in this environment. Please use the desktop version.')
      expect(result.importedCount).toBeUndefined()
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load Excel import module:', expect.any(Error))

      consoleErrorSpy.mockRestore()
    })

    it('should handle import function errors properly', async () => {
      const mockFile = new File(['test content'], 'TestGroup.xlsx')

      // Mock that will make dynamic import throw an error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Clear any previous module mocks
      vi.unmock('./excelImport')
      
      // Mock the dynamic import to throw
      vi.doMock('./excelImport', () => {
        throw new Error('Excel parsing failed')
      })

      const result = await importExcelFileWrapper(mockFile, mockDb)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Excel import is not available in this environment. Please use the desktop version.')
      
      consoleErrorSpy.mockRestore()
    })

    it('should pass through all parameters correctly to the underlying function', async () => {
      const mockFile = new File(['test content'], 'SpecialGroup.xlsx')
      const importExcelFileMock = vi.fn().mockResolvedValue({
        success: true,
        message: 'Import complete',
        importedCount: 3
      })

      // Mock the dynamic import with a spy
      vi.doMock('./excelImport', () => ({
        importExcelFile: importExcelFileMock
      }))

      await importExcelFileWrapper(mockFile, mockDb)

      // Verify the underlying function was called with correct parameters
      expect(importExcelFileMock).toHaveBeenCalledWith(mockFile, mockDb)
      expect(importExcelFileMock).toHaveBeenCalledTimes(1)
    })

    it('should handle network/loading errors during dynamic import', async () => {
      const mockFile = new File(['test content'], 'TestGroup.xlsx')
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Clear any previous module mocks
      vi.unmock('./excelImport')
      
      // Simulate network error during dynamic import
      vi.doMock('./excelImport', () => {
        throw new Error('Network error: Failed to fetch dynamically imported module')
      })

      const result = await importExcelFileWrapper(mockFile, mockDb)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Excel import is not available in this environment. Please use the desktop version.')
      expect(consoleErrorSpy).toHaveBeenCalled()
      // Check that the error was logged (without strict message matching due to Vitest's module mocking behavior)
      expect(consoleErrorSpy.mock.calls[0][0]).toBe('Failed to load Excel import module:')

      consoleErrorSpy.mockRestore()
    })
  })
})