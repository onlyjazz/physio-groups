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