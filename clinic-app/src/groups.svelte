<!-- ============================================================= -->
<!-- Groups.svelte                                                -->
<!-- ============================================================= -->
    <div class="page-title">
      <a href="group-editor" class="button button_green">צור קבוצה חדשה</a>
    </div>
  
    <div class="grid-row">
      <!-- Filters column -->
      <div class="grid-col grid-col_6">
        <div class="filters card">
          <div class="heading heading_3">חפש</div>
          <div class="input">
            <input type="text" class="input__text" id="groupName" />
            <label for="groupName" class="input__label">לפי שם קבוצה</label>
          </div>
          <div class="input input_select">
            <select id="groupStatus" class="input__text input__text_changed">
              <option selected>כל</option>
              <option>פעיל</option>
              <option>סגור</option>
            </select>
            <label for="groupStatus" class="input__label">סטטוס קבוצה</label>
          </div>
          <div class="input input_select">
            <select id="groupType" class="input__text input__text_changed">
              <option selected>All</option>
              <option>Pilates</option>
              <option>Old people</option>
              <option>NIA</option>
              <option>Healthy stretching</option>
            </select>
            <label for="groupType" class="input__label">סוג קבוצה</label>
          </div>
          <button type="submit" class="button button_blocked button_flat">שלח</button>
        </div>
      </div>
  
      <!-- Groups table column -->
      <div class="grid-col grid-col_18">
        <div class="groups card">
          <div class="grid-row">
            <div class="grid-col grid-col_12">
              <div class="heading heading_3">קבוצות</div>
            </div>
            <div class="grid-col grid-col_12 tar">
              <div class="button button_s button_flat">
                פעולות<i class="material-icons">keyboard_arrow_down</i>
                <select class="input__text input__text_changed">
                  <option></option>
                  <option>רשום מטופל לקבוצה</option>
                  <option>הסר מטופל מקבוצה</option>
                </select>
              </div>
            </div>
          </div>
  
          <div class="table">
            <table>
              <thead>
                <tr>
                <th class="tal">
                   <label class="checkbox"><input type="checkbox" /><i class="material-icons">check</i></label>
                </th>
                <th data-id="group-name" class="tal"><button class="table__sort" type="button">קבוצה</button></th>
                <th data-id="group-type" class="tar"><button class="table__sort" type="button">סוג קבוצה</button></th>
                <th data-id="group-availability" class="tal"><button class="table__sort" type="button">פנוי</button></th>
                <th data-id="group-therapist" class="tal"><button class="table__sort" type="button">מטפל/ת</button></th>
                <th data-id="group-time" class="tal"><button class="table__sort table__sort_down" type="button">יום ושעה</button></th>
                <th data-id="group-status" class="tal"><button class="table__sort" type="button">סטטוס</button></th>
              </tr>
              </thead>
              <tbody>
              <!-- Static demo rows -->
              <tr data-href="group-dashboard">
                <td class="tar"><label class="checkbox"><input type="checkbox" /><i class="material-icons">check</i></label></td>
                <td class="tar">Healthy exercise</td>
                <td class="tar">Stretching</td>
                <td class="tar">2</td>
                <td class="tar">Ronit</td>
                <td class="tar">Sunday 7:00</td>
                <td class="tar c_green">Active</td>
              </tr>
              <tr data-href="group-dashboard.html">
                <td class="tar"><label class="checkbox"><input type="checkbox" /><i class="material-icons">check</i></label></td>
                <td class="tar">Pilates</td>
                <td class="tar">Pilates</td>
                <td class="tar">1</td>
                <td class="tar">Gal</td>
                <td class="tar">Sunday 8:00</td>
                <td class="tar c_green">Active</td>
              </tr>
              <!-- add more as needed -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>