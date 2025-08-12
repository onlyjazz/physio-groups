<script lang="ts">
    import { onMount } from 'svelte';
    // one global import is enough; it will cascade to all pages
    import '../css/main.css';
  
    onMount(() => {
      // ensure RTL + Hebrew so the CSS’ RTL rules apply
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'he');
    });
  </script>
  
  <div class="page">
    <header class="page-header">
      <div class="grid-row">
        <div class="grid-col grid-col_12">
          <div class="logo">Phizio Groups</div>
        </div>
        <div class="grid-col grid-col_12 tar fs0">
          <div class="top-nav">
            <div class="top-nav__item">
              <a class="top-nav__link material-icons">notifications</a>
              <i class="top-nav__count">3</i>
            </div>
            <div class="top-nav__item">
              <a class="top-nav__link material-icons">menu</a>
              <div class="top-nav__drop">
                <a>Profile</a>
                <a>Settings</a>
                <a>Help and Support</a>
                <a href="#/groups">Logout</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  
    <aside class="page-aside">
      <div class="main-nav">
        <a href="#/groups" class="main-nav__item"><i class="material-icons">dashboard</i>קבוצות</a>
        <hr class="main-nav__sep" />
        <a href="#/therapists" class="main-nav__item"><i class="material-icons">assignment</i>מטפלים</a>
        <hr class="main-nav__sep" />
        <a href="#/patients" class="main-nav__item"><i class="material-icons">people</i>מטופלים</a>
      </div>
    </aside>
  
    <main class="page-content">
      <slot />
    </main>
  </div>
  
  <style>
    /* keep this empty; all styling comes from main.css */
  </style>
  