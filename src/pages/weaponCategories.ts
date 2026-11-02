// Weapon taxonomy used by the Sell form: category, type → sub type → caliber, rifle purpose.
// IDs are hardcoded and get saved on products, so never renumber an existing entry.
// Scheme: type = 1..n, sub type = type*100 + k, caliber = block*1000 + k (see blocks below).
// A caliber shared by several weapons (e.g. .22 LR) keeps a single id everywhere.
export type WeaponOption = {
  id: number;
  name: string;
};

export type WeaponCaliberGroup = {
  name: string;
  calibers: WeaponOption[];
};

export type WeaponSubType = WeaponOption & {
  // Set only when the caliber list depends on the sub type (Pistol vs Revolver)
  caliberGroups?: WeaponCaliberGroup[];
};

export type WeaponType = WeaponOption & {
  subTypes: WeaponSubType[];
  // Calibers shared by every sub type of this weapon type (Shotgun, Rifle)
  caliberGroups?: WeaponCaliberGroup[];
  hasPurpose?: boolean;
};

export const WEAPON_CATEGORIES: WeaponOption[] = [
  { id: 1, name: "Non-Prohibited" },
  { id: 2, name: "Prohibited" },
];

// ── Rimfire (block 1) — shared by pistols, revolvers and rifles ────────────────
const HMR_17   = { id: 1001, name: ".17 HMR" };
const SHORT_22 = { id: 1002, name: ".22 Short" };
const LONG_22  = { id: 1003, name: ".22 Long" };
const LR_22    = { id: 1004, name: ".22 Long Rifle (.22 LR)" };
const WMR_22   = { id: 1005, name: ".22 WMR (.22 Magnum)" };
const MACH2_17 = { id: 1006, name: ".17 Mach 2" };

const HANDGUN_RIMFIRE: WeaponCaliberGroup = {
  name: "Rimfire",
  calibers: [HMR_17, SHORT_22, LONG_22, LR_22, WMR_22],
};

