const dbName = 'objectsStore'

const openDb = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = self.indexedDB.open('Db', 1);
    request.onerror = (event) => {
      reject('IndexedDB error: ' + request.error);
    };
    request.onsuccess = (event) => {
      resolve(request.result);
    };
    request.onupgradeneeded = (event) => {
      const db = request.result;
      db.createObjectStore(dbName, { keyPath: 'id' });
    };
  });
};

const dbPromise = openDb();

self.addEventListener('message', async (event) => {
  const db = await dbPromise;
  const { type, id, content } = event.data;
  const tx = db.transaction(dbName, type === 'get' ? 'readonly' : 'readwrite');
  const store = tx.objectStore(dbName);

  if (type === 'get') {
    const request = store.get(id);
    request.onsuccess = () => {
      self.postMessage(request.result);
    };
    request.onerror = () => {
      self.postMessage(null);
    };
  } else if (type === 'put') {
    store.put({ id, content });
    tx.oncomplete = () => {
      self.postMessage(true);
    };
    tx.onerror = () => {
      self.postMessage(false);
    };
  }
});
