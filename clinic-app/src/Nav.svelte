<script lang="ts">
  import { goto } from './router'
  import { exportBackup, importBackup } from './lib/backup'
  
  let fileInput: HTMLInputElement
  
  function handleImport(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        if (importBackup(content)) {
          alert('נתונים נטענו בהצלחה!')
          location.reload() // Refresh to show imported data
        } else {
          alert('שגיאה בטעינת הנתונים. אנא בדק את הקובץ.')
        }
      }
      reader.readAsText(file)
    }
    // Reset input
    target.value = ''
  }
  
  function triggerImport() {
    fileInput.click()
  }
</script>

<nav class="bg-white shadow-sm">
  <div class="container px-4 h-14 flex items-center gap-4">
    <h1 class="text-xl font-semibold ml-auto">ניהול קבוצות</h1>
    <button class="text-sm text-gray-700 hover:text-blue-600" on:click={() => goto('/groupsList')}>קבוצות</button>
    <button class="text-sm text-gray-700 hover:text-blue-600" on:click={() => goto('/therapists')}>מטפל/ת</button>
    <button class="text-sm text-gray-700 hover:text-blue-600" on:click={() => goto('/patients')}>מטופלים</button>
    
    <!-- Backup functions -->
    <div class="border-r border-gray-300 h-6 mx-2"></div>
    <button class="text-sm text-green-600 hover:text-green-700 font-medium" on:click={exportBackup}>
      💾 שמירה
    </button>
    <button class="text-sm text-blue-600 hover:text-blue-700 font-medium" on:click={triggerImport}>
      📁 טעינה
    </button>
    
    <!-- Hidden file input for import -->
    <input 
      type="file" 
      accept=".json" 
      bind:this={fileInput} 
      on:change={handleImport} 
      class="hidden"
    />
  </div>
</nav>

