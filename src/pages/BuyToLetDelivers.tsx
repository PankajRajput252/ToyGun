import containerStack from "../components/images/ContainerStack.png"
import deleverybot from "../components/images/delivers-bot.jpg"
import deleveryCalender from "../components/images/delivers-bot-date.jpg"
import worldMap from "../components/images/WorldMap.png"
import twoPerson from "../components/images/two-person.jpg"
import Histogram from "../components/images/Histogram-delivers.jpg"
import logName from "../components/images/log-name.jpg"
const cards = [
  {
    title: "THE PRODUCT",
    img: deleverybot,
    desc:
      "You invest in a 3.7 metric ton steel container. Cost $3,800 USD, active lifespan 20 years. Built to last, and ready to work.",
  },
  {
    title: "THE MARKET",
    img: worldMap,
    desc:
      "90% of global trade is transported in containers. World trade is worth $24.01 trillion USD per year.",
  },
  {
    title: "Security Of Your Capital",
    img: containerStack,
    desc:
      "Your investment is secured by the container itself (you own it). It is also secured by the buy back guarantee.",
  },
  {
    title: "Income Payments",
    img: deleveryCalender,
    desc:
      "Get paid on the 28th of every month, straight to your bank account.",
  },
  {
    title: "Guarantees",
    img: Histogram,
    desc:
      "The container itself is your property. Buy back guarantee included. World trade will never stop.",
  },
  {
    title: "Insurance & Maintenance",
    img: twoPerson,
    desc:
      "Tenants cover insurance and repairs, although this is rarely necessary.",
  },
  {
    title: "Tenants",
    img: logName,
    desc:
      "Your container is leased to top tier global multinational companies.",
  },
];

export default function BuyToLetDelivers() {
  return (
    <section className="bg-[#071f4a] py-24">
      <div className="max-w-7xl mx-auto px-6">
        {/* Heading */}
        <h2 className="text-center text-white text-3xl md:text-4xl font-semibold mb-20">
          Buy-to-Let Delivers
        </h2>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {cards.slice(0, 4).map((card, i) => (
            <Card key={i} {...card} />
          ))}
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {cards.slice(4).map((card, i) => (
            console.log("card title:", card.title),
            <Card key={i} {...card} 
            wide={card.title === "Guarantees"}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* Card Component */
function Card({ img, title, desc, wide }) {
  return (
    <div
      className={`bg-[#0b2a63] rounded-lg overflow-hidden shadow-lg ${
        wide ? "lg:col-span-1 lg:h-[420px] max-w-[570px]" : ""
      }`}
    >
      <img
        src={img}
        alt={title}
        className="w-full h-[200px] object-cover"
      />

      <div className="p-6">
        <h3 className="text-white text-lg font-semibold mb-3">
          {title}
        </h3>
        <p className="text-blue-200 text-sm leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  );
}

