import type { WallpaperBatch, WallpaperSlot } from "../types";

const DB_NAME = "VibeFrameDB";
const DB_VERSION = 1;
const STORE_SAVED = "savedWallpapers";
const STORE_HISTORY = "historyBatches";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_SAVED)) {
        db.createObjectStore(STORE_SAVED, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_HISTORY)) {
        db.createObjectStore(STORE_HISTORY, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadSavedWallpapers(): Promise<WallpaperSlot[]> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SAVED, "readonly");
      const req = tx.objectStore(STORE_SAVED).getAll();
      req.onsuccess = () => {
        const items = (req.result as WallpaperSlot[]) ?? [];
        resolve(items.sort((a, b) => b.createdAt - a.createdAt));
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function putSavedWallpaper(slot: WallpaperSlot): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_SAVED, "readwrite");
      tx.objectStore(STORE_SAVED).put(slot);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore storage errors in private browsing modes
  }
}

export async function removeSavedWallpaper(id: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_SAVED, "readwrite");
      tx.objectStore(STORE_SAVED).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore storage errors
  }
}

export async function loadHistoryBatches(): Promise<WallpaperBatch[]> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_HISTORY, "readonly");
      const req = tx.objectStore(STORE_HISTORY).getAll();
      req.onsuccess = () => {
        const batches = (req.result as WallpaperBatch[]) ?? [];
        resolve(batches.sort((a, b) => b.createdAt - a.createdAt));
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function putHistoryBatch(batch: WallpaperBatch): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_HISTORY, "readwrite");
      tx.objectStore(STORE_HISTORY).put(batch);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore storage errors
  }
}

export async function deleteHistoryBatch(id: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_HISTORY, "readwrite");
      tx.objectStore(STORE_HISTORY).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore storage errors
  }
}
