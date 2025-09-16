<script lang="ts">
  import { load, api, type Db } from '../lib/db'
  import { route } from '../router'
  import { goto } from '../router'
  import { exportToCSV } from '../lib/csvExport'
  
  let db: Db = load()
  
  // Get patient ID from route
  $: patientId = $route.segments[0] || null
  $: patient = patientId ? db.patients.find(p => p.id === patientId) : null
  
  // Get groups for this patient
  $: groupsForPatient = patientId ? db.patientsInGroups.filter(x => x.patientId === patientId) : []
  
  // Separate enrolled and waitlisted
  $: enrolledGroups = groupsForPatient.filter(x => x.enrolled === 1)
  $: waitlistedGroups = groupsForPatient.filter(x => x.enrolled === 0)
  
  function removeFromGroup(groupId: string) {
    if (!patientId) return
    if (confirm('להסיר מהקבוצה?')) {
      api.removePatientFromGroup(db, groupId, patientId)
      db = load()
    }
  }
  
  function exportGroups() {
    if (!patient) return
    
    const exportData = enrolledGroups.map(pig => {
      const group = db.groups.find(g => g.id === pig.groupId)
      const therapistInGroup = db.therapistsInGroups.find(x => x.groupId === pig.groupId)
      const therapist = therapistInGroup ? db.therapists.find(t => t.id === therapistInGroup.therapistId) : null
      
      return group ? {
        'שם מטופל': `${patient.firstName} ${patient.lastName}`,
        'ת.ז.': patient.nationalId,
        'שם קבוצה': group.name,
        'מתי': group.when || 'open',
        'מנחה': therapist?.name || '-',
        'מספר קבלה': pig.receipt || '',
        'סטטוס': 'רשום'
      } : null
    }).filter(Boolean)
    
    // Add waitlisted groups
    waitlistedGroups.forEach(pig => {
      const group = db.groups.find(g => g.id === pig.groupId)
      const therapistInGroup = db.therapistsInGroups.find(x => x.groupId === pig.groupId)
      const therapist = therapistInGroup ? db.therapists.find(t => t.id === therapistInGroup.therapistId) : null
      
      if (group) {
        exportData.push({
          'שם מטופל': `${patient.firstName} ${patient.lastName}`,
          'ת.ז.': patient.nationalId,
          'שם קבוצה': group.name,
          'מתי': group.when || 'open',
          'מנחה': therapist?.name || '-',
          'מספר קבלה': pig.receipt || '',
          'סטטוס': 'ממתין'
        })
      }
    })
    
    exportToCSV(exportData, `groups_for_${patient.firstName}_${patient.lastName}`)
  }
  
  function backToPatients() {
    goto('/patients')
  }
  
  function goToGroup(groupId: string) {
    goto(`/groups/${groupId}`)
  }
</script>

<section class="space-y-6">
  <div class="bg-white rounded-lg shadow p-4">
    <div class="flex justify-between items-center mb-4">
      <div class="flex gap-3">
        <button 
          class="text-blue-600 hover:text-blue-700 text-sm font-medium"
          on:click={exportGroups}
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
      <h2 class="text-lg font-semibold">קבוצות המטופל</h2>
    </div>
  </div>

  {#if !patient}
    <div class="bg-white rounded-lg shadow p-4">
      <p class="text-center text-gray-500 py-8">מטופל לא נמצא</p>
    </div>
  {:else}
    <!-- Patient details -->
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
            <div class="text-lg">קבוצות רשומות: <span class="font-bold text-blue-600">{enrolledGroups.length}</span></div>
            <div class="text-lg">ממתין בקבוצות: <span class="font-bold text-orange-600">{waitlistedGroups.length}</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Enrolled groups -->
    <div class="bg-white rounded-lg shadow p-4">
      <h3 class="text-base font-semibold mb-4">קבוצות רשומות ({enrolledGroups.length})</h3>
      
      {#if enrolledGroups.length === 0}
        <p class="text-center text-gray-500 py-4">אין קבוצות רשומות</p>
      {:else}
        <div class="grid gap-3">
          {#each enrolledGroups as pig}
            {@const group = db.groups.find(g => g.id === pig.groupId)}
            {@const therapistInGroup = db.therapistsInGroups.find(x => x.groupId === pig.groupId)}
            {@const therapist = therapistInGroup ? db.therapists.find(t => t.id === therapistInGroup.therapistId) : null}
            {#if group}
              <div class="border rounded p-3 hover:bg-gray-50">
                <div class="flex items-center justify-between">
                  <div class="flex gap-2">
                    <button 
                      class="text-red-600 hover:text-red-700"
                      on:click={() => removeFromGroup(group.id)}
                      title="הסר"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <button 
                      class="text-blue-600 hover:text-blue-700"
                      on:click={() => goToGroup(group.id)}
                      title="פרטי קבוצה"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                  
                  <div class="flex-1 text-right">
                    <div class="font-medium text-lg">{group.name}</div>
                    <div class="flex gap-4 text-sm text-gray-600 justify-end">
                      <span>קבלה: {pig.receipt || '-'}</span>
                      <span>מנחה: {therapist?.name || '-'}</span>
                      <span>מתי: {group.when || 'open'}</span>
                    </div>
                  </div>
                </div>
              </div>
            {/if}
          {/each}
        </div>
      {/if}
    </div>

    <!-- Waitlisted groups -->
    {#if waitlistedGroups.length > 0}
      <div class="bg-white rounded-lg shadow p-4">
        <h3 class="text-base font-semibold mb-4 text-orange-600">ממתין בקבוצות ({waitlistedGroups.length})</h3>
        
        <div class="grid gap-3">
          {#each waitlistedGroups as pig}
            {@const group = db.groups.find(g => g.id === pig.groupId)}
            {@const therapistInGroup = db.therapistsInGroups.find(x => x.groupId === pig.groupId)}
            {@const therapist = therapistInGroup ? db.therapists.find(t => t.id === therapistInGroup.therapistId) : null}
            {#if group}
              <div class="border border-orange-300 rounded p-3 hover:bg-orange-50">
                <div class="flex items-center justify-between">
                  <div class="flex gap-2">
                    <button 
                      class="text-red-600 hover:text-red-700"
                      on:click={() => removeFromGroup(group.id)}
                      title="הסר"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <button 
                      class="text-blue-600 hover:text-blue-700"
                      on:click={() => goToGroup(group.id)}
                      title="פרטי קבוצה"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <span class="text-orange-600 font-medium text-sm">ממתין</span>
                  </div>
                  
                  <div class="flex-1 text-right">
                    <div class="font-medium text-lg">{group.name}</div>
                    <div class="flex gap-4 text-sm text-gray-600 justify-end">
                      <span>מנחה: {therapist?.name || '-'}</span>
                      <span>מתי: {group.when || 'open'}</span>
                    </div>
                  </div>
                </div>
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</section>