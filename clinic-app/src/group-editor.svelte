<!-- ============================================================= -->
<!-- Group Editor.svelte                                          -->
<!-- ============================================================= -->
<script>
  import { onMount } from 'svelte';

  onMount(() => {
    // Handle input label animations
    const inputs = document.querySelectorAll('.input__text');
    
    inputs.forEach(input => {
      // Handle focus - always float label up
      input.addEventListener('focus', () => {
        input.classList.add('input__text_changed');
      });
      
      // Handle blur - only drop label down if field is empty
      input.addEventListener('blur', () => {
        if (!input.value.trim()) {
          input.classList.remove('input__text_changed');
        }
      });
      
      // Handle input - keep label up if there's content
      input.addEventListener('input', () => {
        if (input.value.trim()) {
          input.classList.add('input__text_changed');
        } else {
          input.classList.remove('input__text_changed');
        }
      });
      
      // Initialize: if input has value, float label up
      if (input.value && input.value.trim()) {
        input.classList.add('input__text_changed');
      }
    });
  });
</script>

<style>
  /* Remove custom overrides - use the grid system as designed */
</style>
<div class="page-title">
  <button class="button button_green">שמור </button>
  <a href="#groups" class="button button_flat">חזור לקבוצות</a>
</div>

<div class="card">
  <div class="heading heading_3">עריכת קבוצה</div>
  <div class="grid-row">
    
    <!-- Group Name Field -->
    <div class="grid-col grid-col_24">
      <br><br>
      <div class="input">
    
        <input type="text" class="input__text" id="group-name" />
        <label for="group-name" class="input__label">שם קבוצה</label>
      </div>
    </div>

    <!-- Group Type Field -->
    <div class="grid-col grid-col_6">
      
      <div class="input input_select">
        <select id="group-type" class="input__text">
          <option selected disabled></option>
          <option>Pilates</option>
          <option>Old people</option>
          <option>NIA</option>
          <option>Healthy stretching</option>
        </select>
        <label for="group-type" class="input__label">סוג קבוצה</label>
      </div>
    </div>

    <!-- Group Availability Field -->
    <div class="grid-col grid-col_4">

      <div class="input">
        <input type="text" class="input__text" id="group-availability" />
        <label for="group-availability" class="input__label">פנוי בקבוצה</label>
      </div>
    </div>

    <!-- Group Therapist Field -->
    <div class="grid-col grid-col_8">
      <div class="input">
        <input type="text" class="input__text" id="group-therapist" />
        <label for="group-therapist" class="input__label">מטפל/ת</label>
      </div>
    </div>

    <!-- Group Time Day Field -->
    <div class="grid-col grid-col_6">
      <div class="input input_select">
        <select id="group-time-day" class="input__text">
          <option selected disabled></option>
          <option>Sunday</option>
          <option>Monday</option>
          <option>Tuesday</option>
          <option>Wednesday</option>
          <option>Thursday</option>
          <option>Friday</option>
          <option>Saturday</option>
        </select>
        <label for="group-time-day" class="input__label">יום</label>
      </div>
    </div>

    <!-- Group Time Hour Field -->
    <div class="grid-col grid-col_6">
      <div class="input input_time">
        <input type="time" class="input__text input__text_changed" id="group-time" value="08:00" />
        <label for="group-time" class="input__label">שעה</label>
      </div>
    </div>

    <!-- Group Status Field -->
    <div class="grid-col grid-col_4">
      <div class="input">
        <input type="text" class="input__text" id="group-status" />
        <label for="group-status" class="input__label">סטטוס קבוצה</label>
      </div>
    </div>
  </div>
</div>
<div class="grid-col grid-col_24">
<div class="tar">
  <br><br>
  <button type="submit" class="button button_raised button_green">שמור</button>
</div>
</div>

