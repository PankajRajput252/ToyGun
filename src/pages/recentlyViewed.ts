// Keeps the last few products a visitor opened, for the "Recently viewed" row on Home.
const KEY = "bandookwale_recently_viewed";
const MAX_ITEMS = 12;

export function getRecentlyViewed<T extends { id?: number }>(): T[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

// Called after a product is deleted so it doesn't come back in the row
export function removeRecentlyViewed(id: number) {
  try {
    const rest = getRecentlyViewed().filter((p) => p.id !== id);
    localStorage.setItem(KEY, JSON.stringify(rest));
  } catch {
    // Storage blocked — nothing to clean up.
  }
}

export function addRecentlyViewed<T extends { id?: number }>(item: T) {
  if (item.id == null) return;
  try {
    const rest = getRecentlyViewed<T>().filter((p) => p.id !== item.id);
    localStorage.setItem(KEY, JSON.stringify([item, ...rest].slice(0, MAX_ITEMS)));
  } catch {
    // Storage full or blocked — the row is a convenience, so ignore.
  }
}
