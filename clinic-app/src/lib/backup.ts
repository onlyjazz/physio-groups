import { load, save, type Db } from './db'

export async function exportBackup(): Promise<void> {
  const db = load()
  const timestamp = new Date().toISOString().slice(0, 10)
  const filename = `physio-groups-${timestamp}.json`
  
  // Modern browsers with file picker
  if ('showSaveFilePicker' in window) {
    try {
      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [{
          description: 'Physio Groups Backup Files',
          accept: { 'application/json': ['.json'] }
        }]
      })
      
      const writable = await fileHandle.createWritable()
      await writable.write(JSON.stringify(db, null, 2))
      await writable.close()
      
      alert('נתונים נשמרו בהצלחה! המיקום יישמר לפעם הבאה.')
      return
    } catch (err: any) {
      if (err.name === 'AbortError') return // User cancelled
      console.error('File picker failed:', err)
    }
  }
  
  // Fallback: regular download
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
  
  alert(`קובץ הורד לתיקיית Downloads. אנא העבר למיקום הגיבוי הרצוי`)
}

export function importBackup(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString)
    
    // Validate data structure
    if (data.therapists && data.patients && data.groups && data.statuses) {
      // Additional validation
      if (Array.isArray(data.therapists) && 
          Array.isArray(data.patients) && 
          Array.isArray(data.groups) &&
          Array.isArray(data.statuses)) {
        
        localStorage.setItem('phizio-db-v1', jsonString)
        return true
      }
    }
    return false
  } catch {
    return false
  }
}
