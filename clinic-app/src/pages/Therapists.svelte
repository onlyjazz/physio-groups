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
          <div class="flex gap-1 min-w-[80px] justify-end">
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
        </div>
      {/each}
      {#if db.therapists.length === 0}
        <div class="py-8 text-center text-gray-500">אין מטפלים</div>
      {/if}
    </div>
  </div>
</section>

