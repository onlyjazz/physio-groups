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
  
  // Get enrolled patients with active subscriptions only
  $: activeEnrolledPatients = groupId ? api.getPatientsWithActiveSubscriptions(db, groupId) : []
  
  // Get all enrolled patients (for showing inactive ones separately if needed)
  $: allEnrolledPatients = patientsInGroup.filter(x => x.enrolled === 1)
  
  // Get inactive enrolled patients
  $: inactiveEnrolledPatients = allEnrolledPatients.filter(pig => 
    !api.hasActiveSubscription(db, pig.patientId, groupId || '')
  )
  
  // Waitlisted patients remain the same
  $: waitlistedPatients = patientsInGroup.filter(x => x.enrolled === 0)
  
  // Calculate available spots based on active subscriptions
  $: availableSpots = groupId ? api.getAvailableWithActiveSubscriptions(db, groupId) : 0
  
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
    
    const exportData = activeEnrolledPatients.map(pig => {
      const patient = db.patients.find(p => p.id === pig.patientId)
      const paymentPeriod = patient && groupId ? getPaymentPeriod(patient.id, groupId) : null
      return patient ? {
        'שם פרטי': patient.firstName,
        'שם משפחה': patient.lastName,
        'ת.ז.': patient.nationalId,
        'טלפון': patient.phone,
        'תקופת תשלום': paymentPeriod || '-',
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
  
  function goToPatientHistory(patientId: string) {
    goto(`history/${patientId}`)
  }
  
  // Get the ACTIVE payment period for a patient in a group
  function getPaymentPeriod(patientId: string, groupId: string): string | null {
    const payments = db.patientPayments
      .filter(p => p.patientId === patientId && p.groupId === groupId)
    
    if (payments.length === 0) return null
    
    // Get current date for comparison
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    const currentDate = currentYear * 12 + currentMonth
    
    // Find the active payment that covers current month
    const activePayment = payments.find(payment => {
      const [fromMonthStr, fromYearStr] = payment.fromMonth.split('/')
      const fromMonth = parseInt(fromMonthStr)
      const fromYear = parseInt(fromYearStr)
      
      const [toMonthStr, toYearStr] = payment.toMonth.split('/')
      const toMonth = parseInt(toMonthStr)
      const toYear = parseInt(toYearStr)
      
      const fromDate = fromYear * 12 + fromMonth
      const toDate = toYear * 12 + toMonth
      
      return fromDate <= currentDate && currentDate <= toDate
    })
    
    // If no active payment, return the most recent one (for historical reference)
    const paymentToShow = activePayment || payments.sort((a, b) => b.createdAt - a.createdAt)[0]
    
    // Format: MM/YY-MM/YY for compact display
    const fromParts = paymentToShow.fromMonth.split('/')
    const toParts = paymentToShow.toMonth.split('/')
    
    const fromMonth = fromParts[0]
    const fromYear = fromParts[1]?.substring(2) // Last 2 digits of year
    const toMonth = toParts[0]
    const toYear = toParts[1]?.substring(2) // Last 2 digits of year
    
    return `${fromMonth}/${fromYear}-${toMonth}/${toYear}`
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
          <h3 class="text-sm font-medium text-gray-600 mb-2">תפוסה</h3>
          <div class="space-y-1">
            <div class="text-2xl font-bold">{activeEnrolledPatients.length} / {group.capacity}</div>
            <div class="text-sm {availableSpots <= 0 ? 'text-red-600 font-medium' : availableSpots <= 3 ? 'text-orange-500' : 'text-gray-600'}">מקומות פנויים: <span dir="ltr" style="display: inline-block;">{availableSpots}</span></div>
          </div>
        </div>
        
        <div class="text-right">
          <h3 class="text-sm font-medium text-gray-600 mb-2">מנחה</h3>
          <div class="text-lg">{therapist ? therapist.name : '-'}</div>
        </div>
      </div>
    </div>

    <!-- Active enrolled patients -->
    <div class="bg-white rounded-lg shadow p-4">
      <h3 class="text-base font-semibold mb-4">רשומים פעילים ({activeEnrolledPatients.length})</h3>
      
      {#if activeEnrolledPatients.length === 0}
        <p class="text-center text-gray-500 py-4">אין מטופלים רשומים פעילים</p>
      {:else}
        <!-- Header row -->
        <div class="flex flex-row-reverse items-center py-2 border-b mb-2">
          <div class="w-10">
            <!-- Empty space for action buttons -->
          </div>
          <div class="flex-1 grid" style="grid-template-columns: 3fr 120px 140px 130px 100px;">
            <div class="text-gray-700 text-right font-semibold text-sm py-1 px-2">שם</div>
            <div class="text-gray-700 text-right font-semibold text-sm py-1 px-2">ת.ז.</div>
            <div class="text-gray-700 text-right font-semibold text-sm py-1 px-2">טלפון</div>
            <div class="text-gray-700 text-right font-semibold text-sm py-1 px-2">תקופה</div>
            <div class="text-gray-700 text-right font-semibold text-sm py-1 px-2">קבלה</div>
          </div>
        </div>
        
        <div class="space-y-2">
          {#each activeEnrolledPatients as pig}
            {@const patient = db.patients.find(p => p.id === pig.patientId)}
            {@const paymentPeriod = patient && groupId ? getPaymentPeriod(patient.id, groupId) : null}
            {#if patient}
              <div class="flex flex-row-reverse items-center py-2 hover:bg-gray-50 rounded transition-colors">
                <div class="w-10 flex justify-center">
                  <button 
                    class="text-red-600 hover:text-red-700 p-1"
                    on:click|stopPropagation={() => removePatient(patient.id)}
                    title="הסר"
                    aria-label="הסר מטופל מהקבוצה"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <button
                  class="flex-1 grid cursor-pointer items-center text-left"
                  style="grid-template-columns: 3fr 120px 140px 130px 100px;"
                  on:click={() => goToPatientHistory(patient.id)}
                  title="לחץ לצפייה בהיסטוריית תשלומים"
                >
                  <div class="font-medium text-right px-2">{patient.firstName} {patient.lastName}</div>
                  <div class="text-sm text-gray-600 text-right px-2">{patient.nationalId}</div>
                  <div class="text-sm text-gray-600 text-right px-2">{patient.phone}</div>
                  <div class="text-sm text-green-700 font-medium text-right px-2">{paymentPeriod || '-'}</div>
                  <div class="text-sm text-gray-500 text-right px-2">{pig.receipt || '-'}</div>
                </button>
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
        
        <!-- Header row -->
        <div class="flex flex-row-reverse items-center py-2 border-b mb-2">
          <div class="w-10">
            <!-- Empty space for action buttons -->
          </div>
          <div class="flex-1 grid" style="grid-template-columns: 3fr 120px 140px 120px;">
            <div class="text-gray-700 text-right font-semibold text-sm py-1 px-2">שם</div>
            <div class="text-gray-700 text-right font-semibold text-sm py-1 px-2">ת.ז.</div>
            <div class="text-gray-700 text-right font-semibold text-sm py-1 px-2">טלפון</div>
            <div class="text-gray-700 text-right font-semibold text-sm py-1 px-2">סטטוס</div>
          </div>
        </div>
        
        <div class="space-y-2">
          {#each waitlistedPatients as pig}
            {@const patient = db.patients.find(p => p.id === pig.patientId)}
            {#if patient}
              <div class="flex flex-row-reverse items-center py-2 hover:bg-gray-50 rounded transition-colors">
                <div class="w-10 flex justify-center">
                  <button 
                    class="text-red-600 hover:text-red-700 p-1"
                    on:click|stopPropagation={() => removePatient(patient.id)}
                    title="הסר"
                    aria-label="הסר מרשימת המתנה"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <button
                  class="flex-1 grid cursor-pointer items-center text-left"
                  style="grid-template-columns: 3fr 120px 140px 120px;"
                  on:click={() => goToPatientHistory(patient.id)}
                  title="לחץ לצפייה בהיסטוריית תשלומים"
                >
                  <div class="font-medium text-right px-2">{patient.firstName} {patient.lastName}</div>
                  <div class="text-sm text-gray-600 text-right px-2">{patient.nationalId}</div>
                  <div class="text-sm text-gray-600 text-right px-2">{patient.phone}</div>
                  <div class="text-sm text-orange-600 font-medium text-right px-2">ממתין</div>
                </button>
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</section>