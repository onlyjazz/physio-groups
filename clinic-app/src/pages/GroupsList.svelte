<script lang="ts">
  import { load, api, save, type Db, type Group } from '../lib/db'
  import { goto } from '../router'
  import { exportToCSV } from '../lib/csvExport'
  
  let db: Db = load()
  let name = ''
  let capacity = 15
  let available = 15
  let when = ''
  let searchQuery = ''
  
  // Inline editing state
  let editingId = ''
  let editingName = ''
  let editingWhen = ''
  let editingTherapistId = ''
  
  // Sorting state
  let sortField: 'name' | 'therapist' | 'when' | 'available' | null = null
  let sortDirection: 'asc' | 'desc' = 'asc'
  
  function add() {
    if (!name.trim()) return
    api.addGroup(db, name.trim(), capacity, available, when)
    // Reset form
    name = ''
    capacity = 15
    available = 15
    when = ''
    db = load()
  }
  
  function startEdit(group: Group) {
    editingId = group.id
    editingName = group.name || ''
    editingWhen = group.when || ''
    
    // Get current therapist
    const therapistInGroup = db.therapistsInGroups.find(x => x.groupId === group.id)
    editingTherapistId = therapistInGroup?.therapistId || ''
  }
  
  function cancelEdit() {
    editingId = ''
    editingName = ''
    editingWhen = ''
    editingTherapistId = ''
  }
  
  function saveEdit() {
    if (!editingName.trim()) return
    
    // Get current group to preserve capacity and available
    const currentGroup = db.groups.find(g => g.id === editingId)
    if (!currentGroup) return
    
    // Update group details (keeping capacity and available unchanged)
    api.updateGroup(db, editingId, {
      name: editingName.trim(),
      capacity: currentGroup.capacity,
      available: currentGroup.available,
      when: editingWhen.trim()
    })
    
    // Update therapist assignment
    if (editingTherapistId) {
      // setTherapistForGroup handles both adding and updating
      api.setTherapistForGroup(db, editingId, editingTherapistId)
    } else {
      // Remove therapist assignment if no therapist selected
      const existingAssignment = db.therapistsInGroups.find(x => x.groupId === editingId)
      if (existingAssignment) {
        // Remove the assignment by filtering it out
        db.therapistsInGroups = db.therapistsInGroups.filter(x => x.groupId !== editingId)
        save(db)
      }
    }
    
    cancelEdit()
    db = load()
  }
  
  function deleteGroup(id: string) {
    if (confirm('למחוק קבוצה?')) {
      api.removeGroup(db, id)
      db = load()
    }
  }
  
  function editGroup(id: string) {
    goto(`groups/${id}`)
  }
  
  function attendanceGroup(id: string) {
    goto(`groupAttendance/${id}`)
  }
  
  function viewPatients(id: string) {
    goto(`patientsInGroup/${id}`)
  }
  
  // Sorting function
  function sortBy(field: 'name' | 'therapist' | 'when' | 'available') {
    if (sortField === field) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'
    } else {
      sortField = field
      sortDirection = 'asc'
    }
  }
  
  // Filter groups based on search
  $: filteredGroups = (() => {
    if (!searchQuery.trim()) return db.groups
    
    const query = searchQuery.toLowerCase()
    return db.groups.filter(group => {
      // Search in group name
      if (group.name?.toLowerCase().includes(query)) return true
      
      // Search in when field
      if (group.when?.toLowerCase().includes(query)) return true
      
      // Search in therapist name
      const therapistInGroup = db.therapistsInGroups.find(x => x.groupId === group.id)
      if (therapistInGroup) {
        const therapist = db.therapists.find(t => t.id === therapistInGroup.therapistId)
        if (therapist?.name?.toLowerCase().includes(query)) return true
      }
      
      return false
    })
  })()
  
  // Get sorted and filtered groups
  $: sortedGroups = (() => {
    const groups = [...filteredGroups]
    
    if (!sortField) return groups
    
    return groups.sort((a, b) => {
      let compareValue = 0
      
      if (sortField === 'name') {
        compareValue = (a.name || '').localeCompare(b.name || '', 'he')
      } else if (sortField === 'therapist') {
        const therapistA = db.therapistsInGroups.find(x => x.groupId === a.id)
        const therapistB = db.therapistsInGroups.find(x => x.groupId === b.id)
        const nameA = therapistA ? db.therapists.find(t => t.id === therapistA.therapistId)?.name || '' : ''
        const nameB = therapistB ? db.therapists.find(t => t.id === therapistB.therapistId)?.name || '' : ''
        compareValue = nameA.localeCompare(nameB, 'he')
      } else if (sortField === 'when') {
        compareValue = (a.when || '').localeCompare(b.when || '', 'he')
      } else if (sortField === 'available') {
        const availableA = api.getAvailableWithActiveSubscriptions(db, a.id)
        const availableB = api.getAvailableWithActiveSubscriptions(db, b.id)
        compareValue = availableA - availableB
      }
      
      return sortDirection === 'asc' ? compareValue : -compareValue
    })
  })()
  
  // Export function
  function exportGroups() {
    const exportData = sortedGroups.map(g => {
      const therapistInGroup = db.therapistsInGroups.find(x => x.groupId === g.id)
      const therapist = therapistInGroup ? db.therapists.find(t => t.id === therapistInGroup.therapistId) : null
      return {
        'שם קבוצה': g.name,
        'מנחה': therapist ? therapist.name : '',
        'מתי': g.when,
        'קיבולת': g.capacity || 15,
        'זמין': g.available || 15
      }
    })
    exportToCSV(exportData, 'groups')
  }
  
  function navigateToImport() {
    goto('excelImport')
  }
  
  // Check if import is available (will fail in single-file build)
  let showImport = false
  if (typeof window !== 'undefined') {
    // Check if we can dynamically import modules
    try {
      // This will fail in single-file builds
      showImport = !!(window as any).require || typeof import.meta !== 'undefined'
    } catch {
      showImport = false
    }
  }
