<script lang="ts">
  import { goto } from './router'
  import { exportBackup, importBackup } from './lib/backup'
  import logo from './assets/logo-clalit.svg'
  
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

<nav class="bg-white shadow-md">
  <!-- First row: Logo and title -->
  <div class="border-b border-gray-200">
    <div class="container px-4 h-14 flex items-center justify-end">
      <span class="text-sm text-gray-600 ml-3 whitespace-nowrap font-normal">ניהול קבוצות מחוץ לסל - מרפאת פיזיותרפיה עזריאלי מודיעין</span>
      <img src={logo} alt="Clalit" class="h-9 ml-6" />
    </div>
  </div>
  
  <!-- Second row: Navigation menu -->
  <div class="bg-gray-50">
    <div class="container px-4 h-12 flex items-center justify-center">
      <div class="flex items-center">
        <button 
          class="px-4 text-sm text-gray-700 hover:text-blue-600 hover:bg-white py-3 transition-colors" 
          on:click={() => goto('/waitlist')}
        >
          ממתינים
        </button>
        <div class="h-6 w-px bg-gray-300"></div>
        
        <button 
          class="px-4 text-sm text-gray-700 hover:text-blue-600 hover:bg-white py-3 transition-colors" 
          on:click={() => goto('/patients')}
        >
          מטופלים
        </button>
        <div class="h-6 w-px bg-gray-300"></div>
        
        <button 
          class="px-4 text-sm text-gray-700 hover:text-blue-600 hover:bg-white py-3 transition-colors" 
          on:click={() => goto('/therapists')}
        >
          מטפלים
        </button>
        <div class="h-6 w-px bg-gray-300"></div>
        
        <button 
          class="px-4 text-sm text-gray-700 hover:text-blue-600 hover:bg-white py-3 transition-colors" 
          on:click={() => goto('/groupsList')}
        >
          קבוצות
        </button>
        <div class="h-6 w-px bg-gray-300"></div>
        
        <button 
          class="px-4 text-sm text-green-600 hover:text-green-700 hover:bg-white py-3 font-medium transition-colors" 
          on:click={exportBackup}
        >
          שמירת נתונים
        </button>
        <div class="h-6 w-px bg-gray-300"></div>
        
        <button 
          class="px-4 text-sm text-blue-600 hover:text-blue-700 hover:bg-white py-3 font-medium transition-colors" 
          on:click={triggerImport}
        >
          טעינת נתונים
        </button>
      </div>
    </div>
  </div>
  
  <!-- Hidden file input for import -->
  <input 
    type="file" 
    accept=".json" 
    bind:this={fileInput} 
    on:change={handleImport} 
    class="hidden"
  />
</nav>

