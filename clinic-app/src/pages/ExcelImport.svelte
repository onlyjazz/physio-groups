<script lang="ts">
  import { load, type Db } from '../lib/db'
  import { importExcelFileWrapper, isImportSupported } from '../lib/importWrapper'
  import { goto } from '../router'
  
  let db: Db = load()
  let fileInput: HTMLInputElement
  let selectedFile: File | null = null
  let importing = false
  let importResult: { success: boolean; message: string } | null = null
  
  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement
    if (input.files && input.files[0]) {
      selectedFile = input.files[0]
      importResult = null
    }
  }
  
  async function handleImport() {
    if (!selectedFile) {
      importResult = { success: false, message: 'Please select a file first' }
      return
    }
    
    importing = true
    importResult = null
    
    try {
      const result = await importExcelFileWrapper(selectedFile, db)
      importResult = result
      
      if (result.success) {
        // Reload database to reflect changes
        db = load()
        
        // Clear file selection after successful import
        setTimeout(() => {
          selectedFile = null
          if (fileInput) {
            fileInput.value = ''
          }
        }, 2000)
      }
    } catch (error) {
      importResult = {
        success: false,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    } finally {
      importing = false
    }
  }
  
  function navigateToGroups() {
    goto('groupsList')
  }
</script>

<section class="space-y-6">
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex justify-between items-center mb-6">
      <button 
        class="text-blue-600 hover:text-blue-700 text-sm font-medium"
        on:click={navigateToGroups}
      >
        חזרה לקבוצות
      </button>
      <h2 class="text-lg font-semibold">ייבוא מאקסל</h2>
    </div>
    
    <div class="space-y-4">
      <!-- Instructions -->
      <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 class="font-medium mb-2">הוראות:</h3>
        <ul class="text-sm text-gray-600 space-y-1 list-disc list-inside" style="direction: rtl;">
          <li>בחר קובץ Excel עם שם הקבוצה (לדוגמה: קבוצה_א.xlsx)</li>
          <li>הקובץ צריך להכיל גיליונות עם שמות: 07.25, 08.25, 09.25, 10.25, 11.25, 12.25</li>
          <li>עמודות: A-מספר סידורי, B-שם מלא, D-ת.ז., E-טלפון, J-סכום, K-מספר קבלה, L-אמצעי תשלום</li>
          <li>תשלום יכול להיות ל-1, 3 או 6 חודשים (50 ש"ח לחודש)</li>
        </ul>
      </div>
      
      <!-- File input -->
      <div class="space-y-2">
        <label for="excel-file-input" class="block text-sm font-medium text-gray-700">
          בחר קובץ Excel:
        </label>
        <input
          id="excel-file-input"
          bind:this={fileInput}
          type="file"
          accept=".xlsx,.xls"
          on:change={handleFileSelect}
          class="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        {#if selectedFile}
          <p class="text-sm text-gray-600">
            קובץ נבחר: {selectedFile.name}
          </p>
        {/if}
      </div>
      
      <!-- Import button -->
      <div class="flex justify-center">
        <button
          on:click={handleImport}
          disabled={!selectedFile || importing}
          class="big-green-button disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {#if importing}
            מייבא...
          {:else}
            ייבא נתונים
          {/if}
        </button>
      </div>
      
      <!-- Result message -->
      {#if importResult}
        <div class={`p-4 rounded-lg ${importResult.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {importResult.message}
        </div>
      {/if}
    </div>
    
    <!-- Data format example -->
    <div class="mt-8 border-t pt-6">
      <h3 class="font-medium mb-3">דוגמה לפורמט נתונים:</h3>
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm border-collapse border border-gray-300">
          <thead>
            <tr class="bg-gray-100">
              <th class="border border-gray-300 px-2 py-1">A</th>
              <th class="border border-gray-300 px-2 py-1">B</th>
              <th class="border border-gray-300 px-2 py-1">D</th>
              <th class="border border-gray-300 px-2 py-1">E</th>
              <th class="border border-gray-300 px-2 py-1">J</th>
              <th class="border border-gray-300 px-2 py-1">K</th>
              <th class="border border-gray-300 px-2 py-1">L</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border border-gray-300 px-2 py-1 text-center">1</td>
              <td class="border border-gray-300 px-2 py-1">ישראל ישראלי</td>
              <td class="border border-gray-300 px-2 py-1">123456789</td>
              <td class="border border-gray-300 px-2 py-1">050-1234567</td>
              <td class="border border-gray-300 px-2 py-1">150</td>
              <td class="border border-gray-300 px-2 py-1">12345</td>
              <td class="border border-gray-300 px-2 py-1">ק</td>
            </tr>
            <tr>
              <td class="border border-gray-300 px-2 py-1 text-center">2</td>
              <td class="border border-gray-300 px-2 py-1">רחל כהן</td>
              <td class="border border-gray-300 px-2 py-1">987654321</td>
              <td class="border border-gray-300 px-2 py-1">052-9876543</td>
              <td class="border border-gray-300 px-2 py-1">300</td>
              <td class="border border-gray-300 px-2 py-1">67890</td>
              <td class="border border-gray-300 px-2 py-1">א</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</section>