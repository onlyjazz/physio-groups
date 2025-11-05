// Lightweight IndexedDB helpers for storing persistent app data (e.g., file handles)

const DB_NAME = 'physio-app';
const DB_VERSION = 1;
const STORE_NAME = 'kv';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T = any>(key: IDBValidKey): Promise<T | undefined> {
  const db = await openDB();
  return new Promise<T | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(key);
    getReq.onsuccess = () => resolve(getReq.result as T | undefined);
    getReq.onerror = () => reject(getReq.error);
  });
}

async function idbSet(key: IDBValidKey, value: any): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const putReq = store.put(value, key);
    putReq.onsuccess = () => resolve();
    putReq.onerror = () => reject(putReq.error);
  });
}

const LAST_BACKUP_HANDLE_KEY = 'backup.lastHandle';

export async function saveLastBackupHandle(handle: FileSystemFileHandle): Promise<void> {
  // FileSystemFileHandle is structured-cloneable in browsers that support the File System Access API
  await idbSet(LAST_BACKUP_HANDLE_KEY, handle);
}

export async function getLastBackupHandle(): Promise<FileSystemFileHandle | undefined> {
  return idbGet<FileSystemFileHandle>(LAST_BACKUP_HANDLE_KEY);
}
