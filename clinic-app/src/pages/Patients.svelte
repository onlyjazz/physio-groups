<script lang="ts">
  import { load, api, type Db, type Patient } from '../lib/db'
  import { exportToCSV } from '../lib/csvExport'
  import { goto } from '../router'
  let db: Db = load()
  let firstName='', lastName='', nationalId='', phone=''
  let editingId = ''
  let editingFirstName = '', editingLastName = '', editingNationalId = '', editingPhone = ''
  let searchQuery = ''
  
  // Sorting state
  let sortDirection: 'asc' | 'desc' = 'asc'
  
  function add() {
    if (!firstName || !lastName) return
    api.addPatient(db,{firstName,lastName,nationalId,phone})
    firstName=lastName=nationalId=phone=''
    db=load()
  }
  function del(id: string) { if (confirm('למחוק מטופל/ת?')) { api.removePatient(db,id); db=load() } }
  function startEdit(patient: Patient) {
    editingId = patient.id
    editingFirstName = patient.firstName
    editingLastName = patient.lastName
    editingNationalId = patient.nationalId
    editingPhone = patient.phone
  }
  function cancelEdit() {
    editingId = ''
    editingFirstName = editingLastName = editingNationalId = editingPhone = ''
  }
  function saveEdit() {
    if (!editingFirstName.trim() || !editingLastName.trim()) return
    api.updatePatient(db, editingId, {
      firstName: editingFirstName.trim(),
      lastName: editingLastName.trim(),
      nationalId: editingNationalId.trim(),
      phone: editingPhone.trim()
    })
    editingId = ''
    editingFirstName = editingLastName = editingNationalId = editingPhone = ''
    db = load()
  }
  
  // Sorting function
  function toggleSort() {
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'
  }
  
  // Get filtered and sorted patients
  $: filteredAndSortedPatients = (() => {
    let patients = [...db.patients]
    
    // Apply search filter if query exists
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase()
      patients = patients.filter(p => {
        const searchableText = [
          p.firstName || '',
          p.lastName || '',
          p.nationalId || '',
          p.phone || ''
        ].join(' ').toLowerCase()
        
        return searchableText.includes(query)
      })
    }
    
    // Apply sorting
    return patients.sort((a, b) => {
      const fullNameA = `${a.firstName || ''} ${a.lastName || ''}`
      const fullNameB = `${b.firstName || ''} ${b.lastName || ''}`
      const compareValue = fullNameA.localeCompare(fullNameB, 'he')
      return sortDirection === 'asc' ? compareValue : -compareValue
    })
  })()
  
  // Export function
  function exportPatients() {
    const exportData = filteredAndSortedPatients.map(p => ({
      'שם פרטי': p.firstName,
      'שם משפחה': p.lastName,
      'ת.ז.': p.nationalId,
      'טלפון': p.phone
    }))
    exportToCSV(exportData, 'patients')
  }
</script>

