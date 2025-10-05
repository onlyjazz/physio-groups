const KEY = 'phizio-db-v1';
function uid() { return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2); }
export function load() {
    const raw = localStorage.getItem(KEY);
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            // Handle migration: add attendance array if missing
            if (!parsed.attendance) {
                parsed.attendance = [];
            }
            // Handle migration: add patientPayments array if missing
            if (!parsed.patientPayments) {
                parsed.patientPayments = [];
            }
            // Handle migration: add enrolled field to existing patientsInGroups
            if (parsed.patientsInGroups) {
                parsed.patientsInGroups = parsed.patientsInGroups.map((pig) => {
                    if (pig.enrolled === undefined) {
                        return { ...pig, enrolled: 1 }; // Assume existing patients are enrolled
                    }
                    return pig;
                });
            }
            // Handle migration: add isMakeup field to existing attendance records
            if (parsed.attendance) {
                parsed.attendance = parsed.attendance.map((att) => {
                    if (att.isMakeup === undefined) {
                        return { ...att, isMakeup: false }; // Assume existing attendance is not makeup
                    }
                    return att;
                });
            }
            // Recalculate available spots for all groups to ensure consistency
            if (parsed.groups && parsed.patientsInGroups) {
                parsed.groups.forEach((group) => {
                    const enrolledCount = parsed.patientsInGroups.filter((x) => x.groupId === group.id && x.enrolled === 1).length;
                    group.available = group.capacity - enrolledCount;
                });
            }
            return parsed;
        }
        catch (e) {
            console.error('Failed to parse database, checking for auto-backup:', e);
            // Try to restore from auto-backup
            const autoBackupStr = localStorage.getItem('phizio-auto-backup');
            if (autoBackupStr) {
                try {
                    const backup = JSON.parse(autoBackupStr);
                    console.log('Restoring from auto-backup created at:', backup.timestamp);
                    localStorage.setItem(KEY, JSON.stringify(backup.data));
                    return backup.data;
                }
                catch (backupError) {
                    console.error('Auto-backup also failed:', backupError);
                }
            }
        }
    }
    // seed
    const now = Date.now();
    const active = { id: uid(), code: 'active' };
    const inactive = { id: uid(), code: 'inactive' };
    const seed = {
        statuses: [active, inactive],
        therapists: [],
        patients: [],
        groups: [],
        patientsInGroups: [],
        therapistsInGroups: [],
        attendance: [],
        patientPayments: []
    };
    localStorage.setItem(KEY, JSON.stringify(seed));
    return seed;
}
export function save(db) {
    // Create auto-backup before saving
    const currentData = localStorage.getItem(KEY);
    if (currentData) {
        try {
            localStorage.setItem('phizio-auto-backup', JSON.stringify({
                timestamp: new Date().toISOString(),
                data: JSON.parse(currentData)
            }));
        }
        catch (e) {
            console.error('Failed to create auto-backup:', e);
        }
    }
    // Save the new data
    localStorage.setItem(KEY, JSON.stringify(db));
}
export function findStatusId(db, code) {
    return db.statuses.find(s => s.code === code).id;
}
/* CRUD helpers */
export const api = {
    addTherapist(db, name) {
        const now = Date.now();
        db.therapists.push({ id: uid(), name, createdAt: now, updatedAt: now, statusId: findStatusId(db, 'active') });
        save(db);
    },
    updateTherapist(db, id, patch) {
        const t = db.therapists.find(x => x.id === id);
        if (!t)
            return;
        Object.assign(t, patch, { updatedAt: Date.now() });
        save(db);
    },
    removeTherapist(db, id) {
        db.therapists = db.therapists.filter(t => t.id !== id);
        db.therapistsInGroups = db.therapistsInGroups.filter(x => x.therapistId !== id);
        save(db);
    },
    addPatient(db, p) {
        const now = Date.now();
        db.patients.push({ id: uid(), ...p, createdAt: now, updatedAt: now, statusId: findStatusId(db, 'active') });
        save(db);
    },
    updatePatient(db, id, patch) {
        const x = db.patients.find(x => x.id === id);
        if (!x)
            return;
        Object.assign(x, patch, { updatedAt: Date.now() });
        save(db);
    },
    removePatient(db, id) {
        db.patients = db.patients.filter(x => x.id !== id);
        db.patientsInGroups = db.patientsInGroups.filter(x => x.patientId !== id);
        db.attendance = db.attendance.filter(x => x.patientId !== id);
        save(db);
    },
    addGroup(db, name, capacity = 15, available = 15, when = 'open') {
        const now = Date.now();
        db.groups.push({ id: uid(), name, capacity, available, when, createdAt: now, updatedAt: now });
        save(db);
    },
    updateGroup(db, id, patch) {
        const g = db.groups.find(g => g.id === id);
        if (!g)
            return;
        Object.assign(g, patch, { updatedAt: Date.now() });
        save(db);
    },
    removeGroup(db, id) {
        db.groups = db.groups.filter(g => g.id !== id);
        db.patientsInGroups = db.patientsInGroups.filter(x => x.groupId !== id);
        db.therapistsInGroups = db.therapistsInGroups.filter(x => x.groupId !== id);
        db.attendance = db.attendance.filter(x => x.groupId !== id);
        save(db);
    },
    setTherapistForGroup(db, groupId, therapistId) {
        // one therapist per group; ensure at most one row
        db.therapistsInGroups = db.therapistsInGroups.filter(x => x.groupId !== groupId);
        db.therapistsInGroups.push({ id: uid(), therapistId, groupId, createdAt: Date.now(), updatedAt: Date.now(), statusId: findStatusId(db, 'active') });
        save(db);
    },
    addPatientToGroup(db, groupId, patientId, receipt) {
        if (db.patientsInGroups.some(x => x.groupId === groupId && x.patientId === patientId))
            return;
        // Check current enrollment count (only enrolled patients, not waitlisted)
        const group = db.groups.find(g => g.id === groupId);
        if (!group)
            return;
        // Use active subscription-based availability for consistency
        // This matches what the UI shows to users
        const availableSpots = api.getAvailableWithActiveSubscriptions(db, groupId);
        const hasAvailability = availableSpots > 0;
        // Set enrolled to 1 if there's availability, 0 for waitlist
        const enrolled = hasAvailability ? 1 : 0;
        db.patientsInGroups.push({
            id: uid(),
            patientId,
            groupId,
            receipt,
            enrolled,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            statusId: findStatusId(db, 'active')
        });
        // Update available count if patient is enrolled (not waitlisted)
        if (enrolled === 1) {
            // Recalculate based on the new enrollment count after adding the patient
            const newEnrolledCount = db.patientsInGroups.filter(x => x.groupId === groupId && x.enrolled === 1).length;
            group.available = group.capacity - newEnrolledCount;
            group.updatedAt = Date.now();
        }
        save(db);
    },
    removePatientFromGroup(db, groupId, patientId) {
        const patientInGroup = db.patientsInGroups.find(x => x.groupId === groupId && x.patientId === patientId);
        const wasEnrolled = patientInGroup?.enrolled === 1;
        db.patientsInGroups = db.patientsInGroups.filter(x => !(x.groupId === groupId && x.patientId === patientId));
        // If an enrolled patient is removed, check if we should move someone from waitlist
        if (wasEnrolled) {
            const group = db.groups.find(g => g.id === groupId);
            if (group) {
                // Find oldest waitlisted patient
                const waitlisted = db.patientsInGroups
                    .filter(x => x.groupId === groupId && x.enrolled === 0)
                    .sort((a, b) => a.createdAt - b.createdAt)[0];
                if (waitlisted) {
                    // Move from waitlist to enrolled
                    waitlisted.enrolled = 1;
                    waitlisted.updatedAt = Date.now();
                }
                else {
                    // No one on waitlist, update available count
                    const enrolledCount = db.patientsInGroups.filter(x => x.groupId === groupId && x.enrolled === 1).length;
                    group.available = group.capacity - enrolledCount;
                    group.updatedAt = Date.now();
                }
            }
        }
        save(db);
    },
    updatePatientReceipt(db, groupId, patientId, receipt) {
        const patientInGroup = db.patientsInGroups.find(x => x.groupId === groupId && x.patientId === patientId);
        if (!patientInGroup)
            return;
        patientInGroup.receipt = receipt;
        patientInGroup.updatedAt = Date.now();
        save(db);
    },
    // Attendance operations
    markAttendance(db, groupId, patientId, therapistId, date, isMakeup = false) {
        // Check if attendance already exists for this patient, group, and date
        const existing = db.attendance.find(a => a.groupId === groupId && a.patientId === patientId && a.date === date);
        if (existing) {
            // Update the therapist and makeup flag if attendance already exists
            existing.therapistId = therapistId;
            existing.isMakeup = isMakeup;
            save(db);
            return;
        }
        db.attendance.push({
            id: uid(),
            patientId,
            groupId,
            therapistId,
            date,
            isMakeup,
            createdAt: Date.now()
        });
        save(db);
    },
    unmarkAttendance(db, groupId, patientId, date) {
        db.attendance = db.attendance.filter(a => !(a.groupId === groupId && a.patientId === patientId && a.date === date));
        save(db);
    },
    getAttendanceForGroupAndDate(db, groupId, date) {
        return new Set(db.attendance
            .filter(a => a.groupId === groupId && a.date === date)
            .map(a => a.patientId));
    },
    // Payment operations
    addPayment(db, payment) {
        const now = Date.now();
        db.patientPayments.push({
            id: uid(),
            ...payment,
            createdAt: now,
            updatedAt: now
        });
        save(db);
    },
    updatePayment(db, id, patch) {
        const payment = db.patientPayments.find(p => p.id === id);
        if (!payment)
            return;
        Object.assign(payment, patch, { updatedAt: Date.now() });
        save(db);
    },
    deletePayment(db, id) {
        db.patientPayments = db.patientPayments.filter(p => p.id !== id);
        save(db);
    },
    getPaymentsByPatient(db, patientId) {
        return db.patientPayments
            .filter(p => p.patientId === patientId)
            .sort((a, b) => b.createdAt - a.createdAt);
    },
    getPaymentsByGroup(db, groupId) {
        return db.patientPayments
            .filter(p => p.groupId === groupId)
            .sort((a, b) => b.createdAt - a.createdAt);
    },
    // Recalculate available spots for all groups
    recalculateAvailableSpots(db) {
        db.groups.forEach(group => {
            const enrolledCount = db.patientsInGroups.filter(x => x.groupId === group.id && x.enrolled === 1).length;
            group.available = group.capacity - enrolledCount;
            group.updatedAt = Date.now();
        });
        save(db);
    },
    // Check if a patient has an active subscription for a group in the current month
    hasActiveSubscription(db, patientId, groupId) {
        const now = new Date();
        const currentMonth = now.getMonth() + 1; // 1-12
        const currentYear = now.getFullYear();
        // Find payments for this patient and group
        const payments = db.patientPayments.filter(p => p.patientId === patientId && p.groupId === groupId);
        // Check if any payment covers the current month
        return payments.some(payment => {
            // Parse fromMonth (MM/YYYY)
            const [fromMonthStr, fromYearStr] = payment.fromMonth.split('/');
            const fromMonth = parseInt(fromMonthStr);
            const fromYear = parseInt(fromYearStr);
            // Parse toMonth (MM/YYYY)
            const [toMonthStr, toYearStr] = payment.toMonth.split('/');
            const toMonth = parseInt(toMonthStr);
            const toYear = parseInt(toYearStr);
            // Check if current date falls within the payment period
            const currentDate = currentYear * 12 + currentMonth;
            const fromDate = fromYear * 12 + fromMonth;
            const toDate = toYear * 12 + toMonth;
            return fromDate <= currentDate && currentDate <= toDate;
        });
    },
    // Get count of patients with active subscriptions for a group
    getActiveSubscriptionCount(db, groupId) {
        // Get all enrolled patients in the group
        const enrolledPatients = db.patientsInGroups.filter(pig => pig.groupId === groupId && pig.enrolled === 1);
        // Count those with active subscriptions
        return enrolledPatients.filter(pig => api.hasActiveSubscription(db, pig.patientId, groupId)).length;
    },
    // Get available spots considering only active subscriptions
    getAvailableWithActiveSubscriptions(db, groupId) {
        const group = db.groups.find(g => g.id === groupId);
        if (!group)
            return 0;
        const activeCount = api.getActiveSubscriptionCount(db, groupId);
        // Don't subtract waitlist count - waitlisted patients are not taking up capacity!
        // They're waiting for spots to become available
        return group.capacity - activeCount;
    },
    // Get patients with active subscriptions in a group
    getPatientsWithActiveSubscriptions(db, groupId) {
        return db.patientsInGroups.filter(pig => pig.groupId === groupId &&
            pig.enrolled === 1 &&
            api.hasActiveSubscription(db, pig.patientId, groupId));
    }
};
//# sourceMappingURL=db.js.map