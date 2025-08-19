<script lang="ts">
  import { load, api, type Db } from '../lib/db'
  let db: Db = load()
  let name='' ; let therapistId = db.therapists[0]?.id ?? ''
  
  
  // Edit group functionality
  let editingGroupId = ''
  let editingGroupName = ''

  function add() {
    if (!name.trim()) return
    api.addGroup(db,name.trim()); name=''; db=load()
  }
  function del(id: string) { if (confirm('למחוק קבוצה?')) { api.removeGroup(db,id); db=load() } }
  function startEditGroup(id: string, currentName: string) {
    editingGroupId = id
    editingGroupName = currentName
  }
  function cancelEditGroup() {
    editingGroupId = ''
    editingGroupName = ''
  }
  function saveEditGroup() {
    if (!editingGroupName.trim()) return
    api.updateGroup(db, editingGroupId, { name: editingGroupName.trim() })
    editingGroupId = ''
    editingGroupName = ''
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
</script>

<section class="space-y-6">
  <div class="bg-white rounded-lg shadow p-4">
    <h2 class="text-lg font-semibold mb-4">קבוצות</h2>
    <form class="grid grid-cols-12 gap-3" on:submit|preventDefault={add}>
      <input class="col-span-6 border rounded px-3 h-10" placeholder="שם קבוצה" bind:value={name}/>
      <select class="col-span-4 border rounded px-3 h-10" bind:value={therapistId}>
        {#each db.therapists as t}<option value={t.id}>{t.name}</option>{/each}
      </select>
      <div class="col-span-2">
        <button class="button bg-blue-600 text-white rounded px-4 h-10 hover:bg-blue-700">צור קבוצה</button>
      </div>
    </form>
  </div>

  {#each db.groups as g (g.id)}
    <div class="bg-white rounded-lg shadow p-4 space-y-3">
      <div class="flex items-center gap-3">
        <h3 class="text-base font-semibold ml-auto">
          {#if editingGroupId === g.id}
            <input class="border rounded px-2 py-1" bind:value={editingGroupName} on:keydown={(e) => e.key === 'Enter' && saveEditGroup()}/>
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

      <div class="grid grid-cols-12 gap-3 items-center">
        <label class="col-span-2 text-sm text-gray-500" for="therapist-{g.id}">מטפל/ת</label>
        <select id="therapist-{g.id}" class="col-span-4 border rounded px-3 h-10" on:change={(e)=>setTherapist(g.id,(e.target as HTMLSelectElement).value)}
          value={db.therapistsInGroups.find(x=>x.groupId===g.id)?.therapistId ?? ''}>
          <option value="" disabled selected={!db.therapistsInGroups.find(x=>x.groupId===g.id)}>בחר/י</option>
          {#each db.therapists as t}<option value={t.id}>{t.name}</option>{/each}
        </select>
      </div>

      <div class="grid grid-cols-12 gap-3 items-center">
        <label class="col-span-2 text-sm text-gray-500" for="add-patient-{g.id}">הוסף/י מטופל/ת</label>
        <select id="add-patient-{g.id}" class="col-span-4 border rounded px-3 h-10" on:change={(e)=>addPatient(g.id,(e.target as HTMLSelectElement).value)}>
          <option value="" selected disabled>בחר/י מטופל/ת</option>
          {#each db.patients as p}<option value={p.id}>{p.firstName} {p.lastName}</option>{/each}
        </select>
      </div>

      <div>
        <h4 class="text-sm text-gray-500 mb-2">מטופלים בקבוצה</h4>
        <ul class="space-y-2">
          {#each db.patientsInGroups.filter(x=>x.groupId===g.id) as row (row.id)}
            <li class="bg-gray-50 p-3 rounded border">
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium">
                  {db.patients.find(p=>p.id===row.patientId)?.firstName}
                  {db.patients.find(p=>p.id===row.patientId)?.lastName}
                </span>
                <button class="text-red-600 hover:underline text-sm" on:click={() => removePatient(g.id,row.patientId)}>הסר/י</button>
              </div>
              <div class="flex items-center gap-2">
                <label class="text-sm text-gray-500" for="receipt-{g.id}-{row.patientId}">קבלה:</label>
                <input 
                  id="receipt-{g.id}-{row.patientId}"
                  class="border rounded px-2 py-1 text-sm flex-1" 
                  placeholder="מספר קבלה"
                  value={row.receipt || ''}
                  on:blur={(e) => updateReceipt(g.id, row.patientId, (e.target as HTMLInputElement).value)}
                />
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

