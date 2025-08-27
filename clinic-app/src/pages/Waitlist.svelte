<script lang="ts">
  import { load, type Db } from '../lib/db'
  import { goto } from '../router'
  
  let db: Db = load()
  
  // Sorting state - default to newest first
  let sortColumn: 'groupName' | 'available' | 'patientName' | 'createdAt' = 'createdAt'
  let sortDirection: 'asc' | 'desc' = 'desc'
  
  // Get all waitlisted patients with their group information
  function getWaitlistedPatients() {
    const waitlisted = []
    
    for (const pig of db.patientsInGroups) {
      if (pig.enrolled === 0) {
        const group = db.groups.find(g => g.id === pig.groupId)
        const patient = db.patients.find(p => p.id === pig.patientId)
        
        if (group && patient) {
          waitlisted.push({
            groupId: group.id,
            groupName: group.name,
            available: group.available,
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
  
  function editGroup(groupId: string) {
    goto(`groups/${groupId}`)
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
                  <button 
                    class="text-blue-600 hover:text-blue-800"
                    on:click={() => editGroup(item.groupId)}
                    title="ערוך קבוצה"
                    aria-label="ערוך קבוצה"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
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
