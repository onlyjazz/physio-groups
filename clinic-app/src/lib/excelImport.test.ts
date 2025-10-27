import { describe, it, expect, vi, beforeEach } from 'vitest'
import { importExcelFile } from './excelImport'
import type { Db, Patient, Group, PatientPayment } from './db'
import { api } from './db'
import * as XLSX from 'xlsx'

// Mock XLSX module
vi.mock('xlsx', () => ({
  read: vi.fn(),
  utils: {
    sheet_to_json: vi.fn()
  }
}))

// Mock the API
vi.mock('./db', () => ({
  api: {
    addGroup: vi.fn(),
    addPatient: vi.fn(),
    addPayment: vi.fn(),
    addPatientToGroup: vi.fn()
  }
}))

describe('importExcelFile', () => {
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

  describe('Patient Data Extraction', () => {
    it('should correctly extract patient data from standard Excel row structure', async () => {
      const mockFile = {
        name: 'TestGroup.xlsx',
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0))
      } as unknown as File
      const mockWorkbook = {
        SheetNames: ['07.25'],
        Sheets: {
          '07.25': {}
        }
      }
      
      const mockRows = [
        // Header row
        { A: '#', B: 'שם מלא', D: 'ת.ז.', E: 'טלפון', J: 'סכום תשלום', K: 'מספר קבלה', L: 'אופן התשלום' },
        // Data row 1
        { A: 1, B: 'ישראל ישראלי', D: '123456789', E: '0501234567', J: 150, K: 'R001', L: 'ק' },
        // Data row 2 - different name structure
        { A: 2, B: 'מרים כהן לוי', D: '987654321', E: '0521234567', J: 200, K: 'R002', L: 'א' }
      ]

      vi.mocked(XLSX.read).mockReturnValue(mockWorkbook)
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(mockRows)
      vi.mocked(api.addGroup).mockImplementation((db, name) => {
        db.groups.push({ id: 'group1', name, createdAt: Date.now(), updatedAt: Date.now() })
      })
      vi.mocked(api.addPatient).mockImplementation((db, data) => {
        const patient: Patient = {
          id: `patient${db.patients.length + 1}`,
          ...data,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
        db.patients.push(patient)
      })

      await importExcelFile(mockFile, mockDb)

      // Check that patients were added with correct data
      expect(api.addPatient).toHaveBeenCalledTimes(2)
      expect(api.addPatient).toHaveBeenCalledWith(mockDb, {
        nationalId: '123456789',
        phone: '0501234567',
        firstName: 'ישראל',
        lastName: 'ישראלי'
      })
      expect(api.addPatient).toHaveBeenCalledWith(mockDb, {
        nationalId: '987654321',
        phone: '0521234567',
        firstName: 'מרים',
        lastName: 'כהן לוי'
      })
    })

    it('should handle rows with missing phone numbers', async () => {
      const mockFile = {
        name: 'TestGroup.xlsx',
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0))
      } as unknown as File
      const mockWorkbook = {
        SheetNames: ['07.25'],
        Sheets: { '07.25': {} }
      }
      
      const mockRows = [
        { A: 1, B: 'דוד כהן', D: '111111111', E: undefined, J: 100, K: 'R003', L: 'מ' },
        { A: 2, B: 'שרה לוי', D: '222222222', E: '', J: 100, K: 'R004', L: 'ת' }
      ]

      vi.mocked(XLSX.read).mockReturnValue(mockWorkbook)
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(mockRows)
      vi.mocked(api.addGroup).mockImplementation((db, name) => {
        db.groups.push({ id: 'group1', name, createdAt: Date.now(), updatedAt: Date.now() })
      })

      await importExcelFile(mockFile, mockDb)

      expect(api.addPatient).toHaveBeenCalledWith(mockDb, expect.objectContaining({
        nationalId: '111111111',
        phone: '',
        firstName: 'דוד',
        lastName: 'כהן'
      }))
      expect(api.addPatient).toHaveBeenCalledWith(mockDb, expect.objectContaining({
        nationalId: '222222222',
        phone: '',
        firstName: 'שרה',
        lastName: 'לוי'
      }))
    })

    it('should skip rows with invalid sequence numbers', async () => {
      const mockFile = {
        name: 'TestGroup.xlsx',
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0))
      } as unknown as File
      const mockWorkbook = {
        SheetNames: ['07.25'],
        Sheets: { '07.25': {} }
      }
      
      const mockRows = [
        { A: 0, B: 'Invalid Zero', D: '000000000', E: '0500000000' },
        { A: 16, B: 'Invalid High', D: '999999999', E: '0599999999' },
        { A: 'text', B: 'Invalid Text', D: '888888888', E: '0588888888' },
        { A: 5, B: 'Valid Entry', D: '555555555', E: '0555555555', J: 100, K: 'R005', L: 'ק' }
      ]

      vi.mocked(XLSX.read).mockReturnValue(mockWorkbook)
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(mockRows)
      vi.mocked(api.addGroup).mockImplementation((db, name) => {
        db.groups.push({ id: 'group1', name, createdAt: Date.now(), updatedAt: Date.now() })
      })

      await importExcelFile(mockFile, mockDb)

      // Only the valid entry should be processed
      expect(api.addPatient).toHaveBeenCalledTimes(1)
      expect(api.addPatient).toHaveBeenCalledWith(mockDb, expect.objectContaining({
        nationalId: '555555555'
      }))
    })
  })

  describe('Payment Processing', () => {
    it('should handle unique receipt numbers correctly across multiple worksheets', async () => {
      const mockFile = {
        name: 'TestGroup.xlsx',
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0))
      } as unknown as File
      const mockWorkbook = {
        SheetNames: ['07.25', '08.25'],
        Sheets: {
          '07.25': {},
          '08.25': {}
        }
      }
      
      vi.mocked(XLSX.read).mockReturnValue(mockWorkbook)
      
      // Mock different data for each sheet
      vi.mocked(XLSX.utils.sheet_to_json)
        .mockReturnValueOnce([
          // July sheet
          { A: 1, B: 'משה כהן', D: '111111111', E: '0501111111', J: 150, K: 'R100', L: 'ק' }
        ])
        .mockReturnValueOnce([
          // August sheet - same receipt number (should not create duplicate)
          { A: 1, B: 'משה כהן', D: '111111111', E: '0501111111', J: 150, K: 'R100', L: 'ק' }
        ])

      vi.mocked(api.addGroup).mockImplementation((db, name) => {
        db.groups.push({ id: 'group1', name, createdAt: Date.now(), updatedAt: Date.now() })
      })
      vi.mocked(api.addPatient).mockImplementation((db, data) => {
        const patient: Patient = {
          id: 'patient1',
          ...data,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
        db.patients.push(patient)
      })

      const result = await importExcelFile(mockFile, mockDb)

      // Should only create one payment despite receipt appearing in two sheets
      expect(api.addPayment).toHaveBeenCalledTimes(1)
      expect(api.addPayment).toHaveBeenCalledWith(mockDb, expect.objectContaining({
        receiptNumber: 'R100',
        amount: 150
      }))
      expect(result.importedCount).toBe(1)
    })

    it('should calculate payment periods correctly based on amount', async () => {
      const mockFile = {
        name: 'TestGroup.xlsx',
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0))
      } as unknown as File
      const mockWorkbook = {
        SheetNames: ['07.25'],
        Sheets: { '07.25': {} }
      }
      
      const mockRows = [
        // 50 NIS = 1 month
        { A: 1, B: 'Patient One', D: '111111111', E: '0501111111', J: 50, K: 'R201', L: 'ק' },
        // 150 NIS = 3 months
        { A: 2, B: 'Patient Two', D: '222222222', E: '0502222222', J: 150, K: 'R202', L: 'א' },
        // 300 NIS = 6 months
        { A: 3, B: 'Patient Three', D: '333333333', E: '0503333333', J: 300, K: 'R203', L: 'ת' }
      ]

      vi.mocked(XLSX.read).mockReturnValue(mockWorkbook)
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(mockRows)
      vi.mocked(api.addGroup).mockImplementation((db, name) => {
        db.groups.push({ id: 'group1', name, createdAt: Date.now(), updatedAt: Date.now() })
      })

      await importExcelFile(mockFile, mockDb)

      // Check first payment (1 month)
      expect(api.addPayment).toHaveBeenCalledWith(mockDb, expect.objectContaining({
        receiptNumber: 'R201',
        fromMonth: '07/2025',
        toMonth: '07/2025',
        amount: 50
      }))

      // Check second payment (3 months)
      expect(api.addPayment).toHaveBeenCalledWith(mockDb, expect.objectContaining({
        receiptNumber: 'R202',
        fromMonth: '07/2025',
        toMonth: '09/2025',
        amount: 150
      }))

      // Check third payment (6 months)
      expect(api.addPayment).toHaveBeenCalledWith(mockDb, expect.objectContaining({
        receiptNumber: 'R203',
        fromMonth: '07/2025',
        toMonth: '12/2025',
        amount: 300
      }))
    })

    it('should handle year rollover in payment periods correctly', async () => {
      const mockFile = {
        name: 'TestGroup.xlsx',
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0))
      } as unknown as File
      const mockWorkbook = {
        SheetNames: ['11.25'],
        Sheets: { '11.25': {} }
      }
      
      const mockRows = [
        // 150 NIS starting November = 3 months (Nov, Dec, Jan)
        { A: 1, B: 'Year Rollover', D: '444444444', E: '0504444444', J: 150, K: 'R301', L: 'מ' }
      ]

      vi.mocked(XLSX.read).mockReturnValue(mockWorkbook)
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(mockRows)
      vi.mocked(api.addGroup).mockImplementation((db, name) => {
        db.groups.push({ id: 'group1', name, createdAt: Date.now(), updatedAt: Date.now() })
      })

      await importExcelFile(mockFile, mockDb)

      expect(api.addPayment).toHaveBeenCalledWith(mockDb, expect.objectContaining({
        fromMonth: '11/2025',
        toMonth: '01/2026',  // Should roll over to next year
        amount: 150
      }))
    })

    it('should ignore invalid amounts', async () => {
      const mockFile = {
        name: 'TestGroup.xlsx',
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0))
      } as unknown as File
      const mockWorkbook = {
        SheetNames: ['07.25'],
        Sheets: { '07.25': {} }
      }
      
      const mockRows = [
        { A: 1, B: 'Too Low', D: '111111111', E: '0501111111', J: 40, K: 'R401', L: 'ק' },  // < 50
        { A: 2, B: 'Too High', D: '222222222', E: '0502222222', J: 700, K: 'R402', L: 'א' }, // > 600
        { A: 3, B: 'Not a Number', D: '333333333', E: '0503333333', J: 'text', K: 'R403', L: 'ת' },
        { A: 4, B: 'Valid Amount', D: '444444444', E: '0504444444', J: 100, K: 'R404', L: 'מ' }
      ]

      vi.mocked(XLSX.read).mockReturnValue(mockWorkbook)
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(mockRows)
      vi.mocked(api.addGroup).mockImplementation((db, name) => {
        db.groups.push({ id: 'group1', name, createdAt: Date.now(), updatedAt: Date.now() })
      })

      await importExcelFile(mockFile, mockDb)

      // Only the valid payment should be created
      expect(api.addPayment).toHaveBeenCalledTimes(1)
      expect(api.addPayment).toHaveBeenCalledWith(mockDb, expect.objectContaining({
        receiptNumber: 'R404',
        amount: 100
      }))
    })
  })

  describe('Payment Method Mapping', () => {
    it('should correctly map payment methods including ה to מ conversion', async () => {
      const mockFile = {
        name: 'TestGroup.xlsx',
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0))
      } as unknown as File
      const mockWorkbook = {
        SheetNames: ['07.25'],
        Sheets: { '07.25': {} }
      }
      
      const mockRows = [
        { A: 1, B: 'Check Payment', D: '111111111', E: '0501111111', J: 100, K: 'R501', L: 'ק' },
        { A: 2, B: 'Bank Transfer', D: '222222222', E: '0502222222', J: 100, K: 'R502', L: 'א' },
        { A: 3, B: 'Credit Card', D: '333333333', E: '0503333333', J: 100, K: 'R503', L: 'ת' },
        { A: 4, B: 'Cash', D: '444444444', E: '0504444444', J: 100, K: 'R504', L: 'מ' },
        { A: 5, B: 'Cash (ה)', D: '555555555', E: '0505555555', J: 100, K: 'R505', L: 'ה' }
      ]

      vi.mocked(XLSX.read).mockReturnValue(mockWorkbook)
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(mockRows)
      vi.mocked(api.addGroup).mockImplementation((db, name) => {
        db.groups.push({ id: 'group1', name, createdAt: Date.now(), updatedAt: Date.now() })
      })

      await importExcelFile(mockFile, mockDb)

      // Check each payment method
      expect(api.addPayment).toHaveBeenCalledWith(mockDb, expect.objectContaining({
        receiptNumber: 'R501',
        paymentMethod: 'ק'
      }))
      expect(api.addPayment).toHaveBeenCalledWith(mockDb, expect.objectContaining({
        receiptNumber: 'R502',
        paymentMethod: 'א'
      }))
      expect(api.addPayment).toHaveBeenCalledWith(mockDb, expect.objectContaining({
        receiptNumber: 'R503',
        paymentMethod: 'ת'
      }))
      expect(api.addPayment).toHaveBeenCalledWith(mockDb, expect.objectContaining({
        receiptNumber: 'R504',
        paymentMethod: 'מ'
      }))
      // ה should be converted to מ
      expect(api.addPayment).toHaveBeenCalledWith(mockDb, expect.objectContaining({
        receiptNumber: 'R505',
        paymentMethod: 'מ'
      }))
    })

    it('should default to מ for invalid or missing payment methods', async () => {
      const mockFile = {
        name: 'TestGroup.xlsx',
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0))
      } as unknown as File
      const mockWorkbook = {
        SheetNames: ['07.25'],
        Sheets: { '07.25': {} }
      }
      
      const mockRows = [
        { A: 1, B: 'Invalid Method', D: '111111111', E: '0501111111', J: 100, K: 'R601', L: 'X' },
        { A: 2, B: 'Empty Method', D: '222222222', E: '0502222222', J: 100, K: 'R602', L: '' },
        { A: 3, B: 'Missing Method', D: '333333333', E: '0503333333', J: 100, K: 'R603' }
      ]

      vi.mocked(XLSX.read).mockReturnValue(mockWorkbook)
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(mockRows)
      vi.mocked(api.addGroup).mockImplementation((db, name) => {
        db.groups.push({ id: 'group1', name, createdAt: Date.now(), updatedAt: Date.now() })
      })

      await importExcelFile(mockFile, mockDb)

      // All should default to 'מ'
      expect(api.addPayment).toHaveBeenCalledTimes(3)
      expect(api.addPayment).toHaveBeenCalledWith(mockDb, expect.objectContaining({
        receiptNumber: 'R601',
        paymentMethod: 'מ'
      }))
      expect(api.addPayment).toHaveBeenCalledWith(mockDb, expect.objectContaining({
        receiptNumber: 'R602',
        paymentMethod: 'מ'
      }))
      expect(api.addPayment).toHaveBeenCalledWith(mockDb, expect.objectContaining({
        receiptNumber: 'R603',
        paymentMethod: 'מ'
      }))
    })
  })

  describe('Column Detection', () => {
    it('should detect column headers dynamically', async () => {
      const mockFile = {
        name: 'TestGroup.xlsx',
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0))
      } as unknown as File
      const mockWorkbook = {
        SheetNames: ['07.25'],
        Sheets: { '07.25': {} }
      }
      
      const mockRows = [
        // Empty row
        {},
        // Header row at position 2 with different column positions
        { A: '#', B: 'שם', D: 'ת.ז.', E: 'טלפון', H: 'סכום תשלום', I: 'מספר קבלה', M: 'אופן התשלום' },
        // Data row using detected columns
        { A: 1, B: 'Dynamic Columns', D: '777777777', E: '0507777777', H: 200, I: 'R701', M: 'ת' }
      ]

      vi.mocked(XLSX.read).mockReturnValue(mockWorkbook)
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(mockRows)
      vi.mocked(api.addGroup).mockImplementation((db, name) => {
        db.groups.push({ id: 'group1', name, createdAt: Date.now(), updatedAt: Date.now() })
      })

      await importExcelFile(mockFile, mockDb)

      // Should correctly use detected columns H, I, M instead of defaults J, K, L
      expect(api.addPayment).toHaveBeenCalledWith(mockDb, expect.objectContaining({
        receiptNumber: 'R701',
        amount: 200,
        paymentMethod: 'ת'
      }))
    })
  })

  describe('Error Handling', () => {
    it('should return error when group creation fails', async () => {
      const mockFile = {
        name: 'TestGroup.xlsx',
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0))
      } as unknown as File
      const mockWorkbook = {
        SheetNames: ['07.25'],
        Sheets: { '07.25': {} }
      }

      vi.mocked(XLSX.read).mockReturnValue(mockWorkbook)
      vi.mocked(api.addGroup).mockImplementation(() => {
        // Don't add group to db
      })

      const result = await importExcelFile(mockFile, mockDb)

      expect(result.success).toBe(false)
      expect(result.message).toBe('Failed to create group')
    })

    it('should handle XLSX read errors gracefully', async () => {
      const mockFile = {
        name: 'TestGroup.xlsx',
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0))
      } as unknown as File
      
      vi.mocked(XLSX.read).mockImplementation(() => {
        throw new Error('Invalid Excel file')
      })

      const result = await importExcelFile(mockFile, mockDb)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Invalid Excel file')
    })

    it('should skip worksheets that do not exist', async () => {
      const mockFile = {
        name: 'TestGroup.xlsx',
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0))
      } as unknown as File
      const mockWorkbook = {
        SheetNames: ['07.25'],  // Only July exists
        Sheets: {
          '07.25': {}
        }
      }
      
      const mockRows = [
        { A: 1, B: 'Only July', D: '888888888', E: '0508888888', J: 100, K: 'R801', L: 'ק' }
      ]

      vi.mocked(XLSX.read).mockReturnValue(mockWorkbook)
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(mockRows)
      vi.mocked(api.addGroup).mockImplementation((db, name) => {
        db.groups.push({ id: 'group1', name, createdAt: Date.now(), updatedAt: Date.now() })
      })

      const consoleSpy = vi.spyOn(console, 'log')

      await importExcelFile(mockFile, mockDb)

      // Should log messages about missing worksheets
      expect(consoleSpy).toHaveBeenCalledWith('Worksheet 08.25 not found, skipping')
      expect(consoleSpy).toHaveBeenCalledWith('Worksheet 09.25 not found, skipping')
      
      // Should still process the existing worksheet
      expect(api.addPayment).toHaveBeenCalledTimes(1)
    })
  })
})