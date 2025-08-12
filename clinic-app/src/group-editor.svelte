<script>
    import Select from 'svelte-select';
  
    let groupName = '';
    let groupAvailability = '';
    let groupTherapist = null;
    let groupStatus = null;
    let dayOfTheWeek = null;
    let groupTime = '08:00';
  
    const therapists = [
      { value: 'pt-1', label: 'עוז המלך' },
      { value: 'pt-2', label: 'גל המלכה' }
    ];
  
    const statuses = [
      { value: 'active', label: 'פעיל' },
      { value: 'inactive', label: 'סגור' }
    ];
  
    const days = [
      { value: 'Sunday', label: 'ראשון' },
      { value: 'Monday', label: 'שני' },
      { value: 'Tuesday', label: 'שלישי' },
      { value: 'Wednesday', label: 'רביעי' },
      { value: 'Thursday', label: 'חמישי' },
      { value: 'Friday', label: 'שישי' },
      { value: 'Saturday', label: 'שבת' }
    ];
  </script>
  
  <div class="card new-study edit-groups-form" dir="rtl">
    <div class="page-title tar">
      <h1 class="heading heading_3 tar">עריכת קבוצה</h1>
    </div>
  
    <form class="grid">
      <div class="grid-row">
        <!-- Group name -->
        <div class="grid-col grid-col_8 grid-col_md-24">
          <div class="input">
            <input type="text" class="input__text" bind:value={groupName} placeholder="" />
            <label class="input__label">שם קבוצה</label>
          </div>
        </div>
  
        <!-- Available places -->
        <div class="grid-col grid-col_8 grid-col_md-24">
          <div class="input">
            <input type="number" class="input__text" bind:value={groupAvailability} min="0" />
            <label class="input__label">מספר מקומות פנויים</label>
          </div>
        </div>
  
        <!-- Therapist -->
        <div class="grid-col grid-col_8 grid-col_md-24">
          <div class="input">
            <div class="input__label input__label_static">מטפל/ת</div>
            <Select
              class="ss"
              items={therapists}
              bind:value={groupTherapist}
              placeholder="בחר/י מטפל/ת"
              clearable={false}
            />
          </div>
        </div>
     
        <!-- Status -->
        <div class="grid-col grid-col_8 grid-col_md-24">
          <div class="input">
            <div class="input__label input__label_static">סטטוס</div>
            <Select
              class="ss"
              items={statuses}
              bind:value={groupStatus}
              placeholder="בחר/י סטטוס"
              clearable={false}
            />
          </div>
        </div>
  
        <!-- Day of week -->
        <div class="grid-col grid-col_8 grid-col_md-24">
          <div class="input">
            <div class="input__label input__label_static">יום בשבוע</div>
            <Select
              class="ss"
              items={days}
              bind:value={dayOfTheWeek}
              placeholder="בחר/י יום"
              clearable={false}
            />
          </div>
        </div>
  
        <!-- Start time -->
        <div class="grid-col grid-col_8 grid-col_md-24">
          <div class="input">
            <div class="input__label input__label_static">שעת התחלה</div>
            <input type="time" class="input__text" bind:value={groupTime} />
          </div>
        </div>

      </div>
    </form>
  </div>
  
  <style>
    /* keep form spacing tight and consistent with your guide */
    :global(.edit-groups-form .input) { margin-bottom: 18px; }

      /* only affect the editor page */
  :global(.edit-groups-form .page-title) {
    padding: 0 24px 8px;         /* a little breathing room inside the card */
  }
  
  :global(.edit-groups-form .page-title .heading) {
    margin: 0;
    text-align: end;             /* RTL/LTR aware */
    display: block;
  }
  
    /* floating-label inputs: room under label so text doesn’t collide */
    :global(.edit-groups-form .input__text) {
      height: 44px;
      padding-top: 14px;
      font-size: 16px;
    }
    :global(.edit-groups-form .input__label) { top: 10px; }
  
    /* static labels above selects to match your aesthetic */
    .input__label_static {
      position: static;
      display: block;
      margin-bottom: 6px;
      opacity: 0.7;
    }
  
    /* ---- svelte-select “skin” to match .input__text ---- */
    /* root */
    :global(.edit-groups-form .ss.svelte-select) {
      display: block;
      direction: rtl;          /* RTL caret + text */
      font-size: 12px;
    }
  
    /* control */
    :global(.edit-groups-form .ss .control) {
      min-height: 44px;
      height: 44px;
      border: 1px solid #d4d9df;          /* match input border */
      border-radius: 8px;                  /* match input radius */
      padding: 0 12px;                     /* inner padding */
      box-shadow: none;
      background: #fff;
    }
  
    /* value text area */
    :global(.edit-groups-form .ss .value-container) {
      padding: 0;                          /* align with input text */
    }
  
    /* placeholder and single-value */
    :global(.edit-groups-form .ss .placeholder),
    :global(.edit-groups-form .ss .single-value) {
      line-height: 42px;                   /* visually center text */
    }
  
    /* indicators (clear/x + arrow) – keep subtle */
    :global(.edit-groups-form .ss .indicators) {
      gap: 6px;
    }
    :global(.edit-groups-form .ss .indicator) {
      opacity: 0.6;
    }
  
    /* focus state to mirror inputs */
    :global(.edit-groups-form .ss .control.focused) {
      border-color: #4aa3ff;               /* your blue */
      box-shadow: 0 0 0 2px rgba(74,163,255,0.15);
    }
  
    /* menu (dropdown) */
    :global(.edit-groups-form .ss .menu) {
      border: 1px solid #d4d9df;
      border-radius: 8px;
      box-shadow: 0 10px 24px rgba(0,0,0,0.08);
      overflow: hidden;
      z-index: 9999;
    }
  
    /* option rows */
    :global(.edit-groups-form .ss .option) {
      padding: 10px 12px;
    }
    :global(.edit-groups-form .ss .option.hover) {
      background: #f4f6f8;
    }
    :global(.edit-groups-form .ss .option.selected) {
      background: #e9f3ff;
    }
  
    /* make sure the menu opens over other UI */
    :global(.svelte-select__menu) { z-index: 9999; }

    /* for fields with a static label above them, remove the floating-label padding */
    :global(.edit-groups-form .input .input__label_static + .input__text) {
    padding-top: 0;
    padding-bottom: 0;
    height: 44px;
    line-height: 44px; /* center the digits vertically */
  }

  /* make sure the native time input matches exactly */
  :global(.edit-groups-form input[type="time"].input__text) {
    padding-top: 0;
    padding-bottom: 0;
    height: 44px;
    line-height: 44px;
  }

  /* optional: same for the numeric availability field if needed */
  :global(.edit-groups-form input[type="number"].input__text) {
    padding-top: 0;
    line-height: 44px;
  }

  </style>
  