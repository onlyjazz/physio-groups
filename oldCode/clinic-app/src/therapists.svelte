<!-- ============================================================= -->
<!-- Therapists.svelte                                            -->
<!-- ============================================================= -->
    <div class="page-title">
      <a href="therapist-add.html" class="button button_green">הוסף מטפל חדש</a>
    </div>
  
    <div class="grid-row">
      <!-- Filters column -->
      <div class="grid-col grid-col_6">
        <div class="filters card">
          <div class="heading heading_3">חפש</div>
          <div class="input">
            <input id="therapist-search" type="text" class="input__text" />
            <label for="therapist-search" class="input__label">לפי שם מטפל</label>
          </div>
          <button type="submit" class="button button_blocked button_flat">שלח</button>
        </div>
      </div>
  
      <!-- Therapists table column -->
      <div class="grid-col grid-col_18">
        <div class="groups card">
          <div class="grid-row">
            <div class="grid-col grid-col_12">
              <div class="heading heading_3">מטפלים</div>
            </div>
            <div class="grid-col grid-col_12 tar">
              <div class="button button_s button_flat">
                פעולות<i class="material-icons">keyboard_arrow_down</i>
                <select class="input__text input__text_changed">
                  <option></option>
                  <option>עדכן מטפל בקבוצה</option>
                  <option>הסר מטפל מקבוצה</option>
                </select>
              </div>
            </div>
          </div>
  
          <div class="table">
            <table>
              <thead>
                <tr>
                  <th class="tal"><label class="checkbox"><input type="checkbox" /><i class="material-icons">check</i></label></th>
                  <th class="tal"><button class="table__sort" type="button">מטפל.ת</button></th>
                  <th class="tal"><button class="table__sort" type="button">קבוצה</button></th>
                  <th class="tal"><button class="table__sort" type="button">פנוי בקבוצה</button></th>
                  <th class="tal"><button class="table__sort table__sort_down" type="button">יום ושעה</button></th>
                  <th class="tal"><button class="table__sort" type="button">סטטוס קבוצה</button></th>
                </tr>
              </thead>
              <tbody>
                <tr data-href="group-dashboard.html">
                  <td class="tar"><label class="checkbox"><input type="checkbox" /><i class="material-icons">check</i></label></td>
                  <td class="tar">עוז</td>
                  <td class="tar">Healthy exercise</td>
                  <td class="tar">2</td>
                  <td class="tar">Sunday 7:00</td>
                  <td class="tar c_green">Active</td>
                </tr>
                <tr data-href="group-dashboard.html">
                  <td class="tar"><label class="checkbox"><input type="checkbox" /><i class="material-icons">check</i></label></td>
                  <td class="tar">גל</td>
                  <td class="tar">Pilates</td>
                  <td class="tar">1</td>
                  <td class="tar">Sunday 8:00</td>
                  <td class="tar c_green">Active</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>