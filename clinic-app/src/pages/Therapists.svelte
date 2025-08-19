<script lang="ts">
  import { load, save, api, type Db } from '../lib/db'
  let db: Db = load()
  let name = ''
  function add() { if (!name.trim()) return; api.addTherapist(db, name.trim()); name=''; db = load() }
  function del(id: string) { if (confirm('למחוק מטפל/ת?')) { api.removeTherapist(db,id); db=load() } }
</script>

<section class="space-y-6">
  <div class="bg-white rounded-lg shadow p-4">
    <h2 class="text-lg font-semibold mb-4">מטפל/ת</h2>
    <form class="flex items-center gap-3" on:submit|preventDefault={add}>
      <input class="input input-bordered grow rtl:text-right border rounded px-3 h-10" placeholder="שם מלא" bind:value={name}/>
      <button class="button bg-blue-600 text-white rounded px-4 h-10 hover:bg-blue-700">הוסף/י</button>
    </form>
  </div>

  <div class="bg-white rounded-lg shadow p-4">
    <table class="w-full text-right">
      <thead><tr class="text-sm text-gray-500">
        <th class="py-2">שם</th>
        <th class="py-2 w-32">פעולות</th>
      </tr></thead>
      <tbody>
        {#each db.therapists as t (t.id)}
          <tr class="border-t">
            <td class="py-2">{t.name}</td>
            <td class="py-2">
              <button class="text-red-600 hover:underline" on:click={() => del(t.id)}>מחק</button>
            </td>
          </tr>
        {/each}
        {#if db.therapists.length === 0}
          <tr><td class="py-4 text-gray-500" colspan="2">אין מטפלים</td></tr>
        {/if}
      </tbody>
    </table>
  </div>
</section>

