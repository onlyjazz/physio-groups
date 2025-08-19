<script lang="ts">
  import Groups from './groups.svelte';
  import GroupEditor from './group-editor.svelte';
  import Patients from './patients.svelte';
  import Therapists from './therapists.svelte';
  import { route } from './router';
  import { onDestroy, onMount } from 'svelte';

  const routes: Record<string, any> = {
    groups: Groups,
    'group-editor': GroupEditor,
    patients: Patients,
    therapists: Therapists
  };

  // route store (explicit subscribe)
  let current = { name: 'groups', segments: [] as string[] };
  const unsub = route.subscribe((r) => (current = r));
  onDestroy(unsub);

  // choose page
  $: Comp = routes[current.name] ?? Groups;
  $: params = { id: current.segments[0] };

  // dynamically import Layout so it can’t be pruned by HMR/TS
  let LayoutComp: any = null;
  onMount(async () => {
    const mod = await import('./Layout.svelte');
    LayoutComp = mod.default;
  });
</script>

{#if LayoutComp}
  <svelte:component this={LayoutComp}>
    <svelte:component this={Comp} {...params} />
  </svelte:component>
{:else}
  <!-- tiny fallback while Layout loads -->
  <div style="padding:12px; font-family:sans-serif;">Loading…</div>
{/if}