import * as XLSX from 'xlsx'
import type { Db, PatientPayment } from './db'
import { api } from './db'

interface ImportRow {
  sequenceNumber: number
  fullName: string
  nationalId: string
  phone: string
  amount: number
  receiptNumber: string
  paymentMethod: 'ק' | 'א' | 'ת' | 'מ'
}

export async function importExcelFile(file: File, db: Db): Promise<{ success: boolean; message: string; importedCount?: number }> {
  try {
    // Read the file
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data)
    
    // Extract group name from filename (remove .xlsx extension)
    const groupName = file.name.replace(/\.xlsx$/i, '')
    
    // Create the group
    api.addGroup(db, groupName)
    const group = db.groups.find(g => g.name === groupName)
    if (!group) {
      return { success: false, message: 'Failed to create group' }
    }
    const groupId = group.id
    
    // Process specific worksheets
    const targetSheets = ['07.25', '08.25', '09.25', '10.25', '11.25', '12.25']
    let totalImported = 0
    const processedPayments = new Set<string>() // Track payments to avoid duplicates
    
    for (const sheetName of targetSheets) {
      if (!workbook.SheetNames.includes(sheetName)) {
        continue // Skip if worksheet doesn't exist
      }
      
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 'A' })
      
      // Process rows with sequence numbers 1-15
      for (const row of jsonData) {
        const sequenceNumber = parseInt(row['A'])
        if (!sequenceNumber || sequenceNumber < 1 || sequenceNumber > 15) {
          continue // Skip invalid sequence numbers
        }
        
        // Extract data from columns
        const fullName = row['B']?.toString().trim()
        const nationalId = row['D']?.toString().trim()
        const phone = row['E']?.toString().trim()
        
        // Parse amount carefully - must be a valid number between 50 and 500 (typical payment ranges)
        const amountRaw = row['J']
        let amount = 0
        if (amountRaw !== undefined && amountRaw !== null && amountRaw !== '') {
          const parsed = parseFloat(amountRaw.toString())
          // Only accept reasonable payment amounts (multiples of 50, up to 12 months = 600)
          if (!isNaN(parsed) && parsed >= 50 && parsed <= 600 && parsed % 50 === 0) {
            amount = parsed
          }
        }
        
        const receiptNumber = row['K']?.toString().trim() || ''
        const paymentMethodRaw = row['L']?.toString().trim()
        
        if (!fullName || !nationalId) {
          continue // Skip rows without essential data
        }
        
        // Split name into first and last
        const nameParts = fullName.split(/\s+/)
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''
        
        // Map payment method
        let paymentMethod: 'ק' | 'א' | 'ת' | 'מ' = 'מ' // Default to cash
        if (paymentMethodRaw) {
          const firstChar = paymentMethodRaw[0]
          if (['ק', 'א', 'ת', 'מ'].includes(firstChar)) {
            paymentMethod = firstChar as 'ק' | 'א' | 'ת' | 'מ'
          }
        }
        
        // Check if patient exists, create if not
        let patient = db.patients.find(p => p.nationalId === nationalId)
        if (!patient) {
          api.addPatient(db, {
            nationalId,
            phone: phone || '',
            firstName,
            lastName
          })
          patient = db.patients.find(p => p.nationalId === nationalId)
          if (!patient) continue
        }
        
        // Add patient to group if not already there
        const isInGroup = db.patientsInGroups.some(pig => 
          pig.patientId === patient!.id && pig.groupId === groupId
        )
        if (!isInGroup) {
          api.addPatientToGroup(db, groupId, patient.id, receiptNumber)
        }
        
        // Process payment if amount is provided and receipt number exists
        if (amount > 0 && receiptNumber) {
          // IMPORTANT: Check if this receipt number already exists for this patient
          // This handles multi-month payments that appear in multiple worksheets
          const existingPaymentWithReceipt = db.patientPayments.find(p => 
            p.patientId === patient!.id &&
            p.groupId === groupId &&
            p.receiptNumber === receiptNumber
          )
          
          // If receipt already exists, skip this payment record
          if (existingPaymentWithReceipt) {
            continue
          }
          
          // Calculate payment duration (months)
          const months = Math.round(amount / 50)
          
          // Parse worksheet name to get fromMonth (MM.YY format)
          const fromMonth = sheetName.replace('.', '/')
          
          // Validate and parse the date components
          const [monthStr, yearStr] = fromMonth.split('/')
          const fromMonthNum = parseInt(monthStr)
          const fromYear = parseInt('20' + yearStr) // Assuming 20XX
          
          // Validate month and year are reasonable
          if (isNaN(fromMonthNum) || isNaN(fromYear) || 
              fromMonthNum < 1 || fromMonthNum > 12 || 
              fromYear < 2020 || fromYear > 2030) {
            console.warn(`Invalid date in worksheet ${sheetName}, skipping payment`)
            continue
          }
          
          // Calculate end month
          let toMonthNum = fromMonthNum + months - 1
          let toYear = fromYear
          
          while (toMonthNum > 12) {
            toMonthNum -= 12
            toYear++
          }
          
          const toMonth = `${toMonthNum.toString().padStart(2, '0')}/${toYear}`
          
          // Create payment record
          const today = new Date()
          const paymentDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`
          
          api.addPayment(db, {
            patientId: patient.id,
            groupId,
            fromMonth,
            toMonth,
            paymentDate,
            amount,
            paymentMethod,
            receiptNumber
          })
          
          totalImported++
        }
      }
    }
    
    return { 
      success: true, 
      message: `Successfully imported ${totalImported} payment records for group "${groupName}"`,
      importedCount: totalImported
    }
    
  } catch (error) {
    console.error('Import error:', error)
    return { 
      success: false, 
      message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}