</script>

<section class="space-y-6">
  <div class="bg-white rounded-lg shadow p-4">
    <div class="flex justify-between items-center mb-4">
      <div class="flex gap-2">
        <button 
          class="text-blue-600 hover:text-blue-700 text-sm font-medium"
          on:click={exportGroups}
        >
          ייצוא
        </button>
        {#if showImport}
          <button 
            class="text-green-600 hover:text-green-700 text-sm font-medium"
            on:click={navigateToImport}
          >
            ייבוא מאקסל
          </button>
        {/if}
      </div>
      <h2 class="text-lg font-semibold">קבוצות</h2>
    </div>
    
    <!-- Search box -->
    <div class="mb-3">
      <input
        type="text"
        class="w-full border rounded-full px-4 py-2 text-sm"
        style="text-align: right;"
        placeholder="חיפוש..."
        bind:value={searchQuery}
        dir="rtl"
      />
    </div>
    <form on:submit|preventDefault={add}>
      <div class="flex flex-row-reverse items-center gap-2">
        <label for="group-name" class="text-sm text-gray-500 whitespace-nowrap">שם קבוצה</label>
        <input 
          id="group-name" 
          class="flex-1 border rounded px-3 h-10" 
          style="text-align: right;"
          placeholder="שם קבוצה" 
          bind:value={name}
          dir="rtl"
        />
        <label for="group-when" class="text-sm text-gray-500 whitespace-nowrap ml-2">מתי</label>
        <input 
          id="group-when" 
          class="border rounded px-3 h-10" 
          style="text-align: right; width: 150px;"
          placeholder="יום ושעה" 
          bind:value={when}
          dir="rtl"
        />
        <label for="group-available" class="text-sm text-gray-500 whitespace-nowrap ml-2">פנוי</label>
        <input 
          id="group-available" 
          class="border rounded px-3 h-10" 
          style="text-align: right; width: 60px;"
          type="number" 
          bind:value={available}
          dir="rtl"
          max="99"
        />
        <label for="group-capacity" class="text-sm text-gray-500 whitespace-nowrap ml-2">קיבולת</label>
        <input 
          id="group-capacity" 
          class="border rounded px-3 h-10" 
          style="text-align: right; width: 60px;"
          type="number" 
          bind:value={capacity}
          dir="rtl"
          max="99"
        />
        <button type="submit" class="big-green-button" style="min-width: 100px;">הוסף/י</button>
      </div>
    </form>
  </div>

  <div class="bg-white rounded-lg shadow p-4">
    <!-- Header row -->
    <div class="flex items-center py-2 border-b mb-2">
      <div class="flex-1 grid" style="grid-template-columns: 50px minmax(100px, 1fr) minmax(100px, 1fr) 3fr;">
        <button 
          class="text-gray-700 text-center font-semibold text-sm py-1 px-2 flex items-center justify-center"
          on:click={() => sortBy('available')}
        >
          <span>זמין</span>
          {#if sortField === 'available'}
            <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={sortDirection === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}></path>
            </svg>
          {/if}
        </button>
        <button 
          class="text-gray-700 text-center font-semibold text-sm py-1 px-2 flex items-center justify-center"
          on:click={() => sortBy('therapist')}
        >
          <span>מנחה</span>
          {#if sortField === 'therapist'}
            <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={sortDirection === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}></path>
            </svg>
          {/if}
        </button>
        <button 
          class="text-gray-700 text-center font-semibold text-sm py-1 px-2 flex items-center justify-center"
          on:click={() => sortBy('when')}
        >
          <span>מתי</span>
          {#if sortField === 'when'}
            <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={sortDirection === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}></path>
            </svg>
          {/if}
        </button>
        <button 
          class="text-gray-700 text-center font-semibold text-sm py-1 px-2 flex items-center justify-center"
          on:click={() => sortBy('name')}
        >
          <span>שם קבוצה</span>
          {#if sortField === 'name'}
            <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={sortDirection === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}></path>
            </svg>
          {/if}
        </button>
      </div>
      <div class="flex gap-1 min-w-[90px] justify-end">
        <!-- Empty space for action buttons column -->
      </div>
    </div>
    
    <div class="space-y-2">
      {#each sortedGroups as g (g.id)}
        {@const therapistInGroup = db.therapistsInGroups.find(x => x.groupId === g.id)}
        {@const therapist = therapistInGroup ? db.therapists.find(t => t.id === therapistInGroup.therapistId) : null}
        {@const realAvailable = api.getAvailableWithActiveSubscriptions(db, g.id)}
        <div class="flex {editingId === g.id ? 'flex-row-reverse' : ''} items-center py-2 gap-4">
          <div class="flex-1">
            {#if editingId === g.id}
              <div class="flex items-center" style="gap: 8px; padding-right: 58px;">
                <!-- Therapist selector (under therapist header) -->
                <select 
                  class="border rounded px-3 py-1 text-sm text-center"
                  style="min-width: 150px; width: 200px;"
                  bind:value={editingTherapistId}
                  dir="rtl"
                >
                  <option value="">בחר מנחה</option>
                  {#each db.therapists as therapist}
                    <option value={therapist.id}>{therapist.name}</option>
                  {/each}
                </select>
                <!-- When field (under when header) -->
                <input 
                  type="text"
                  class="border rounded px-3 py-1 text-sm text-center"
                  style="min-width: 100px; width: 150px;"
                  bind:value={editingWhen}
                  dir="rtl"
                  placeholder="מתי"
                />
                <!-- Group name (under group name header, takes remaining space) -->
                <input 
                  type="text"
                  class="border rounded px-3 py-1 text-sm text-center font-medium"
                  style="flex: 1;"
                  bind:value={editingName}
                  dir="rtl"
                  placeholder="שם קבוצה"
                />
              </div>
            {:else}
              <div class="grid" style="grid-template-columns: 50px minmax(100px, 1fr) minmax(100px, 1fr) 3fr;">
                <div class="text-gray-600 text-center">
                  <span class="{realAvailable <= 0 ? 'text-red-600 font-bold' : realAvailable <= 3 ? 'text-orange-500' : ''}" dir="ltr" style="display: inline-block;">
                    {realAvailable}
                  </span>
                </div>
                <div class="text-gray-600 text-center">
                  <span>{therapist ? therapist.name : '-'}</span>
                </div>
                <div class="text-gray-600 text-center">
                  <span class="font-medium">{g.when}</span>
                </div>
                <div class="text-gray-900 text-center">
                  <span class="font-medium">{g.name}</span>
                </div>
              </div>
            {/if}
          </div>
          <div class="flex gap-1" style="min-width: 90px;">
            {#if editingId === g.id}
              <button 
                class="big-blue-button" 
                style="height: auto; padding: 0.25rem 0.5rem; font-size: 0.875rem;"
                on:click={saveEdit}
              >
                שמור
              </button>
              <button 
                class="big-orange-button" 
                style="height: auto; padding: 0.25rem 0.5rem; font-size: 0.875rem;"
                on:click={cancelEdit}
              >
                ביטול
              </button>
            {:else}
              <button 
                class="text-indigo-600 hover:text-indigo-700 p-1"
                on:click={() => viewPatients(g.id)}
                title="מטופלים"
                aria-label="מטופלים"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </button>
              <button 
                class="text-green-600 hover:text-green-700 p-1"
                on:click={() => attendanceGroup(g.id)}
                title="נוכחות"
                aria-label="נוכחות"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button 
                class="text-blue-600 hover:text-blue-700 p-1"
                on:click={() => startEdit(g)}
                title="ערוך"
                aria-label="ערוך"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button 
                class="text-red-600 hover:text-red-700 p-1"
                on:click={() => deleteGroup(g.id)}
                title="מחק"
                aria-label="מחק"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            {/if}
          </div>
        </div>
      {/each}
      {#if sortedGroups.length === 0}
        <div class="py-8 text-center text-gray-500">
          {#if searchQuery.trim()}
            לא נמצאו תוצאות עבור "{searchQuery}"
          {:else}
            אין קבוצות
          {/if}
        </div>
      {/if}
    </div>
  </div>
</section>
