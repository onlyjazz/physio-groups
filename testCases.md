# 3-Nov-2025
# Case 1 Run test to understand why Windows is saving JSON with Physio Groups (JSON)
## Issue
Windows fails to save the backup file, showing:

*file:/// can’t open files in this folder because it contains system files*

Removing the description field from the save file picker did not immediately resolve the issue.
Further testing revealed that backup.js was not being rebuilt after edits to backup.ts. The compiled index.html still contained outdated JavaScript.

After deleting backup.js and re-running npm run build, the rebuilt index.html correctly reflected the updated code (verified via grep).

This suggests that the Svelte build pipeline may be using cached .js outputs if they exist.

## Code changes
### Removed description from save file picker
### 
  const canUsePicker =
    typeof (window as any).showSaveFilePicker === 'function' &&
    !window.location.href.startsWith('file:');

  if (canUsePicker) {
    (window as any)
      .showSaveFilePicker({
        suggestedName: filename
      })
## Setup
Windows: use apponfly windows vm
remove description from backup.ts
rm backup.js
npm run build
email groupsapp-without-filetype.html, groupsdata.json to myself 
Store files in Groupapp local folder

# Branch: bug-fix-save-json-remove-metadata 

## Results
### Windows:
- Saves into Downloads folder as Customised Files (*.csv, *.json) 
- Does not show the Physio Groups file type as expected after we removed the description from save file picker
- Does not show file picker on save, saves to Downloads folder
### MacOS:
- MacOs doesn't show file type on save
- Does not show file picker on save, saves to Downloads folder

## Conclusion
Physio Groups Backup Files (.json)* type.
This mismatch likely triggered the Windows security block (“contains system files”).

After removing the description:
- Windows and Mac both skip showing a file type
- Both default to saving into Downloads without error
- However, the file picker no longer appears, which limits UX

## Next Steps
- How can we add a file picker to enable user to save file to the shared folder? 

## Findings
- Single file index.html saves without presenting a file picker
- npm run dev on localhost:5172 shows file picker


# 4-Nov-2025
# Rev 4
# Case 2 Mitigate file type issue
## Issue
Windows may block saving files with a specific file type if the file type is not recognized by the system.
We already know that the MS Exchange server blacklists .json files.

## Code changes
- Removed duplicate alert in Nav and backup.ts. Enabled user to choose .csv or .json file type in Nav.
- Lines 18-21 changed filename and mime type.
 const filename = 'groupsdata.csv';
  const BOM = '\uFEFF';
  const jsonContent = BOM + JSON.stringify(db, null, 2);
  const blob = new Blob([jsonContent], { type: 'text/csv;charset=utf-8' });

## Test Setup
Apponfly Windows: use apponfly windows vm
Clinic Windows: clinic workstation with Talyak login
MacOs:  use local MBP

## Branch: feature-save-json-with-csv-file-extension

## Test protocol
- save and open
- verify file can be opened and properly imported to restore the database
- see if the browser opens a file picker or remembers a non Downloads folder

## Test Results
### Apponfly Windows:
- Single file index.html : Open file picker for restore, doesn't open file picker for save. Always saves to Downloads folder.
- Same behavior in Chrome and Edge

### Clinic Windows:
- Single file index.html : Chrome: Opens file picker for restore and save to shared folder.
- Edge: doesn't open file picker for save

### MacOS:
- Single file index.html : Open file picker for restore, doesn't open file picker for save
- npm run dev on localhost:5172 : Open file picker for restore and save Chrome, doesn't open file picker for save Safari

## Next Steps
- Since the Windows workstation we used for testing in the clinic supports file picker, we should be able to use it to save to the shared folder however there is a potential issue. The Windows workstation doesn't seem to default associate Chrome with HTML files. After you change attributes
to default open HTML files with Chrome, the next day it seems to revert to open with Edge by default

- Make Default association link for the app to open with Chrome in shared folder

"C:\Program Files\Google\Chrome\Application\chrome.exe" --allow-file-access-from-files "\\mrnt9428\Apps$\ClinicShare\phiziodocs\קבוצות מחוץ לסל\groupapp.html"

---

### 💡 Why it works perfectly in the shared folder

* Everyone already has read access to `\\mrnt9428\Apps$\ClinicShare\phiziodocs\קבוצות מחוץ לסל`.
* The shortcut target (UNC path to `groupapp.html`) is the *same* for every workstation.
* So if you drop **`Physiotherapy App (Chrome).lnk`** in that shared folder, everyone can just double-click it — no installation, no drive letter issues.

---

### 🪄 How to set it up once

1. From any Windows machine with Chrome:
   * Right-click on the desktop → **New → Shortcut**
   * In the location field, paste:

     ```
     "C:\Program Files\Google\Chrome\Application\chrome.exe" --allow-file-access-from-files "\\mrnt9428\Apps$\ClinicShare\phiziodocs\קבוצות מחוץ לסל\groupapp.html"
     ```

   * Click **Next**, name it

     ```
     Physiotherapy App (Chrome)
     ```

   * Click **Finish**.

2. Right-click the new shortcut → **Properties → Change Icon** → pick the Chrome icon if you want.

3. Copy that `.lnk` file into the shared folder:

   ```
   \\mrnt9428\Apps$\ClinicShare\phiziodocs\קבוצות מחוץ לסל\
   ```

4. Everyone else can now open the app by double-clicking that shortcut — it’ll always launch in Chrome with `--allow-file-access-from-files`.

---
