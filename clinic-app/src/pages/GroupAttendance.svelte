<script lang="ts">
  import { load, api, type Db } from '../lib/db'
  import { route } from '../router'
  import { goto } from '../router'
  import { exportToCSV } from '../lib/csvExport'
  
  let db: Db = load()
  
  // Get group ID from route
  $: groupId = $route.segments[0] || null
  $: group = groupId ? db.groups.find(g => g.id === groupId) : null
  
  // Get today's date in YYYY-MM-DD format
  let selectedDate = new Date().toISOString().split('T')[0]
  
  // Get patients in this group
  $: patientsInGroup = groupId ? db.patientsInGroups.filter(x => x.groupId === groupId) : []
  
  // Get attendance for selected date
  $: attendanceSet = groupId && selectedDate ? 
    api.getAttendanceForGroupAndDate(db, groupId, selectedDate) : new Set()
  
  function toggleAttendance(patientId: string) {
    if (!groupId || !selectedDate) return
    
    if (attendanceSet.has(patientId)) {
      api.unmarkAttendance(db, groupId, patientId, selectedDate)
    } else {
      api.markAttendance(db, groupId, patientId, selectedDate)
    }
    
    db = load()
  }
  
  function backToList() {
    goto('groupsList')
  }
  
  function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleDateString('he-IL', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }
  
  // Export function
  function exportAttendance() {
    if (!group || !patientsInGroup.length) return
    
    const exportData = patientsInGroup.map(pg => {
      const patient = db.patients.find(p => p.id === pg.patientId)
      return patient ? {
        'שם פרטי': patient.firstName,
        'שם משפחה': patient.lastName,
        'ת.ז.': patient.nationalId,
        'טלפון': patient.phone,
        'נוכח': attendanceSet.has(patient.id) ? 'כן' : 'לא',
        'תאריך': selectedDate,
        'קבוצה': group.name
      } : null
    }).filter(Boolean)
    
    exportToCSV(exportData, `attendance_${group.name}_${selectedDate}`)
  }
</script>

<section class="space-y-6">
  {#if group}
    <div class="bg-white rounded-lg shadow p-4">
      <div class="flex justify-between items-center mb-4">
        <button 
          class="text-blue-600 hover:underline text-sm" 
          on:click={backToList}
        >
          חזרה לרשימה
        </button>
        <h2 class="text-lg font-semibold">נוכחות - {group.name}</h2>
      </div>
      
      <div class="flex items-center gap-4 mb-4 justify-end">
        <div class="text-sm text-gray-600" dir="rtl">{formatDate(selectedDate)}</div>
        <input 
          id="date"
          type="date" 
          class="border rounded px-3 py-2"
          bind:value={selectedDate}
          on:change={() => db = load()}
        />
        <label for="date" class="text-sm text-gray-600">תאריך:</label>
      </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-4">
      <div class="flex justify-between items-center mb-4">
        <button 
          class="text-blue-600 hover:text-blue-700 text-sm font-medium"
          on:click={exportAttendance}
        >
          ייצוא
        </button>
        <h3 class="text-base font-semibold">רשימת מטופלים</h3>
      </div>
      
      {#if patientsInGroup.length === 0}
        <p class="text-gray-500 text-center py-8">אין מטופלים רשומים לקבוצה זו</p>
      {:else}
        <div class="space-y-2">
          {#each patientsInGroup as pg (pg.id)}
            {@const patient = db.patients.find(p => p.id === pg.patientId)}
            {#if patient}
              <div class="flex items-center justify-between py-3 px-4 hover:bg-gray-50 rounded">
                <div class="flex-1">
                  <span class="font-medium">
                    {patient.firstName} {patient.lastName}
                  </span>
                  <span class="text-sm text-gray-500 mr-3">
                    ת.ז. {patient.nationalId}
                  </span>
                </div>
                <label class="flex items-center cursor-pointer gap-2">
                  <input 
                    type="checkbox" 
                    class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    checked={attendanceSet.has(patient.id)}
                    on:change={() => toggleAttendance(patient.id)}
                  />
                  <span class="text-sm text-gray-600">נוכח/ת</span>
                </label>
              </div>
            {/if}
          {/each}
        </div>
        
        <div class="mt-6 pt-4 border-t">
          <div class="text-sm text-gray-600">
            <span class="font-semibold">סה"כ נוכחים:</span>
            <span class="mr-2">{attendanceSet.size} מתוך {patientsInGroup.length}</span>
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <div class="bg-white rounded-lg shadow p-8">
      <p class="text-center text-gray-500">קבוצה לא נמצאה</p>
      <div class="text-center mt-4">
        <button 
          class="text-blue-600 hover:underline text-sm" 
          on:click={backToList}
        >
          חזרה לרשימה
        </button>
      </div>
    </div>
  {/if}
</section>
