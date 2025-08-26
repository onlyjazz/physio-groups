<script lang="ts">
  import { route } from './router'
  import Nav from './Nav.svelte'
  import Therapists from './pages/Therapists.svelte'
  import Patients from './pages/Patients.svelte'
  import Groups from './pages/Groups.svelte'
  import GroupsList from './pages/GroupsList.svelte'
  import GroupAttendance from './pages/GroupAttendance.svelte'

  const routes: Record<string, any> = {
    therapists: Therapists,
    patients: Patients,
    groups: Groups,
    groupsList: GroupsList,
    groupAttendance: GroupAttendance
  }

  $: current = $route
  $: Comp = routes[current.name] ?? GroupsList
</script>

<Nav />
<main class="container px-4 py-6">
  <svelte:component this={Comp} />
</main>

