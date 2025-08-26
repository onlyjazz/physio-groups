<script lang="ts">
  import { load, api, type Db } from '../lib/db'
  import { route } from '../router'
  import { goto } from '../router'
  
  let db: Db = load()
  
  // Get group ID from route if available
  $: groupId = $route.segments[0] || null
  $: displayGroups = groupId ? db.groups.filter(g => g.id === groupId) : []
  
  
  // Edit group functionality
  let editingGroupId = ''
  let editingGroupName = ''
  let editingGroupCapacity = 15
  let editingGroupAvailable = 15
  let editingGroupWhen = 'open'

  function del(id: string) { 
    if (confirm('למחוק קבוצה?')) { 
      api.removeGroup(db,id)
      db=load()
      // Navigate back to list after deletion
      goto('groupsList')
    } 
  }
  function startEditGroup(id: string, currentName: string) {
    const group = db.groups.find(g => g.id === id)
    editingGroupId = id
    editingGroupName = currentName
    editingGroupCapacity = group?.capacity || 15
    editingGroupAvailable = group?.available || 15
    editingGroupWhen = group?.when || 'open'
  }
  function cancelEditGroup() {
    editingGroupId = ''
    editingGroupName = ''
    editingGroupCapacity = 15
    editingGroupAvailable = 15
    editingGroupWhen = 'open'
  }
  function saveEditGroup() {
    if (!editingGroupName.trim()) return
    api.updateGroup(db, editingGroupId, { 
      name: editingGroupName.trim(),
      capacity: editingGroupCapacity,
      available: editingGroupAvailable,
      when: editingGroupWhen
    })
    editingGroupId = ''
    editingGroupName = ''
    editingGroupCapacity = 15
    editingGroupAvailable = 15
    editingGroupWhen = 'open'
    db = load()
  }
  function setTherapist(groupId: string, tId: string) {
    api.setTherapistForGroup(db, groupId, tId); db=load()
  }
  function addPatient(groupId: string, patientId: string) {
    if (!patientId) return
    api.addPatientToGroup(db, groupId, patientId); 
    db=load()
    // Reset the dropdown
    setTimeout(() => {
      const select = document.getElementById(`add-patient-${groupId}`) as HTMLSelectElement
      if (select) select.value = ''
    }, 100)
  }
  function removePatient(groupId: string, patientId: string) {
    api.removePatientFromGroup(db, groupId, patientId); db=load()
  }
  function updateReceipt(groupId: string, patientId: string, newReceipt: string) {
    api.updatePatientReceipt(db, groupId, patientId, newReceipt); db=load()
  }
  
  function backToList() {
    goto('groupsList')
  }
</script>

