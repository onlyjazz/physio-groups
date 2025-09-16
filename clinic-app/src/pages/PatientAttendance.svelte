<script lang="ts">
  import { load, api, type Db } from '../lib/db'
  import { route } from '../router'
  import { goto } from '../router'
  import { exportToCSV } from '../lib/csvExport'
  
  let db: Db = load()
  
  // Get patient ID from route
  $: patientId = $route.segments[0] || null
  $: patient = patientId ? db.patients.find(p => p.id === patientId) : null
  
  // Get all attendance records for this patient
  $: patientAttendance = patientId ? db.attendance.filter(a => a.patientId === patientId) : []
  
  // Sort by date (newest first)
  $: sortedAttendance = patientAttendance.sort((a, b) => {
    // Parse DD/MM/YYYY format
    const parseDate = (dateStr: string | undefined) => {
      if (!dateStr) return new Date(0) // Return epoch for missing dates
      const parts = dateStr.split('/')
      if (parts.length !== 3) return new Date(0)
      const [day, month, year] = parts
      const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      return isNaN(parsedDate.getTime()) ? new Date(0) : parsedDate
    }
    return parseDate(b.date).getTime() - parseDate(a.date).getTime()
  })
  
  // Group attendance by month for better visualization
  $: attendanceByMonth = (() => {
    const grouped = sortedAttendance.reduce((acc, record) => {
      // Handle various date formats
      let monthKey = 'unknown'
      
      if (record.date) {
        // Try DD/MM/YYYY format
        if (record.date.includes('/')) {
          const dateParts = record.date.split('/')
          if (dateParts.length === 3) {
            const [day, month, year] = dateParts
            monthKey = `${year}-${month.padStart(2, '0')}`
          }
        } 
        // Try YYYY-MM-DD format
        else if (record.date.includes('-')) {
          const dateParts = record.date.split('-')
          if (dateParts.length === 3) {
            const [year, month, day] = dateParts
            monthKey = `${year}-${month.padStart(2, '0')}`
          }
        }
      }
      
      if (!acc[monthKey]) {
        acc[monthKey] = []
      }
      acc[monthKey].push(record)
      return acc
    }, {} as Record<string, typeof sortedAttendance>)
    
    return grouped
  })()
  
  // Get month display name
  function getMonthName(monthKey: string): string {
    const parts = monthKey.split('-')
    if (parts.length !== 2) return monthKey
    
    const [year, month] = parts
    const months = [
      'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
      'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
    ]
    
    const monthIndex = parseInt(month) - 1
    if (monthIndex < 0 || monthIndex >= months.length) return monthKey
    
    return `${months[monthIndex]} ${year}`
  }
  
  // Calculate statistics
  $: totalAttendance = sortedAttendance.length
  $: uniqueGroups = new Set(sortedAttendance.map(a => a.groupId)).size
  $: currentMonthAttendance = sortedAttendance.filter(a => {
    const [day, month, year] = a.date.split('/')
    const now = new Date()
    return parseInt(year) === now.getFullYear() && parseInt(month) === (now.getMonth() + 1)
  }).length
  
  function exportAttendance() {
    if (!patient) return
    
    const exportData = sortedAttendance.map(record => {
      const group = db.groups.find(g => g.id === record.groupId)
      const therapist = db.therapists.find(t => t.id === record.therapistId)
      
      return {
        'תאריך': record.date,
        'קבוצה': group?.name || '-',
        'מנחה': therapist?.name || '-',
        'שם מטופל': `${patient.firstName} ${patient.lastName}`,
        'ת.ז.': patient.nationalId
      }
    })
    
    exportToCSV(exportData, `attendance_${patient.firstName}_${patient.lastName}`)
  }
  
  function backToPatients() {
    goto('/patients')
  }
  
  function goToGroup(groupId: string) {
    goto(`/groups/${groupId}`)
  }
  
  function deleteAttendance(attendanceId: string, groupId: string, date: string) {
    if (!patientId) return
    if (confirm('למחוק רישום נוכחות?')) {
      api.unmarkAttendance(db, groupId, patientId, date)
      db = load()
    }
  }
</script>

