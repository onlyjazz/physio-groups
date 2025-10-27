import type { Db } from './db'

// Check if we're in a browser environment that supports dynamic imports
export const isImportSupported = () => {
  try {
    // Check if we can use dynamic imports
    return typeof window !== 'undefined' && 'File' in window
  } catch {
    return false
  }
}

// Lazy load the import function only when needed
export async function importExcelFileWrapper(
  file: File, 
  db: Db
): Promise<{ success: boolean; message: string; importedCount?: number }> {
  try {
    // Dynamically import the Excel import module only when the function is called
    const { importExcelFile } = await import('./excelImport')
    return await importExcelFile(file, db)
  } catch (error) {
    console.error('Failed to load Excel import module:', error)
    return {
      success: false,
      message: 'Excel import is not available in this environment. Please use the desktop version.'
    }
  }
}