import type { ShootingCategoryGroup } from "./shootingCategories";

// Toy gun store taxonomy, used by admins who sell toy guns (see config/userRestrictions).
// Same shape and ID scheme as shootingCategories.ts: group = n*1000, category = group + k*10.
// IDs are saved on products, so never renumber an existing entry. Toy IDs start at 20000 so they
// can't collide with the shooting categories (1000–10999).
export const TOY_GUN_CATEGORIES: ShootingCategoryGroup[] = [
  {
    id: 20000,
    name: "Water Guns",
    categories: [
      { id: 20010, name: "Pump-Action" },
      { id: 20020, name: "Electric / Automatic" },
      { id: 20030, name: "Backpack Water Blasters" },
    ],
  },
  {
    id: 21000,
    name: "Foam Dart Blasters",
    categories: [
      { id: 21010, name: "Manual Blasters" },
      { id: 21020, name: "Motorised Blasters" },
      { id: 21030, name: "Foam Darts & Refills" },
    ],
  },
  {
    id: 22000,
    name: "Gel Ball Blasters",
    categories: [
      { id: 22010, name: "Gel Blasters" },
      { id: 22020, name: "Gel Balls & Refills" },
    ],
  },
  {
    id: 23000,
    name: "Cap Guns",
    categories: [
      { id: 23010, name: "Cap Pistols" },
      { id: 23020, name: "Cap Rifles" },
      { id: 23030, name: "Caps & Refills" },
    ],
  },
  {
    id: 24000,
    name: "Soft Bullet Toy Guns",
    categories: [
      { id: 24010, name: "Shell-Ejecting Pistols" },
      { id: 24020, name: "Shell-Ejecting Rifles" },
      { id: 24030, name: "Soft Bullets" },
    ],
  },
  { id: 25000, name: "Bubble Guns", categories: [] },
  { id: 26000, name: "Light & Sound Guns", categories: [] },
  {
    id: 27000,
    name: "Toy Gun Accessories",
    categories: [
      { id: 27010, name: "Targets" },
      { id: 27020, name: "Holsters & Vests" },
      { id: 27030, name: "Safety Goggles" },
    ],
  },
];

/** Columns for the category menu on the admin store page. */
export const TOY_GUN_CATEGORY_COLUMNS: ShootingCategoryGroup[][] = [
  TOY_GUN_CATEGORIES.slice(0, 3),
  TOY_GUN_CATEGORIES.slice(3, 6),
  TOY_GUN_CATEGORIES.slice(6),
];
