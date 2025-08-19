<script lang="ts">
  import { route } from './router'
  import Nav from './Nav.svelte'
  import Therapists from './pages/Therapists.svelte'
  import Patients from './pages/Patients.svelte'
  import Groups from './pages/Groups.svelte'
  import Statuses from './pages/Statuses.svelte'

  const routes: Record<string, any> = {
    therapists: Therapists,
    patients: Patients,
    groups: Groups,
    statuses: Statuses
  }

  $: current = $route
  $: Comp = routes[current.name] ?? Therapists
</script>

<Nav />
<main class="container px-4 py-6">
  <svelte:component this={Comp} />
</main>

