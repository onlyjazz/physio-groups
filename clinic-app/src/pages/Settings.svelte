<script lang="ts">
  import { load, type Db } from '../lib/db'
  import { goto } from '../router'
  
  let db: Db = load()
  // Get clinic name from first settings record if it exists
  let clinicName = ''
  let isSaved = false
  
  // Initialize clinic name safely
  if (db && db.settings && Array.isArray(db.settings) && db.settings.length > 0) {
    clinicName = db.settings[0].clinicName || ''
  }

  function handleSave() {
    if (!clinicName.trim()) {
      alert('אנא הכנס שם מרפאה')
      return
    }
    // Ensure settings array exists
    if (!db.settings) {
      db.settings = []
    }
    // Create or update settings record
    if (db.settings.length === 0) {
      // Create new settings record
      db.settings.push({
        id: Math.random().toString(36).slice(2),
        clinicName: clinicName.trim(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      })
    } else {
      // Update existing record
      db.settings[0].clinicName = clinicName.trim()
      db.settings[0].updatedAt = Date.now()
    }
    // Save to localStorage
    localStorage.setItem('phizio-db-v1', JSON.stringify(db))
    isSaved = true
    // Reload the entire page to ensure Nav component gets the update
    setTimeout(() => {
      location.reload()
    }, 500)
  }

  function handleCancel() {
    goto('/groupsList')
  }
</script>

<section class="space-y-6">
  <div class="bg-white rounded-lg shadow p-4">
    <div class="flex justify-between items-center mb-4">
      <div></div>
      <h2 class="text-lg font-semibold">הגדרות</h2>
    </div>
  </div>
  
  <div class="bg-white rounded-lg shadow p-4">
    <div class="mb-6">
      <label for="clinicName" class="block text-right text-sm font-medium text-gray-700 mb-2">
        שם המרפאה
      </label>
      <input
        id="clinicName"
        type="text"
        bind:value={clinicName}
        class="w-full border rounded px-3 h-10"
        style="text-align: right;"
        dir="rtl"
        placeholder="הזן את שם המרפאה"
      />
    </div>
    
    <div class="flex gap-4 justify-end">
      <button
        on:click={handleCancel}
        class="big-orange-button"
      >
        ביטול
      </button>
      <button
        on:click={handleSave}
        class="big-blue-button"
      >
        שמור
      </button>
    </div>
    
    {#if isSaved}
      <div class="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-right text-sm">
        ההגדרות נשמרו בהצלחה!
      </div>
    {/if}
  </div>
</section>
