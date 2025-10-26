<script lang="ts">
  import { load, api, save, type Db } from '../lib/db'
  import { route } from '../router'
  import { goto } from '../router'
  
  let db: Db = load()
  let dbVersion = 0 // Force reactivity updates
  
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
  let paymentSaved = false // Track if payment was just saved
  
  // Get selected group details - dbVersion forces recalculation
  $: selectedGroup = selectedGroupId && dbVersion >= 0 ? db.groups.find(g => g.id === selectedGroupId) : null
  $: selectedGroupActiveCount = selectedGroupId && dbVersion >= 0 ? api.getActiveSubscriptionCount(db, selectedGroupId) : 0
  $: selectedGroupWaitlist = selectedGroupId && dbVersion >= 0 ? db.patientsInGroups.filter(x => x.groupId === selectedGroupId && x.enrolled === 0).length : 0
  // For registration, calculate available count based on active subscriptions
  // This ensures consistency with PatientsInGroup page
  $: selectedGroupAvailable = selectedGroupId && dbVersion >= 0 ? api.getAvailableWithActiveSubscriptions(db, selectedGroupId) : 0
  
  // Keep track of raw enrolled count for debugging
  $: actualEnrolledCount = selectedGroupId ? db.patientsInGroups.filter(x => x.groupId === selectedGroupId && x.enrolled === 1).length : 0
  $: rawAvailable = selectedGroup ? selectedGroup.capacity - actualEnrolledCount : 0
  
  // Log discrepancy if exists
  $: if (selectedGroup && selectedGroupAvailable !== rawAvailable) {
    console.warn('Available count mismatch!', {
      activeSubscriptionBased: selectedGroupAvailable,
      rawEnrollmentBased: rawAvailable,
      capacity: selectedGroup.capacity,
      enrolled: actualEnrolledCount,
      activeCount: selectedGroupActiveCount
    })
  }
  
  $: patientAlreadyInGroup = patientId && selectedGroupId ? db.patientsInGroups.find(x => x.groupId === selectedGroupId && x.patientId === patientId) : null
  $: patientHasActiveSubscription = patientId && selectedGroupId ? api.hasActiveSubscription(db, patientId, selectedGroupId) : false
  
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
    
    // Validate that from date is not after to date
    
    // First check if patient is already in the group
    const existingEntry = db.patientsInGroups.find(
      pig => pig.patientId === patientId && pig.groupId === selectedGroupId
    )
    
    // Check if patient already has active subscription (before adding new payment)
    const alreadyHasActiveSubscription = api.hasActiveSubscription(db, patientId, selectedGroupId)
    
    // IMPORTANT: Add payment FIRST if provided, so that active subscription check works
    // Note: amount can be 0 or any positive number
    let paymentAdded = false
    if (amount !== null && amount !== undefined && amount >= 0 && receiptNumber) {
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
      paymentAdded = true
      
      // Update receipt if patient is already in group
      if (existingEntry) {
        api.updatePatientReceipt(db, selectedGroupId, patientId, receiptNumber)
      }
    }
    
    // For new patients, check availability based on active subscriptions
    // This should match what's displayed to the user
    const hasAvailability = api.getAvailableWithActiveSubscriptions(db, selectedGroupId) > 0
    
    // If group has availability and payment not added, require payment details  
    if (!existingEntry && hasAvailability && !paymentAdded) {
      alert('נא למלא את כל פרטי התשלום')
      return
    }
    
    // Now add patient to group or update existing entry
    if (!existingEntry) {
      // Add patient to group (will now correctly check active subscriptions)
      api.addPatientToGroup(db, selectedGroupId, patientId, receiptNumber || '')
    } else if (existingEntry && !alreadyHasActiveSubscription && paymentAdded) {
      // Patient is in group but didn't have active subscription before, ensure they're enrolled
      if (existingEntry.enrolled === 0) {
        // Move from waitlist to enrolled if payment was added
        existingEntry.enrolled = 1
        existingEntry.updatedAt = Date.now()
        save(db)
      }
    }
    
    // Reload database to reflect changes
    db = load()
    dbVersion++ // Trigger reactivity updates
    
    // Get updated group to check final status
    const updatedGroup = db.groups.find(g => g.id === selectedGroupId)
    const wasActuallyEnrolled = !existingEntry && updatedGroup && updatedGroup.available >= 0
    
    // Show appropriate success message
    if (wasActuallyEnrolled && updatedGroup && updatedGroup.available > 0) {
      alert('התשלום והרישום נרשמו בהצלחה')
    } else if (!existingEntry && updatedGroup && updatedGroup.available === 0) {
      // This happens when we just filled the last spot
      alert('נרשם בהצלחה - הקבוצה התמלאה')
    } else if (!existingEntry) {
      alert('המטופל נוסף לרשימת המתנה')
    } else {
      alert('התשלום נרשם בהצלחה')
    }
    
    // Mark payment as saved to hide the button
    paymentSaved = true
    
    // Reset form and redirect after a short delay
    amount = 0
    receiptNumber = ''
    paymentDate = new Date().toISOString().split('T')[0]
    
    // Redirect to history page to show the payment that was just recorded
    setTimeout(() => {
      goto(`/history/${patientId}`)
    }, 1500)
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
        <label class="text-sm text-gray-600 whitespace-nowrap" for="group-select">קבוצה</label>
        <select
          id="group-select"
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
        <div class="flex flex-row-reverse items-center gap-2">
            <!-- In RTL layout with flex-row-reverse: -->
            <!-- Elements appear right-to-left, so first element in code appears rightmost -->
            
            <!-- FROM date (מ) - should appear on the RIGHT in Hebrew reading -->
            <span class="text-xs text-gray-500">:מ</span>
            <select class="border rounded px-2 h-10" bind:value={fromYear} dir="rtl" aria-label="שנת התחלה">
              {#each years as year}
                <option value={year}>{year}</option>
              {/each}
            </select>
            <select class="border rounded px-2 h-10" bind:value={fromMonth} dir="rtl" aria-label="חודש התחלה">
              {#each months as month}
                <option value={month.value}>{month.label}</option>
              {/each}
            </select>
            
            <!-- TO date (עד) - should appear on the LEFT in Hebrew reading -->
            <span class="text-xs text-gray-500">:עד</span>
            <select class="border rounded px-2 h-10" bind:value={toYear} dir="rtl" aria-label="שנת סיום">
              {#each years as year}
                <option value={year}>{year}</option>
              {/each}
            </select>
            <select class="border rounded px-2 h-10" bind:value={toMonth} dir="rtl" aria-label="חודש סיום">
              {#each months as month}
                <option value={month.value}>{month.label}</option>
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
              <div class="text-sm text-gray-600">
                <span class="font-medium {selectedGroupAvailable <= 0 ? 'text-red-600' : selectedGroupAvailable <= 3 ? 'text-orange-500' : 'text-green-600'}" dir="ltr" style="display: inline-block;">{selectedGroupAvailable}</span> :מקומות פנויים
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
      <div class="flex flex-row-reverse items-center gap-3 {selectedGroupAvailable <= 0 ? 'opacity-50' : ''}" >
        <label class="text-sm text-gray-600 whitespace-nowrap" for="amount-input">סכום</label>
        <input
          id="amount-input"
          type="number" 
          class="border rounded px-3 h-10 {selectedGroupAvailable <= 0 ? 'bg-gray-100' : ''}" 
          style="text-align: right; width: 100px;"
          bind:value={amount}
          dir="rtl"
          disabled={selectedGroupAvailable <= 0}
        />
        
        <label class="text-sm text-gray-600 whitespace-nowrap" for="payment-method">אופן תשלום</label>
        <select
          id="payment-method"
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
        
        <label class="text-sm text-gray-600 whitespace-nowrap" for="receipt-number">מספר קבלה</label>
        <input
          id="receipt-number"
          type="text" 
          class="border rounded px-3 h-10 {selectedGroupAvailable <= 0 ? 'bg-gray-100' : ''}" 
          style="text-align: right; width: 150px;"
          bind:value={receiptNumber}
          dir="rtl"
          disabled={selectedGroupAvailable <= 0}
        />
        
        <label class="text-sm text-gray-600 whitespace-nowrap" for="payment-date">תאריך תשלום</label>
        <input 
          id="payment-date"
          type="date"
          class="border rounded px-3 h-10 {selectedGroupAvailable <= 0 ? 'bg-gray-100' : ''}"
          bind:value={paymentDate}
          disabled={selectedGroupAvailable <= 0}
        />
      </div>

      <!-- Save button - hide after payment is saved -->
      {#if !paymentSaved}
        <div class="flex justify-center pt-4 border-t">
          <button 
            class="big-green-button"
            on:click={savePayment}
          >
          {selectedGroupAvailable > 0 ? 
            (patientAlreadyInGroup && patientAlreadyInGroup.enrolled === 1 ? 'שמור תשלום' : 'שמור תשלום והרשמה') : 
            'הכנס לרשימת המתנה'
          }
          </button>
        </div>
      {:else}
        <div class="flex justify-center pt-4 border-t">
          <div class="text-green-600 font-medium">
            ✓ התשלום נרשם בהצלחה - מעבר להיסטוריית תשלומים...
          </div>
        </div>
      {/if}
    </div>
  {/if}
</section>