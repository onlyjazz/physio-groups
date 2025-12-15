import type { Db } from './db';
import { getLastBackupHandle, saveLastBackupHandle } from './idb';

export async function exportBackup(): Promise<void> {
  const dbStr = localStorage.getItem('phizio-db-v1');
  if (!dbStr) {
    alert('אין נתונים לגיבוי');
    return;
  }

  let db: Db;
  try {
    db = JSON.parse(dbStr);
  } catch {
    alert('שגיאה בקריאת הנתונים מהדפדפן');
    return;
  }

  const defaultFilename = 'groupsdata.csv';
  const LAST_BACKUP_NAME_KEY = 'backup.lastSuggestedName';
  const pickerId = 'physio-backup-save';
  const lastSuggestedName = localStorage.getItem(LAST_BACKUP_NAME_KEY) || defaultFilename;
  
  const BOM = '\uFEFF';
  const jsonContent = BOM + JSON.stringify(db, null, 2);
  const blob = new Blob([jsonContent], { type: 'text/csv;charset=utf-8' });
/*
  let canUsePicker =
    typeof (window as any).showSaveFilePicker === 'function' &&
    !window.location.href.startsWith('file:');
*/
  let canUsePicker = true;
console.log('canUsePicker', canUsePicker);
console.log('window.location.href', window.location.href);
console.log('window.location.href.startsWith("file:")', window.location.href.startsWith('file:'));
console.log('window.location.href.startsWith("http:")', window.location.href.startsWith('http:'));
   if (canUsePicker) {
    // Try to restore last handle (directory/file) from IndexedDB to seed picker location
    let startIn: any = undefined;
    let suggestedName = lastSuggestedName;
    try {
      const lastHandle = await getLastBackupHandle();
      if (lastHandle) {
        // Use previous file's directory (browsers typically interpret startIn=fileHandle as its parent directory)
        startIn = lastHandle;
        suggestedName = (lastHandle as any).name || suggestedName;
      }
    } catch {}

    (window as any)
      .showSaveFilePicker({
        suggestedName,
        id: pickerId,
        ...(startIn ? { startIn } : {})
      })
      .then(async (fileHandle: any) => {
        try {
          // Persist handle for next time (Chromium browsers)
          await saveLastBackupHandle(fileHandle);
          localStorage.setItem(LAST_BACKUP_NAME_KEY, fileHandle?.name || suggestedName);
        } catch {}
        return fileHandle.createWritable();
      })
      .then((writable: any) => { writable.write(jsonContent); return writable; })
      .then((writable: any) => writable.close())
      .then(() => alert('שמור'))
      .catch((err: any) => {
        if (err.name !== 'AbortError') console.error('File picker failed:', err);
      });
  } else {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = lastSuggestedName;
    try { localStorage.setItem(LAST_BACKUP_NAME_KEY, lastSuggestedName); } catch {}
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('שמור');
  }
}

/**
 * Import database backup from JSON string
 */
export function importBackup(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (!validateDb(data)) {
      alert('קובץ גיבוי לא תקין');
      return false;
    }

    localStorage.setItem('phizio-db-v1', jsonString);
    return true;
  } catch (error) {
    console.error('Import backup error:', error);
    alert('שגיאה בקריאת קובץ הגיבוי');
    return false;
  }
}

/**
 * Validate database structure
 */
export function validateDb(db: any): boolean {
  if (!db) return false;

  const requiredFields = [
    'statuses', 'therapists', 'patients', 'groups',
    'patientsInGroups', 'therapistsInGroups', 'attendance', 'patientPayments'
  ];

  for (const field of requiredFields) {
    if (!Array.isArray(db[field])) {
      console.error(`Missing or invalid field: ${field}`);
      return false;
    }
  }

  if (db.statuses.length < 2) {
    console.error('Database must have at least 2 statuses (active/inactive)');
    return false;
  }

  for (const patient of db.patients) {
    if (!patient.id || !patient.firstName || !patient.lastName) {
      console.error('Invalid patient structure:', patient);
      return false;
    }
  }

  return true;
}
