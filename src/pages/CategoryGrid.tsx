import { useEffect, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Category } from "./CategoryFilterBar";

import g1 from "../components/images/g1.jpg";
import g2 from "../components/images/g2.jpg";
import SCRAL from "../components/images/FN SCRAL.jpg";
import HeroImg from "../components/images/HeroImg.jpg";
import Mossberry from "../components/images/Mossbery 590.jpg";
import Gork from "../components/images/Glock 19.jpg";
import Desert from "../components/images/Desert_Eagle.jpg";
import close_up from "../components/images/close_up_rifle.jpg";
import wooden_wall from "../components/images/wooden_wall.jpg";
import thomas from "../components/images/thomas-tucker.jpg";
import stngl from "../components/images/stngr-llc.jpg";
import stngl2 from "../components/images/stngr-llc2.jpg";

interface Props {
  selectedCategoryId: number | null;
  onSelectCategory: (categoryId: number | null, categoryName?: string) => void;
}

const API_URL = "http://bandookwale.eba-55irbrg4.ap-south-1.elasticbeanstalk.com";

const getImageForCategory = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes("handgun") || n.includes("pistol")) return g1;
  if (n.includes("antique")) return g2;
  if (n.includes("bolt")) return SCRAL;
  if (n.includes("automatic") && !n.includes("semi")) return HeroImg;
  if (n.includes("semi")) return Mossberry;
  if (n.includes("shotgun") || n.includes("shot-gun") || n.includes("shot gun")) return Gork;
  if (n.includes("rifle")) return close_up;
  if (n.includes("furniture")) return Desert;
  if (n.includes("fashion")) return stngl;
  if (n.includes("pet")) return stngl2;
  if (n.includes("book") || n.includes("sport") || n.includes("hobby")) return wooden_wall;
  if (n.includes("service")) return thomas;
  return g1;
};

export default function CategoryGrid({ selectedCategoryId, onSelectCategory }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(
          `${API_URL}/api/users/getCategory?filterBy=ACTIVE&page=0&size=20&inputPkId=null&inputFkId=null&searchValue=null`
        );
        const data = await res.json();
        const list: Category[] = Array.isArray(data?.data) ? data.data : [];
        setCategories(list);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (isLoading) {
    return (
      <section className="w-full bg-[#f4f4f2] py-10 mt-16 flex justify-center items-center min-h-[200px]">
        <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
      </section>
    );
  }

  const selectedCat = categories.find((c) => c.categoryPkId === selectedCategoryId);

  return (
    <section className="w-full bg-[#f4f4f2] py-8 mt-16">
      <div className="max-w-7xl mx-auto px-6">

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {categories.map((item) => {
            const isSelected = selectedCategoryId === item.categoryPkId;
            const img = getImageForCategory(item.categoryName);

            return (
              <div
                key={item.categoryPkId}
                onClick={() =>
                  onSelectCategory(
                    isSelected ? null : item.categoryPkId,
                    item.categoryName
                  )
                }
                className={`group relative bg-white rounded-2xl overflow-hidden cursor-pointer
                            transition-all duration-200
                            ${isSelected
                              ? "border-2 border-yellow-500 -translate-y-1 shadow-md shadow-yellow-200"
                              : "border border-gray-200 hover:border-yellow-400 hover:-translate-y-1"
                            }`}
              >
                {/* Selected dot */}
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 z-10 w-2.5 h-2.5
                                  rounded-full bg-yellow-500" />
                )}

                {/* Image */}
                <div className="w-full h-28 bg-[#111] overflow-hidden">
                  <img
                    src={img}
                    alt={item.categoryName}
                    className="w-full h-full object-cover opacity-80
                               group-hover:opacity-100 group-hover:scale-105
                               transition-all duration-300"
                    onError={(e) => { e.currentTarget.src = g1; }}
                  />
                </div>

                {/* Body */}
                <div className="px-3 pt-2.5 pb-3">
                  <p className={`text-sm font-semibold leading-tight mb-0.5
                                 ${isSelected ? "text-yellow-700" : "text-gray-800"}`}>
                    {item.categoryName}
                  </p>
                  <p className="text-[11px] text-gray-400">Browse items</p>
                </div>

                {/* Arrow button */}
                <div className={`absolute bottom-3 right-3 w-6 h-6 rounded-full
                                 flex items-center justify-center transition-colors duration-200
                                 ${isSelected
                                   ? "bg-yellow-500"
                                   : "bg-gray-100 group-hover:bg-yellow-500"
                                 }`}>
                  <ArrowRight className={`w-3 h-3 transition-colors duration-200
                    ${isSelected ? "text-white" : "text-gray-500 group-hover:text-white"}`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected category bar */}
        {selectedCategoryId && selectedCat && (
          <div className="mt-4 flex items-center gap-3 bg-white border-2 border-yellow-500
                          rounded-xl px-4 py-3">
            <div className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0" />
            <p className="text-sm font-semibold text-yellow-700">
              {selectedCat.categoryName}
            </p>
            <p className="text-xs text-gray-400">— showing filtered results</p>
            <button
              onClick={() => onSelectCategory(null)}
              className="ml-auto text-xs text-gray-400 hover:text-yellow-600
                         transition-colors font-medium"
            >
              Clear ×
            </button>
          </div>
        )}

      </div>
    </section>
  );
}