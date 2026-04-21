import g1 from "../components/images/g1.jpg";
import g2 from "../components/images/g2.jpg";
import SCRAL from "../components/images/FN SCRAL.jpg"
import HeroImg from "../components/images/HeroImg.jpg"
import Mossberry from "../components/images/Mossbery 590.jpg"
import Gork from "../components/images/Glock 19.jpg"
import Desert from "../components/images/Desert_Eagle.jpg"
import Sig_saul from "../components/images/Sig_Saul.jpg"
import shortgun from "../components/images/42345.jpg"
import close_up from "../components/images/close_up_rifle.jpg"
import wooden_wall from "../components/images/wooden_wall.jpg"
import thomas from "../components/images/thomas-tucker.jpg"
import stngl from "../components/images/stngr-llc.jpg"
import stngl2 from "../components/images/stngr-llc2.jpg"
export default function CategoryGrid() {
  const categories = [
    { name: "Handguns", img: g1 },
    { name: "Antique firearms", img: g2 },
    { name: "Bolt-action", img: SCRAL },
    { name: "Automatic firearms", img: HeroImg },
    { name: "Semi-automatic firearms", img: Mossberry },
    { name: "Shotguns", img: Gork },
    { name: "Rifles", img: close_up },
    { name: "Furniture", img: Desert },
    { name: "Fashion", img: stngl },
    { name: "Pets", img: stngl2 },
    { name: "Books, Sports & Hobbies", img: wooden_wall },
    { name: "Services", img: thomas },
  ];

  return (
    <section className="w-full bg-[#f7f8f9] py-10 mt-16">
      <div className="max-w-7xl mx-auto px-6">

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {categories.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center cursor-pointer group"
            >
              {/* Image Box */}
              <div className="w-40 h-28 bg-gray-100 rounded-2xl flex items-center justify-center mb-3 group-hover:shadow-md transition">
                <img
                  src={item.img}
                  alt={item.name}
                  className="w-full h-full object-contain p-4"
                />
              </div>

              {/* Title */}
              <p className="text-sm font-medium text-gray-800 group-hover:text-blue-600">
                {item.name}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}