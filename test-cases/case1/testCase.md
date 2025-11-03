# 3-Nov-2025
# Case 1 Run test to understand why Windows is saving JSON with Physio Groups (JSON)
## Issue
Windows is failing to save with with the infamous
*file:///can't open files in this folder because it contains system files*

After removing the description field from the save file picker, the issue continued and I determined that the backup.js file was not being updated after the changes to backup.ts and that the single file index.html still contained the old JS code.
I rm'd the backup.js file and ran npm run build to update the file and I confirmed that the single file index.html no longer contains the description by grepping. Seems a bit strange almost as if the npx build uses existing js files if they exist.

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

## Results
Windows:
- Saves into Downloads folder as Customised Files (*.csv, *.json) 
- Does not show the Physio Groups file type as expected after we removed the description from save file picker
- Does not show file picker on save, saves to Downloads folder
MacOS:
- MacOs doesn't show file type on save
- Does not show file picker on save, saves to Downloads folder

## Conclusion
The description field was causing Windows to save the file as Physio Groups Backup Files (*.json)
and presumably the non-MS Office file type was causing Windows to fail on file download with the infamous
*file:///can't open files in this folder because it contains system files*


After removing the description field:
    - Windows doesn't show file type on save, saves to Downloads folder
    - MacOS doesn't show file type on save, saves to Downloads folder

## Next Steps
- How can we add a file picker to enable user to save file to the shared folder 
