const DB_NAME = 'kids_tracker_photos'
const DB_VERSION = 1
const STORE_NAME = 'medication_photos'

const openDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error ?? new Error('Failed to open photo database'))
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

export const saveMedicationPhoto = async (id: string, dataUrl: string): Promise<void> => {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.put(dataUrl, id)

    request.onerror = () => reject(request.error ?? new Error('Failed to save photo'))
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('Failed to save photo'))
  })
}

export const getMedicationPhoto = async (id: string): Promise<string | null> => {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(id)

    request.onerror = () => reject(request.error ?? new Error('Failed to load photo'))
    request.onsuccess = () => resolve((request.result as string | undefined) ?? null)
  })
}

export const deleteMedicationPhoto = async (id: string): Promise<void> => {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onerror = () => reject(request.error ?? new Error('Failed to delete photo'))
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('Failed to delete photo'))
  })
}

export const getAllMedicationPhotos = async (): Promise<Record<string, string>> => {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()
    const keysRequest = store.getAllKeys()

    Promise.all([
      new Promise<unknown[]>((res, rej) => {
        request.onsuccess = () => res(request.result)
        request.onerror = () => rej(request.error)
      }),
      new Promise<IDBValidKey[]>((res, rej) => {
        keysRequest.onsuccess = () => res(keysRequest.result)
        keysRequest.onerror = () => rej(keysRequest.error)
      })
    ])
      .then(([values, keys]) => {
        const photos: Record<string, string> = {}
        keys.forEach((key, index) => {
          photos[String(key)] = values[index] as string
        })
        resolve(photos)
      })
      .catch(reject)
  })
}

export const clearAllMedicationPhotos = async (): Promise<void> => {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.clear()

    request.onerror = () => reject(request.error ?? new Error('Failed to clear photos'))
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('Failed to clear photos'))
  })
}

export const restoreMedicationPhotos = async (photos: Record<string, string>): Promise<void> => {
  await clearAllMedicationPhotos()
  await Promise.all(Object.entries(photos).map(([id, dataUrl]) => saveMedicationPhoto(id, dataUrl)))
}

export const createPhotoId = (): string => `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
