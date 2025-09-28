<script lang="ts">
  import { load, api, type Db, type Patient } from '../lib/db'
  import { route } from '../router'
  import { goto } from '../router'
  import { exportToCSV } from '../lib/csvExport'
  
  let db: Db = load()
  
  // Get group ID from route
  $: groupId = $route.segments[0] || null
  $: group = groupId ? db.groups.find(g => g.id === groupId) : null
  
  // Get today's date in YYYY-MM-DD format
  let selectedDate = new Date().toISOString().split('T')[0]
  
  // Get patients in this group (only enrolled, not waitlisted)
  $: patientsInGroup = groupId ? db.patientsInGroups.filter(x => x.groupId === groupId && x.enrolled === 1) : []
  
  // Get the default therapist for this group
  $: defaultTherapistId = groupId ? 
    db.therapistsInGroups.find(x => x.groupId === groupId)?.therapistId || '' : ''
  
  // Selected therapist (defaults to group's assigned therapist)
  let selectedTherapistId = ''
  $: if (defaultTherapistId && !selectedTherapistId) {
    selectedTherapistId = defaultTherapistId
  }
  
  // Get attendance for selected date
  $: attendanceSet = groupId && selectedDate ? 
    api.getAttendanceForGroupAndDate(db, groupId, selectedDate) : new Set()
  
  // Makeup class search
  let makeupSearchQuery = ''
  
  // Get filtered patients for makeup search
  $: makeupSearchResults = (() => {
    if (!makeupSearchQuery.trim()) return []
    
    const query = makeupSearchQuery.trim().toLowerCase()
    const patientsInGroupSet = new Set(patientsInGroup.map(pg => pg.patientId))
    
    // Search all patients, excluding those already in the group
    return db.patients.filter(p => {
      // Skip patients already in the group
      if (patientsInGroupSet.has(p.id)) return false
      
      const searchableText = [
        p.firstName || '',
        p.lastName || '',
        p.nationalId || '',
        p.phone || ''
      ].join(' ').toLowerCase()
      
      return searchableText.includes(query)
    })
  })()
  
  function toggleAttendance(patientId: string, isMakeup: boolean = false) {
    if (!groupId || !selectedDate || !selectedTherapistId) {
      if (!selectedTherapistId) {
        alert('נא לבחור מנחה')
      }
      return
    }
    
    if (attendanceSet.has(patientId)) {
      api.unmarkAttendance(db, groupId, patientId, selectedDate)
    } else {
      api.markAttendance(db, groupId, patientId, selectedTherapistId, selectedDate, isMakeup)
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
    if (!group) return
    
    // Get all attended patients (both regular and makeup)
    const allAttendedPatientIds = Array.from(attendanceSet)
    
    const exportData = allAttendedPatientIds.map(patientId => {
      const patient = db.patients.find(p => p.id === patientId)
      const isRegular = patientsInGroup.some(pg => pg.patientId === patientId)
      
      return patient ? {
        'שם פרטי': patient.firstName,
        'שם משפחה': patient.lastName,
        'ת.ז.': patient.nationalId,
        'טלפון': patient.phone,
        'סוג': isRegular ? 'רגיל' : 'השלמה',
        'נוכח': 'כן',
        'תאריך': selectedDate,
        'קבוצה': group.name
      } : null
    }).filter(Boolean)
    
    // Add non-attended regular patients
    const nonAttendedRegular = patientsInGroup
      .filter(pg => !attendanceSet.has(pg.patientId))
      .map(pg => {
        const patient = db.patients.find(p => p.id === pg.patientId)
        return patient ? {
          'שם פרטי': patient.firstName,
          'שם משפחה': patient.lastName,
          'ת.ז.': patient.nationalId,
          'טלפון': patient.phone,
          'סוג': 'רגיל',
          'נוכח': 'לא',
          'תאריך': selectedDate,
          'קבוצה': group.name
        } : null
      }).filter(Boolean)
    
    exportToCSV([...exportData, ...nonAttendedRegular], `attendance_${group.name}_${selectedDate}`)
  }
  
  // Count attendance including makeup students
  $: totalAttendance = attendanceSet.size
  $: regularAttendance = patientsInGroup.filter(pg => attendanceSet.has(pg.patientId)).length
  $: makeupAttendance = totalAttendance - regularAttendance
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
      
      <div class="space-y-3 mb-4">
        <div class="flex items-center gap-4 justify-end">
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
        
        <div class="flex items-center gap-4 justify-end">
          {#if selectedTherapistId !== defaultTherapistId && selectedTherapistId !== ''}
            <span class="text-xs text-orange-600 font-medium">מנחה מחליף/ה</span>
          {/if}
          <select 
            id="therapist"
            class="border rounded px-3 py-2 min-w-[200px] text-right"
            bind:value={selectedTherapistId}
            dir="rtl"
          >
            <option value="" disabled>בחר/י מנחה</option>
            {#each db.therapists as therapist}
              <option value={therapist.id}>
                {therapist.name}
                {#if therapist.id === defaultTherapistId}
                  (מנחה קבוע/ה)
                {/if}
              </option>
            {/each}
          </select>
          <label for="therapist" class="text-sm text-gray-600">מנחה:</label>
        </div>
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
                    on:change={() => toggleAttendance(patient.id, false)}
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
            <span class="mr-2">{regularAttendance} מתוך {patientsInGroup.length}</span>
          </div>
        </div>
      {/if}
    </div>
    
    <!-- Makeup Classes Section -->
    <div class="bg-white rounded-lg shadow p-4">
      <div class="mb-4">
        <h3 class="text-base font-semibold text-right">השלמות</h3>
      </div>
      
      <!-- Search box for makeup students -->
      <div class="mb-3">
        <input
          type="text"
          class="w-full border rounded-full px-4 py-2 text-sm"
          style="text-align: right;"
          placeholder="חיפוש מטופל להשלמה..."
          bind:value={makeupSearchQuery}
          dir="rtl"
        />
      </div>
      
      <!-- Search results -->
      {#if makeupSearchQuery.trim() && makeupSearchResults.length > 0}
        <div class="space-y-2 mb-4">
          {#each makeupSearchResults as patient (patient.id)}
            <div class="flex items-center justify-between py-3 px-4 hover:bg-gray-50 rounded border border-gray-100">
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
                  on:change={() => toggleAttendance(patient.id, true)}
                />
                <span class="text-sm text-gray-600">נוכח/ת</span>
              </label>
            </div>
          {/each}
        </div>
      {:else if makeupSearchQuery.trim() && makeupSearchResults.length === 0}
        <p class="text-gray-500 text-center py-4 text-sm">לא נמצאו מטופלים התואמים לחיפוש</p>
      {/if}
      
      <!-- Show makeup students already marked as present -->
      {#if makeupAttendance > 0}
        <div class="border-t pt-4 mt-4">
          <h4 class="text-sm font-semibold text-gray-700 mb-2 text-right">מטופלים בהשלמה</h4>
          <div class="space-y-2">
            {#each Array.from(attendanceSet) as patientId}
              {#if !patientsInGroup.some(pg => pg.patientId === patientId)}
                {@const patient = db.patients.find(p => p.id === patientId)}
                {#if patient}
                  <div class="flex items-center justify-between py-2 px-3 bg-blue-50 rounded">
                    <div class="flex-1">
                      <span class="font-medium text-sm">
                        {patient.firstName} {patient.lastName}
                      </span>
                      <span class="text-xs text-gray-500 mr-3">
                        ת.ז. {patient.nationalId}
                      </span>
                    </div>
                    <button 
                      class="text-red-600 hover:text-red-700 text-xs font-medium"
                      on:click={() => toggleAttendance(patient.id, true)}
                    >
                      הסר
                    </button>
                  </div>
                {/if}
              {/if}
            {/each}
          </div>
        </div>
      {/if}
      
      <!-- Summary -->
      <div class="mt-4 pt-4 border-t">
        <div class="text-sm text-gray-600 space-y-1">
          <div>
            <span class="font-semibold">סה"כ השלמות:</span>
            <span class="mr-2">{makeupAttendance}</span>
          </div>
          <div class="text-xs text-gray-500">
            <span class="font-semibold">סה"כ כללי:</span>
            <span class="mr-2">{totalAttendance} נוכחים</span>
          </div>
        </div>
      </div>
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
