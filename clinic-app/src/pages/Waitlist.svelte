<script lang="ts">
  import { load, api, type Db } from '../lib/db'
  import { goto } from '../router'
  
  let db: Db = load()
  
  // Waitlist item interface
  interface WaitlistItem {
    groupId: string
    patientId: string
    groupName: string
    available: number
    patientName: string
    createdAt: number
  }
  
  // Sorting state - default to newest first
  let sortColumn: 'groupName' | 'available' | 'patientName' | 'createdAt' = 'createdAt'
  let sortDirection: 'asc' | 'desc' = 'desc'
  
  // Get all waitlisted patients with their group information
  function getWaitlistedPatients(): WaitlistItem[] {
    const waitlisted: WaitlistItem[] = []
    
    for (const pig of db.patientsInGroups) {
      if (pig.enrolled === 0) {
        const group = db.groups.find(g => g.id === pig.groupId)
        const patient = db.patients.find(p => p.id === pig.patientId)
        
        if (group && patient) {
          // Calculate available spots correctly based on enrolled patients
          const enrolledInGroup = db.patientsInGroups.filter(p => p.groupId === group.id && p.enrolled === 1).length
          const availableSpots = group.capacity - enrolledInGroup
          
          waitlisted.push({
            groupId: group.id,
            patientId: patient.id,
            groupName: group.name,
            available: availableSpots,
            patientName: `${patient.firstName} ${patient.lastName}`,
            createdAt: pig.createdAt
          })
        }
      }
    }
    
    // Sort the data
    const sorted = waitlisted.sort((a, b) => {
      let aVal = a[sortColumn]
      let bVal = b[sortColumn]
      
      // Handle string comparison for names
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }
      
      if (sortDirection === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
      }
    })
    
    return sorted
  }
  
  // Make dependencies explicit for Svelte reactivity
  $: waitlistedPatients = (() => {
    // Access variables to establish dependency
    sortColumn;
    sortDirection;
    db;
    return getWaitlistedPatients();
  })()
  
  function removeFromWaitlist(groupId: string, patientId: string, patientName: string) {
    if (confirm(`להסיר את ${patientName} מרשימת המתנה?`)) {
      api.removePatientFromGroup(db, groupId, patientId)
      db = load()
    }
  }
  
  function goToRegistration(patientId: string, groupId: string) {
    goto(`registration/${patientId}/${groupId}`)
  }
  
  // Refresh data
  function refresh() {
    db = load()
  }
  
  // Sort handling
  function handleSort(column: typeof sortColumn) {
    if (sortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'
    } else {
      sortColumn = column
      sortDirection = 'asc'
    }
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
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-50">
              <th class="px-2 py-3 text-left w-12">
                <span class="text-sm font-medium text-gray-600">פעולות</span>
              </th>
              <th class="px-2 py-3">
                <button 
                  class="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center justify-center w-full"
                  on:click={() => handleSort('createdAt')}
                >
                  תאריך הצטרפות
                  {#if sortColumn === 'createdAt'}
                    <span class="mr-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  {/if}
                </button>
              </th>
              <th class="px-2 py-3">
                <button 
                  class="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center justify-center w-full"
                  on:click={() => handleSort('patientName')}
                >
                  שם מטופל
                  {#if sortColumn === 'patientName'}
                    <span class="mr-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  {/if}
                </button>
              </th>
              <th class="px-2 py-3 w-20">
                <button 
                  class="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center justify-center w-full"
                  on:click={() => handleSort('available')}
                >
                  פנוי
                  {#if sortColumn === 'available'}
                    <span class="mr-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  {/if}
                </button>
              </th>
              <th class="px-2 py-3">
                <button 
                  class="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center justify-center w-full"
                  on:click={() => handleSort('groupName')}
                >
                  שם קבוצה
                  {#if sortColumn === 'groupName'}
                    <span class="mr-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  {/if}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {#each waitlistedPatients as item}
              <tr class="hover:bg-gray-50">
                <td class="px-2 py-3 text-left">
                  <div class="flex gap-2">
                    <button 
                      class="text-red-600 hover:text-red-700"
                      on:click={() => removeFromWaitlist(item.groupId, item.patientId, item.patientName)}
                      title="הסר מרשימת המתנה"
                      aria-label="הסר מרשימת המתנה"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <button 
                      class="text-green-600 hover:text-green-700"
                      on:click={() => goToRegistration(item.patientId, item.groupId)}
                      title="לתשלום"
                      aria-label="לתשלום"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                </td>
                <td class="px-2 py-3 text-sm text-center text-gray-600">
                  {new Date(item.createdAt).toLocaleDateString('he-IL', { 
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit'
                  })}
                </td>
                <td class="px-2 py-3 text-sm text-center">{item.patientName}</td>
                <td class="px-2 py-3 text-sm text-center">
                  <span class:text-red-600={item.available === 0} 
                        class:text-green-600={item.available > 0}
                        class:font-semibold={item.available === 0}>
                    {item.available}
                  </span>
                </td>
                <td class="px-2 py-3 text-sm font-medium text-center">{item.groupName}</td>
              </tr>
            {/each}
          </tbody>
        </table>
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
