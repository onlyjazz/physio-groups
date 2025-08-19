<script lang="ts">
    import { createEventDispatcher } from 'svelte';
  
    /** Pass real therapists from parent if you have them */
    export let therapists: { id: string; name: string }[] = [
      { id: 'pt-1', name: 'עוז המלך' },
      { id: 'pt-2', name: 'גל המלכה' }
    ];
  
    // form state
    export let groupName = '';
    export let groupTherapist = therapists[0]?.id ?? '';
    export let groupAvailability: number | '' = '';
    export let groupStatus: 'active' | 'inactive' = 'active';
    export let dayOfTheWeek:
      | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'
      = 'Sunday';
    export let groupTime = '08:00';
  
    const days = [
      { value: 'Sunday',    label: 'ראשון'  },
      { value: 'Monday',    label: 'שני'    },
      { value: 'Tuesday',   label: 'שלישי'  },
      { value: 'Wednesday', label: 'רביעי'  },
      { value: 'Thursday',  label: 'חמישי'  },
      { value: 'Friday',    label: 'שישי'   },
      { value: 'Saturday',  label: 'שבת'    }
    ];
  
    const dispatch = createEventDispatcher();
  
    function clampAvailability() {
      if (groupAvailability === '') return;
      const n = Number(groupAvailability);
      groupAvailability = Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
    }
  
    function onSubmit(e: Event) {
      e.preventDefault();
      clampAvailability();
      dispatch('save', {
        groupName: groupName.trim(),
        therapistId: groupTherapist,
        groupAvailability:
          typeof groupAvailability === 'string' ? Number(groupAvailability) : groupAvailability,
        groupStatus,
        dayOfTheWeek,
        groupTime
      });
    }
  </script>
  
  <!-- Card -->
  <div class="card new-study edit-groups-form" dir="rtl">
    <div class="page-title tar">
      <h1 class="heading heading_3">עריכת קבוצה</h1>
    </div>
  
    <form id="group-editor-form" class="grid" on:submit={onSubmit} novalidate>
      <!-- ROW 1: name (12) + availability (12) -->
      <div class="grid-row">
        <div class="grid-col grid-col_12 grid-col_md-24">
          <div class="input">
            <div class="input__label input__label_static">שם קבוצה</div>
            <input class="input__text" type="text" bind:value={groupName} autocomplete="off" />
          </div>
        </div>
  
        <div class="grid-col grid-col_12 grid-col_md-24">
          <div class="input">
            <div class="input__label input__label_static">מספר מקומות פנויים</div>
            <input
              class="input__text"
              type="number"
              min="0"
              step="1"
              bind:value={groupAvailability}
              on:blur={clampAvailability}
              inputmode="numeric"
            />
          </div>
        </div>
      </div>
  
      <!-- ROW 2: therapist (12) + status (12) -->
      <div class="grid-row">
        <div class="grid-col grid-col_12 grid-col_md-24">
          <div class="input">
            <div class="input__label input__label_static">מטפל/ת</div>
            <select class="input__text" bind:value={groupTherapist}>
              {#each therapists as t}
                <option value={t.id}>{t.name}</option>
              {/each}
            </select>
          </div>
        </div>
  
        <div class="grid-col grid-col_12 grid-col_md-24">
          <div class="input">
            <div class="input__label input__label_static">סטטוס</div>
            <select class="input__text" bind:value={groupStatus}>
              <option value="active">פעיל</option>
              <option value="inactive">סגור</option>
            </select>
          </div>
        </div>
      </div>
  
      <!-- ROW 3: balanced small fields (8 + 8 + 8) -->
      <div class="grid-row sm-row">
        <div class="grid-col grid-col_8 grid-col_md-24">
          <div class="input">
            <div class="input__label input__label_static">יום בשבוע</div>
            <select class="input__text" bind:value={dayOfTheWeek}>
              {#each days as d}
                <option value={d.value}>{d.label}</option>
              {/each}
            </select>
          </div>
        </div>
  
        <div class="grid-col grid-col_8 grid-col_md-24">
          <div class="input">
            <div class="input__label input__label_static">שעת התחלה</div>
            <input type="time" class="input__text" bind:value={groupTime} />
          </div>
        </div>
  
        <div class="grid-col grid-col_8 grid-col_md-24">
          <div class="input">
            <div class="input__label input__label_static">—</div>
            <input class="input__text" type="text" placeholder="" />
          </div>
        </div>
      </div>
    </form>
  </div>
  
  <!-- Actions bar below the card -->
  <div class="edit-actions tar">
    <a href="#/groups" class="button button_flat" style="margin-left:8px">ביטול</a>
    <button type="submit" form="group-editor-form" class="button button_blue">שמירת קבוצה</button>
  </div>
  
  <style>
    /* Title spacing & alignment */
    :global(.edit-groups-form .page-title) { padding: 0 24px 8px; }
    :global(.edit-groups-form .page-title .heading) { margin: 0; text-align: end; display: block; }
  
    /* Static labels—closer to their fields */
    :global(.edit-groups-form .input__label_static) {
      position: static !important;
      display: block;
      margin-bottom: 4px;         /* tighter than default for stronger pairing */
      opacity: .75;
    }
  
    /* Full-width single-line controls with vertical centering */
    :global(.edit-groups-form .input),
    :global(.edit-groups-form .input .input__text) {
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
    }
    :global(.edit-groups-form input.input__text),
    :global(.edit-groups-form select.input__text) {
      height: 44px;
      line-height: 44px;
      padding: 0 12px;
      font-size: 16px;
    }
    :global(.edit-groups-form input[type="time"].input__text) {
      text-align: left;           /* nicer for HH:MM in RTL */
    }
  
    /* Keep dropdowns visible and rows contributing height */
    :global(.edit-groups-form .grid-row) { overflow: visible; }
    :global(.edit-groups-form form.grid) { padding-bottom: 12px; }
  
    /* Align small fields on same baseline */
    :global(.edit-groups-form .sm-row) { align-items: center; }
  
    /* Actions bar under the card (separates inputs from actions) */
    .edit-actions {
      max-width: 1200px;          /* same as .grid container */
      margin: 12px auto 24px;
      padding: 0 24px;
    }
  </style>
  