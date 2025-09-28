<script lang="ts">
  import { load, api, save, type Db } from '../lib/db'
  import { route } from '../router'
  import { goto } from '../router'
  
  let db: Db = load()
  
  // Get patient ID and group ID from route
  $: patientId = $route.segments[0] || null
  $: groupIdFromRoute = $route.segments[1] || null
  $: patient = patientId ? db.patients.find(p => p.id === patientId) : null
  
  // Form state - initialize with group from route if available
  let selectedGroupId = ''
  
  // Set selectedGroupId from route if available
  $: if (groupIdFromRoute && !selectedGroupId) {
    selectedGroupId = groupIdFromRoute
  }
  
  let fromMonth = String(new Date().getMonth() + 1).padStart(2, '0')
  let fromYear = new Date().getFullYear()
  let toMonth = String(new Date().getMonth() + 1).padStart(2, '0')
  let toYear = new Date().getFullYear()
  let amount = 0
  let paymentMethod: 'ק' | 'א' | 'ת' | 'מ' = 'ק'
  let receiptNumber = ''
  let paymentDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  
  // Get selected group details
  $: selectedGroup = selectedGroupId ? db.groups.find(g => g.id === selectedGroupId) : null
  $: selectedGroupEnrolled = selectedGroupId ? db.patientsInGroups.filter(x => x.groupId === selectedGroupId && x.enrolled === 1).length : 0
  $: selectedGroupWaitlist = selectedGroupId ? db.patientsInGroups.filter(x => x.groupId === selectedGroupId && x.enrolled === 0).length : 0
  $: selectedGroupAvailable = selectedGroup ? selectedGroup.capacity - selectedGroupEnrolled - selectedGroupWaitlist : 0
  $: patientAlreadyInGroup = patientId && selectedGroupId ? db.patientsInGroups.find(x => x.groupId === selectedGroupId && x.patientId === patientId) : null
  
  // Generate month options
  const months = [
    { value: '01', label: 'ינואר' },
    { value: '02', label: 'פברואר' },
    { value: '03', label: 'מרץ' },
    { value: '04', label: 'אפריל' },
    { value: '05', label: 'מאי' },
    { value: '06', label: 'יוני' },
    { value: '07', label: 'יולי' },
    { value: '08', label: 'אוגוסט' },
    { value: '09', label: 'ספטמבר' },
    { value: '10', label: 'אוקטובר' },
    { value: '11', label: 'נובמבר' },
    { value: '12', label: 'דצמבר' }
  ]
  
  // Generate year options (last 2 years + next year)
  const currentYear = new Date().getFullYear()
  const years = Array.from({length: 4}, (_, i) => currentYear - 2 + i)
  
  function savePayment() {
    if (!patientId || !selectedGroupId) {
      alert('נא לבחור מטופל וקבוצה')
      return
    }
    
    // Check if group has availability
    const hasAvailability = selectedGroupAvailable > 0
    
    // If group has availability, require payment details
    if (hasAvailability && (!amount || !receiptNumber)) {
      alert('נא למלא את כל פרטי התשלום')
      return
    }
    
    // First check if patient is already in the group
    const existingEntry = db.patientsInGroups.find(
      pig => pig.patientId === patientId && pig.groupId === selectedGroupId
    )
    
    if (!existingEntry) {
      // Add patient to group (will automatically go to waitlist if no availability)
      api.addPatientToGroup(db, selectedGroupId, patientId, receiptNumber || '')
    } else {
      // Patient is already in group
      if (!hasAvailability && existingEntry.enrolled === 1) {
        // If no availability but patient is enrolled, move to waitlist
        existingEntry.enrolled = 0
        existingEntry.updatedAt = Date.now()
        // Clear receipt since waitlist doesn't require payment
        existingEntry.receipt = ''
        save(db)
      } else if (hasAvailability && receiptNumber) {
        // If there's availability and we have a receipt, update it
        api.updatePatientReceipt(db, selectedGroupId, patientId, receiptNumber)
      }
    }
    
    // Only add payment record if payment details were provided
    if (amount && receiptNumber) {
      // Convert date from YYYY-MM-DD to DD/MM/YYYY
      const [year, month, day] = paymentDate.split('-')
      const formattedPaymentDate = `${day}/${month}/${year}`
      
      api.addPayment(db, {
        patientId,
        groupId: selectedGroupId,
        fromMonth: `${fromMonth}/${fromYear}`,
        toMonth: `${toMonth}/${toYear}`,
        paymentDate: formattedPaymentDate,
        amount,
        paymentMethod,
        receiptNumber
      })
    }
    
    // Reload database to reflect changes
    db = load()
    
    // Show appropriate success message
    if (hasAvailability) {
      alert('התשלום והרישום נרשמו בהצלחה')
    } else {
      alert('המטופל נוסף לרשימת המתנה')
    }
    
    // Reset form
    amount = 0
    receiptNumber = ''
    paymentDate = new Date().toISOString().split('T')[0]
  }
  
  // Determine where to navigate back to
  function goBack() {
    if (groupIdFromRoute) {
      // If we have a groupId from route, we came from waitlist
      goto('/waitlist')
    } else {
      // Otherwise, we came from patients
      goto('/patients')
    }
  }
  
  // Get the appropriate back button text
  $: backButtonText = groupIdFromRoute ? 'חזרה לממתינים' : 'חזרה למטופלים'
