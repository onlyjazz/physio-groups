<script lang="ts">
  import { load, api, type Db } from '../lib/db'
  import { goto } from '../router'
  
  let db: Db = load()
  
  // Waitlist item interface
  interface WaitlistItem {
    groupId: string
    patientId: string
    patient: any // Full patient object
    pig: any // PatientsInGroups object
    groupName: string
    available: number
    createdAt: number
  }
  
  // No sorting for now to match PatientsInGroup
  
  // Get all waitlisted patients with their group information
  function getWaitlistedPatients(): WaitlistItem[] {
    const waitlisted: WaitlistItem[] = []
    
    for (const pig of db.patientsInGroups) {
      if (pig.enrolled === 0) {
        const group = db.groups.find(g => g.id === pig.groupId)
        const patient = db.patients.find(p => p.id === pig.patientId)
        
        if (group && patient) {
          // Calculate available spots based on active subscriptions
          const availableSpots = api.getAvailableWithActiveSubscriptions(db, group.id)
          
          waitlisted.push({
            groupId: group.id,
            patientId: patient.id,
            patient: patient,
            pig: pig,
            groupName: group.name,
            available: availableSpots,
            createdAt: pig.createdAt
          })
        }
      }
    }
    
    // Sort by creation date (newest first)
    return waitlisted.sort((a, b) => b.createdAt - a.createdAt)
  }
  
  // Make dependencies explicit for Svelte reactivity
  $: waitlistedPatients = (() => {
    db;
    return getWaitlistedPatients();
  })()
  
  function removeFromWaitlist(groupId: string, patientId: string, patientName: string) {
    if (confirm(`להסיר את ${patientName} מרשימת המתנה?`)) {
      api.removePatientFromGroup(db, groupId, patientId)
      db = load()
    }
  }
  
  // Get the latest payment period for a patient in a group
  function getPaymentPeriod(patientId: string, groupId: string): string | null {
    const payments = db.patientPayments
      .filter(p => p.patientId === patientId && p.groupId === groupId)
      .sort((a, b) => b.createdAt - a.createdAt)
    
    if (payments.length === 0) return null
    
    const latest = payments[0]
    // Format: MM/YY-MM/YY for compact display
    const fromParts = latest.fromMonth.split('/')
    const toParts = latest.toMonth.split('/')
    
    const fromMonth = fromParts[0]
    const fromYear = fromParts[1]?.substring(2) // Last 2 digits of year
    const toMonth = toParts[0]
    const toYear = toParts[1]?.substring(2) // Last 2 digits of year
    
    return `${fromMonth}/${fromYear}-${toMonth}/${toYear}`
  }
  
  
  // Refresh data
  function refresh() {
    db = load()
  }
  
  
  // Export to CSV
  function exportToCSV() {
    const headers = ['שם קבוצה', 'מקומות פנויים', 'שם מטופל', 'תאריך הצטרפות לרשימת המתנה']
    const rows = waitlistedPatients.map(item => [
      item.groupName,
      item.available.toString(),
      item.patientName,
      new Date(item.createdAt).toLocaleDateString('he-IL')
    ])
    
    // Add BOM for proper Hebrew encoding
    const BOM = '\uFEFF'
    const csvContent = BOM + [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `waitlist_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
</script>

<section class="space-y-6">
  <div class="bg-white rounded-lg shadow p-4">
    <div class="flex justify-between items-center mb-4">
      <div class="flex gap-3">
        <button 
          class="text-blue-600 hover:underline text-sm" 
          on:click={refresh}
        >
          רענן
        </button>
        <button 
          class="text-green-600 hover:underline text-sm" 
          on:click={exportToCSV}
        >
          ייצוא ל-CSV
        </button>
      </div>
      <h2 class="text-xl font-semibold">ממתינים</h2>
    </div>
    
    {#if waitlistedPatients.length === 0}
      <p class="text-center text-gray-500 py-8">אין מטופלים ממתינים</p>
    {:else}
      <!-- Header row (matching PatientsInGroup layout) -->
      <div class="flex items-center py-2 border-b mb-2">
        <div class="w-20">
          <!-- Space for action buttons -->
        </div>
        <div class="flex-1 grid" style="grid-template-columns: 100px 50px 120px 140px 120px 3fr;">
          <div class="text-gray-700 text-right font-semibold text-sm py-1 px-2">תאריך צירוף</div>
          <div class="text-gray-700 text-right font-semibold text-sm py-1 px-2">פנוי</div>
          <div class="text-gray-700 text-right font-semibold text-sm py-1 px-2">קבצות</div>
          <div class="text-gray-700 text-right font-semibold text-sm py-1 px-2">טלפון</div>
          <div class="text-gray-700 text-right font-semibold text-sm py-1 px-2">ת.ז.</div>
          <div class="text-gray-700 text-right font-semibold text-sm py-1 px-2">שם</div>
        </div>
      </div>
      
      <div class="space-y-2">
        {#each waitlistedPatients as item}
          {@const paymentPeriod = getPaymentPeriod(item.patientId, item.groupId)}
          <div class="flex items-center py-2 hover:bg-gray-50 rounded transition-colors">
            <div class="w-20 flex justify-center">
              <button 
                class="text-red-600 hover:text-red-700 p-1"
                on:click={() => removeFromWaitlist(item.groupId, item.patientId, `${item.patient.firstName} ${item.patient.lastName}`)}
                title="הסר מרשימת המתנה"
                aria-label="הסר מרשימת המתנה"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <div class="flex-1 grid" style="grid-template-columns: 100px 50px 120px 140px 120px 3fr;">
              <div class="text-sm text-gray-600 text-right px-2">
                {new Date(item.createdAt).toLocaleDateString('he-IL', { 
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit'
                })}
              </div>
              <div class="text-sm text-right px-2">
                <span class="font-semibold"
                      class:text-red-600={item.available <= 0} 
                      class:text-orange-500={item.available > 0 && item.available <= 3}
                      class:text-green-600={item.available > 3}
                      dir="ltr"
                      style="display: inline-block;">
                  {item.available}
                </span>
              </div>
              <div class="text-sm font-medium text-right px-2">{item.groupName}</div>
              <div class="text-sm text-gray-600 text-right px-2">{item.patient.phone}</div>
              <div class="text-sm text-gray-600 text-right px-2">{item.patient.nationalId}</div>
              <div class="font-medium text-right px-2">{item.patient.firstName} {item.patient.lastName}</div>
            </div>
          </div>
        {/each}
      </div>
      
      <div class="mt-4 pt-4 border-t">
        <div class="text-sm font-medium text-gray-700 text-center">
          סה"כ ממתינים: {waitlistedPatients.length}
        </div>
      </div>
    {/if}
  </div>
</section>

<style>
  table {
    direction: rtl;
  }
</style>
