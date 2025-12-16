<script lang="ts">
  import { goto } from './router'
  import { exportBackup, importBackup } from './lib/backup'
  import { load, api } from './lib/db'
  
  let fileInput: HTMLInputElement
  let db = load()
  let clinicName = (db.settings && db.settings[0]?.clinicName) || 'ניהול קבוצות מחוץ לסל - מרפאת פיזיותרפיה עזריאלי מודיעין'
  
  function handleImport(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        
      // JSON format  can have .json or .csv extension
        if (file.name.endsWith('.json') || file.name.endsWith('.csv')) {
          if (importBackup(content)) {
            alert('נתונים נטענו בהצלחה!')
            location.reload() // Refresh to show imported data
          } else {
            alert('שגיאה בטעינת הנתונים. אנא בדק את הקובץ.')
          }
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

<nav class="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
  <!-- First row: Logo and title -->
  <div class="border-b border-gray-200">
    <div class="container px-4 h-14 flex items-center justify-end">
      <span class="text-sm text-gray-600 ml-3 whitespace-nowrap font-normal">{clinicName}</span>
      <svg class="h-9 ml-6" viewBox="0 0 120 34" width="120" height="34" xmlns="http://www.w3.org/2000/svg">
        <style type="text/css">
          .st0{fill-rule:evenodd;clip-rule:evenodd;fill:#00A651;}
          .st1{fill-rule:evenodd;clip-rule:evenodd;fill:#00AEEF;}
          .st3{fill:#EDEDED;}
          .st4{fill:#1D439A;}
        </style>
        <g>
          <path class="st0" d="M28.1,5.5c0,0,0.3,1.7-0.6,5.9l-1.7,8.2h5.8 l1.7-8.2c0.8-3.8,0.6-5.9,0.6-5.9H28.1z"/>
          <path class="st0" d="M69.4,5.5l-1.2,5.8h4.7c2,0,3.2,1,2.1,6.4 c-1,4.8-2.6,6.4-4.7,6.4h-4.8l-1.2,5.8h7.4c4.1,0,7.5-3.8,9.3-12.2c1.9-9.2-0.8-12.2-4.2-12.2L69.4,5.5z"/>
          <path class="st0" d="M36.7,1c0,0.6,0,1.2-0.1,1.7l-0.5,2.8 c-0.5,3.5,0.3,5.8,4,5.8h1.8c3.2-0.2,1.8,1.9,0.7,4.6l-5.3,14h6.1l5.9-15.8c2.2-5.9,0.1-8.6-2.2-8.6c-1.7,0-2.4,0-3.8,0 c-1.5,0-1.3-1.4-1-2.6c0.1-0.7,0.1-1.5,0.1-1.9L36.7,1z"/>
          <path class="st0" d="M6.2,21.7c-1.1,4.9-3.2,3.7-4.7,3.4 c-0.4,1.8-1,4.6-1,4.6c1.6,0.3,3.2,0.4,4.7,0.4c3.1-0.1,5.3-1.5,6.8-8.9l2.1-9.9h2.1c2.6,0,2.5,1.1,1.9,4.5l-2.9,14.1H21l3.2-15.4 c1.8-8.3-0.8-9.1-4.8-9.1H9.6L6.2,21.7z"/>
          <path class="st0" d="M52.6,1c0,0.6,0,1.2-0.1,1.7 C52.3,3.9,52,5.5,52,5.5c-0.5,3.5,0.3,5.8,4,5.8h1.8c3.2-0.2,1.8,1.9,0.7,4.6l-5.3,14h6.1l5.9-15.8c2.2-5.9,0.1-8.6-2.2-8.6 c-1.7,0-2.4,0-3.8,0c-1.5,0-1.3-1.4-1-2.6c0.1-0.7,0.1-1.5,0.1-1.9L52.6,1z"/>
          <path class="st1" d="M102.4,1.6l-7.6,6.3 c-0.3,0.3-0.7,0.4-1.2,0.4h-5c-0.4,0-0.7,0.3-0.8,0.7l-1,4.7c0,0.2,0,0.3,0.1,0.5c0.1,0.1,0.3,0.2,0.4,0.2h9 c0.6,0,1.1-0.2,1.6-0.5l5.4-4.5c0.2-0.1,0.4-0.2,0.6-0.2c0.3,0,0.5,0.1,0.7,0.3l3.6,4.2c0.4,0.5,1.1,0.8,1.7,0.7h8.1 c0.4,0,0.7-0.3,0.8-0.7l1-4.7c0-0.2,0-0.3-0.1-0.5c-0.1-0.1-0.3-0.2-0.4-0.2h-6.8c-0.3,0-0.5-0.1-0.7-0.3l-5.4-6.3 c-0.5-0.6-1.2-0.9-1.9-0.9C103.7,0.7,102.9,1,102.4,1.6"/>
          <path class="st0" d="M86.1,19.8c-0.4,0-0.7,0.3-0.8,0.7l-1,4.7 c0,0.2,0,0.3,0.1,0.5c0.1,0.1,0.3,0.2,0.4,0.2h6.8c0.3,0,0.5,0.1,0.7,0.3l5.4,6.3c0.5,0.6,1.2,0.9,1.9,0.9c0.8,0,1.6-0.3,2.1-0.9 l7.5-6.3c0.3-0.3,0.7-0.4,1.2-0.4h5c0.4,0,0.7-0.3,0.8-0.7l1-4.6c0-0.2,0-0.3-0.1-0.5c-0.1-0.1-0.3-0.2-0.4-0.2h-9 c-0.6,0-1.1,0.1-1.6,0.5l-5.4,4.5c-0.2,0.1-0.4,0.2-0.6,0.2c-0.2,0-0.5-0.1-0.7-0.3l-3.6-4.2c-0.4-0.5-1.1-0.8-1.7-0.7L86.1,19.8z"/>
        </g>
      </svg>
    </div>
  </div>
  
  <!-- Second row: Navigation menu -->
  <div class="bg-gray-50">
    <div class="container px-4 h-12 flex items-center justify-end">
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
          מנחים
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
          class="px-4 text-sm text-gray-700 hover:text-blue-600 hover:bg-white py-3 transition-colors" 
          on:click={() => goto('/monthlyReport')}
        >
          דוח חודשי
        </button>
        <div class="h-6 w-px bg-gray-300"></div>
        
        <button 
          class="px-4 text-sm text-gray-700 hover:text-blue-600 hover:bg-white py-3 transition-colors" 
          on:click={() => goto('/indicators')}
        >
          מדדים
        </button>
        <div class="h-6 w-px bg-gray-300"></div>
        
        <button 
          class="px-4 text-sm text-green-600 hover:text-green-700 hover:bg-white py-3 font-medium transition-colors" 
          on:click={exportBackup}
        >
          שמירה
        </button>
        <div class="h-6 w-px bg-gray-300"></div>
        
        <button 
          class="px-4 text-sm text-blue-600 hover:text-blue-700 hover:bg-white py-3 font-medium transition-colors" 
          on:click={triggerImport}
        >
          טעינה
        </button>
        <div class="h-6 w-px bg-gray-300"></div>
        
        <button 
          class="px-4 text-sm text-gray-700 hover:text-blue-600 hover:bg-white py-3 transition-colors" 
          on:click={() => goto('/settings')}
        >
          הגדרות
        </button>
      </div>
    </div>
  </div>
  
  <!-- Hidden file input for import -->
  <input 
    type="file" 
    accept=".csv,.json" 
    bind:this={fileInput} 
    on:change={handleImport} 
    class="hidden"
  />
</nav>

