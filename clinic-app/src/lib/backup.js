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
    // Get database directly from localStorage to avoid circular dependency
    const dbStr = localStorage.getItem('phizio-db-v1');
    if (!dbStr) {
        alert('אין נתונים לגיבוי');
        return;
    }
    const db = JSON.parse(dbStr);
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
            alert('שמור');
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
    alert('שמור');
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