export type ID = string

export interface Status { id: ID; code: 'active'|'inactive' }
export interface Therapist { id: ID; name: string; createdAt: number; updatedAt: number; statusId: ID }
export interface Patient { id: ID; nationalId: string; phone: string; firstName: string; lastName: string; createdAt: number; updatedAt: number; statusId: ID }
export interface Group { id: ID; name: string; capacity: number; available: number; when: string; createdAt: number; updatedAt: number }
export interface PatientsInGroups { id: ID; patientId: ID; groupId: ID; receipt?: string; enrolled: number; createdAt: number; updatedAt: number; statusId: ID }
export interface TherapistsInGroups { id: ID; therapistId: ID; groupId: ID; createdAt: number; updatedAt: number; statusId: ID }
export interface Attendance { id: ID; patientId: ID; groupId: ID; therapistId: ID; date: string; createdAt: number }

export interface Db {
  statuses: Status[]
  therapists: Therapist[]
  patients: Patient[]
  groups: Group[]
  patientsInGroups: PatientsInGroups[]
  therapistsInGroups: TherapistsInGroups[]
  attendance: Attendance[]
}

const KEY = 'phizio-db-v1'

function uid() { return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) }

export function load(): Db {
  const raw = localStorage.getItem(KEY)
  if (raw) {
    const parsed = JSON.parse(raw)
    // Handle migration: add attendance array if missing
    if (!parsed.attendance) {
      parsed.attendance = []
    }
    // Handle migration: add enrolled field to existing patientsInGroups
    if (parsed.patientsInGroups) {
      parsed.patientsInGroups = parsed.patientsInGroups.map((pig: any) => {
        if (pig.enrolled === undefined) {
          return { ...pig, enrolled: 1 } // Assume existing patients are enrolled
        }
        return pig
      })
    }
    return parsed
  }
  // seed
  const now = Date.now()
  const active: Status = { id: uid(), code: 'active' }
  const inactive: Status = { id: uid(), code: 'inactive' }
  const seed: Db = {
    statuses: [active, inactive],
    therapists: [],
    patients: [],
    groups: [],
    patientsInGroups: [],
    therapistsInGroups: [],
    attendance: []
  }
  localStorage.setItem(KEY, JSON.stringify(seed))
  return seed
}

export function save(db: Db) {
  localStorage.setItem(KEY, JSON.stringify(db))
}

export function findStatusId(db: Db, code: 'active'|'inactive') {
  return db.statuses.find(s => s.code === code)!.id
}

