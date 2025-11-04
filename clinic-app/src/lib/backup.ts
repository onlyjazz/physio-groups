import type { Db } from './db';

export function exportBackup(): void {
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

  const filename = 'groupsdata.csv';
  
  const BOM = '\uFEFF';
  const jsonContent = BOM + JSON.stringify(db, null, 2);
  const blob = new Blob([jsonContent], { type: 'text/csv;charset=utf-8' });

  const canUsePicker =
    typeof (window as any).showSaveFilePicker === 'function' &&
    !window.location.href.startsWith('file:');

  if (canUsePicker) {
    (window as any)
      .showSaveFilePicker({
        suggestedName: filename
      })
      .then((fileHandle: any) => fileHandle.createWritable())
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
    link.download = filename;
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
