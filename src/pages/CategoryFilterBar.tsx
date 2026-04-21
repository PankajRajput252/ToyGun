import { Menu } from "lucide-react";

export default function CategoryFilterBar() {
    const categories = [
        "Viper SMG",
        "Ironclad Rifle",
        "Thunderstrike Shotgun",
        "Phantom Sniper",
        "Blaze Cannon",
        "Nova Blaster",
        "Raptor Carbine",
    ];

    return (
        <div className="w-full bg-white border-b sticky  top-[70px] z-40">
            <div className="max-w-7xl mx-auto px-3 py-3 flex items-center gap-1">

                {/* All Categories Button */}
                <button className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-full whitespace-nowrap">
                    <Menu className="w-5 h-5" />
                    ALL CATEGORIES
                </button>

                {/* Category Pills */}
                {categories.map((item, index) => (
                    <button
                        key={index}
                        className="px-4 py-2 border rounded-full text-sm whitespace-nowrap text-gray-800 bg-white hover:bg-gray-100 transition"
                    >
                        {item}
                    </button>
                ))}
            </div>
        </div>
    );
}