</script>

<section class="space-y-6">
  <div class="bg-white rounded-lg shadow p-4">
    <div class="flex justify-between items-center mb-4">
      <button 
        class="text-blue-600 hover:underline text-sm" 
        on:click={goBack}
      >
        {backButtonText}
      </button>
      <h2 class="text-lg font-semibold">רישום תשלום</h2>
    </div>
  </div>

  {#if !patient}
    <div class="bg-white rounded-lg shadow p-4">
      <p class="text-center text-gray-500 py-8">מטופל לא נמצא</p>
    </div>
  {:else}
    <div class="bg-white rounded-lg shadow p-4 space-y-4">
      <!-- Row 1: Group selection and Period -->
      <div class="flex flex-row-reverse items-center gap-3">
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label class="text-sm text-gray-600 whitespace-nowrap">קבוצה</label>
        <select 
          class="flex-1 border rounded px-3 h-10 {groupIdFromRoute ? 'bg-gray-100' : ''}" 
          style="text-align: right;" 
          dir="rtl"
          bind:value={selectedGroupId}
          disabled={!!groupIdFromRoute}
        >
          <option value="" disabled>בחר/י קבוצה</option>
          {#each db.groups as group}
            <option value={group.id}>{group.name}</option>
          {/each}
        </select>
        
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label class="text-sm text-gray-600 whitespace-nowrap ml-3">תקופה</label>
        <div class="flex items-center gap-2">
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="text-xs text-gray-500">מ:</label>
            <select class="border rounded px-2 h-10" bind:value={fromMonth} dir="rtl">
            {#each months as month}
              <option value={month.value}>{month.label}</option>
            {/each}
          </select>
          <select class="border rounded px-2 h-10" bind:value={fromYear} dir="rtl">
            {#each years as year}
              <option value={year}>{year}</option>
            {/each}
          </select>
          
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="text-xs text-gray-500 ml-2">עד:</label>
          <select class="border rounded px-2 h-10" bind:value={toMonth} dir="rtl">
            {#each months as month}
              <option value={month.value}>{month.label}</option>
            {/each}
          </select>
          <select class="border rounded px-2 h-10" bind:value={toYear} dir="rtl">
            {#each years as year}
              <option value={year}>{year}</option>
            {/each}
          </select>
        </div>
      </div>

      <!-- Row 2: Patient and Group details -->
      <div class="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
        <div class="text-right">
          <h3 class="text-sm font-medium text-gray-600 mb-2">פרטי מטופל</h3>
          <div class="space-y-1">
            <div><span class="font-medium">{patient.firstName} {patient.lastName}</span></div>
            <div class="text-sm text-gray-600">ת.ז: {patient.nationalId}</div>
            <div class="text-sm text-gray-600">טלפון: {patient.phone}</div>
          </div>
        </div>
        
        {#if selectedGroup}
          <div class="text-right">
            <h3 class="text-sm font-medium text-gray-600 mb-2">פרטי קבוצה</h3>
            <div class="space-y-1">
              <div><span class="font-medium">{selectedGroup.name}</span></div>
              <div class="text-sm text-gray-600">מתי: {selectedGroup.when || '-'}</div>
              <div class="text-sm text-gray-600">קיבולת: {selectedGroup.capacity}</div>
              <div class="text-sm font-medium {selectedGroupAvailable <= 0 ? 'text-red-600' : selectedGroupAvailable <= 3 ? 'text-orange-500' : 'text-green-600'}">
                מקומות פנויים: {selectedGroupAvailable}
              </div>
              {#if selectedGroupWaitlist > 0}
                <div class="text-sm text-orange-600">ממתינים: {selectedGroupWaitlist}</div>
              {/if}
              {#if patientAlreadyInGroup}
                <div class="text-sm font-medium text-blue-600">
                  {patientAlreadyInGroup.enrolled === 1 ? '✓ המטופל רשום בקבוצה' : '⏱ המטופל ברשימת המתנה'}
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>

      <!-- Row 3: Payment details -->
      {#if selectedGroupAvailable <= 0 && selectedGroup}
        <div class="bg-orange-50 border border-orange-200 rounded p-3">
          <p class="text-sm text-orange-800 text-center">
            הקבוצה מלאה - המטופל יצורף לרשימת המתנה (ללא תשלום)
          </p>
        </div>
      {:else if selectedGroup}
        <div class="bg-green-50 border border-green-200 rounded p-3">
          <p class="text-sm text-green-800 text-center">
            יש מקום פנוי - נא למלא את פרטי התשלום
          </p>
        </div>
      {/if}
      
      <div class="flex flex-row-reverse items-center gap-3 {selectedGroupAvailable <= 0 ? 'opacity-50' : ''}" >
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label class="text-sm text-gray-600 whitespace-nowrap">סכום</label>
        <input 
          type="number" 
          class="border rounded px-3 h-10 {selectedGroupAvailable <= 0 ? 'bg-gray-100' : ''}" 
          style="text-align: right; width: 100px;"
          bind:value={amount}
          dir="rtl"
          disabled={selectedGroupAvailable <= 0}
        />
        
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label class="text-sm text-gray-600 whitespace-nowrap">אופן תשלום</label>
        <select 
          class="border rounded px-3 h-10 {selectedGroupAvailable <= 0 ? 'bg-gray-100' : ''}" 
          style="text-align: right; width: 100px;"
          bind:value={paymentMethod}
          dir="rtl"
          disabled={selectedGroupAvailable <= 0}
        >
          <option value="א">א - אשראי</option>
          <option value="ת">ת - מזומן</option>
          <option value="ה">ה - הרשאה</option>
        </select>
        
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label class="text-sm text-gray-600 whitespace-nowrap">מספר קבלה</label>
        <input 
          type="text" 
          class="border rounded px-3 h-10 {selectedGroupAvailable <= 0 ? 'bg-gray-100' : ''}" 
          style="text-align: right; width: 150px;"
          bind:value={receiptNumber}
          dir="rtl"
          disabled={selectedGroupAvailable <= 0}
        />
        
        <label class="text-sm text-gray-600 whitespace-nowrap">תאריך תשלום</label>
        <input 
          type="date" 
          class="border rounded px-3 h-10 {selectedGroupAvailable <= 0 ? 'bg-gray-100' : ''}"
          bind:value={paymentDate}
          disabled={selectedGroupAvailable <= 0}
        />
      </div>

      <!-- Save button -->
      <div class="flex justify-center pt-4 border-t">
        <button 
          class="big-green-button"
          on:click={savePayment}
        >
        {selectedGroupAvailable <= 0 ? 'שמור להמתנה' : (patientAlreadyInGroup && patientAlreadyInGroup.enrolled === 1 ? 'שמור תשלום' : 'שמור תשלום להרשמה')}
        </button>
      </div>
    </div>
  {/if}
</section>