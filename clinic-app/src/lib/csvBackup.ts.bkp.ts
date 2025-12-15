import type { Db } from './db'

/**
 * Convert array of objects to CSV string
 */
function arrayToCSV(data: any[], headers?: string[]): string {
  if (data.length === 0) return ''
  
  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0])
  
  // Create header row
  const headerRow = csvHeaders.join(',')
  
  // Create data rows
  const dataRows = data.map(row => {
    return csvHeaders.map(header => {
      const value = row[header]
      // Handle null/undefined
      if (value === null || value === undefined) return ''
      // Escape values that contain commas, quotes, or newlines
      const stringValue = String(value)
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    }).join(',')
  })
  
  return [headerRow, ...dataRows].join('\n')
}

/**
 * Convert CSV string to array of objects
 */
function csvToArray(csvString: string): any[] {
  if (!csvString || csvString.trim() === '') return []
  
  const lines = csvString.trim().split('\n')
  if (lines.length < 2) return [] // Need at least headers and one data row
  
  // Parse headers
  const headers = parseCSVLine(lines[0])
  
  // Parse data rows
  const data = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length !== headers.length) continue // Skip malformed rows
    
    const row: any = {}
    headers.forEach((header, index) => {
      const value = values[index]
      // Try to parse numbers and booleans
      if (value === '') {
        row[header] = undefined
      } else if (value === 'true') {
        row[header] = true
      } else if (value === 'false') {
        row[header] = false
      } else if (!isNaN(Number(value)) && value !== '') {
        row[header] = Number(value)
      } else {
        row[header] = value
      }
    })
    data.push(row)
  }
  
  return data
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  // Add last field
  result.push(current)
  
  return result
}

/**
 * Export database as CSV files in a single text file
 * remove the Promise<void> from the function signature
 */
export  function exportBackupCSV(): void {
  // Get database directly from localStorage to avoid circular dependency
  const dbStr = localStorage.getItem('phizio-db-v1')
  if (!dbStr) {
    alert('אין נתונים לגיבוי')
    return
  }
  
  const db: Db = JSON.parse(dbStr)
  
  // Create CSV content for each table
  const csvSections = []
  
  // Export each table
  const tables: Array<{ name: string; data: any[] }> = [
    { name: 'STATUSES', data: db.statuses },
    { name: 'THERAPISTS', data: db.therapists },
    { name: 'PATIENTS', data: db.patients },
    { name: 'GROUPS', data: db.groups },
    { name: 'PATIENTS_IN_GROUPS', data: db.patientsInGroups },
    { name: 'THERAPISTS_IN_GROUPS', data: db.therapistsInGroups },
    { name: 'ATTENDANCE', data: db.attendance },
    { name: 'PATIENT_PAYMENTS', data: db.patientPayments }
  ]
  
  for (const table of tables) {
    csvSections.push(`### TABLE: ${table.name} ###`)
    if (table.data.length > 0) {
      csvSections.push(arrayToCSV(table.data))
    } else {
      // For empty tables, just add headers based on the table type
      csvSections.push(getEmptyTableHeaders(table.name))
    }
    csvSections.push('')
  }
  
  const csvContent = csvSections.join('\n')
  
  // Download
  const filename = 'groupsdata'
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
  
  alert('שמור')
}

/**
 * Import database from CSV file
 */
export function importBackupCSV(csvContent: string): boolean {
  try {
    
    // Parse sections
    const sections = csvContent.split(/### TABLE: (\w+) ###/)
    const db: Db = {
      statuses: [],
      therapists: [],
      patients: [],
      groups: [],
      patientsInGroups: [],
      therapistsInGroups: [],
      attendance: [],
      patientPayments: []
    }
    
    // Process each table section
    for (let i = 1; i < sections.length; i += 2) {
      const tableName = sections[i]
      const tableContent = sections[i + 1]?.trim()
      
      if (!tableContent) continue
      
      // Find the CSV content (skip metadata lines)
      const lines = tableContent.split('\n')
      const csvLines = []
      for (const line of lines) {
        if (!line.startsWith('###') && line.trim() !== '') {
          csvLines.push(line)
        }
      }
      
      if (csvLines.length === 0) continue
      
      const csvData = csvLines.join('\n')
      const data = csvToArray(csvData)
      
      // Map to correct property in db object
      switch (tableName) {
        case 'STATUSES':
          db.statuses = data
          break
        case 'THERAPISTS':
          db.therapists = data
          break
        case 'PATIENTS':
          db.patients = data
          break
        case 'GROUPS':
          db.groups = data
          break
        case 'PATIENTS_IN_GROUPS':
          db.patientsInGroups = data
          break
        case 'THERAPISTS_IN_GROUPS':
          db.therapistsInGroups = data
          break
        case 'ATTENDANCE':
          db.attendance = data
          break
        case 'PATIENT_PAYMENTS':
          db.patientPayments = data
          break
      }
    }
    
    // Basic validation - ensure required data exists
    if (!db.statuses || db.statuses.length < 2) {
      console.error('Missing or invalid statuses')
      return false
    }
    
    // Store in localStorage
    localStorage.setItem('phizio-db-v1', JSON.stringify(db))
    
    return true
  } catch (error) {
    console.error('Import CSV backup error:', error)
    return false
  }
}

/**
 * Get empty table headers for tables with no data
 */
function getEmptyTableHeaders(tableName: string): string {
  switch (tableName) {
    case 'STATUSES':
      return 'id,code'
    case 'THERAPISTS':
      return 'id,name,createdAt,updatedAt,statusId'
    case 'PATIENTS':
      return 'id,nationalId,phone,firstName,lastName,createdAt,updatedAt,statusId'
    case 'GROUPS':
      return 'id,name,capacity,available,when,createdAt,updatedAt'
    case 'PATIENTS_IN_GROUPS':
      return 'id,patientId,groupId,receipt,enrolled,createdAt,updatedAt,statusId'
    case 'THERAPISTS_IN_GROUPS':
      return 'id,therapistId,groupId,createdAt,updatedAt,statusId'
    case 'ATTENDANCE':
      return 'id,patientId,groupId,therapistId,date,isMakeup,createdAt'
    case 'PATIENT_PAYMENTS':
      return 'id,patientId,groupId,fromMonth,toMonth,paymentDate,amount,paymentMethod,receiptNumber,createdAt,updatedAt'
    default:
      return ''
  }
}