import { useEffect, useRef, useState } from "react";
import { Menu, ChevronDown, X, ShoppingCart, MessageCircle } from "lucide-react";
import type { Product } from "./ProductCard";
import { WEAPON_CATEGORIES, WEAPON_TYPES } from "./weaponCategories";
import {
  SHOOTING_CATEGORIES, SHOOTING_CATEGORY_COLUMNS, selectionIds, selectionLabel, type CategorySelection,
} from "./shootingCategories";

// The two sections of the home page use different category trees:
//   Store       → SHOOTING_CATEGORIES (product.categoryId / subcategoryId, set by the admin form)
//   Marketplace → weapon category + type + sub type (weaponCategoryFkId / weaponTypeFkId / weaponSubTypeFkId)
export type ShopMode = "store" | "listing";

// Still used by CategoryGrid (API-driven category tiles)
export interface Category {
  categoryPkId: number;
  categoryName: string;
}

export type CategoryFilter = {
  /** Shown in the bar and page heading, e.g. "Air Guns › CO2 › Pistols" */
  label: string;
  match: (p: Product) => boolean;
};

interface Props {
  mode: ShopMode;
  selected: CategoryFilter | null;
  onSelect: (filter: CategoryFilter | null) => void;
}

// ── Store filters ──────────────────────────────────────────────────────────────
const storeFilter = (s: CategorySelection): CategoryFilter => {
  const ids = new Set(selectionIds(s));
  return {
    label: selectionLabel(s),
    // A subcategory pick must match the product's subcategory; broader picks match either field
    match: (p) =>
      s.subcategory
        ? ids.has(p.subcategoryId!)
        : ids.has(p.categoryId!) || ids.has(p.subcategoryId!),
  };
};

// ── Marketplace filters ────────────────────────────────────────────────────────
const licenceFilter = (id: number, name: string): CategoryFilter => ({
  label: name,
  match: (p) => p.weaponCategoryFkId === id,
});
const typeFilter = (id: number, name: string): CategoryFilter => ({
  label: name,
  match: (p) => p.weaponTypeFkId === id,
});
const subTypeFilter = (typeName: string, id: number, name: string): CategoryFilter => ({
  label: `${typeName} › ${name}`,
  match: (p) => p.weaponSubTypeFkId === id,
});

// Quick pills: the top level of each tree
const STORE_PILLS: CategoryFilter[] = SHOOTING_CATEGORIES.map((g) => storeFilter({ group: g.name }));
const MARKET_PILLS: CategoryFilter[] = [
  ...WEAPON_CATEGORIES.map((c) => licenceFilter(c.id, c.name)),
  ...WEAPON_TYPES.map((t) => typeFilter(t.id, t.name)),
];

