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
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data)
    const groupName = file.name.replace(/\.xlsx$/i, '')
    
    api.addGroup(db, groupName)
    const group = db.groups.find(g => g.name === groupName)
    if (!group) {
      return { success: false, message: 'Failed to create group' }
    }
    const groupId = group.id
    
    const targetSheets = ['07.25', '08.25', '09.25', '10.25', '11.25', '12.25']
    let totalImported = 0
    const importLog: string[] = []
    const processedPatients = new Set<string>()
    const receiptMap = new Map<string, any>() // receiptNumber -> payment data
    
    // Process each worksheet
    for (const sheetName of targetSheets) {
      if (!workbook.SheetNames.includes(sheetName)) {
        console.log(`Worksheet ${sheetName} not found, skipping`)
        continue
      }
      
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 'A' })
      const currentMonth = sheetName.replace('.', '/') // Convert 07.25 to 07/25
      const fullYearMonth = `${currentMonth.split('/')[0]}/20${currentMonth.split('/')[1]}` // Convert to 07/2025
      
      console.log(`Processing ${sheetName} with ${jsonData.length} rows`)
      
      // Find column indices by header keywords - headers are typically in row 3 (index 2)
      let amountCol = 'J', receiptCol = 'K', paymentMethodCol = 'L' // defaults
      
      // Search for headers in first few rows
      for (let headerRowIndex = 0; headerRowIndex < Math.min(5, jsonData.length); headerRowIndex++) {
        const headerRow = jsonData[headerRowIndex]
        let foundHeaders = false
        
        if (headerRow) {
          for (const [col, value] of Object.entries(headerRow)) {
            const header = value?.toString() || ''
            if (header.includes('סכום') && header.includes('תשלום')) {
              amountCol = col
              console.log(`Found amount column: ${col} in row ${headerRowIndex + 1}`)
              foundHeaders = true
            } else if (header.includes('מספר') && header.includes('קבלה')) {
              receiptCol = col
              console.log(`Found receipt column: ${col} in row ${headerRowIndex + 1}`)
              foundHeaders = true
            } else if (header.includes('אופן') || header.includes('התשלום') || header.includes('ה/מ/כ')) {
              paymentMethodCol = col
              console.log(`Found payment method column: ${col} in row ${headerRowIndex + 1}`)
            }
          }
        }
        
        if (foundHeaders) break // Stop searching once we find headers
      }

      for (const row of jsonData) {
        const sequenceNumber = parseInt(row['A'])
        if (!sequenceNumber || sequenceNumber < 1 || sequenceNumber > 15) continue

        // Fixed columns for patient data
        const fullName = row['B']?.toString().trim()
        const nationalId = row['D']?.toString().trim()
        const phone = row['E']?.toString().trim()
        
        if (!fullName || !nationalId) continue
        
        // Use detected columns for payment data
        const amountRaw = row[amountCol]
        const receiptNumber = row[receiptCol]?.toString().trim() || ''
        const paymentMethodRaw = row[paymentMethodCol]?.toString().trim()
        
        // Parse amount
        let amount = 0
        if (amountRaw !== undefined && amountRaw !== null && amountRaw !== '') {
          const parsed = parseFloat(amountRaw.toString())
          if (!isNaN(parsed) && parsed >= 50 && parsed <= 600) {
            amount = parsed
          }
        }
        
        // Debug דבורה דילון
        if (nationalId === '104683-8' || fullName?.includes('דבורה דילון')) {
          console.log(`DEBUG ${sheetName}: ${fullName} (${nationalId}), Receipt: ${receiptNumber}, Amount: ${amount}`)
        }

        const nameParts = fullName.split(/\s+/)
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''

        let paymentMethod: 'ק' | 'א' | 'ת' | 'מ' = 'מ'
        if (paymentMethodRaw && ['ק', 'א', 'ת', 'מ', 'ה'].includes(paymentMethodRaw)) {
          // Map 'ה' to 'מ' (cash) as default
          paymentMethod = (paymentMethodRaw === 'ה' ? 'מ' : paymentMethodRaw) as 'ק' | 'א' | 'ת' | 'מ'
        }

        // Create or find patient
        let patient = db.patients.find(p => p.nationalId === nationalId)
        if (!patient) {
          api.addPatient(db, { nationalId, phone: phone || '', firstName, lastName })
          patient = db.patients.find(p => p.nationalId === nationalId)
          if (!patient) continue
        }
        
        processedPatients.add(patient.id)
        
        // Process receipt - only record if first time seeing it
        if (receiptNumber) {
          if (amount > 0) {
            // Only process if we haven't seen this receipt before
            if (!receiptMap.has(receiptNumber)) {
              const monthsCovered = Math.round(amount / 50) // ₪50 per month
              const [fromMonthNum, fromYear] = fullYearMonth.split('/').map(Number)
              
              let toMonthNum = fromMonthNum + monthsCovered - 1
              let toYear = fromYear
              
              while (toMonthNum > 12) {
                toMonthNum -= 12
                toYear++
              }
              
              const fromMonth = fullYearMonth
              const toMonth = `${String(toMonthNum).padStart(2, '0')}/${toYear}`
              
              // Insert receipt (only on first occurrence)
              receiptMap.set(receiptNumber, {
                patientId: patient.id,
                patientName: `${firstName} ${lastName}`,
                amount,
                paymentMethod,
                fromMonth,
                toMonth
              })
              
              console.log(`New receipt ${receiptNumber}: ${firstName} ${lastName}, ${fromMonth} to ${toMonth}, ₪${amount}`)
            }
          } else if (nationalId === '104683-8') {  // Debug דבורה דילון
            console.log(`DEBUG: ${fullName} in ${sheetName} has receipt ${receiptNumber} with amount ${amountRaw}`)
          }
        }
      }
    }
    
    // First create payment records from receipt map
    const today = new Date()
    const paymentDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`
    
    // Group receipts by patient to find first receipt per patient
    const patientFirstReceipt = new Map<string, string>()
    
    for (const [receiptNumber, data] of receiptMap) {
      // Track first receipt for each patient
      if (!patientFirstReceipt.has(data.patientId)) {
        patientFirstReceipt.set(data.patientId, receiptNumber)
      }
      
      // Check if payment already exists
      const existing = db.patientPayments.find(p => 
        p.patientId === data.patientId && 
        p.groupId === groupId && 
        p.receiptNumber === receiptNumber
      )
      
      if (!existing) {
        api.addPayment(db, {
          patientId: data.patientId,
          groupId,
          fromMonth: data.fromMonth,
          toMonth: data.toMonth,
          paymentDate,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          receiptNumber
        })
        totalImported++
        console.log(`Created payment: ${data.patientName}, Receipt ${receiptNumber}, ${data.fromMonth}-${data.toMonth}`)
      }
    }
    
    // Now add all patients to group with their first receipt
    for (const patientId of processedPatients) {
      const isInGroup = db.patientsInGroups.some(pig => pig.patientId === patientId && pig.groupId === groupId)
      if (!isInGroup) {
        const firstReceipt = patientFirstReceipt.get(patientId) || ''
        api.addPatientToGroup(db, groupId, patientId, firstReceipt)
        console.log(`Added patient ${patientId} to group with receipt ${firstReceipt}`)
      }
    }
    
    // Log summary for debugging
    console.log('Import Summary:', importLog)
    
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