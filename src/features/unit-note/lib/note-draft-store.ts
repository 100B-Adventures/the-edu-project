const DB_NAME = 'odokgong-note-drafts';
const STORE_NAME = 'drafts';

export const saveNoteDraft = (key: string, handwriting: string) =>
  new Promise<void>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const transaction = request.result.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(handwriting, key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
  });
