import { load, save } from './db';
const AUTO_BACKUP_KEY = 'phizio-auto-backup';
const LAST_BACKUP_TIME_KEY = 'phizio-last-backup-time';
/**
 * Create an automatic backup in localStorage
 */
export function createAutoBackup(db) {
    try {
        const backup = {
            timestamp: new Date().toISOString(),
            data: db
        };
        localStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify(backup));
        localStorage.setItem(LAST_BACKUP_TIME_KEY, backup.timestamp);
    }
    catch (e) {
        console.error('Failed to create auto backup:', e);
    }
}
/**
 * Restore from auto backup if available
 */
export function restoreFromAutoBackup() {
    try {
        const backupStr = localStorage.getItem(AUTO_BACKUP_KEY);
        if (!backupStr)
            return null;
        const backup = JSON.parse(backupStr);
        if (validateDb(backup.data)) {
            return backup.data;
        }
    }
    catch (e) {
        console.error('Failed to restore from auto backup:', e);
    }
    return null;
}
/**
 * Validate database structure
 */
export function validateDb(db) {
    if (!db)
        return false;
    // Check required top-level fields
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
    // Validate statuses exist
    if (db.statuses.length < 2) {
        console.error('Database must have at least 2 statuses (active/inactive)');
        return false;
    }
    // Validate patient structure
    for (const patient of db.patients) {
        if (!patient.id || !patient.firstName || !patient.lastName) {
            console.error('Invalid patient structure:', patient);
            return false;
        }
    }
    return true;
}
export async function exportBackup() {
    const db = load();
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `physio-groups-${timestamp}.json`;
    // Modern browsers with file picker
    if ('showSaveFilePicker' in window) {
        try {
            const fileHandle = await window.showSaveFilePicker({
                suggestedName: filename,
                types: [{
                        description: 'Physio Groups Backup Files',
                        accept: { 'application/json': ['.json'] }
                    }]
            });
            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(db, null, 2));
            await writable.close();
            alert('נתונים נשמרו בהצלחה! המיקום יישמר לפעם הבאה.');
            return;
        }
        catch (err) {
            if (err.name === 'AbortError')
                return; // User cancelled
            console.error('File picker failed:', err);
        }
    }
    // Fallback: regular download
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    alert(`קובץ הורד לתיקיית Downloads. אנא העבר למיקום הגיבוי הרצוי`);
}
export function importBackup(jsonString) {
    try {
        // Parse to validate it's valid JSON
        const data = JSON.parse(jsonString);
        // Basic validation - just ensure it has the expected structure
        if (!data.statuses || !data.therapists || !data.patients || !data.groups) {
            return false;
        }
        // Store exactly what was in the backup - no modifications
        localStorage.setItem('phizio-db-v1', jsonString);
        return true;
    }
    catch (error) {
        console.error('Import backup error:', error);
        return false;
    }
}
//# sourceMappingURL=backup.js.map