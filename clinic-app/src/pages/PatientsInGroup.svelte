<script lang="ts">
  import { load, api, type Db } from '../lib/db'
  import { route } from '../router'
  import { goto } from '../router'
  import { exportToCSV } from '../lib/csvExport'
  
  let db: Db = load()
  
  // Get group ID from route
  $: groupId = $route.segments[0] || null
  $: group = groupId ? db.groups.find(g => g.id === groupId) : null
  
  // Get patients in this group
  $: patientsInGroup = groupId ? db.patientsInGroups.filter(x => x.groupId === groupId) : []
  
  // Separate enrolled and waitlisted
  $: enrolledPatients = patientsInGroup.filter(x => x.enrolled === 1)
  $: waitlistedPatients = patientsInGroup.filter(x => x.enrolled === 0)
  
  // Calculate available spots correctly
  $: availableSpots = group ? group.capacity - enrolledPatients.length : 0
  
  // Get therapist for this group
  $: therapistInGroup = groupId ? db.therapistsInGroups.find(x => x.groupId === groupId) : null
  $: therapist = therapistInGroup ? db.therapists.find(t => t.id === therapistInGroup.therapistId) : null
  
  function removePatient(patientId: string) {
    if (!groupId) return
    if (confirm('להסיר מטופל/ת מהקבוצה?')) {
      api.removePatientFromGroup(db, groupId, patientId)
      db = load()
    }
  }
  
  function exportPatients() {
    if (!group) return
    
    const exportData = enrolledPatients.map(pig => {
      const patient = db.patients.find(p => p.id === pig.patientId)
      return patient ? {
        'שם פרטי': patient.firstName,
        'שם משפחה': patient.lastName,
        'ת.ז.': patient.nationalId,
        'טלפון': patient.phone,
        'מספר קבלה': pig.receipt || '',
        'סטטוס': 'רשום',
        'קבוצה': group.name
      } : null
    }).filter(Boolean)
    
    // Add waitlisted patients
    waitlistedPatients.forEach(pig => {
      const patient = db.patients.find(p => p.id === pig.patientId)
      if (patient) {
        exportData.push({
          'שם פרטי': patient.firstName,
          'שם משפחה': patient.lastName,
          'ת.ז.': patient.nationalId,
          'טלפון': patient.phone,
          'מספר קבלה': pig.receipt || '',
          'סטטוס': 'ממתין',
          'קבוצה': group.name
        })
      }
    })
    
    exportToCSV(exportData, `patients_in_${group.name}`)
  }
  
  function backToGroups() {
    goto('/groupsList')
  }
</script>

<section class="space-y-6">
  <div class="bg-white rounded-lg shadow p-4">
    <div class="flex justify-between items-center mb-4">
      <div class="flex gap-3">
        <button 
          class="text-blue-600 hover:text-blue-700 text-sm font-medium"
          on:click={exportPatients}
        >
          ייצוא
        </button>
        <button 
          class="text-blue-600 hover:underline text-sm" 
          on:click={backToGroups}
        >
          חזרה לקבוצות
        </button>
      </div>
      <h2 class="text-lg font-semibold">מטופלים בקבוצה</h2>
    </div>
  </div>

  {#if !group}
    <div class="bg-white rounded-lg shadow p-4">
      <p class="text-center text-gray-500 py-8">קבוצה לא נמצאה</p>
    </div>
  {:else}
    <!-- Group details -->
    <div class="bg-white rounded-lg shadow p-4">
      <div class="grid grid-cols-3 gap-4">
        <div class="text-right">
          <h3 class="text-sm font-medium text-gray-600 mb-2">פרטי קבוצה</h3>
          <div class="space-y-1">
            <div><span class="font-medium text-lg">{group.name}</span></div>
            <div class="text-sm text-gray-600">מתי: {group.when || 'open'}</div>
          </div>
        </div>
        
        <div class="text-right">
          <h3 class="text-sm font-medium text-gray-600 mb-2">קיבולת</h3>
          <div class="space-y-1">
            <div class="text-2xl font-bold">{enrolledPatients.length} / {group.capacity}</div>
            <div class="text-sm {availableSpots <= 0 ? 'text-red-600 font-medium' : availableSpots <= 3 ? 'text-orange-500' : 'text-gray-600'}">מקומות פנויים: {availableSpots}</div>
          </div>
        </div>
        
        <div class="text-right">
          <h3 class="text-sm font-medium text-gray-600 mb-2">מנחה</h3>
          <div class="text-lg">{therapist ? therapist.name : '-'}</div>
        </div>
      </div>
    </div>

    <!-- Enrolled patients -->
    <div class="bg-white rounded-lg shadow p-4">
      <h3 class="text-base font-semibold mb-4">רשומים ({enrolledPatients.length})</h3>
      
      {#if enrolledPatients.length === 0}
        <p class="text-center text-gray-500 py-4">אין מטופלים רשומים</p>
      {:else}
        <div class="space-y-2">
          {#each enrolledPatients as pig}
            {@const patient = db.patients.find(p => p.id === pig.patientId)}
            {#if patient}
              <div class="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded">
                <button 
                  class="text-red-600 hover:text-red-700"
                  on:click={() => removePatient(patient.id)}
                  title="הסר"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                
                <div class="flex-1 text-right flex items-center gap-4">
                  <span class="text-sm text-gray-500">קבלה: {pig.receipt || '-'}</span>
                  <span class="text-sm text-gray-600">טל: {patient.phone}</span>
                  <span class="text-sm text-gray-600">ת.ז: {patient.nationalId}</span>
                  <span class="font-medium">{patient.firstName} {patient.lastName}</span>
                </div>
              </div>
            {/if}
          {/each}
        </div>
      {/if}
    </div>

    <!-- Waitlisted patients -->
    {#if waitlistedPatients.length > 0}
      <div class="bg-white rounded-lg shadow p-4">
        <h3 class="text-base font-semibold mb-4 text-orange-600">ממתינים ({waitlistedPatients.length})</h3>
        
        <div class="space-y-2">
          {#each waitlistedPatients as pig}
            {@const patient = db.patients.find(p => p.id === pig.patientId)}
            {#if patient}
              <div class="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded">
                <button 
                  class="text-red-600 hover:text-red-700"
                  on:click={() => removePatient(patient.id)}
                  title="הסר"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                
                <div class="flex-1 text-right flex items-center gap-4">
                  <span class="text-sm text-orange-600 font-medium">ממתין</span>
                  <span class="text-sm text-gray-600">טל: {patient.phone}</span>
                  <span class="text-sm text-gray-600">ת.ז: {patient.nationalId}</span>
                  <span class="font-medium">{patient.firstName} {patient.lastName}</span>
                </div>
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</section>