<script lang="ts">
  import { load, type Db, type Group, type Patient, type Therapist, type Attendance, type PatientsInGroups } from '../lib/db'
  
  let db: Db = load()
  let selectedMonth: string = ''
  let selectedYear: string = ''
  let reportData: GroupReportData[] = []
  let showReport = false
  
  interface AttendanceRecord {
    patientName: string
    patientId: string
    date: string
    receipt: string
    therapistName: string
  }
  
  interface GroupReportData {
    group: Group
    therapistName: string
    attendance: AttendanceRecord[]
  }
  
  // Get current month and year as defaults
  const now = new Date()
  const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0')
  const currentYear = now.getFullYear().toString()
  
  selectedMonth = currentMonth
  selectedYear = currentYear
  
  function getMonthName(month: string): string {
    const monthNames = [
      'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
      'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
    ]
    return monthNames[parseInt(month) - 1] || ''
  }
  
  function generateReport() {
    if (!selectedMonth || !selectedYear) {
      alert('נא לבחור חודש ושנה')
      return
    }
    
    db = load()
    reportData = []
    
    // Filter attendance records for the selected month/year
    const monthStart = `${selectedYear}-${selectedMonth}-01`
    const monthEnd = `${selectedYear}-${selectedMonth}-31`
    
    const monthAttendance = db.attendance.filter(a => {
      return a.date >= monthStart && a.date <= monthEnd
    })
    
    // Group attendance by group ID
    const attendanceByGroup = new Map<string, Attendance[]>()
    monthAttendance.forEach(a => {
      if (!attendanceByGroup.has(a.groupId)) {
        attendanceByGroup.set(a.groupId, [])
      }
      attendanceByGroup.get(a.groupId)!.push(a)
    })
    
    // Process each group with attendance
    attendanceByGroup.forEach((groupAttendance, groupId) => {
      const group = db.groups.find(g => g.id === groupId)
      if (!group) return
      
      // Get group's therapist
      const therapistInGroup = db.therapistsInGroups.find(tig => tig.groupId === groupId)
      const groupTherapist = therapistInGroup ? 
        db.therapists.find(t => t.id === therapistInGroup.therapistId) : null
      const therapistName = groupTherapist?.name || 'לא הוקצה'
      
      // Build attendance records
      const attendanceRecords: AttendanceRecord[] = []
      
      groupAttendance.forEach(a => {
        const patient = db.patients.find(p => p.id === a.patientId)
        if (!patient) return
        
        // Get patient's receipt from PatientsInGroups
        const patientInGroup = db.patientsInGroups.find(pig => 
          pig.patientId === a.patientId && pig.groupId === groupId
        )
        const receipt = patientInGroup?.receipt || ''
        
        // Get therapist who took attendance
        const attendanceTherapist = db.therapists.find(t => t.id === a.therapistId)
        const attendanceTherapistName = attendanceTherapist?.name || ''
        
        // Format date as DD/MM/YYYY
        const [year, month, day] = a.date.split('-')
        const formattedDate = `${day}/${month}/${year}`
        
        attendanceRecords.push({
          patientName: `${patient.firstName} ${patient.lastName}`,
          patientId: patient.nationalId,
          date: formattedDate,
          receipt: receipt,
          therapistName: attendanceTherapistName
        })
      })
      
      // Sort attendance records by date and then by patient name
      attendanceRecords.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date)
        if (dateCompare !== 0) return dateCompare
        return a.patientName.localeCompare(b.patientName)
      })
      
      reportData.push({
        group,
        therapistName,
        attendance: attendanceRecords
      })
    })
    
    // Sort groups by name
    reportData.sort((a, b) => a.group.name.localeCompare(b.group.name))
    
    showReport = true
  }
  
  function exportToCSV() {
    if (reportData.length === 0) {
      alert('אין נתונים לייצוא')
      return
    }
    
    let csv = '\ufeff' // BOM for UTF-8
    csv += `ריכוז חודשי לקבוצות לחודש ${getMonthName(selectedMonth)} ${selectedYear}\n\n`
    
    reportData.forEach(groupData => {
      csv += `\nקבוצה: ${groupData.group.name}\n`
      csv += `מנחה: ${groupData.therapistName}\n`
      csv += `יום: ${groupData.group.when}\n\n`
      
      // Add headers
      csv += 'שם מטופל,ת.ז.,תאריך נוכחות,קבלה,מנחה\n'
      
      // Add attendance records
      groupData.attendance.forEach(record => {
        csv += `"${record.patientName}","${record.patientId}","${record.date}","${record.receipt}","${record.therapistName}"\n`
      })
    })
    
    // Create and download the file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `monthly_report_${selectedMonth}_${selectedYear}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  function printReport() {
    window.print()
  }