<section class="space-y-6">
  {#if groupId}
    <div class="bg-white rounded-lg shadow p-4">
      <div class="flex justify-between items-center mb-4">
        <button 
          class="text-blue-600 hover:underline text-sm" 
          on:click={backToList}
        >
          חזרה לרשימה
        </button>
        <h2 class="text-lg font-semibold">עריכת קבוצה</h2>
      </div>
    </div>
  {/if}

  {#if !groupId}
    <p class="text-center text-gray-500 py-8">אנא בחר קבוצה מהרשימה</p>
  {/if}

  {#each displayGroups as g (g.id)}
    <div class="bg-white rounded-lg shadow p-4 space-y-3">
      <div class="flex items-center gap-3">
        <h3 class="text-base font-semibold ml-auto">
          {#if editingGroupId === g.id}
            <input class="border rounded px-2 py-1 text-right" bind:value={editingGroupName} on:keydown={(e) => e.key === 'Enter' && saveEditGroup()}/>
          {:else}
            {g.name}
          {/if}
        </h3>
        <div class="flex gap-2">
          {#if editingGroupId === g.id}
            <button class="text-green-600 hover:underline text-sm" on:click={saveEditGroup}>שמור</button>
            <button class="text-gray-600 hover:underline text-sm" on:click={cancelEditGroup}>ביטול</button>
          {:else}
            <button class="text-blue-600 hover:underline text-sm" on:click={() => startEditGroup(g.id, g.name)}>ערוך</button>
            <button class="text-red-600 hover:underline text-sm" on:click={() => del(g.id)}>מחק</button>
          {/if}
        </div>
      </div>

      <div class="flex items-center gap-2">
        <select id="therapist-{g.id}" class="flex-1 border rounded px-3 h-10 text-right" dir="rtl" on:change={(e)=>setTherapist(g.id,(e.target as HTMLSelectElement).value)}
          value={db.therapistsInGroups.find(x=>x.groupId===g.id)?.therapistId ?? ''}>
          <option value="" disabled selected={!db.therapistsInGroups.find(x=>x.groupId===g.id)}>בחר/י</option>
          {#each db.therapists as t}<option value={t.id}>{t.name}</option>{/each}
        </select>
        <label class="text-sm text-gray-500 whitespace-nowrap ml-2" for="therapist-{g.id}">מטפל/ת</label>
      </div>
      
      <div class="flex items-center gap-2">
        {#if editingGroupId === g.id}
          <input class="w-16 border rounded px-2 py-1 text-sm text-right" type="number" bind:value={editingGroupCapacity}/>
        {:else}
          <span class="w-16 text-sm">{g.capacity || 15}</span>
        {/if}
        <span class="text-sm text-gray-500 whitespace-nowrap ml-1">קיבולת</span>
        {#if editingGroupId === g.id}
          <input class="w-16 border rounded px-2 py-1 text-sm text-right" type="number" bind:value={editingGroupAvailable}/>
        {:else}
          <span class="w-16 text-sm">{g.available || 15}</span>
        {/if}
        <span class="text-sm text-gray-500 whitespace-nowrap ml-1">פנוי</span>
        {#if editingGroupId === g.id}
          <input class="w-40 border rounded px-2 py-1 text-sm text-right" bind:value={editingGroupWhen}/>
        {:else}
          <span class="w-40 text-sm">{g.when || 'open'}</span>
        {/if}
        <span class="text-sm text-gray-500 whitespace-nowrap ml-1">מתי</span>
      </div>

      <div class="flex items-center gap-2">
        <select id="add-patient-{g.id}" class="flex-1 border rounded px-3 h-10 text-right" dir="rtl" on:change={(e)=>addPatient(g.id,(e.target as HTMLSelectElement).value)}>
          <option value="" selected disabled>בחר/י מטופל/ת</option>
          {#each db.patients as p}<option value={p.id}>{p.firstName} {p.lastName}</option>{/each}
        </select>
        <label class="text-sm text-gray-500 whitespace-nowrap ml-2" for="add-patient-{g.id}">הוסף/י מטופל/ת</label>
      </div>

      <div>
        <h4 class="text-sm text-gray-500 mb-2">מטופלים בקבוצה</h4>
        <ul class="space-y-2">
          {#each db.patientsInGroups.filter(x=>x.groupId===g.id) as row (row.id)}
            <li class="bg-gray-50 p-3 rounded border">
              <div class="flex items-center justify-end gap-3 mb-2">
                <button class="text-red-600 hover:underline text-sm" on:click={() => removePatient(g.id,row.patientId)}>הסר/י</button>
                <span class="font-medium">
                  {db.patients.find(p=>p.id===row.patientId)?.firstName}
                  {db.patients.find(p=>p.id===row.patientId)?.lastName}
                </span>
              </div>
              <div class="flex items-center gap-2 justify-end">
                <input 
                  id="receipt-{g.id}-{row.patientId}"
                  class="border rounded px-2 py-1 text-sm flex-1 text-right" 
                  placeholder="מספר קבלה"
                  value={row.receipt || ''}
                  on:blur={(e) => updateReceipt(g.id, row.patientId, (e.target as HTMLInputElement).value)}
                />
                <label class="text-sm text-gray-500" for="receipt-{g.id}-{row.patientId}">קבלה</label>
              </div>
            </li>
          {/each}
          {#if db.patientsInGroups.filter(x=>x.groupId===g.id).length===0}
            <li class="text-gray-500 p-3">אין מטופלים בקבוצה</li>
          {/if}
        </ul>
      </div>
    </div>
  {/each}
</section>