export const WEAPON_TYPES: WeaponType[] = [
  {
    id: 1,
    name: "Shotgun",
    subTypes: [
      { id: 101, name: "Semi-Automatic" },
      { id: 102, name: "Pump Action" },
      { id: 103, name: "Single Barrel" },
      { id: 104, name: "Double Barrel" },
      { id: 105, name: "Under Over" },
      { id: 106, name: "Bolt Action" },
    ],
    // block 2
    caliberGroups: [
      {
        name: "Gauge / Bore",
        calibers: [
          { id: 2001, name: "4 Gauge" },
          { id: 2002, name: "8 Gauge" },
          { id: 2003, name: "10 Gauge" },
          { id: 2004, name: "12 Gauge" },
          { id: 2005, name: "16 Gauge" },
          { id: 2006, name: "20 Gauge" },
          { id: 2007, name: "24 Gauge" },
          { id: 2008, name: "28 Gauge" },
          { id: 2009, name: "32 Gauge" },
          { id: 2010, name: ".410 Bore" },
          { id: 2011, name: "9mm Flobert" },
        ],
      },
    ],
  },
  {
    id: 2,
    name: "Handguns",
    subTypes: [
      {
        id: 201,
        name: "Pistol",
        // block 3
        caliberGroups: [
          HANDGUN_RIMFIRE,
          {
            name: "Semi-Automatic Centerfire",
            calibers: [
              { id: 3001, name: ".25 ACP" },
              { id: 3002, name: ".32 ACP" },
              { id: 3003, name: ".380 ACP" },
              { id: 3004, name: "7.62×25mm Tokarev" },
              { id: 3005, name: ".30 Luger (7.65×21mm)" },
              { id: 3006, name: "9×18mm Makarov" },
              { id: 3007, name: "9×19mm Parabellum (9mm Luger)" },
              { id: 3008, name: "9×21mm" },
              { id: 3009, name: ".38 Super" },
              { id: 3010, name: ".357 SIG" },
              { id: 3011, name: ".40 S&W" },
              { id: 3012, name: "10mm Auto" },
              { id: 3013, name: ".45 GAP" },
              { id: 3014, name: ".45 ACP" },
              { id: 3015, name: "4.6×30mm" },
              { id: 3016, name: "5.7×28mm" },
              { id: 3017, name: ".50 Action Express (.50 AE)" },
            ],
          },
        ],
      },
      {
        id: 202,
        name: "Revolver",
        // block 4
        caliberGroups: [
          HANDGUN_RIMFIRE,
          {
            name: "Revolver Centerfire",
            calibers: [
              { id: 4001, name: ".32 S&W" },
              { id: 4002, name: ".32 S&W Long" },
              { id: 4003, name: ".32 H&R Magnum" },
              { id: 4004, name: ".327 Federal Magnum" },
              { id: 4005, name: ".38 S&W" },
              { id: 4006, name: ".38 Special" },
              { id: 4007, name: ".357 Magnum" },
              { id: 4008, name: ".41 Magnum" },
              { id: 4009, name: ".44 Special" },
              { id: 4010, name: ".44 Magnum" },
              { id: 4011, name: ".45 Schofield" },
              { id: 4012, name: ".45 Colt" },
              { id: 4013, name: ".454 Casull" },
              { id: 4014, name: ".460 S&W Magnum" },
              { id: 4015, name: ".500 S&W Magnum" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 3,
    name: "Rifle",
    // "By Action" list — includes Bolt Action and Semi-Automatic
    subTypes: [
      { id: 301, name: "Bolt-Action" },
      { id: 302, name: "Lever-Action" },
      { id: 303, name: "Pump-Action" },
      { id: 304, name: "Semi-Automatic" },
      { id: 305, name: "Fully-Automatic (Select-Fire)" },
      { id: 306, name: "Single-Shot (Falling-block, Rolling-block)" },
      { id: 307, name: "Break-Action" },
      { id: 308, name: "Double Rifle (Side-by-side or Over-under)" },
    ],
    hasPurpose: true,
    // blocks 5–9
    caliberGroups: [
      {
        name: "Rimfire",
        calibers: [HMR_17, MACH2_17, SHORT_22, LR_22, WMR_22],
      },
      {
        name: "Small Caliber / Varmint Centerfire",
        calibers: [
          { id: 5001, name: ".204 Ruger" },
          { id: 5002, name: ".22 Hornet" },
          { id: 5003, name: ".222 Remington" },
          { id: 5004, name: ".223 Remington" },
          { id: 5005, name: "5.56×45mm NATO" },
          { id: 5006, name: ".22-250 Remington" },
          { id: 5007, name: ".220 Swift" },
        ],
      },
      {
        name: "Medium Caliber / Intermediate Centerfire",
        calibers: [
          { id: 6001, name: ".243 Winchester" },
          { id: 6002, name: "6mm Remington" },
          { id: 6003, name: ".25-06 Remington" },
          { id: 6004, name: "6.5 Grendel" },
          { id: 6005, name: "6.5mm Creedmoor" },
          { id: 6006, name: "6.5×55mm Swedish" },
          { id: 6007, name: "6.8mm Remington SPC" },
          { id: 6008, name: ".270 Winchester" },
          { id: 6009, name: "7mm-08 Remington" },
          { id: 6010, name: "7×57mm Mauser" },
          { id: 6011, name: "7.62×39mm" },
          { id: 6012, name: ".300 AAC Blackout" },
        ],
      },
      {
        name: "Standard / Full-Power Centerfire",
        calibers: [
          { id: 7001, name: ".30-30 Winchester" },
          { id: 7002, name: ".308 Winchester" },
          { id: 7003, name: "7.62×51mm NATO" },
          { id: 7004, name: ".30-06 Springfield" },
          { id: 7005, name: "7.62×54mmR" },
          { id: 7006, name: ".303 British" },
          { id: 7007, name: "8×57mm IS (8mm Mauser)" },
          { id: 7008, name: ".35 Remington" },
        ],
      },
      {
        name: "Magnum Centerfire",
        calibers: [
          { id: 8001, name: "7mm Remington Magnum" },
          { id: 8002, name: ".300 Winchester Short Magnum (WSM)" },
          { id: 8003, name: ".300 Winchester Magnum" },
          { id: 8004, name: ".300 Weatherby Magnum" },
          { id: 8005, name: ".338 Winchester Magnum" },
          { id: 8006, name: ".338 Lapua Magnum" },
        ],
      },
      {
        name: "Large Bore / Dangerous Game Centerfire",
        calibers: [
          { id: 9001, name: ".375 H&H Magnum" },
          { id: 9002, name: ".404 Jeffery" },
          { id: 9003, name: ".416 Rigby" },
          { id: 9004, name: ".416 Remington Magnum" },
          { id: 9005, name: ".45-70 Government" },
          { id: 9006, name: ".458 Winchester Magnum" },
          { id: 9007, name: ".458 Lott" },
          { id: 9008, name: ".470 Nitro Express" },
          { id: 9009, name: ".500 Nitro Express" },
          { id: 9010, name: ".50 BMG (12.7×99mm NATO)" },
        ],
      },
    ],
  },
];

// Rifle "By Purpose / Military Designation"
export const RIFLE_PURPOSES: WeaponOption[] = [
  { id: 1, name: "Assault Rifle" },
  { id: 2, name: "Battle Rifle" },
  { id: 3, name: "Sniper Rifle" },
  { id: 4, name: "Designated Marksman Rifle (DMR)" },
  { id: 5, name: "Carbine (Short-barreled rifle)" },
  { id: 6, name: "Anti-Materiel Rifle" },
  { id: 7, name: "Varmint Rifle" },
  { id: 8, name: "Scout Rifle" },
  { id: 9, name: "Match / Target Rifle" },
  { id: 10, name: "Sporting / Hunting Rifle" },
];
