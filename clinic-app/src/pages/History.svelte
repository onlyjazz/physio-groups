<script lang="ts">
  import { load, api, type Db } from '../lib/db'
  import { route } from '../router'
  import { goto } from '../router'
  import { exportToCSV } from '../lib/csvExport'
  
  let db: Db = load()
  
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
          <div class="grid grid-cols-6 gap-2 pb-2 border-b font-semibold text-sm text-gray-700 text-right">
            <div class="cursor-pointer hover:text-blue-600" on:click={() => sortBy('group')}>
              קבוצה
              {#if sortField === 'group'}
                <span class="text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
              {/if}
            </div>
            <div class="cursor-pointer hover:text-blue-600" on:click={() => sortBy('period')}>
              תקופה
              {#if sortField === 'period'}
                <span class="text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
              {/if}
            </div>
            <div class="cursor-pointer hover:text-blue-600" on:click={() => sortBy('paymentDate')}>
              תאריך תשלום
              {#if sortField === 'paymentDate'}
                <span class="text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
              {/if}
            </div>
            <div class="cursor-pointer hover:text-blue-600" on:click={() => sortBy('amount')}>
              סכום
              {#if sortField === 'amount'}
                <span class="text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
              {/if}
            </div>
            <div class="cursor-pointer hover:text-blue-600" on:click={() => sortBy('paymentMethod')}>
              אופן תשלום
              {#if sortField === 'paymentMethod'}
                <span class="text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
              {/if}
            </div>
            <div class="cursor-pointer hover:text-blue-600" on:click={() => sortBy('receiptNumber')}>
              מספר קבלה
              {#if sortField === 'receiptNumber'}
                <span class="text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>
              {/if}
            </div>
          </div>
          
          <!-- Payment rows -->
          {#each payments as payment}
            {@const group = db.groups.find(g => g.id === payment.groupId)}
            <div class="grid grid-cols-6 gap-2 py-2 border-b text-sm text-right">
              <div class="font-medium">{group?.name || '-'}</div>
              <div>{payment.fromMonth} - {payment.toMonth}</div>
              <div>{payment.paymentDate}</div>
              <div class="font-medium">₪{payment.amount}</div>
              <div>{getPaymentMethodLabel(payment.paymentMethod)}</div>
              <div>{payment.receiptNumber}</div>
            </div>
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