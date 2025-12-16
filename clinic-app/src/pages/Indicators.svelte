<script lang="ts">
  import { load, type Db, api } from '../lib/db'
  import { onMount } from 'svelte'
  
  let db: Db = load()
  
  // Refresh data periodically
  onMount(() => {
    const interval = setInterval(() => {
      db = load()
    }, 5000) // Refresh every 5 seconds
    
    return () => clearInterval(interval)
  })
  
  // Calculate various statistics
  $: activeTherapists = db.therapists.filter(t => 
    db.statuses.find(s => s.id === t.statusId)?.code === 'active'
  ).length
  
  // Active patients are those with active subscriptions (payments covering current month)
  $: activePatients = (() => {
    const now = new Date()
    const currentMonth = now.getMonth() + 1 // 1-12
    const currentYear = now.getFullYear()
    const currentDate = currentYear * 12 + currentMonth
    
    const activePatientsSet = new Set<string>()
    
    db.patientPayments.forEach(payment => {
      // Parse fromMonth (MM/YYYY)
      const [fromMonthStr, fromYearStr] = payment.fromMonth.split('/')
      const fromMonth = parseInt(fromMonthStr)
      const fromYear = parseInt(fromYearStr)
      
      // Parse toMonth (MM/YYYY)
      const [toMonthStr, toYearStr] = payment.toMonth.split('/')
      const toMonth = parseInt(toMonthStr)
      const toYear = parseInt(toYearStr)
      
      // Check if current date falls within the payment period
      const fromDate = fromYear * 12 + fromMonth
      const toDate = toYear * 12 + toMonth
      
      if (fromDate <= currentDate && currentDate <= toDate) {
        activePatientsSet.add(payment.patientId)
      }
    })
    
    return activePatientsSet.size
  })()
  
  $: totalPatients = db.patients.filter(p => 
    db.statuses.find(s => s.id === p.statusId)?.code === 'active'
  ).length
  
  $: enrolledCount = db.patientsInGroups.filter(pig => pig.enrolled === 1).length
  $: waitlistedCount = db.patientsInGroups.filter(pig => pig.enrolled === 0).length
  
  $: attendanceThisMonth = (() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    return db.attendance.filter(a => {
      const date = new Date(a.date)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    }).length
  })()
  
  $: regularAttendance = db.attendance.filter(a => !a.isMakeup).length
  $: makeupAttendance = db.attendance.filter(a => a.isMakeup).length
  
  // Use the same calculation as activeSubscriptionsCount
  $: paymentsThisMonth = activeSubscriptionsCount
  
  $: totalRevenue = db.patientPayments.reduce((sum, p) => sum + p.amount, 0)
  
  $: groupsWithCapacity = db.groups.filter(g => {
    const available = api.getAvailableWithActiveSubscriptions(db, g.id)
    return available > 0
  }).length
  
  $: fullGroups = db.groups.filter(g => {
    const available = api.getAvailableWithActiveSubscriptions(db, g.id)
    return available === 0
  }).length
  
  // Count total active subscriptions (a patient might have multiple)
  $: activeSubscriptionsCount = (() => {
    const now = new Date()
    const currentMonth = now.getMonth() + 1 // 1-12
    const currentYear = now.getFullYear()
    const currentDate = currentYear * 12 + currentMonth
    
    return db.patientPayments.filter(payment => {
      // Parse fromMonth (MM/YYYY)
      const [fromMonthStr, fromYearStr] = payment.fromMonth.split('/')
      const fromMonth = parseInt(fromMonthStr)
      const fromYear = parseInt(fromYearStr)
      
      // Parse toMonth (MM/YYYY)
      const [toMonthStr, toYearStr] = payment.toMonth.split('/')
      const toMonth = parseInt(toMonthStr)
      const toYear = parseInt(toYearStr)
      
      // Check if current date falls within the payment period
      const fromDate = fromYear * 12 + fromMonth
      const toDate = toYear * 12 + toMonth
      
      return fromDate <= currentDate && currentDate <= toDate
    }).length
  })()
</script>

