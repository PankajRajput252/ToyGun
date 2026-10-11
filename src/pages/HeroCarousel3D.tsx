import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// 3D "cover flow" carousel for the home hero: the active image sits in front,
// neighbours rotate away behind it. Auto-advances; pauses on hover.
const AUTOPLAY_MS = 3200;

export default function HeroCarousel3D({ images }: { images: string[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = images.length;

  useEffect(() => {
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (paused || reduceMotion || count < 2) return;
    const timer = setInterval(() => setActive((a) => (a + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [paused, count]);

  const go = (step: number) => setActive((a) => (a + step + count) % count);

  // Signed distance from the active slide, wrapped so slides loop around (-2..2 for 5 images)
  const offsetOf = (i: number) => {
    let d = (i - active + count) % count;
    if (d > count / 2) d -= count;
    return d;
  };

  return (
    <div
      className="relative w-full h-56 sm:h-72 md:h-80 lg:h-96 select-none"
      style={{ perspective: "1200px" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Gold glow behind the stage */}
      <div className="absolute inset-x-10 top-1/2 -translate-y-1/2 h-2/3 rounded-full bg-gold-500/25 blur-3xl" />

      <div className="relative w-full h-full" style={{ transformStyle: "preserve-3d" }}>
        {images.map((src, i) => {
          const d = offsetOf(i);
          const abs = Math.abs(d);
          const isActive = d === 0;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              className="absolute left-1/2 top-1/2 w-[62%] sm:w-[58%] aspect-[4/3] rounded-2xl overflow-hidden
                         transition-all duration-700 ease-out"
              style={{
                transform: `translate(-50%, -50%) translateX(${d * 48}%) translateZ(${-abs * 180}px) rotateY(${-d * 38}deg)`,
                zIndex: 10 - abs,
                opacity: abs > 1 ? 0 : isActive ? 1 : 0.55,
                filter: isActive ? "none" : "brightness(0.6)",
                pointerEvents: abs > 1 ? "none" : "auto",
                boxShadow: isActive
                  ? "0 30px 60px -15px rgba(0,0,0,0.8), 0 0 0 1px rgba(201,147,26,0.6), 0 0 40px rgba(201,147,26,0.25)"
                  : "0 20px 40px -20px rgba(0,0,0,0.9)",
              }}
            >
              <img
                src={src}
                alt=""
                draggable={false}
                className={`w-full h-full object-cover ${isActive ? "hero-float" : ""}`}
              />
              {/* Glossy highlight for depth */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-black/30" />
            </button>
          );
        })}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous image"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center
                       bg-black/50 text-white border border-white/10 hover:bg-gold-500 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next image"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center
                       bg-black/50 text-white border border-white/10 hover:bg-gold-500 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Go to image ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? "w-6 bg-gold-500" : "w-1.5 bg-white/40 hover:bg-white/70"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