<section class="space-y-6">
  <div class="bg-white rounded-lg shadow p-4">
    <div class="flex justify-between items-center mb-4">
      <div class="flex gap-3">
        <button 
          class="text-blue-600 hover:text-blue-700 text-sm font-medium"
          on:click={exportAttendance}
        >
          ייצוא
        </button>
        <button 
          class="text-blue-600 hover:underline text-sm" 
          on:click={backToPatients}
        >
          חזרה למטופלים
        </button>
      </div>
      <h2 class="text-lg font-semibold">היסטוריית נוכחות</h2>
    </div>
  </div>

  {#if !patient}
    <div class="bg-white rounded-lg shadow p-4">
      <p class="text-center text-gray-500 py-8">מטופל לא נמצא</p>
    </div>
  {:else}
    <!-- Patient details and statistics -->
    <div class="bg-white rounded-lg shadow p-4">
      <div class="grid grid-cols-2 gap-4">
        <div class="text-right">
          <h3 class="text-sm font-medium text-gray-600 mb-2">פרטי מטופל</h3>
          <div class="space-y-1">
            <div><span class="font-medium text-lg">{patient.firstName} {patient.lastName}</span></div>
            <div class="text-sm text-gray-600">ת.ז: {patient.nationalId}</div>
            <div class="text-sm text-gray-600">טלפון: {patient.phone}</div>
          </div>
        </div>
        
        <div class="text-right">
          <h3 class="text-sm font-medium text-gray-600 mb-2">סטטיסטיקה</h3>
          <div class="space-y-1">
            <div class="flex justify-end items-baseline gap-2">
              <span class="text-sm text-gray-600">סה"כ נוכחות:</span>
              <span class="text-2xl font-bold text-blue-600">{totalAttendance}</span>
            </div>
            <div class="flex justify-end items-baseline gap-2">
              <span class="text-sm text-gray-600">החודש:</span>
              <span class="text-lg font-bold text-green-600">{currentMonthAttendance}</span>
            </div>
            <div class="flex justify-end items-baseline gap-2">
              <span class="text-sm text-gray-600">קבוצות:</span>
              <span class="text-lg font-bold text-purple-600">{uniqueGroups}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Attendance records by month -->
    {#if sortedAttendance.length === 0}
      <div class="bg-white rounded-lg shadow p-4">
        <p class="text-center text-gray-500 py-8">אין רישומי נוכחות</p>
      </div>
    {:else}
      {#if Object.keys(attendanceByMonth).length === 0 || (Object.keys(attendanceByMonth).length === 1 && attendanceByMonth['unknown'])}
        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-center text-gray-500 py-8">אין רישומי נוכחות עם תאריכים</p>
        </div>
      {/if}
      
      {#each Object.entries(attendanceByMonth).filter(([key]) => key !== 'unknown').sort((a, b) => b[0].localeCompare(a[0])) as [monthKey, records]}
        <div class="bg-white rounded-lg shadow p-4">
          <h3 class="text-base font-semibold mb-3 text-gray-700">
            {getMonthName(monthKey)} ({records.length} מפגשים)
          </h3>
          
          <div class="space-y-2">
            {#each records as record}
              {@const group = db.groups.find(g => g.id === record.groupId)}
              {@const therapist = db.therapists.find(t => t.id === record.therapistId)}
              <div class="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded">
                <div class="flex gap-2">
                  <button 
                    class="text-red-600 hover:text-red-700 p-1"
                    on:click={() => deleteAttendance(record.id, record.groupId, record.date)}
                    title="מחק"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <button 
                    class="text-blue-600 hover:text-blue-700 p-1"
                    on:click={() => goToGroup(record.groupId)}
                    title="פרטי קבוצה"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
                
                <div class="flex-1 text-right flex items-center justify-end gap-4">
                  <span class="text-sm text-gray-500">מנחה: {therapist?.name || '-'}</span>
                  <span class="font-medium">{group?.name || '-'}</span>
                  <span class="text-sm font-medium text-blue-600">{record.date}</span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
      
      <!-- Show records with unknown dates if any -->
      {#if attendanceByMonth['unknown'] && attendanceByMonth['unknown'].length > 0}
        <div class="bg-white rounded-lg shadow p-4">
          <h3 class="text-base font-semibold mb-3 text-gray-700">
            רישומים ללא תאריך ({attendanceByMonth['unknown'].length} מפגשים)
          </h3>
          
          <div class="space-y-2">
            {#each attendanceByMonth['unknown'] as record}
              {@const group = db.groups.find(g => g.id === record.groupId)}
              {@const therapist = db.therapists.find(t => t.id === record.therapistId)}
              <div class="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded">
                <div class="flex gap-2">
                  <button 
                    class="text-red-600 hover:text-red-700 p-1"
                    on:click={() => deleteAttendance(record.id, record.groupId, record.date)}
                    title="מחק"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <button 
                    class="text-blue-600 hover:text-blue-700 p-1"
                    on:click={() => goToGroup(record.groupId)}
                    title="פרטי קבוצה"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
                
                <div class="flex-1 text-right flex items-center justify-end gap-4">
                  <span class="text-sm text-gray-500">מנחה: {therapist?.name || '-'}</span>
                  <span class="font-medium">{group?.name || '-'}</span>
                  <span class="text-sm font-medium text-gray-400">{record.date || 'ללא תאריך'}</span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    {/if}
  {/if}
</section>