</script>

<div class="mx-auto max-w-7xl">
  <h1 class="text-2xl font-bold mb-6 text-right">ריכוז חודשי לקבוצות</h1>
  
  {#if !showReport}
    <div class="bg-white rounded-lg shadow p-6">
      <div class="grid grid-cols-2 gap-4 max-w-md mx-auto">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2 text-right">שנה</label>
          <input
            type="number"
            bind:value={selectedYear}
            min="2020"
            max="2030"
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
            placeholder="2025"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2 text-right">חודש</label>
          <select
            bind:value={selectedMonth}
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
          >
            <option value="01">ינואר</option>
            <option value="02">פברואר</option>
            <option value="03">מרץ</option>
            <option value="04">אפריל</option>
            <option value="05">מאי</option>
            <option value="06">יוני</option>
            <option value="07">יולי</option>
            <option value="08">אוגוסט</option>
            <option value="09">ספטמבר</option>
            <option value="10">אוקטובר</option>
            <option value="11">נובמבר</option>
            <option value="12">דצמבר</option>
          </select>
        </div>
      </div>
      
      <div class="mt-6 text-center">
        <button
          on:click={generateReport}
          class="big-blue-button mx-auto"
        >
          הצג דוח
        </button>
      </div>
    </div>
  {:else}
    <div class="mb-4 flex gap-2 justify-end print:hidden">
      <button
        on:click={() => { showReport = false }}
        class="big-gray-button"
      >
        חזור
      </button>
      <button
        on:click={exportToCSV}
        class="big-green-button"
      >
        ייצא ל-CSV
      </button>
      <button
        on:click={printReport}
        class="big-blue-button"
      >
        הדפס
      </button>
    </div>
    
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-xl font-bold mb-4 text-center">
        ריכוז חודשי לקבוצות לחודש {getMonthName(selectedMonth)} {selectedYear}
      </h2>
      
      {#if reportData.length === 0}
        <p class="text-center text-gray-500 py-8">אין נתוני נוכחות לחודש זה</p>
      {:else}
        {#each reportData as groupData}
          <div class="mb-8 border-b border-gray-200 pb-6 last:border-b-0">
            <div class="mb-4 text-right">
              <h3 class="text-lg font-semibold">
                קבוצה: {groupData.group.name}
                <span class="mx-4">מנחה: {groupData.therapistName}</span>
                <span>יום: {groupData.group.when}</span>
              </h3>
            </div>
            
            {#if groupData.attendance.length > 0}
              <div class="overflow-x-auto">
                <table class="w-full border-collapse">
                  <thead>
                    <tr class="border-b border-gray-200">
                      <th class="text-right p-2 font-medium">שם מטופל</th>
                      <th class="text-right p-2 font-medium">ת.ז.</th>
                      <th class="text-right p-2 font-medium">תאריך נוכחות</th>
                      <th class="text-right p-2 font-medium">קבלה</th>
                      <th class="text-right p-2 font-medium">מנחה</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each groupData.attendance as record}
                      <tr class="border-b border-gray-100 hover:bg-gray-50">
                        <td class="p-2 text-right">{record.patientName}</td>
                        <td class="p-2 text-right">{record.patientId}</td>
                        <td class="p-2 text-right">{record.date}</td>
                        <td class="p-2 text-right">{record.receipt}</td>
                        <td class="p-2 text-right">{record.therapistName}</td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {:else}
              <p class="text-gray-500 text-center py-4">אין נתוני נוכחות לקבוצה זו</p>
            {/if}
          </div>
        {/each}
      {/if}
    </div>
  {/if}
</div>

<style>
  @media print {
    @page {
      margin: 1cm;
    }
    
    body {
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
    
    .print\\:hidden {
      display: none !important;
    }
  }
</style>
