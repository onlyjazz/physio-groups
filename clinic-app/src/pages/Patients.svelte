<script lang="ts">
  import { load, api, type Db, type Patient } from '../lib/db'
  let db: Db = load()
  let firstName='', lastName='', nationalId='', phone=''
  let editingId = ''
  let editingFirstName = '', editingLastName = '', editingNationalId = '', editingPhone = ''
  
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
</script>

<section class="space-y-6">
  <div class="bg-white rounded-lg shadow p-4">
    <h2 class="text-lg font-semibold mb-4">מטופלים</h2>
    <form class="grid grid-cols-12 gap-3" on:submit|preventDefault={add}>
      <input class="col-span-3 border rounded px-3 h-10" placeholder="שם פרטי" bind:value={firstName}/>
      <input class="col-span-3 border rounded px-3 h-10" placeholder="שם משפחה" bind:value={lastName}/>
      <input class="col-span-3 border rounded px-3 h-10" placeholder="ת.ז." bind:value={nationalId}/>
      <input class="col-span-3 border rounded px-3 h-10" placeholder="טלפון" bind:value={phone}/>
      <div class="col-span-12">
        <button class="button bg-blue-600 text-white rounded px-4 h-10 hover:bg-blue-700">הוסף/י</button>
      </div>
    </form>
  </div>

  <div class="bg-white rounded-lg shadow p-4">
    <div class="space-y-2">
      {#each db.patients as p (p.id)}
        <div class="flex items-center gap-4 py-2">
          <div class="flex-1 min-w-0">
            {#if editingId === p.id}
              <div class="grid grid-cols-3 gap-2">
                <input class="border rounded px-2 py-1 text-sm" bind:value={editingFirstName} placeholder="שם פרטי"/>
                <input class="border rounded px-2 py-1 text-sm" bind:value={editingLastName} placeholder="שם משפחה"/>
                <input class="border rounded px-2 py-1 text-sm" bind:value={editingNationalId} placeholder="ת.ז."/>
              </div>
              <div class="mt-2">
                <input class="border rounded px-2 py-1 text-sm w-48" bind:value={editingPhone} placeholder="טלפון"/>
              </div>
            {:else}
              <div class="text-gray-900">
                <span class="font-medium">{p.firstName} {p.lastName}</span>
                <span class="text-gray-600 text-sm mr-3">ת.ז. {p.nationalId}</span>
                <span class="text-gray-600 text-sm">טל. {p.phone}</span>
              </div>
            {/if}
          </div>
          <div class="flex gap-1 min-w-[80px] justify-end">
            {#if editingId === p.id}
              <button class="text-green-600 hover:underline text-sm" on:click={saveEdit}>שמור</button>
              <button class="text-gray-600 hover:underline text-sm" on:click={cancelEdit}>ביטול</button>
            {:else}
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
      {#if db.patients.length===0}
        <div class="py-8 text-center text-gray-500">אין מטופלים</div>
      {/if}
    </div>
  </div>
</section>

