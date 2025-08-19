<script lang="ts">
  import { load, api, type Db } from '../lib/db'
  let db: Db = load()
  let name='' ; let therapistId = db.therapists[0]?.id ?? ''

  function add() {
    if (!name.trim()) return
    api.addGroup(db,name.trim()); name=''; db=load()
  }
  function del(id: string) { if (confirm('למחוק קבוצה?')) { api.removeGroup(db,id); db=load() } }
  function setTherapist(groupId: string, tId: string) {
    api.setTherapistForGroup(db, groupId, tId); db=load()
  }
  function addPatient(groupId: string, patientId: string) {
    api.addPatientToGroup(db, groupId, patientId); db=load()
  }
  function removePatient(groupId: string, patientId: string) {
    api.removePatientFromGroup(db, groupId, patientId); db=load()
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
        <h3 class="text-base font-semibold ml-auto">{g.name}</h3>
        <button class="text-red-600 hover:underline" on:click={() => del(g.id)}>מחק</button>
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
        <ul class="space-y-1">
          {#each db.patientsInGroups.filter(x=>x.groupId===g.id) as row (row.id)}
            <li class="flex items-center gap-2">
              <span class="ml-auto">
                {db.patients.find(p=>p.id===row.patientId)?.firstName}
                {db.patients.find(p=>p.id===row.patientId)?.lastName}
              </span>
              <button class="text-red-600 hover:underline" on:click={() => removePatient(g.id,row.patientId)}>הסר/י</button>
            </li>
          {/each}
          {#if db.patientsInGroups.filter(x=>x.groupId===g.id).length===0}
            <li class="text-gray-500">אין מטופלים בקבוצה</li>
          {/if}
        </ul>
      </div>
    </div>
  {/each}
</section>

