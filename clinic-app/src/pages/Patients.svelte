<script lang="ts">
  import { load, api, type Db } from '../lib/db'
  let db: Db = load()
  let firstName='', lastName='', nationalId='', phone=''
  function add() {
    if (!firstName || !lastName) return
    api.addPatient(db,{firstName,lastName,nationalId,phone})
    firstName=lastName=nationalId=phone=''
    db=load()
  }
  function del(id: string) { if (confirm('למחוק מטופל/ת?')) { api.removePatient(db,id); db=load() } }
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
    <table class="w-full text-right">
      <thead><tr class="text-sm text-gray-500">
        <th class="py-2">שם</th><th class="py-2">ת.ז.</th><th class="py-2">טלפון</th><th class="py-2 w-24">פעולות</th>
      </tr></thead>
      <tbody>
        {#each db.patients as p (p.id)}
          <tr class="border-t">
            <td class="py-2">{p.firstName} {p.lastName}</td>
            <td class="py-2">{p.nationalId}</td>
            <td class="py-2">{p.phone}</td>
            <td class="py-2">
              <button class="text-red-600 hover:underline" on:click={() => del(p.id)}>מחק</button>
            </td>
          </tr>
        {/each}
        {#if db.patients.length===0}
          <tr><td class="py-4 text-gray-500" colspan="4">אין מטופלים</td></tr>
        {/if}
      </tbody>
    </table>
  </div>
</section>

