<script lang="ts">
  import { load, save, api, type Db } from '../lib/db'
  import { exportToCSV } from '../lib/csvExport'
  let db: Db = load()
  let name = ''
  let editingId = ''
  let editingName = ''
  
  // Sorting state
  let sortDirection: 'asc' | 'desc' = 'asc'
  
  function add() { if (!name.trim()) return; api.addTherapist(db, name.trim()); name=''; db = load() }
  function del(id: string) { if (confirm('למחוק מנחה?')) { api.removeTherapist(db,id); db=load() } }
  function startEdit(id: string, currentName: string) {
    editingId = id
    editingName = currentName
  }
  function cancelEdit() {
    editingId = ''
    editingName = ''
  }
  function saveEdit() {
    if (!editingName.trim()) return
    api.updateTherapist(db, editingId, { name: editingName.trim() })
    editingId = ''
    editingName = ''
    db = load()
  }
  
  // Sorting function
  function toggleSort() {
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'
  }
  
  // Get sorted therapists
  $: sortedTherapists = (() => {
    const therapists = [...db.therapists]
    return therapists.sort((a, b) => {
      const compareValue = (a.name || '').localeCompare(b.name || '', 'he')
      return sortDirection === 'asc' ? compareValue : -compareValue
    })
  })()
  
  // Export function
  function exportTherapists() {
    const exportData = sortedTherapists.map(t => ({
      'שם מנחה': t.name
    }))
    exportToCSV(exportData, 'therapists')
  }
  
  // Compute sort icon path
  $: sortIconPath = sortDirection === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'
</script>

<section class="space-y-6">
  <div class="bg-white rounded-lg shadow p-4">
    <div class="flex justify-between items-center mb-4">
      <button 
        class="text-blue-600 hover:text-blue-700 text-sm font-medium"
        on:click={exportTherapists}
      >
        ייצוא
      </button>
      <h2 class="text-lg font-semibold">מנחה</h2>
    </div>
    <form on:submit|preventDefault={add}>
      <div class="flex flex-row-reverse items-center gap-2">
        <input 
          class="flex-1 border rounded px-3 h-10" 
          style="text-align: right;"
          placeholder="שם מלא" 
          bind:value={name} 
          dir="rtl"
        />
        <button type="submit" class="big-green-button" style="min-width: 100px;">הוסף/י</button>
      </div>
    </form>
  </div>

  <div class="bg-white rounded-lg shadow p-4">
    <!-- Header row -->
    <div class="flex flex-row-reverse items-center gap-2 py-2 border-b mb-2">
      <div class="flex gap-1">
        <button class="text-blue-600 hover:text-blue-700 p-1" disabled>
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"></svg>
        </button>
        <button class="text-red-600 hover:text-red-700 p-1" disabled>
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"></svg>
        </button>
      </div>
      <div>
        <span class="text-gray-700 font-semibold text-sm">שם מנחה</span>
      </div>
    </div>
    
    <div class="space-y-2">
      {#each sortedTherapists as t (t.id)}
        <div class="flex flex-row-reverse items-center gap-2 py-2">
          <div class="flex gap-1">
            {#if editingId === t.id}
              <button class="text-green-600 hover:underline text-sm" on:click={saveEdit}>שמור</button>
              <button class="text-gray-600 hover:underline text-sm" on:click={cancelEdit}>ביטול</button>
            {:else}
              <button 
                class="text-blue-600 hover:text-blue-700 p-1" 
                on:click={() => startEdit(t.id, t.name)}
                title="ערוך"
                aria-label="ערוך"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button 
                class="text-red-600 hover:text-red-700 p-1" 
                on:click={() => del(t.id)}
                title="מחק"
                aria-label="מחק"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            {/if}
          </div>
          <div>
            {#if editingId === t.id}
              <input class="border rounded px-2 py-1" style="text-align: right;" bind:value={editingName} dir="rtl" on:keydown={(e) => e.key === 'Enter' && saveEdit()}/>
            {:else}
              <span class="text-gray-900">{t.name}</span>
            {/if}
          </div>
        </div>
      {/each}
      {#if sortedTherapists.length === 0}
        <div class="py-8 text-center text-gray-500">אין מנחים</div>
      {/if}
    </div>
  </div>
</section>

