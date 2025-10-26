<script lang="ts">
  import { load, api, type Db, type Group } from '../lib/db'
  import { route } from '../router'
  import { goto } from '../router'
  
  let db: Db = load()
  
  // Get group ID from route
  $: groupId = $route.segments[0] || null
  $: group = groupId ? db.groups.find(g => g.id === groupId) : null
  $: therapistInGroup = groupId ? db.therapistsInGroups.find(x => x.groupId === groupId) : null
  
  // Calculate stats
  $: enrolledCount = groupId ? db.patientsInGroups.filter(x => x.groupId === groupId && x.enrolled === 1).length : 0
  $: waitlistCount = groupId ? db.patientsInGroups.filter(x => x.groupId === groupId && x.enrolled === 0).length : 0
  $: availableSpots = group ? group.capacity - enrolledCount : 0
  
  // Edit form state
  let editing = false
  let editName = ''
  let editCapacity = 15
  let editWhen = 'open'
  let editTherapistId = ''
  
  function startEdit() {
    if (!group) return
    editing = true
    editName = group.name
    editCapacity = group.capacity || 15
    editWhen = group.when || 'open'
    editTherapistId = therapistInGroup?.therapistId || ''
  }
  
  function cancelEdit() {
    editing = false
    editName = ''
    editCapacity = 15
    editWhen = 'open'
    editTherapistId = ''
  }
  
  function saveEdit() {
    if (!editName.trim() || !groupId) return
    // Calculate the correct available spots based on enrolled patients
    const enrolledInGroup = db.patientsInGroups.filter(x => x.groupId === groupId && x.enrolled === 1).length
    const correctAvailable = editCapacity - enrolledInGroup
    
    api.updateGroup(db, groupId, { 
      name: editName.trim(),
      capacity: editCapacity,
      available: correctAvailable,
      when: editWhen
    })
    // Update therapist if changed
    if (editTherapistId !== (therapistInGroup?.therapistId || '')) {
      api.setTherapistForGroup(db, groupId, editTherapistId)
    }
    editing = false
    db = load()
  }
  
  function deleteGroup() {
    if (!groupId) return
    if (confirm('למחוק קבוצה?')) {
      api.removeGroup(db, groupId)
      goto('groupsList')
    }
  }
  
  function backToList() {
    goto('groupsList')
  }
</script>

<section class="space-y-6">
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

  {#if !group}
    <div class="bg-white rounded-lg shadow p-4">
      <p class="text-center text-gray-500 py-8">קבוצה לא נמצאה</p>
    </div>
  {:else}
    <div class="bg-white rounded-lg shadow p-4 space-y-4">
      <!-- Group Name -->
      <div class="flex flex-row-reverse items-center gap-3">
        <label class="text-sm text-gray-600 font-medium whitespace-nowrap" for="group-name">שם קבוצה</label>
        {#if editing}
          <input 
            id="group-name"
            class="flex-1 border rounded px-3 h-10" 
            style="text-align: right;"
            bind:value={editName} 
            dir="rtl" 
            on:keydown={(e) => e.key === 'Enter' && saveEdit()}
          />
        {:else}
          <div class="flex-1 px-3 py-2">
            <span class="text-lg font-medium">{group.name}</span>
          </div>
        {/if}
      </div>

      <!-- Therapist Selection -->
      <div class="flex flex-row-reverse items-center gap-3">
        <label class="text-sm text-gray-600 font-medium whitespace-nowrap" for="therapist">מנחה</label>
        {#if editing}
          <select 
            id="therapist" 
            class="flex-1 border rounded px-3 h-10" 
            style="text-align: right;" 
            dir="rtl" 
            bind:value={editTherapistId}
          >
            <option value="" disabled>בחר/י</option>
            {#each db.therapists as t}
              <option value={t.id}>{t.name}</option>
            {/each}
          </select>
        {:else}
          {@const therapist = therapistInGroup ? db.therapists.find(t => t.id === therapistInGroup.therapistId) : null}
          <div class="flex-1 px-3 py-2">
            <span class="text-lg font-medium">{therapist ? therapist.name : '-'}</span>
          </div>
        {/if}
      </div>
      
      <!-- Group Properties -->
      <div class="flex flex-row-reverse items-center gap-3">
        <label class="text-sm text-gray-600 font-medium whitespace-nowrap" for="when-input">מתי</label>
        {#if editing}
          <input 
            id="when-input"
            class="w-40 border rounded px-3 h-10" 
            style="text-align: right;" 
            bind:value={editWhen} 
            dir="rtl"
          />
        {:else}
          <div class="w-40 px-3 py-2">
            <span>{group.when || 'open'}</span>
          </div>
        {/if}
        
        <span class="text-sm text-gray-600 font-medium whitespace-nowrap">פנוי</span>
        {#if editing}
          <div class="w-20 px-3 py-2 text-center bg-gray-100 rounded">
            <span class="text-gray-600">{editCapacity - enrolledCount}</span>
          </div>
        {:else}
          <div class="w-20 px-3 py-2 text-center">
            <span>{availableSpots}</span>
          </div>
        {/if}
        
        <label class="text-sm text-gray-600 font-medium whitespace-nowrap" for="capacity-input">קיבולת</label>
        {#if editing}
          <input 
            id="capacity-input"
            class="w-20 border rounded px-3 h-10" 
            style="text-align: right;" 
            type="number" 
            bind:value={editCapacity} 
            dir="rtl"
          />
        {:else}
          <div class="w-20 px-3 py-2 text-center">
            <span>{group.capacity}</span>
          </div>
        {/if}
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-center gap-3 pt-4 border-t">
        {#if editing}
          <button 
            class="big-blue-button" 
            on:click={saveEdit}
          >
            שמור
          </button>
          <button 
            class="big-orange-button" 
            on:click={cancelEdit}
          >
            ביטול
          </button>
        {:else}
          <button 
            class="big-blue-button" 
            on:click={startEdit}
          >
            ערוך פרטים
          </button>
          <button 
            class="big-red-button" 
            on:click={deleteGroup}
          >
            מחק קבוצה
          </button>
        {/if}
      </div>

      <!-- Group Statistics -->
      <div class="mt-6 pt-4 border-t">
        <h3 class="text-sm font-medium text-gray-600 mb-2">סטטיסטיקה</h3>
        <div class="grid grid-cols-3 gap-4 text-center">
          <div>
            <div class="text-2xl font-bold text-blue-600">
              {enrolledCount}
            </div>
            <div class="text-sm text-gray-500">רשומים</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-orange-600">
              {waitlistCount}
            </div>
            <div class="text-sm text-gray-500">ממתינים</div>
          </div>
          <div>
            <div class="text-2xl font-bold {availableSpots <= 0 ? 'text-red-600' : availableSpots <= 3 ? 'text-orange-600' : 'text-green-600'}">
              {availableSpots}
            </div>
            <div class="text-sm text-gray-500">מקומות פנויים</div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</section>

