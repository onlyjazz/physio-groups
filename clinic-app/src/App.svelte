<script lang="ts">
  import { route } from './router'
  import Nav from './Nav.svelte'
  import Therapists from './pages/Therapists.svelte'
  import Patients from './pages/Patients.svelte'
  import Groups from './pages/Groups.svelte'
  import GroupsList from './pages/GroupsList.svelte'
  import GroupAttendance from './pages/GroupAttendance.svelte'
  import Waitlist from './pages/Waitlist.svelte'
  import MonthlyReport from './pages/MonthlyReport.svelte'
  import Registration from './pages/Registration.svelte'
  import History from './pages/History.svelte'

  const routes: Record<string, any> = {
    therapists: Therapists,
    patients: Patients,
    groups: Groups,
    groupsList: GroupsList,
    groupAttendance: GroupAttendance,
    waitlist: Waitlist,
    monthlyReport: MonthlyReport,
    registration: Registration,
    history: History
  }

  $: current = $route
  $: Comp = routes[current.name] ?? GroupsList
</script>

<Nav />
<main class="container px-4 py-6">
  <svelte:component this={Comp} />
</main>

