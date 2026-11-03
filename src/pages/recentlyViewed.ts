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

// Swap stored copies for fresh ones (e.g. after an edit) without changing the order.
// Returns the updated list so callers can put it straight into state.
export function refreshRecentlyViewed<T extends { id?: number }>(fresh: T[]): T[] {
  const list = getRecentlyViewed<T>();
  const byId = new Map(fresh.filter((p) => p.id != null).map((p) => [p.id, p]));
  if (!list.some((p) => byId.has(p.id))) return list;
  const updated = list.map((p) => (byId.has(p.id) ? { ...p, ...byId.get(p.id)! } : p));
  try {
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {
    // Storage blocked — the row still shows the fresh data for this visit.
  }
  return updated;
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
