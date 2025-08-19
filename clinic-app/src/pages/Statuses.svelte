<script lang="ts">
  import { load, save, type Db, type Status } from '../lib/db'
  let db: Db = load()
  function add(code: 'active'|'inactive') {
    if (db.statuses.some(s=>s.code===code)) return
    db.statuses.push({ id: crypto.randomUUID(), code }); save(db); db=load()
  }
</script>

<div class="bg-white rounded-lg shadow p-4">
  <h2 class="text-lg font-semibold mb-4">סטטוסים</h2>
  <div class="flex gap-3">
    <button class="button bg-blue-600 text-white rounded px-4 h-10 hover:bg-blue-700" on:click={() => add('active')}>active</button>
    <button class="button bg-blue-600 text-white rounded px-4 h-10 hover:bg-blue-700" on:click={() => add('inactive')}>inactive</button>
  </div>
  <ul class="mt-4 list-disc pr-6">
    {#each db.statuses as s}<li>{s.code}</li>{/each}
  </ul>
</div>