export default function CategoryFilterBar({ mode, selected, onSelect }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const isStore = mode === "store";
  const pills = isStore ? STORE_PILLS : MARKET_PILLS;

  // Close the menu on outside click / Escape, and whenever the section changes
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);
  useEffect(() => setMenuOpen(false), [mode]);

  const pick = (filter: CategoryFilter | null) => {
    onSelect(filter);
    setMenuOpen(false);
  };

  const accent = isStore
    ? { solid: "bg-gold-500 text-white shadow-md shadow-gold-500/25", border: "border-gold-500", hoverBorder: "hover:border-gold-500", text: "text-gold-400", hoverText: "hover:text-gold-300" }
    : { solid: "bg-blue-600 text-white shadow-md shadow-blue-600/25", border: "border-blue-500", hoverBorder: "hover:border-blue-500", text: "text-blue-400", hoverText: "hover:text-blue-300" };

  const isPillActive = (f: CategoryFilter) => selected?.label === f.label;
  // A deeper pick (e.g. "Handguns › Revolver") isn't a pill, so show it as its own chip
  const deepSelection = selected && !pills.some(isPillActive) ? selected : null;

  const linkClass = (label: string, base: string) =>
    `${base} text-left transition ${selected?.label === label ? `${accent.text} font-semibold` : `${accent.hoverText}`}`;

  return (
    <div ref={wrapRef} className="relative w-full bg-black/95 backdrop-blur border-b border-gray-800 pt-2 z-30">
      {/* same width and side padding as Header so "All Categories" lines up under the logo */}
      <div className="w-full px-3 sm:px-4 lg:px-6 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar">

        {/* Which section these categories belong to */}
        <span
          className={`hidden md:inline-flex items-center gap-1.5 flex-shrink-0 text-[11px] font-semibold uppercase tracking-wide
                      px-2.5 py-1 rounded-md ${isStore ? "bg-gold-500/15 text-gold-300" : "bg-blue-500/15 text-blue-300"}`}
        >
          {isStore ? <ShoppingCart className="w-3.5 h-3.5" /> : <MessageCircle className="w-3.5 h-3.5" />}
          {isStore ? "Store" : "Marketplace"}
        </span>

        {/* All Categories — opens the full category / subcategory menu */}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          className={`flex items-center gap-2 px-4 lg:px-5 py-2 rounded-full whitespace-nowrap
                      transition font-medium text-sm flex-shrink-0
                      ${selected === null || menuOpen ? accent.solid : "bg-gray-800 text-gray-200 hover:bg-gray-700"}`}
        >
          <Menu className="w-4 h-4" />
          ALL CATEGORIES
          <ChevronDown className={`w-4 h-4 transition ${menuOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Deeper selection chip */}
        {deepSelection && (
          <span className={`inline-flex items-center gap-1.5 pl-4 pr-2 py-2 rounded-full text-sm whitespace-nowrap flex-shrink-0 font-semibold ${accent.solid}`}>
            {deepSelection.label}
            <button onClick={() => pick(null)} aria-label="Clear category" className="p-0.5 rounded-full hover:bg-white/20">
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        )}

        {/* Top-level pills */}
        {pills.map((f) => (
          <button
            key={f.label}
            onClick={() => pick(isPillActive(f) ? null : f)}
            className={`px-4 py-2 border rounded-full text-sm whitespace-nowrap transition flex-shrink-0
                        ${isPillActive(f)
                          ? `${accent.solid} ${accent.border} font-semibold`
                          : `text-gray-300 bg-gray-900 border-gray-700 ${accent.hoverBorder} hover:text-white`}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Full category menu ── */}
      {menuOpen && (
        <div className="absolute left-0 right-0 top-full bg-gray-950 border-b border-gray-800 shadow-2xl max-h-[70vh] overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-400">
                {isStore ? "Store categories" : "Marketplace categories"}
              </p>
              <button
                onClick={() => pick(null)}
                className={`text-sm font-semibold ${accent.text} hover:underline`}
              >
                Show all {isStore ? "Store" : "Marketplace"} items
              </button>
            </div>

            {isStore ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
                {SHOOTING_CATEGORY_COLUMNS.map((column, colIndex) => (
                  <div key={colIndex} className="space-y-6">
                    {column.map((group) => (
                      <div key={group.id}>
                        <button
                          onClick={() => pick(storeFilter({ group: group.name }))}
                          className={linkClass(group.name, "block text-sm font-bold uppercase tracking-wide text-white mb-2")}
                        >
                          {group.name}
                        </button>
                        <ul className="space-y-1.5">
                          {group.categories.map((cat) => {
                            const catLabel = selectionLabel({ group: group.name, category: cat.name });
                            return (
                              <li key={cat.id}>
                                <button
                                  onClick={() => pick(storeFilter({ group: group.name, category: cat.name }))}
                                  className={linkClass(catLabel, `text-sm ${cat.subcategories ? "text-gray-200 font-medium" : "text-gray-400"}`)}
                                >
                                  {cat.name}
                                </button>
                                {cat.subcategories && (
                                  <ul className="mt-1 ml-3 pl-3 border-l border-gray-800 space-y-1">
                                    {cat.subcategories.map((sub) => {
                                      const sel = { group: group.name, category: cat.name, subcategory: sub.name };
                                      return (
                                        <li key={sub.id}>
                                          <button
                                            onClick={() => pick(storeFilter(sel))}
                                            className={linkClass(selectionLabel(sel), "text-[13px] text-gray-400")}
                                          >
                                            {sub.name}
                                          </button>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-white mb-2">Licence category</p>
                  <ul className="space-y-1.5">
                    {WEAPON_CATEGORIES.map((c) => (
                      <li key={c.id}>
                        <button
                          onClick={() => pick(licenceFilter(c.id, c.name))}
                          className={linkClass(c.name, "text-sm text-gray-300")}
                        >
                          {c.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                {WEAPON_TYPES.map((t) => (
                  <div key={t.id}>
                    <button
                      onClick={() => pick(typeFilter(t.id, t.name))}
                      className={linkClass(t.name, "block text-sm font-bold uppercase tracking-wide text-white mb-2")}
                    >
                      {t.name}
                    </button>
                    <ul className="space-y-1.5">
                      {t.subTypes.map((s) => (
                        <li key={s.id}>
                          <button
                            onClick={() => pick(subTypeFilter(t.name, s.id, s.name))}
                            className={linkClass(`${t.name} › ${s.name}`, "text-sm text-gray-400")}
                          >
                            {s.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
