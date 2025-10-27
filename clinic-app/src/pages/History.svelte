<script lang="ts">
  import { load, api, type Db, type PatientPayment } from '../lib/db'
  import { route } from '../router'
  import { goto } from '../router'
  import { exportToCSV } from '../lib/csvExport'
  
  let db: Db = load()
  
  // Edit mode state
  let editingPaymentId: string | null = null
  let editingPayment: Partial<PatientPayment> = {}
  
  // Sorting state
  let sortField: 'group' | 'period' | 'paymentDate' | 'amount' | 'paymentMethod' | 'receiptNumber' | null = null
  let sortDirection: 'asc' | 'desc' = 'asc'
  
  // Get patient ID from route
  $: patientId = $route.segments[0] || null
  $: patient = patientId ? db.patients.find(p => p.id === patientId) : null
  
  // Get patient payments
  $: rawPayments = patientId ? api.getPaymentsByPatient(db, patientId) : []
  
  // Sorting function
  function sortBy(field: 'group' | 'period' | 'paymentDate' | 'amount' | 'paymentMethod' | 'receiptNumber') {
    if (sortField === field) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'
    } else {
      sortField = field
      sortDirection = 'asc'
    }
  }
  
  // Get sorted payments
  $: payments = (() => {
    const sorted = [...rawPayments]
    
    if (!sortField) return sorted
    
    return sorted.sort((a, b) => {
      let compareValue = 0
      
      if (sortField === 'group') {
        const groupA = db.groups.find(g => g.id === a.groupId)?.name || ''
        const groupB = db.groups.find(g => g.id === b.groupId)?.name || ''
        compareValue = groupA.localeCompare(groupB, 'he')
      } else if (sortField === 'period') {
        // Sort by fromMonth first, then toMonth
        const fromA = a.fromMonth.split('/').reverse().join('')
        const fromB = b.fromMonth.split('/').reverse().join('')
        compareValue = fromA.localeCompare(fromB)
        if (compareValue === 0) {
          const toA = a.toMonth.split('/').reverse().join('')
          const toB = b.toMonth.split('/').reverse().join('')
          compareValue = toA.localeCompare(toB)
        }
      } else if (sortField === 'paymentDate') {
        // Convert DD/MM/YYYY to sortable format
        const dateA = a.paymentDate.split('/').reverse().join('')
        const dateB = b.paymentDate.split('/').reverse().join('')
        compareValue = dateA.localeCompare(dateB)
      } else if (sortField === 'amount') {
        compareValue = a.amount - b.amount
      } else if (sortField === 'paymentMethod') {
        compareValue = a.paymentMethod.localeCompare(b.paymentMethod, 'he')
      } else if (sortField === 'receiptNumber') {
        compareValue = a.receiptNumber.localeCompare(b.receiptNumber)
      }
      
      return sortDirection === 'asc' ? compareValue : -compareValue
    })
  })()
  
  // Get payment method label
  function getPaymentMethodLabel(method: string): string {
    switch(method) {
      case 'ק': return 'המחאה'
      case 'א': return 'אשראי'
      case 'ת': return 'מזומן'
      case 'מ': return 'העברה'
      default: return method
    }
  }
  
  function deletePayment(paymentId: string) {
    if (confirm('האם למחוק את הרשומה?')) {
      api.deletePayment(db, paymentId)
      db = load()
    }
  }
  
  function startEdit(payment: PatientPayment) {
    editingPaymentId = payment.id
    editingPayment = { ...payment }
  }
  
  function cancelEdit() {
    editingPaymentId = null
    editingPayment = {}
  }
  
  function saveEdit() {
    if (!editingPaymentId || !editingPayment) return
    
    // Find and update the payment
    const paymentIndex = db.patientPayments.findIndex(p => p.id === editingPaymentId)
    if (paymentIndex !== -1) {
      db.patientPayments[paymentIndex] = {
        ...db.patientPayments[paymentIndex],
        ...editingPayment,
        updatedAt: new Date().toISOString()
      }
      
      // Save to localStorage
      localStorage.setItem('phizio-db-v1', JSON.stringify(db))
      db = load()
      
      // Reset edit state
      editingPaymentId = null
      editingPayment = {}
    }
  }
  
  function exportHistory() {
    if (!patient) return
    
    const exportData = payments.map(payment => {
      const group = db.groups.find(g => g.id === payment.groupId)
      return {
        'שם פרטי': patient.firstName,
        'שם משפחה': patient.lastName,
        'ת.ז.': patient.nationalId,
        'קבוצה': group?.name || '-',
        'תקופה מ': payment.fromMonth,
        'תקופה עד': payment.toMonth,
        'תאריך תשלום': payment.paymentDate,
        'סכום': payment.amount,
        'אופן תשלום': getPaymentMethodLabel(payment.paymentMethod),
        'מספר קבלה': payment.receiptNumber
      }
    })
    
    exportToCSV(exportData, `payment_history_${patient.firstName}_${patient.lastName}`)
  }
  
  function backToPatients() {
    goto('/patients')
  }
  
  function goToRegistration() {
    if (patientId) {
      goto(`/registration/${patientId}`)
    }
  }