/* CRUD helpers */
export const api = {
  addTherapist(db: Db, name: string) {
    const now = Date.now()
    db.therapists.push({ id: uid(), name, createdAt: now, updatedAt: now, statusId: findStatusId(db, 'active') })
    save(db)
  },
  updateTherapist(db: Db, id: ID, patch: Partial<Omit<Therapist,'id'>>) {
    const t = db.therapists.find(x => x.id === id); if (!t) return
    Object.assign(t, patch, { updatedAt: Date.now() }); save(db)
  },
  removeTherapist(db: Db, id: ID) {
    db.therapists = db.therapists.filter(t => t.id !== id)
    db.therapistsInGroups = db.therapistsInGroups.filter(x => x.therapistId !== id)
    save(db)
  },

  addPatient(db: Db, p: Omit<Patient,'id'|'createdAt'|'updatedAt'|'statusId'>) {
    const now = Date.now()
    db.patients.push({ id: uid(), ...p, createdAt: now, updatedAt: now, statusId: findStatusId(db, 'active') })
    save(db)
  },
  updatePatient(db: Db, id: ID, patch: Partial<Omit<Patient,'id'>>) {
    const x = db.patients.find(x => x.id === id); if (!x) return
    Object.assign(x, patch, { updatedAt: Date.now() }); save(db)
  },
  removePatient(db: Db, id: ID) {
    db.patients = db.patients.filter(x => x.id !== id)
    db.patientsInGroups = db.patientsInGroups.filter(x => x.patientId !== id)
    db.attendance = db.attendance.filter(x => x.patientId !== id)
    save(db)
  },

  addGroup(db: Db, name: string, capacity: number = 15, available: number = 15, when: string = 'open') {
    const now = Date.now()
    db.groups.push({ id: uid(), name, capacity, available, when, createdAt: now, updatedAt: now })
    save(db)
  },
  updateGroup(db: Db, id: ID, patch: Partial<Omit<Group,'id'>>) {
    const g = db.groups.find(g => g.id === id); if (!g) return
    Object.assign(g, patch, { updatedAt: Date.now() }); save(db)
  },
  removeGroup(db: Db, id: ID) {
    db.groups = db.groups.filter(g => g.id !== id)
    db.patientsInGroups = db.patientsInGroups.filter(x => x.groupId !== id)
    db.therapistsInGroups = db.therapistsInGroups.filter(x => x.groupId !== id)
    db.attendance = db.attendance.filter(x => x.groupId !== id)
    save(db)
  },

  setTherapistForGroup(db: Db, groupId: ID, therapistId: ID) {
    // one therapist per group; ensure at most one row
    db.therapistsInGroups = db.therapistsInGroups.filter(x => x.groupId !== groupId)
    db.therapistsInGroups.push({ id: uid(), therapistId, groupId, createdAt: Date.now(), updatedAt: Date.now(), statusId: findStatusId(db, 'active') })
    save(db)
  },
  addPatientToGroup(db: Db, groupId: ID, patientId: ID, receipt?: string) {
    if (db.patientsInGroups.some(x => x.groupId === groupId && x.patientId === patientId)) return
    
    // Check current enrollment count (only enrolled patients, not waitlisted)
    const group = db.groups.find(g => g.id === groupId)
    if (!group) return
    
    const enrolledCount = db.patientsInGroups.filter(x => x.groupId === groupId && x.enrolled === 1).length
    const hasAvailability = enrolledCount < group.capacity
    
    // Set enrolled to 1 if there's availability, 0 for waitlist
    const enrolled = hasAvailability ? 1 : 0
    
    db.patientsInGroups.push({ 
      id: uid(), 
      patientId, 
      groupId, 
      receipt, 
      enrolled,
      createdAt: Date.now(), 
      updatedAt: Date.now(), 
      statusId: findStatusId(db, 'active') 
    })
    
    // Update available count if patient is enrolled (not waitlisted)
    if (enrolled === 1) {
      const newAvailable = group.capacity - (enrolledCount + 1)
      group.available = newAvailable
      group.updatedAt = Date.now()
    }
    
    save(db)
  },
  removePatientFromGroup(db: Db, groupId: ID, patientId: ID) {
    const patientInGroup = db.patientsInGroups.find(x => x.groupId === groupId && x.patientId === patientId)
    const wasEnrolled = patientInGroup?.enrolled === 1
    
    db.patientsInGroups = db.patientsInGroups.filter(x => !(x.groupId === groupId && x.patientId === patientId))
    
    // If an enrolled patient is removed, check if we should move someone from waitlist
    if (wasEnrolled) {
      const group = db.groups.find(g => g.id === groupId)
      if (group) {
        // Find oldest waitlisted patient
        const waitlisted = db.patientsInGroups
          .filter(x => x.groupId === groupId && x.enrolled === 0)
          .sort((a, b) => a.createdAt - b.createdAt)[0]
        
        if (waitlisted) {
          // Move from waitlist to enrolled
          waitlisted.enrolled = 1
          waitlisted.updatedAt = Date.now()
        } else {
          // No one on waitlist, update available count
          const enrolledCount = db.patientsInGroups.filter(x => x.groupId === groupId && x.enrolled === 1).length
          group.available = group.capacity - enrolledCount
          group.updatedAt = Date.now()
        }
      }
    }
    
    save(db)
  },
  updatePatientReceipt(db: Db, groupId: ID, patientId: ID, receipt: string) {
    const patientInGroup = db.patientsInGroups.find(x => x.groupId === groupId && x.patientId === patientId)
    if (!patientInGroup) return
    patientInGroup.receipt = receipt
    patientInGroup.updatedAt = Date.now()
    save(db)
  },

  // Attendance operations
  markAttendance(db: Db, groupId: ID, patientId: ID, therapistId: ID, date: string) {
    // Check if attendance already exists for this patient, group, and date
    const existing = db.attendance.find(a => 
      a.groupId === groupId && a.patientId === patientId && a.date === date
    )
    if (existing) {
      // Update the therapist if attendance already exists
      existing.therapistId = therapistId
      save(db)
      return
    }
    
    db.attendance.push({
      id: uid(),
      patientId,
      groupId,
      therapistId,
      date,
      createdAt: Date.now()
    })
    save(db)
  },
  
  unmarkAttendance(db: Db, groupId: ID, patientId: ID, date: string) {
    db.attendance = db.attendance.filter(a => 
      !(a.groupId === groupId && a.patientId === patientId && a.date === date)
    )
    save(db)
  },
  
  getAttendanceForGroupAndDate(db: Db, groupId: ID, date: string): Set<ID> {
    return new Set(
      db.attendance
        .filter(a => a.groupId === groupId && a.date === date)
        .map(a => a.patientId)
    )
  }
}

