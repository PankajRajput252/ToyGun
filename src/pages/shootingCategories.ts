// Store taxonomy: group (e.g. AIR GUNS) → category (Air Rifles) → subcategory (Match Rifles)
// IDs are hardcoded and get saved on products, so never renumber an existing entry.
// Scheme: group = n*1000, category = group + k*10, subcategory = category + j
export type ShootingSubcategory = {
  id: number;
  name: string;
};

export type ShootingCategory = {
  id: number;
  name: string;
  subcategories?: ShootingSubcategory[];
};

export type ShootingCategoryGroup = {
  id: number;
  name: string;
  categories: ShootingCategory[];
};

export const SHOOTING_CATEGORIES: ShootingCategoryGroup[] = [
  {
    id: 1000,
    name: "Air Guns",
    categories: [
      {
        id: 1010,
        name: "Air Rifles",
        subcategories: [
          { id: 1011, name: "Match Rifles" },
          { id: 1012, name: "Hobby Rifles" },
        ],
      },
      { id: 1020, name: "Air Pistols", subcategories: [{ id: 1021, name: "Match Pistols" }] },
      {
        id: 1030,
        name: "CO2",
        subcategories: [
          { id: 1031, name: "Pistols" },
          { id: 1032, name: "CO2 Capsules" },
        ],
      },
    ],
  },
  {
    id: 2000,
    name: "Firearms",
    categories: [
      { id: 2010, name: "Pistols" },
      { id: 2020, name: "Accessories" },
    ],
  },
  {
    id: 3000,
    name: "Clay Targets Machine",
    categories: [],
  },
  {
    id: 4000,
    name: "Ammo",
    categories: [
      {
        id: 4010,
        name: "Air Pellets",
        subcategories: [
          { id: 4011, name: "Match Pellets" },
          { id: 4012, name: "Hobby Pellets" },
        ],
      },
      { id: 4020, name: "BBs Pellets" },
    ],
  },
  {
    id: 5000,
    name: "Spares Parts",
    categories: [
      { id: 5010, name: "CO2 Pistol Spares" },
      { id: 5020, name: "Rifle Spares" },
      { id: 5030, name: "Pistol Spares" },
    ],
  },
  {
    id: 6000,
    name: "Gun Accessories",
    categories: [
      { id: 6010, name: "Beretta Accessories" },
      { id: 6020, name: "Bags & Cases" },
      { id: 6030, name: "Camping" },
      { id: 6040, name: "Clothing" },
      { id: 6050, name: "Knives & Tools" },
      { id: 6060, name: "Shooting Glasses" },
      {
        id: 6070,
        name: "Pistol Accessories",
        subcategories: [
          { id: 6071, name: "Grips" },
          { id: 6072, name: "Magazines" },
        ],
      },
      {
        id: 6080,
        name: "Rifle Accessories",
        subcategories: [
          { id: 6081, name: "Butt Plates" },
          { id: 6082, name: "Barrel Weight" },
          { id: 6083, name: "Magazines" },
          { id: 6084, name: "Prism Block" },
          { id: 6085, name: "Gun Slings" },
          { id: 6086, name: "Shooting Sticks, Tripod & Bipod" },
          { id: 6087, name: "Grips" },
        ],
      },
      { id: 6090, name: "Tools & Equipment" },
      { id: 6100, name: "Air Cylinders" },
    ],
  },
  {
    id: 7000,
    name: "Gun Care",
    categories: [
      { id: 7010, name: "Cleaning Brushes, Rods Etc." },
      { id: 7020, name: "Cleaning Kits" },
      { id: 7030, name: "Oils & Solvents" },
    ],
  },
  {
    id: 8000,
    name: "Shooting Accessories",
    categories: [
      { id: 8010, name: "Hearing Protection" },
      { id: 8020, name: "Shooting Frames & Accessories" },
      {
        id: 8030,
        name: "Targets",
        subcategories: [
          { id: 8031, name: "Paper Targets" },
          { id: 8032, name: "Field Targets" },
        ],
      },
      { id: 8040, name: "Others" },
    ],
  },
  {
    id: 9000,
    name: "Sights",
    categories: [
      {
        id: 9010,
        name: "Rifle Sights",
        subcategories: [
          { id: 9011, name: "Rear Sights" },
          { id: 9012, name: "Front Sights" },
          { id: 9013, name: "Sight Sets" },
          { id: 9014, name: "Colour Filters" },
          { id: 9015, name: "Sighting In Accessories" },
        ],
      },
      {
        id: 9020,
        name: "Pistol Sights",
        subcategories: [
          { id: 9021, name: "Rear Sights" },
          { id: 9022, name: "Front Sights" },
        ],
      },
    ],
  },
];

// Laid out as four columns, like the shop's mega menu
export const SHOOTING_CATEGORY_COLUMNS: ShootingCategoryGroup[][] = [
  SHOOTING_CATEGORIES.filter((g) => ["Air Guns", "Firearms", "Clay Targets Machine"].includes(g.name)),
  SHOOTING_CATEGORIES.filter((g) => ["Ammo", "Spares Parts"].includes(g.name)),
  SHOOTING_CATEGORIES.filter((g) => ["Gun Accessories", "Gun Care"].includes(g.name)),
  SHOOTING_CATEGORIES.filter((g) => ["Shooting Accessories", "Sights"].includes(g.name)),
];

// Selected node in the tree; subcategory/category are optional for broader picks
export type CategorySelection = {
  group: string;
  category?: string;
  subcategory?: string;
};

export const selectionLabel = (s: CategorySelection) =>
  [s.group, s.category, s.subcategory].filter(Boolean).join(" › ");

// Names that should count as a match for a selection: the node itself plus everything under it
export const selectionTerms = (s: CategorySelection): string[] => {
  if (s.subcategory) return [s.subcategory];
  const group = SHOOTING_CATEGORIES.find((g) => g.name === s.group);
  if (!group) return [];
  if (s.category) {
    const cat = group.categories.find((c) => c.name === s.category);
    return [s.category, ...(cat?.subcategories ?? []).map((sub) => sub.name)];
  }
  return [
    s.group,
    ...group.categories.flatMap((c) => [c.name, ...(c.subcategories ?? []).map((sub) => sub.name)]),
  ];
};

// Hardcoded IDs covered by a selection: the node itself plus everything under it
export const selectionIds = (s: CategorySelection): number[] => {
  const group = SHOOTING_CATEGORIES.find((g) => g.name === s.group);
  if (!group) return [];
  const cats = s.category ? group.categories.filter((c) => c.name === s.category) : group.categories;
  if (s.subcategory) {
    return cats.flatMap((c) => c.subcategories ?? []).filter((sub) => sub.name === s.subcategory).map((sub) => sub.id);
  }
  return [
    ...(s.category ? [] : [group.id]),
    ...cats.flatMap((c) => [c.id, ...(c.subcategories ?? []).map((sub) => sub.id)]),
  ];
};
