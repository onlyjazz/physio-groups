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
  
  // Sorting state
  let sortColumn: 'name' | 'group' | 'available' | 'date' | null = null
  let sortDirection: 'asc' | 'desc' = 'asc'
  
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
    
    // Apply sorting
    if (sortColumn) {
      waitlisted.sort((a, b) => {
        let aVal: any, bVal: any
        
        switch (sortColumn) {
          case 'name':
            aVal = `${a.patient.lastName} ${a.patient.firstName}`.toLowerCase()
            bVal = `${b.patient.lastName} ${b.patient.firstName}`.toLowerCase()
            break
          case 'group':
            aVal = a.groupName.toLowerCase()
            bVal = b.groupName.toLowerCase()
            break
          case 'available':
            aVal = a.available
            bVal = b.available
            break
          case 'date':
            aVal = a.createdAt
            bVal = b.createdAt
            break
          default:
            return 0
        }
        
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    } else {
      // Default sort by creation date (newest first)
      waitlisted.sort((a, b) => b.createdAt - a.createdAt)
    }
    
    return waitlisted
  }
  
  // Sort function
  function sort(column: 'name' | 'group' | 'available' | 'date') {
    if (sortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'
    } else {
      sortColumn = column
      sortDirection = 'asc'
    }
  }
  
  // Make dependencies explicit for Svelte reactivity
  $: waitlistedPatients = (() => {
    db;
    sortColumn;
    sortDirection;
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
      <!-- Header row (matching Patients page layout) -->
      <div class="flex items-center gap-4 py-2 border-b mb-2">
        <div class="text-gray-700 font-semibold text-sm px-2" style="width: 120px;">
          <button 
            class="hover:bg-gray-50 px-1 py-1 rounded cursor-pointer"
            on:click={() => sort('date')}
          >
            בהמתנה מ
            {#if sortColumn === 'date'}
              <span class="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
            {/if}
          </button>
        </div>
        <div class="text-gray-700 font-semibold text-sm px-2" style="width: 50px;">
          <button 
            class="hover:bg-gray-50 px-1 py-1 rounded cursor-pointer"
            on:click={() => sort('available')}
          >
            פנוי
            {#if sortColumn === 'available'}
              <span class="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
            {/if}
          </button>
        </div>
        <div class="text-gray-700 font-semibold text-sm text-right" style="width: 120px;">
          <button 
            class="hover:bg-gray-50 px-1 py-1 rounded cursor-pointer text-right w-full"
            on:click={() => sort('group')}
          >
            קבוצה
            {#if sortColumn === 'group'}
              <span class="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
            {/if}
          </button>
        </div>
        <div class="flex-1 min-w-0">
          <button 
            class="py-1 px-2 inline-flex items-center"
            on:click={() => sort('name')}
          >
            <span class="text-gray-700 font-semibold text-sm">פרטי מטופל</span>
            {#if sortColumn === 'name'}
              <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={sortDirection === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}></path>
              </svg>
            {/if}
          </button>
        </div>
        <div class="flex gap-1 min-w-[80px] justify-end">
          <!-- Empty space for action buttons column -->
        </div>
      </div>
      
      <div class="space-y-2">
        {#each waitlistedPatients as item}
          {@const paymentPeriod = getPaymentPeriod(item.patientId, item.groupId)}
          <div class="flex items-center gap-4 py-2">
            <div class="text-sm text-gray-600 text-center" style="width: 120px;">
              {new Date(item.createdAt).toLocaleDateString('he-IL', { 
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
              })}
            </div>
            <div class="text-sm text-center" style="width: 50px;">
              <span class="font-semibold"
                    class:text-red-600={item.available <= 0} 
                    class:text-orange-500={item.available > 0 && item.available <= 3}
                    class:text-green-600={item.available > 3}>
                {item.available}
              </span>
            </div>
            <div class="text-sm font-medium text-right" style="width: 120px;">
              {item.groupName}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-gray-900 text-left px-2">
                <span class="font-medium">{item.patient.firstName} {item.patient.lastName}</span>
                <span class="text-gray-600 text-sm mr-3">ת.ז. {item.patient.nationalId}</span>
                <span class="text-gray-600 text-sm">טל. {item.patient.phone}</span>
              </div>
            </div>
            <div class="flex gap-1" style="min-width: 80px;">
              <button 
                class="text-green-600 hover:text-green-700 p-1"
                on:click={() => goto(`/registration/${item.patientId}/${item.groupId}`)}
                title="רישום תשלום"
                aria-label="רישום תשלום"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button 
                class="text-red-600 hover:text-red-700 p-1"
                on:click={() => removeFromWaitlist(item.groupId, item.patientId, `${item.patient.firstName} ${item.patient.lastName}`)}
                title="הסר מרשימת המתנה"
                aria-label="הסר מרשימת המתנה"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
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
