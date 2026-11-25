// Fixed per-user UI rules (by login email). Product visibility itself is enforced on the backend
// (StoreVisibilityRules in the gunwala project); this file only hides parts of the interface.

/** Users who don't get the category filter bar (STORE · ALL CATEGORIES · category chips) on the home page. */
const HIDE_CATEGORY_FILTER = new Set(["rajputpankajsingh252@gmail.com"]);

const norm = (email?: string | null) => (email ?? "").trim().toLowerCase();

export const hidesCategoryFilter = (email?: string | null) => HIDE_CATEGORY_FILTER.has(norm(email));

/** Admins who sell toy guns: their store-product form and store page use the toy gun categories. */
const TOY_GUN_ADMINS = new Set(["rajputsahilsingh8092@gmail.com"]);

export const usesToyGunCategories = (email?: string | null) => TOY_GUN_ADMINS.has(norm(email));
