<script lang="ts">
  import { goto } from './router'
</script>

<nav class="bg-white shadow-sm">
  <div class="container px-4 h-14 flex items-center gap-4">
    <h1 class="text-xl font-semibold ml-auto">ניהול קבוצות</h1>
    <button class="text-sm text-gray-700 hover:text-blue-600" on:click={() => goto('/groups')}>קבוצות</button>
    <button class="text-sm text-gray-700 hover:text-blue-600" on:click={() => goto('/therapists')}>מטפל/ת</button>
    <button class="text-sm text-gray-700 hover:text-blue-600" on:click={() => goto('/patients')}>מטופלים</button>
    <button class="text-sm text-gray-700 hover:text-blue-600" on:click={() => goto('/statuses')}>סטטוסים</button>
  </div>
</nav>

