<script>
    export let currentRoute = '';
  </script>

    <svelte:head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0" />
    <meta name="Content-Language" content="he" />
    <meta name="google" content="notranslate" />

    <!-- External resources allowed by clinic firewall -->
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@100..900&display=swap" rel="stylesheet" />

    <!-- Local stylesheet lives in css/main.css next to the compiled HTML files -->
    <link rel="stylesheet" href="css/main.css" />
    </svelte:head>

    <div class="page" dir="rtl" lang="he">
    <!-- Header -->
    <header class="page-header">
        <div class="grid-row">
        <div class="grid-col grid-col_12">
            <div class="logo">Physiotherapy Modiin</div>
        </div>
        </div>
    </header>

    <!-- Top nav (notifications + hamburger) -->
    <nav class="top-nav-wrapper">
        <div class="top-nav">
        <div class="top-nav__item">
            <button class="top-nav__link material-icons" type="button">notifications</button>
            <i class="top-nav__count">10</i>
        </div>
        <div class="top-nav__item">
            <button class="top-nav__link material-icons" type="button">menu</button>
            <div class="top-nav__drop">
            <button class="top-nav__link" aria-label="Profile">Profile</button>
            <button class="top-nav__link js-popup-opener" data-ref="#popup-settings" aria-label="Settings">Settings</button>
            <button class="top-nav__link" aria-label="Help and Support">Help and Support</button>
            <button class="top-nav__link" aria-label="Setup">Setup</button>
            <button class="top-nav__link" aria-label="Logout" on:click={() => { /* Add logout logic here */ }}>Logout</button>
            </div>
        </div>
        </div>
    </nav>

    <!-- Side navigation -->
    <aside class="page-aside">
        <nav class="main-nav">
            <button
                class="main-nav__item {currentRoute === 'groups' ? 'main-nav__item_active' : ''}"
                on:click={() => window.location.hash = 'groups'}
            ><i class="material-icons">dashboard</i>קבוצות</button>
        <hr class="main-nav__sep" />
        <button
            class="main-nav__item {currentRoute === 'therapists' ? 'main-nav__item_active' : ''}"
            aria-label="Therapists"
            on:click={() => window.location.hash = 'therapists'}
            ><i class="material-icons">assignment</i>מטפלים</button>
        <hr class="main-nav__sep" />
        <button
            class="main-nav__item {currentRoute === 'patients' ? 'main-nav__item_active' : ''}"
            aria-label="Patients"
            on:click={() => window.location.hash = 'patients'}
            ><i class="material-icons">people</i>מטופלים</button>
        </nav>
    </aside>

    <!-- Where each page injects its own markup -->
    <main class="page-content">
        <slot />
    </main>
    </div>
