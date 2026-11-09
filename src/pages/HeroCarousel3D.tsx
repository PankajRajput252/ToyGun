import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// 3D "cover flow" carousel for the home hero: the active slide sits in front,
// neighbours rotate away behind it. Auto-advances; pauses on hover.
const AUTOPLAY_MS = 3200;
/** Above this many slides the dots get crowded; show "3 / 24" instead. */
const MAX_DOTS = 10;

export interface HeroSlide {
  image: string;
  /** Shown on the front slide, e.g. the product name. */
  title?: string;
  /** e.g. the price. */
  subtitle?: string;
  /** Where clicking the front slide goes; side slides just come to the front. */
  onOpen?: () => void;
}

export default function HeroCarousel3D({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  // The slide list can change (store products load after the fallback images)
  useEffect(() => {
    setActive((a) => (a < count ? a : 0));
  }, [count]);

  useEffect(() => {
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (paused || reduceMotion || count < 2) return;
    const timer = setInterval(() => setActive((a) => (a + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [paused, count]);

  if (count === 0) return null;

  const go = (step: number) => setActive((a) => (a + step + count) % count);

  // Signed distance from the active slide, wrapped so slides loop around
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
        {slides.map((slide, i) => {
          const d = offsetOf(i);
          const abs = Math.abs(d);
          const isActive = d === 0;
          const opens = isActive && !!slide.onOpen;
          return (
            <button
              key={`${slide.image}-${i}`}
              type="button"
              onClick={() => (opens ? slide.onOpen!() : setActive(i))}
              aria-label={opens ? `Open ${slide.title ?? "product"}` : `Show ${slide.title ?? `image ${i + 1}`}`}
              tabIndex={abs > 1 ? -1 : 0}
              className={`absolute left-1/2 top-1/2 w-[62%] sm:w-[58%] aspect-[4/3] rounded-2xl overflow-hidden bg-white
                         transition-all duration-700 ease-out ${opens ? "cursor-pointer" : ""}`}
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
                src={slide.image}
                alt={slide.title ?? ""}
                draggable={false}
                loading={abs > 1 ? "lazy" : "eager"}
                className={`w-full h-full object-cover ${isActive ? "hero-float" : ""}`}
              />
              {/* Glossy highlight for depth */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-black/30" />

              {isActive && (slide.title || slide.subtitle) && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-3 pb-2.5 pt-8 text-left">
                  {slide.title && <p className="truncate text-sm sm:text-base font-semibold text-white">{slide.title}</p>}
                  <div className="flex items-center justify-between gap-2">
                    {slide.subtitle && <p className="text-sm sm:text-base font-bold text-gold-400">{slide.subtitle}</p>}
                    {slide.onOpen && <span className="text-[11px] font-semibold text-white/80">View →</span>}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center
                       bg-black/50 text-white border border-white/10 hover:bg-gold-500 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center
                       bg-black/50 text-white border border-white/10 hover:bg-gold-500 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          {count <= MAX_DOTS ? (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
              {slides.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Go to ${s.title ?? `image ${i + 1}`}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? "w-6 bg-gold-500" : "w-1.5 bg-white/40 hover:bg-white/70"}`}
                />
              ))}
            </div>
          ) : (
            <p className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-20 text-xs font-medium text-white/60 tabular-nums">
              {active + 1} / {count}
            </p>
          )}
        </>
      )}
    </div>
  );
}