<section class="space-y-6">
  <div class="bg-white rounded-lg shadow p-4">
    <div class="flex justify-between items-center mb-4">
      <button 
        class="text-blue-600 hover:text-blue-700 text-sm font-medium"
        on:click={exportPatients}
      >
        ייצוא
      </button>
      <h2 class="text-lg font-semibold">מטופלים</h2>
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
        <input 
          class="flex-1 border rounded px-3 h-10" 
          style="text-align: right;"
          placeholder="שם פרטי" 
          bind:value={firstName} 
          dir="rtl" 
          aria-label="שם פרטי"
        />
        <input 
          class="border rounded px-3 h-10" 
          style="text-align: right; min-width: 150px; flex: 0.8;"
          placeholder="שם משפחה" 
          bind:value={lastName} 
          dir="rtl" 
          aria-label="שם משפחה"
        />
        <input 
          class="border rounded px-3 h-10" 
          style="text-align: right; width: 120px;"
          placeholder="ת.ז." 
          bind:value={nationalId} 
          dir="rtl" 
          aria-label="תעודת זהות"
        />
        <input 
          class="border rounded px-3 h-10" 
          style="text-align: right; width: 140px;"
          placeholder="טלפון" 
          bind:value={phone} 
          dir="rtl" 
          aria-label="טלפון"
        />
        <button class="big-green-button" style="min-width: 90px;">הוסף/י</button>
      </div>
    </form>
  </div>

  <div class="bg-white rounded-lg shadow p-4">
    <!-- Header row -->
    <div class="flex items-center gap-4 py-2 border-b mb-2">
      <div class="flex-1 min-w-0">
        <button 
          class="py-1 px-2 inline-flex items-center"
          on:click={toggleSort}
        >
          <span class="text-gray-700 font-semibold text-sm">פרטי מטופל</span>
          <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={sortDirection === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}></path>
          </svg>
        </button>
      </div>
      <div class="flex gap-1 min-w-[80px] justify-end">
        <!-- Empty space for action buttons column -->
      </div>
    </div>
    
    <div class="space-y-2">
      {#each filteredAndSortedPatients as p (p.id)}
        <div class="flex {editingId === p.id ? 'flex-row-reverse' : ''} items-center gap-4 py-2">
          <div class="flex-1 min-w-0">
            {#if editingId === p.id}
              <div class="flex flex-row-reverse items-center gap-2">
                <input 
                  class="flex-1 border rounded px-3 py-1 text-sm" 
                  style="text-align: right;"
                  bind:value={editingFirstName} 
                  placeholder="שם פרטי" 
                  dir="rtl" 
                  aria-label="עריכת שם פרטי"
                />
                <input 
                  class="border rounded px-3 py-1 text-sm" 
                  style="text-align: right; min-width: 150px; flex: 0.8;"
                  bind:value={editingLastName} 
                  placeholder="שם משפחה" 
                  dir="rtl" 
                  aria-label="עריכת שם משפחה"
                />
                <input 
                  class="border rounded px-3 py-1 text-sm" 
                  style="text-align: right; width: 120px;"
                  bind:value={editingNationalId} 
                  placeholder="ת.ז." 
                  dir="rtl" 
                  aria-label="עריכת תעודת זהות"
                />
                <input 
                  class="border rounded px-3 py-1 text-sm" 
                  style="text-align: right; width: 140px;"
                  bind:value={editingPhone} 
                  placeholder="טלפון" 
                  dir="rtl" 
                  aria-label="עריכת טלפון"
                />
              </div>
            {:else}
              <button 
                class="text-gray-900 text-left hover:bg-gray-50 rounded px-2 py-1 transition-colors"
                on:click={() => goto(`/patientAttendance/${p.id}`)}
              >
                <span class="font-medium hover:text-blue-600">{p.firstName} {p.lastName}</span>
                <span class="text-gray-600 text-sm mr-3">ת.ז. {p.nationalId}</span>
                <span class="text-gray-600 text-sm">טל. {p.phone}</span>
              </button>
            {/if}
          </div>
          <div class="flex gap-1" style="min-width: 90px;">
            {#if editingId === p.id}
              <button class="big-blue-button" style="height: auto; padding: 0.25rem 0.5rem; font-size: 0.875rem;" on:click={saveEdit}>שמור</button>
              <button class="big-orange-button" style="height: auto; padding: 0.25rem 0.5rem; font-size: 0.875rem;" on:click={cancelEdit}>ביטול</button>
            {:else}
              <button 
                class="text-green-600 hover:text-green-700 p-1" 
                on:click={() => goto(`/registration/${p.id}`)}
                title="רישום"
                aria-label="רישום"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button 
                class="text-purple-600 hover:text-purple-700 p-1" 
                on:click={() => goto(`/history/${p.id}`)}
                title="היסטוריה"
                aria-label="היסטוריה"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button 
                class="text-indigo-600 hover:text-indigo-700 p-1" 
                on:click={() => goto(`/groupsForPatient/${p.id}`)}
                title="קבוצות"
                aria-label="קבוצות"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </button>
              <button 
                class="text-blue-600 hover:text-blue-700 p-1" 
                on:click={() => startEdit(p)}
                title="ערוך"
                aria-label="ערוך"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button 
                class="text-red-600 hover:text-red-700 p-1" 
                on:click={() => del(p.id)}
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
      {#if filteredAndSortedPatients.length===0}
        <div class="py-8 text-center text-gray-500">
          {#if searchQuery.trim()}
            לא נמצאו תוצאות עבור "{searchQuery}"
          {:else}
            אין מטופלים
          {/if}
        </div>
      {/if}
    </div>
  </div>
</section>