<section class="space-y-6">
  <div class="bg-white rounded-lg shadow p-4">
    <div class="flex justify-between items-center mb-4">
      <div></div>
      <h2 class="text-lg font-semibold">מדדים</h2>
    </div>
  
  <!-- Main Statistics Cards -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
      <div class="text-blue-600 text-sm font-medium">מטופלים פעילים</div>
      <div class="text-3xl font-bold text-blue-800">{activePatients}</div>
      <div class="text-xs text-gray-600 mt-1">עם מנוי פעיל | {totalPatients} רשומים פעילים</div>
    </div>
    
    <div class="bg-green-50 p-4 rounded-lg border border-green-200">
      <div class="text-green-600 text-sm font-medium">קבוצות</div>
      <div class="text-3xl font-bold text-green-800">{db.groups.length}</div>
      <div class="text-xs text-gray-600 mt-1">{groupsWithCapacity} עם מקום | {fullGroups} מלאות</div>
    </div>
    
    <div class="bg-purple-50 p-4 rounded-lg border border-purple-200">
      <div class="text-purple-600 text-sm font-medium">מנחים פעילים</div>
      <div class="text-3xl font-bold text-purple-800">{activeTherapists}</div>
      <div class="text-xs text-gray-600 mt-1">מתוך {db.therapists.length} רשומים</div>
    </div>
    
    <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
      <div class="text-yellow-700 text-sm font-medium">מנויים פעילים</div>
      <div class="text-3xl font-bold text-yellow-800">{activeSubscriptionsCount}</div>
      <div class="text-xs text-gray-600 mt-1">תשלומים פעילים החודש</div>
    </div>
  </div>
  
  <!-- Registration Statistics -->
  <div class="bg-white p-4 rounded-lg border mb-6">
    <h2 class="text-lg font-semibold mb-3">רישום לקבוצות</h2>
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
      <div>
        <div class="text-sm text-gray-600">רשומים</div>
        <div class="text-2xl font-bold">{enrolledCount}</div>
      </div>
      <div>
        <div class="text-sm text-gray-600">ממתינים</div>
        <div class="text-2xl font-bold text-orange-600">{waitlistedCount}</div>
      </div>
      <div>
        <div class="text-sm text-gray-600">סה"כ רישומים</div>
        <div class="text-2xl font-bold">{db.patientsInGroups.length}</div>
      </div>
    </div>
  </div>
  
  <!-- Attendance Statistics -->
  <div class="bg-white p-4 rounded-lg border mb-6">
    <h2 class="text-lg font-semibold mb-3">נוכחות</h2>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div>
        <div class="text-sm text-gray-600">סה"כ נוכחות</div>
        <div class="text-2xl font-bold">{db.attendance.length}</div>
      </div>
      <div>
        <div class="text-sm text-gray-600">החודש</div>
        <div class="text-2xl font-bold text-blue-600">{attendanceThisMonth}</div>
      </div>
      <div>
        <div class="text-sm text-gray-600">רגילה</div>
        <div class="text-2xl font-bold">{regularAttendance}</div>
      </div>
      <div>
        <div class="text-sm text-gray-600">השלמות</div>
        <div class="text-2xl font-bold text-purple-600">{makeupAttendance}</div>
      </div>
    </div>
  </div>
  
  <!-- Payment Statistics -->
  <div class="bg-white p-4 rounded-lg border mb-6">
    <h2 class="text-lg font-semibold mb-3">תשלומים</h2>
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
      <div>
        <div class="text-sm text-gray-600">סה"כ תשלומים</div>
        <div class="text-2xl font-bold">{db.patientPayments.length}</div>
      </div>
      <div>
        <div class="text-sm text-gray-600">פעילים החודש</div>
        <div class="text-2xl font-bold text-green-600">{paymentsThisMonth}</div>
      </div>
      <div>
        <div class="text-sm text-gray-600">סה"כ הכנסות</div>
        <div class="text-2xl font-bold">₪{totalRevenue.toLocaleString()}</div>
      </div>
    </div>
  </div>
  
  <!-- Database Table Counts -->
  <div class="bg-gray-50 p-4 rounded-lg border" dir="rtl">
    <h2 class="text-lg font-semibold mb-3 text-right">ספירת רשומות במסד הנתונים</h2>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
      <div class="flex items-center gap-2">
        <span class="text-gray-600">סטטוסים:</span>
        <span class="font-mono font-bold">{db.statuses.length}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-gray-600">מנחים:</span>
        <span class="font-mono font-bold">{db.therapists.length}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-gray-600">מטופלים:</span>
        <span class="font-mono font-bold">{db.patients.length}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-gray-600">קבוצות:</span>
        <span class="font-mono font-bold">{db.groups.length}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-gray-600">מטופלים בקבוצות:</span>
        <span class="font-mono font-bold">{db.patientsInGroups.length}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-gray-600">מנחים בקבוצות:</span>
        <span class="font-mono font-bold">{db.therapistsInGroups.length}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-gray-600">נוכחות:</span>
        <span class="font-mono font-bold">{db.attendance.length}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-gray-600">תשלומים:</span>
        <span class="font-mono font-bold">{db.patientPayments.length}</span>
      </div>
    </div>
  </div>
  
  <!-- Last Update Time -->
  <div class="text-center text-sm text-gray-500 mt-4">
    עדכון אחרון: {new Date().toLocaleTimeString('he-IL')}
  </div>
  </div>
</section>
