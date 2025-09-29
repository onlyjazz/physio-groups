<script lang="ts">
  import { load, api, type Db } from '../lib/db'
  import { route } from '../router'
  import { goto } from '../router'
  import { exportToCSV } from '../lib/csvExport'
  
  let db: Db = load()
  
  // Get patient ID from route
  $: patientId = $route.segments[0] || null
  $: patient = patientId ? db.patients.find(p => p.id === patientId) : null
  
  // Get patient payments
  $: payments = patientId ? api.getPaymentsByPatient(db, patientId) : []
  
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
            <div>קבוצה</div>
            <div>תקופה</div>
            <div>תאריך תשלום</div>
            <div>סכום</div>
            <div>אופן תשלום</div>
            <div>מספר קבלה</div>
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