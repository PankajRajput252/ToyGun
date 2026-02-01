import React, { useEffect, useState, useRef } from "react";
import containerImg from "../components/images/RentContainer.png"; // your image

const START = 2000;
const END = 3800;
const DURATION = 3000;

export default function EarningsSection() {
  const [amount, setAmount] = useState(2000);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animateCount();
        } else {
          // Reset when leaving viewport
          setAmount(START);
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
          }
        }
      },
      {
        threshold: 0.4, // 👈 triggers when 40% visible
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const animateCount = () => {
    const startTime = performance.now();

    const animate = (time: number) => {
      const progress = Math.min((time - startTime) / DURATION, 1);

      // ease-out animation (smooth premium feel)
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const value = Math.floor(
        START + (END - START) * easedProgress
      );

      setAmount(value);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  return (
    <section
      ref={sectionRef}
      className="w-full bg-white py-28"
    >
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">

        {/* LEFT CONTENT */}
        <div>
          <h2 className="text-4xl md:text-5xl font-serif font-semibold text-[#0b1d3a] leading-tight mb-6">
            Earn up to 30% – 35% annually
            <br />
            with your shipping containers
          </h2>

          <p className="text-lg text-gray-600 max-w-xl mb-10">
            Shipping containers power 90% of global trade, moving goods
            worth $24 trillion annually. By owning containers, you tap
            into the world’s biggest business—world trade. It’s the
            backbone of the global economy, and now you can be part of it.
          </p>

          <div className="flex items-center gap-6">
            <div className="relative">
              <img
                src={containerImg}
                alt="Shipping containers"
                className="w-[260px]"
              />

              {/* Green Badge */}
              <div className="absolute -top-6 -right-6 bg-green-600 text-white rounded-full w-32 h-32 flex items-center justify-center text-center text-sm font-semibold shadow-lg">
                Containers
                <br />
                move 90%
                <br />
                of global trade
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PRICE */}
        <div className="text-left lg:text-right">
          <p className="text-gray-500 text-lg mb-2">Entry Level</p>

          <div className="text-5xl md:text-6xl font-bold text-[#1e5bc6] tracking-tight">
            {amount.toLocaleString()} USD
          </div>
        </div>

      </div>
    </section>
  );
}
