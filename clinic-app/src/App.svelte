<script>
  import Layout from './Layout.svelte';
  import Groups from './groups.svelte';
  import Patients from './patients.svelte';
  import Therapists from './therapists.svelte';

  const routes = {
    groups: Groups,
    patients: Patients,
    therapists: Therapists
  };

  let currentRoute = 'groups'; // fallback default
  let Component = routes[currentRoute];

  function handleRouteChange() {
    const hash = window.location.hash.slice(1);
    currentRoute = routes[hash] ? hash : 'groups';
    Component = routes[currentRoute];
  }

  // Initial load
  handleRouteChange();

  // Listen for hash changes
  window.addEventListener('hashchange', handleRouteChange);
</script>

<Layout currentRoute={currentRoute}>
  <svelte:component this={Component} />
</Layout>