<script lang="ts">
  import { load, save, api, type Db } from '../lib/db'
  let db: Db = load()
  let name = ''
  let editingId = ''
  let editingName = ''
  
  function add() { if (!name.trim()) return; api.addTherapist(db, name.trim()); name=''; db = load() }
  function del(id: string) { if (confirm('למחוק מטפל/ת?')) { api.removeTherapist(db,id); db=load() } }
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
    <div class="space-y-2">
      {#each db.therapists as t (t.id)}
        <div class="flex items-center justify-between py-2">
          <div class="flex-1 max-w-sm">
            {#if editingId === t.id}
              <input class="border rounded px-2 py-1 w-full" bind:value={editingName} on:keydown={(e) => e.key === 'Enter' && saveEdit()}/>
            {:else}
              <span class="text-gray-900">{t.name}</span>
            {/if}
          </div>
          <div class="flex gap-3 min-w-[120px] justify-end">
            {#if editingId === t.id}
              <button class="text-green-600 hover:underline text-sm" on:click={saveEdit}>שמור</button>
              <button class="text-gray-600 hover:underline text-sm" on:click={cancelEdit}>ביטול</button>
            {:else}
              <button class="text-blue-600 hover:underline text-sm" on:click={() => startEdit(t.id, t.name)}>ערוך</button>
              <button class="text-red-600 hover:underline text-sm" on:click={() => del(t.id)}>מחק</button>
            {/if}
          </div>
        </div>
      {/each}
      {#if db.therapists.length === 0}
        <div class="py-8 text-center text-gray-500">אין מטפלים</div>
      {/if}
    </div>
  </div>
</section>