</script>

<section class="space-y-6">
  <div class="bg-white rounded-lg shadow p-4">
    <div class="flex justify-between items-center mb-4">
      <div class="flex gap-3">
        <button 
          class="text-blue-600 hover:text-blue-700 text-sm font-medium"
          on:click={exportHistory}
        >
          ייצוא
        </button>
        <button 
          class="text-blue-600 hover:underline text-sm" 
          on:click={backToPatients}
        >
          חזרה למטופלים
        </button>
      </div>
      <h2 class="text-lg font-semibold">היסטוריית תשלומים</h2>
    </div>
  </div>

  {#if !patient}
    <div class="bg-white rounded-lg shadow p-4">
      <p class="text-center text-gray-500 py-8">מטופל לא נמצא</p>
    </div>
  {:else}
    <!-- Patient details -->
    <div class="bg-white rounded-lg shadow p-4">
      <div class="flex justify-between items-center">
        <button 
          class="big-green-button"
          on:click={goToRegistration}
        >
          רישום תשלום חדש
        </button>
        <div class="text-right">
          <h3 class="text-sm font-medium text-gray-600 mb-2">פרטי מטופל</h3>
          <div class="flex gap-4">
            <span class="font-medium">{patient.firstName} {patient.lastName}</span>
            <span class="text-sm text-gray-600">ת.ז: {patient.nationalId}</span>
            <span class="text-sm text-gray-600">טלפון: {patient.phone}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment history -->
    <div class="bg-white rounded-lg shadow p-4">
      {#if payments.length === 0}
        <p class="text-center text-gray-500 py-8">אין היסטוריית תשלומים</p>
      {:else}
        <div class="space-y-3">
          <!-- Header -->
          <div class="grid grid-cols-7 gap-2 pb-2 border-b font-semibold text-sm text-gray-700 text-right">
            <button 
              class="cursor-pointer hover:text-blue-600 text-right w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded" 
              on:click={() => sortBy('group')}
              aria-label="מיין לפי קבוצה"
            >
              קבוצה
              {#if sortField === 'group'}
                <span class="text-xs" aria-hidden="true">{sortDirection === 'asc' ? '▲' : '▼'}</span>
              {/if}
            </button>
            <button 
              class="cursor-pointer hover:text-blue-600 text-right w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded" 
              on:click={() => sortBy('period')}
              aria-label="מיין לפי תקופה"
            >
              תקופה
              {#if sortField === 'period'}
                <span class="text-xs" aria-hidden="true">{sortDirection === 'asc' ? '▲' : '▼'}</span>
              {/if}
            </button>
            <button 
              class="cursor-pointer hover:text-blue-600 text-right w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded" 
              on:click={() => sortBy('paymentDate')}
              aria-label="מיין לפי תאריך תשלום"
            >
              תאריך תשלום
              {#if sortField === 'paymentDate'}
                <span class="text-xs" aria-hidden="true">{sortDirection === 'asc' ? '▲' : '▼'}</span>
              {/if}
            </button>
            <button 
              class="cursor-pointer hover:text-blue-600 text-right w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded" 
              on:click={() => sortBy('amount')}
              aria-label="מיין לפי סכום"
            >
              סכום
              {#if sortField === 'amount'}
                <span class="text-xs" aria-hidden="true">{sortDirection === 'asc' ? '▲' : '▼'}</span>
              {/if}
            </button>
            <button 
              class="cursor-pointer hover:text-blue-600 text-right w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded" 
              on:click={() => sortBy('paymentMethod')}
              aria-label="מיין לפי אופן תשלום"
            >
              אופן תשלום
              {#if sortField === 'paymentMethod'}
                <span class="text-xs" aria-hidden="true">{sortDirection === 'asc' ? '▲' : '▼'}</span>
              {/if}
            </button>
            <button 
              class="cursor-pointer hover:text-blue-600 text-right w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded" 
              on:click={() => sortBy('receiptNumber')}
              aria-label="מיין לפי מספר קבלה"
            >
              מספר קבלה
              {#if sortField === 'receiptNumber'}
                <span class="text-xs" aria-hidden="true">{sortDirection === 'asc' ? '▲' : '▼'}</span>
              {/if}
            </button>
            <div class="text-center">פעולות</div>
          </div>
          
          <!-- Payment rows -->
          {#each payments as payment}
            {@const group = db.groups.find(g => g.id === payment.groupId)}
            {#if editingPaymentId === payment.id}
              <!-- Edit mode -->
              <div class="grid grid-cols-7 gap-2 py-2 border-b text-sm text-right bg-blue-50">
                <select 
                  class="border rounded px-2 py-1 text-sm"
                  bind:value={editingPayment.groupId}
                  dir="rtl"
                >
                  {#each db.groups as g}
                    <option value={g.id}>{g.name}</option>
                  {/each}
                </select>
                <div class="flex gap-1">
                  <input 
                    type="text" 
                    class="border rounded px-1 py-1 w-16 text-sm text-center"
                    bind:value={editingPayment.fromMonth}
                    placeholder="MM/YYYY"
                  />
                  <span>-</span>
                  <input 
                    type="text" 
                    class="border rounded px-1 py-1 w-16 text-sm text-center"
                    bind:value={editingPayment.toMonth}
                    placeholder="MM/YYYY"
                  />
                </div>
                <input 
                  type="text" 
                  class="border rounded px-2 py-1 text-sm text-center"
                  bind:value={editingPayment.paymentDate}
                  placeholder="DD/MM/YYYY"
                />
                <input 
                  type="number" 
                  class="border rounded px-2 py-1 text-sm text-right"
                  bind:value={editingPayment.amount}
                  min="0"
                  step="10"
                />
                <select 
                  class="border rounded px-2 py-1 text-sm"
                  bind:value={editingPayment.paymentMethod}
                  dir="rtl"
                >
                  <option value="ק">המחאה</option>
                  <option value="א">אשראי</option>
                  <option value="ת">מזומן</option>
                  <option value="מ">העברה</option>
                </select>
                <input 
                  type="text" 
                  class="border rounded px-2 py-1 text-sm"
                  bind:value={editingPayment.receiptNumber}
                />
                <div class="flex justify-center gap-2">
                  <button 
                    class="text-green-600 hover:text-green-700" 
                    on:click={saveEdit}
                    title="שמור"
                  >
                    ✓
                  </button>
                  <button 
                    class="text-red-600 hover:text-red-700" 
                    on:click={cancelEdit}
                    title="ביטול"
                  >
                    ✕
                  </button>
                </div>
              </div>
            {:else}
              <!-- Display mode -->
              <div class="grid grid-cols-7 gap-2 py-2 border-b text-sm text-right">
                <div class="font-medium">{group?.name || '-'}</div>
                <div>{payment.fromMonth} - {payment.toMonth}</div>
                <div>{payment.paymentDate}</div>
                <div class="font-medium">₪{payment.amount}</div>
                <div>{getPaymentMethodLabel(payment.paymentMethod)}</div>
                <div>{payment.receiptNumber}</div>
                <div class="flex justify-center gap-2">
                  <button 
                    class="text-blue-600 hover:text-blue-700" 
                    on:click={() => startEdit(payment)}
                    title="עריכה"
                  >
                    ✏️
                  </button>
                  <button 
                    class="text-red-600 hover:text-red-700" 
                    on:click={() => deletePayment(payment.id)}
                    title="מחיקה"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            {/if}
          {/each}
          
          <!-- Summary -->
          <div class="pt-4 border-t">
            <div class="flex justify-between">
              <div class="text-sm text-gray-600">
                סה"כ תשלומים: {payments.length}
              </div>
              <div class="font-medium">
                סה"כ: ₪{payments.reduce((sum, p) => sum + p.amount, 0)}
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</section>