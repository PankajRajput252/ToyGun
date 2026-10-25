import { useEffect, useState } from "react";
import { Menu, Loader2 } from "lucide-react";

export interface Category {
  categoryPkId: number;
  categoryName: string;
}

interface Props {
  selectedCategoryId: number | null;
  onSelectCategory: (categoryId: number | null, categoryName?: string) => void;
}

const API_URL = "https://api.bandookwale.com";

export default function CategoryFilterBar({ selectedCategoryId, onSelectCategory }: Props) {
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
        // Response: { data: [ { categoryPkId, categoryName, ... } ] }
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

  return (
    <div className="w-full bg-black/95 backdrop-blur border-b border-gray-800 pt-2">
      {/* same width and side padding as Header so "All Categories" lines up under the logo */}
      <div className="w-full px-3 sm:px-4 lg:px-6 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar">

        {/* All Categories */}
        <button
          onClick={() => onSelectCategory(null)}
          className={`flex items-center gap-2 px-4 lg:px-5 py-2 rounded-full whitespace-nowrap
                      transition font-medium text-sm flex-shrink-0
                      ${selectedCategoryId === null
                        ? "bg-gold-500 text-white shadow-md shadow-gold-500/25"
                        : "bg-gray-800 text-gray-200 hover:bg-gray-700"
                      }`}
        >
          <Menu className="w-4 h-4" />
          ALL CATEGORIES
        </button>

        {isLoading && (
          <Loader2 className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" />
        )}

        {/* Dynamic category pills */}
        {categories.map((cat) => (
          <button
            key={cat.categoryPkId}
            onClick={() => onSelectCategory(cat.categoryPkId, cat.categoryName)}
            className={`px-4 py-2 border rounded-full text-sm whitespace-nowrap
                        transition flex-shrink-0
                        ${selectedCategoryId === cat.categoryPkId
                          ? "bg-gold-500 text-white border-gold-500 font-semibold shadow-md shadow-gold-500/25"
                          : "text-gray-300 bg-gray-900 border-gray-700 hover:border-gold-500 hover:text-white"
                        }`}
          >
            {cat.categoryName}
          </button>
        ))}
      </div>
    </div>
  );
}