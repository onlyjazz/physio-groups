<script lang="ts">
  import { load, api, type Db } from '../lib/db'
  import { goto } from '../router'
  
  let db: Db = load()
  let name = ''
  let capacity = 15
  let available = 15
  let when = 'open'
  
  function add() {
    if (!name.trim()) return
    api.addGroup(db, name.trim(), capacity, available, when)
    // Reset form
    name = ''
    capacity = 15
    available = 15
    when = 'open'
    db = load()
  }
  
  function del(id: string) {
    if (confirm('למחוק קבוצה?')) {
      api.removeGroup(db, id)
      db = load()
    }
  }
  
  function editGroup(id: string) {
    goto(`groups/${id}`)
  }
  
  function attendanceGroup(id: string) {
    goto(`groupAttendance/${id}`)
  }
</script>

<section class="space-y-6">
  <div class="bg-white rounded-lg shadow p-4">
    <h2 class="text-lg font-semibold mb-4">קבוצות</h2>
    <form class="space-y-3" on:submit|preventDefault={add}>
      <!-- First row - Group name only -->
      <div class="flex items-center gap-2 justify-end">
        <input 
          id="group-name" 
          class="flex-1 border rounded px-3 h-10 text-right" 
          placeholder="שם קבוצה" 
          bind:value={name}
        />
        <label for="group-name" class="text-sm text-gray-500 whitespace-nowrap">שם קבוצה</label>
      </div>
      
      <!-- Second row - When, Available, Capacity -->
      <div class="flex items-center gap-2 justify-end">
        <input 
          id="group-when" 
          class="w-32 border rounded px-3 h-10 text-right" 
          placeholder="מתי" 
          bind:value={when}
        />
        <label for="group-when" class="text-sm text-gray-500 whitespace-nowrap">מתי</label>
        <input 
          id="group-available" 
          class="w-20 border rounded px-3 h-10 text-right" 
          type="number" 
          bind:value={available}
        />
        <label for="group-available" class="text-sm text-gray-500 whitespace-nowrap">פנוי</label>
        <input 
          id="group-capacity" 
          class="w-20 border rounded px-3 h-10 text-right" 
          type="number" 
          bind:value={capacity}
        />
        <label for="group-capacity" class="text-sm text-gray-500 whitespace-nowrap">קיבולת</label>
      </div>
      <div class="flex justify-center">
        <button class="bg-blue-600 text-white rounded px-4 h-10 hover:bg-blue-700">צור קבוצה</button>
      </div>
    </form>
  </div>

  <div class="bg-white rounded-lg shadow p-4">
    <!-- Header row -->
    <div class="flex items-center py-2 border-b mb-2">
      <div class="flex-1 grid" style="grid-template-columns: 60px 1fr 1fr 2fr;">
        <div class="text-gray-700 text-center font-semibold text-sm">
          <span>זמין</span>
        </div>
        <div class="text-gray-700 text-center font-semibold text-sm">
          <span>מטפל/ת</span>
        </div>
        <div class="text-gray-700 text-center font-semibold text-sm">
          <span>מתי</span>
        </div>
        <div class="text-gray-700 text-center font-semibold text-sm">
          <span>שם קבוצה</span>
        </div>
      </div>
      <div class="w-[100px]">
        <!-- Empty space for action buttons column -->
      </div>
    </div>
    
    <div class="space-y-2">
      {#each db.groups as g (g.id)}
        {@const therapistInGroup = db.therapistsInGroups.find(x => x.groupId === g.id)}
        {@const therapist = therapistInGroup ? db.therapists.find(t => t.id === therapistInGroup.therapistId) : null}
        <div class="flex items-center py-2">
          <div class="flex-1 grid" style="grid-template-columns: 60px 1fr 1fr 2fr;">
            <div class="text-gray-600 text-center">
              <span>{g.available || 15}</span>
            </div>
            <div class="text-gray-600 text-center">
              <span>{therapist ? therapist.name : '-'}</span>
            </div>
            <div class="text-gray-600 text-center">
              <span>{g.when || 'open'}</span>
            </div>
            <div class="text-gray-900 text-center">
              <span class="font-medium">{g.name}</span>
            </div>
          </div>
          <div class="flex gap-1 w-[100px] justify-end">
            <button 
              class="text-green-600 hover:text-green-700 p-1" 
              on:click={() => attendanceGroup(g.id)}
              title="נוכחות"
              aria-label="נוכחות"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button 
              class="text-blue-600 hover:text-blue-700 p-1" 
              on:click={() => editGroup(g.id)}
              title="ערוך"
              aria-label="ערוך"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button 
              class="text-red-600 hover:text-red-700 p-1" 
              on:click={() => del(g.id)}
              title="מחק"
              aria-label="מחק"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      {/each}
      {#if db.groups.length === 0}
        <div class="py-8 text-center text-gray-500">אין קבוצות</div>
      {/if}
    </div>
  </div>
</section>
