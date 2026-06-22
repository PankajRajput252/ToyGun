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

const API_URL = "http://bandookWale.eba-55irbrg4.ap-south-1.elasticbeanstalk.com";

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
    <div className="w-full bg-black border-b sticky top-[70px] z-40 pt-2">
      <div className="max-w-7xl mx-auto px-3 py-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">

        {/* All Categories */}
        <button
          onClick={() => onSelectCategory(null)}
          className={`flex items-center gap-2 px-5 py-2 rounded-full whitespace-nowrap
                      transition font-medium text-sm flex-shrink-0
                      ${selectedCategoryId === null
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-blue-600 hover:text-white"
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
                          ? "bg-yellow-500 text-white border-yellow-500 font-semibold"
                          : "text-gray-800 bg-white border-gray-300 hover:bg-gray-100"
                        }`}
          >
            {cat.categoryName}
          </button>
        ))}
      </div>
    </div>
  );
}