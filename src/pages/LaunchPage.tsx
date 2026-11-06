import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { Loader2, Sparkles, ArrowRight } from "lucide-react";
import { siteLaunchApi } from "../services/api";
import logo from "../components/images/RealLogo2-white.png";

// Secret /launch page: a one-time "Launch Website" button for the launch ceremony.
// The launched flag lives on the server, so once anyone clicks it the button never
// shows again (on any device) and the page only replays the Diwali celebration.

type Phase = "loading" | "ready" | "countdown" | "live";

const COUNTDOWN_FROM = 3;
const COUNTDOWN_STEP_MS = 900;

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Server timestamps look like "2026-11-04 10:20:30.123" (UTC)
const formatLaunchDate = (value: string | null) => {
  if (!value) return "";
  const date = new Date(`${value.trim().replace(" ", "T")}Z`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" });
};

export default function LaunchPage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [count, setCount] = useState(COUNTDOWN_FROM);
  const [launchedAt, setLaunchedAt] = useState<string | null>(null);
  const [justLaunched, setJustLaunched] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    siteLaunchApi
      .getStatus()
      .then((status) => {
        setLaunchedAt(status.launchedAt);
        setPhase(status.launched ? "live" : "ready");
      })
      .catch(() => {
        setError("Couldn't reach the server. Please refresh and try again.");
        setPhase("ready");
      });
  }, []);

  const handleLaunch = async () => {
    setError("");
    setPhase("countdown");
    setCount(COUNTDOWN_FROM);

    // Run the 3-2-1 countdown while the launch request is in flight
    const countdown = new Promise<void>((resolve) => {
      let n = COUNTDOWN_FROM;
      const id = window.setInterval(() => {
        n -= 1;
        if (n <= 0) {
          window.clearInterval(id);
          resolve();
        } else {
          setCount(n);
        }
      }, COUNTDOWN_STEP_MS);
    });

    try {
      const [status] = await Promise.all([siteLaunchApi.launch(), countdown]);
      setLaunchedAt(status.launchedAt);
      setJustLaunched(!status.alreadyLaunched);
      setPhase("live");
    } catch {
      setError("Launch failed — please check your connection and press the button again.");
      setPhase("ready");
    }
  };

  const isLive = phase === "live";

  return (
    <div className="launch-root relative min-h-screen overflow-hidden text-white">
      <style>{LAUNCH_CSS}</style>

      <Stars />
      <Toran />
      {isLive && <Fireworks intensity={justLaunched ? "high" : "low"} />}
      {isLive && <Petals />}

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-28 pb-44 text-center">
        {phase === "loading" && <Loader2 className="h-10 w-10 animate-spin text-amber-300" />}

        {phase === "ready" && (
          <div className="launch-fade-in flex flex-col items-center">
            <img src={logo} alt="Bandookwale" className="h-20 w-auto sm:h-24 drop-shadow-[0_0_24px_rgba(251,191,36,0.45)]" />
            <p className="mt-6 text-xs sm:text-sm font-semibold uppercase tracking-[0.35em] text-amber-300/90">
              The big moment
            </p>
            <h1 className="launch-gold-text mt-3 text-4xl sm:text-6xl font-bold">Bandookwale</h1>
            <p className="mt-4 max-w-md text-sm sm:text-base text-amber-50/75">
              Light the first diya and open Bandookwale to the world.
            </p>

            <button onClick={handleLaunch} className="launch-button group relative mt-12">
              <span className="launch-ring" />
              <span className="launch-ring launch-ring-delay" />
              <span className="relative z-10 inline-flex items-center gap-3 rounded-full px-9 py-5 sm:px-12 sm:py-6
                               text-lg sm:text-2xl font-bold tracking-wide text-[#3b1d00]
                               bg-gradient-to-b from-amber-200 via-amber-400 to-orange-500
                               shadow-[0_0_40px_rgba(251,191,36,0.55)] transition-transform duration-200
                               group-hover:scale-105 group-active:scale-95">
                <span aria-hidden className="text-2xl sm:text-3xl">🪔</span>
                Launch Website
              </span>
            </button>

            {error && <p className="mt-6 max-w-sm text-sm text-red-300">{error}</p>}
          </div>
        )}

        {phase === "countdown" && (
          <div key={count} className="launch-count launch-gold-text text-[9rem] sm:text-[13rem] font-bold leading-none">
            {count}
          </div>
        )}

        {isLive && (
          <div className="relative flex flex-col items-center">
            <Rangoli />
            <div className="launch-fade-in relative z-10 flex flex-col items-center">
              <img src={logo} alt="Bandookwale" className="h-16 w-auto sm:h-20 drop-shadow-[0_0_24px_rgba(251,191,36,0.5)]" />
              <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-400/10
                               px-4 py-1.5 text-xs sm:text-sm font-semibold text-amber-200 backdrop-blur-sm">
                <span aria-hidden>🪔</span> शुभ दीपावली · Happy Diwali
              </span>
              <h1 className="launch-gold-text launch-shimmer mt-5 text-4xl sm:text-7xl font-bold">
                Bandookwale is LIVE!
              </h1>
              <p className="mt-4 max-w-lg text-sm sm:text-lg text-amber-50/80">
                {justLaunched
                  ? "Launched just now — thank you for lighting the first diya."
                  : `Launched on ${formatLaunchDate(launchedAt)}.`}
              </p>
              <Link
                to="/"
                className="mt-10 inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold
                           bg-gradient-to-b from-amber-300 to-orange-500 text-[#3b1d00]
                           shadow-[0_0_30px_rgba(251,146,60,0.45)] transition hover:scale-105"
              >
                <Sparkles className="h-5 w-5" />
                Enter Bandookwale
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        )}
      </main>

      <DiyaRow />
    </div>
  );
}

// ── Twinkling night sky ──────────────────────────────────────────────────────────
function Stars() {
  const stars = useMemo(
    () =>
      Array.from({ length: 70 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 70,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 4,
      })),
    []
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {stars.map((s, i) => (
        <span
          key={i}
          className="launch-star"
          style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s` }}
        />
      ))}
    </div>
  );
}

// ── Marigold toran hanging along the top ─────────────────────────────────────────
function Toran() {
  const strands = Array.from({ length: 22 }, (_, i) => 2 + ((i * 7) % 4));
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-20">
      <div className="launch-toran-rope" />
      <div className="flex justify-between overflow-hidden px-1">
        {strands.map((len, i) => (
          <div key={i} className="launch-strand flex flex-col items-center" style={{ animationDelay: `${(i % 5) * 0.3}s` }}>
            {Array.from({ length: len }, (_, j) => (
              <span key={j} className={`launch-marigold ${(i + j) % 2 ? "launch-marigold-yellow" : ""}`} />
            ))}
            <span className="launch-leaf" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Row of flickering diyas along the bottom ─────────────────────────────────────
function DiyaRow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex items-end justify-center gap-5 sm:gap-10">
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className={`launch-diya ${i === 0 || i === 6 ? "hidden sm:block" : ""}`}>
          <span className="launch-diya-glow" style={{ animationDelay: `${i * 0.25}s` }} />
          <span className="launch-diya-flame" style={{ animationDelay: `${i * 0.17}s` }} />
          <span className="launch-diya-oil" />
          <span className="launch-diya-bowl" />
        </div>
      ))}
    </div>
  );
}

// ── Slowly turning rangoli behind the "LIVE" message ─────────────────────────────
function Rangoli() {
  const rings = [
    { count: 12, r: 78, rx: 9, ry: 20, fill: "#db2777" },
    { count: 12, r: 60, rx: 10, ry: 18, fill: "#f97316", turn: 15 },
    { count: 8, r: 40, rx: 10, ry: 18, fill: "#facc15" },
    { count: 8, r: 24, rx: 6, ry: 12, fill: "#22c55e", turn: 22.5 },
  ];
  return (
    <svg aria-hidden viewBox="-100 -100 200 200" className="launch-rangoli absolute left-1/2 top-1/2 h-[26rem] w-[26rem] sm:h-[38rem] sm:w-[38rem]">
      <circle r="96" fill="none" stroke="#fbbf24" strokeWidth="0.8" strokeDasharray="2 4" />
      {Array.from({ length: 36 }, (_, i) => (
        <circle key={i} r="1.6" fill="#fde68a" transform={`rotate(${i * 10}) translate(0 -90)`} />
      ))}
      {rings.map((ring, ri) =>
        Array.from({ length: ring.count }, (_, i) => (
          <ellipse
            key={`${ri}-${i}`}
            cx="0"
            cy={-ring.r}
            rx={ring.rx}
            ry={ring.ry}
            fill={ring.fill}
            fillOpacity="0.85"
            transform={`rotate(${(360 / ring.count) * i + (ring.turn ?? 0)})`}
          />
        ))
      )}
      <circle r="12" fill="#7c3aed" />
      <circle r="6" fill="#fde047" />
    </svg>
  );
}

// ── Falling marigold petals ──────────────────────────────────────────────────────
function Petals() {
  const petals = useMemo(
    () =>
      Array.from({ length: prefersReducedMotion() ? 0 : 32 }, (_, i) => ({
        left: Math.random() * 100,
        size: 9 + Math.random() * 8,
        duration: 7 + Math.random() * 7,
        delay: Math.random() * 8,
        drift: (Math.random() - 0.5) * 160,
        color: ["#f97316", "#fbbf24", "#ef4444", "#fb923c"][i % 4],
      })),
    []
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {petals.map((p, i) => (
        <span
          key={i}
          className="launch-petal"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.7,
            background: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            ["--drift" as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

// ── Canvas fireworks ─────────────────────────────────────────────────────────────
type Rocket = { x: number; y: number; vx: number; vy: number; hue: number };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; decay: number; hue: number; size: number };

// gold, orange, pink, purple, green, cyan, red
const FIREWORK_HUES = [45, 28, 330, 280, 130, 190, 0];
const GRAVITY = 0.12;

function Fireworks({ intensity }: { intensity: "high" | "low" }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = prefersReducedMotion();
    const level = reduced ? "low" : intensity;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const rockets: Rocket[] = [];
    const sparks: Spark[] = [];

    const launchRocket = () => {
      const targetY = height * (0.12 + Math.random() * 0.33);
      rockets.push({
        x: width * (0.1 + Math.random() * 0.8),
        y: height,
        vx: (Math.random() - 0.5) * 1.2,
        // speed that brings the rocket to a stop around targetY
        vy: -Math.sqrt(2 * GRAVITY * (height - targetY)),
        hue: FIREWORK_HUES[Math.floor(Math.random() * FIREWORK_HUES.length)],
      });
    };

    const explode = (r: Rocket) => {
      const count = level === "high" ? 90 : 55;
      const ring = Math.random() < 0.35; // some bursts are clean rings
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.1;
        const speed = ring ? 4.2 : 1.5 + Math.random() * 4.5;
        sparks.push({
          x: r.x,
          y: r.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          decay: 0.011 + Math.random() * 0.012,
          hue: r.hue + (Math.random() * 24 - 12),
          size: 1.4 + Math.random() * 1.4,
        });
      }
    };

    let frame = 0;
    const tick = () => {
      // fade the previous frame to transparent so the sky gradient shows through the trails
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.x += r.vx;
        r.y += r.vy;
        r.vy += GRAVITY;
        ctx.fillStyle = `hsl(${r.hue}, 100%, 75%)`;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
        if (r.vy >= 0) {
          explode(r);
          rockets.splice(i, 1);
        }
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.vx *= 0.985;
        s.vy = s.vy * 0.985 + 0.05;
        s.x += s.vx;
        s.y += s.vy;
        s.life -= s.decay;
        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        ctx.fillStyle = `hsla(${s.hue}, 100%, 62%, ${s.life})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    // Opening salvo right after the launch, then a steady show
    const salvo = level === "high" ? [0, 150, 350, 600, 800, 1100] : [0];
    const salvoTimers = salvo.map((ms) => window.setTimeout(launchRocket, ms));
    const interval = window.setInterval(
      () => {
        launchRocket();
        if (level === "high" && Math.random() < 0.5) launchRocket();
      },
      level === "high" ? 550 : 1500
    );

    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(interval);
      salvoTimers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("resize", resize);
    };
  }, [intensity]);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 z-[5] h-full w-full" />;
}

const LAUNCH_CSS = `
.launch-root {
  background:
    radial-gradient(ellipse at 50% 110%, rgba(234, 88, 12, 0.35), transparent 55%),
    radial-gradient(ellipse at 50% -10%, #312e81 0%, #120f2e 45%, #07060f 100%);
}
.launch-gold-text {
  background: linear-gradient(180deg, #fff7d6 0%, #fcd34d 45%, #f59e0b 75%, #ea580c 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0 18px rgba(251, 191, 36, 0.35));
}
.launch-shimmer {
  background-size: 100% 200%;
  animation: launch-shimmer 3s ease-in-out infinite alternate;
}
@keyframes launch-shimmer { from { background-position: 0 0; } to { background-position: 0 100%; } }

.launch-fade-in { animation: launch-fade-in 0.9s ease-out both; }
@keyframes launch-fade-in { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: none; } }

.launch-count { animation: launch-count ${COUNTDOWN_STEP_MS}ms ease-out both; }
@keyframes launch-count {
  0% { opacity: 0; transform: scale(2.2); }
  25% { opacity: 1; transform: scale(1); }
  80% { opacity: 1; }
  100% { opacity: 0; transform: scale(0.85); }
}

.launch-star {
  position: absolute; border-radius: 9999px; background: #fef3c7;
  animation: launch-twinkle 3s ease-in-out infinite;
}
@keyframes launch-twinkle { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.95; } }

/* Launch button pulse rings */
.launch-button { border-radius: 9999px; }
.launch-ring {
  position: absolute; inset: 0; border-radius: 9999px;
  border: 2px solid rgba(251, 191, 36, 0.7);
  animation: launch-pulse 2.2s ease-out infinite;
}
.launch-ring-delay { animation-delay: 1.1s; }
@keyframes launch-pulse { from { transform: scale(1); opacity: 0.9; } to { transform: scale(1.45, 1.8); opacity: 0; } }

/* Toran */
.launch-toran-rope {
  height: 6px;
  background: repeating-linear-gradient(90deg, #15803d 0 14px, #166534 14px 28px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}
.launch-strand { transform-origin: top center; animation: launch-sway 4s ease-in-out infinite alternate; }
@keyframes launch-sway { from { transform: rotate(-2.5deg); } to { transform: rotate(2.5deg); } }
.launch-marigold {
  width: 16px; height: 16px; margin-top: -2px; border-radius: 9999px;
  background: radial-gradient(circle at 40% 35%, #fdba74 0 18%, #f97316 45%, #c2410c 85%);
  box-shadow: 0 0 6px rgba(249, 115, 22, 0.5);
}
.launch-marigold-yellow { background: radial-gradient(circle at 40% 35%, #fef08a 0 18%, #facc15 45%, #ca8a04 85%); }
.launch-leaf {
  width: 10px; height: 14px; margin-top: -1px;
  background: #16a34a; border-radius: 0 100% 0 100%; transform: rotate(45deg);
}

/* Diyas */
.launch-diya { position: relative; width: 58px; height: 76px; }
.launch-diya-bowl {
  position: absolute; bottom: 0; left: 0; width: 58px; height: 24px;
  background: linear-gradient(180deg, #c2410c 0%, #7c2d12 100%);
  border-radius: 6px 6px 40px 40px / 6px 6px 26px 26px;
  box-shadow: inset 0 -4px 6px rgba(0, 0, 0, 0.35);
}
.launch-diya-oil {
  position: absolute; bottom: 19px; left: 3px; width: 52px; height: 10px; border-radius: 50%;
  background: radial-gradient(ellipse, #fbbf24 0%, #b45309 70%);
}
.launch-diya-flame {
  position: absolute; bottom: 25px; left: 50%; width: 14px; height: 30px; margin-left: -7px;
  background: radial-gradient(ellipse at 50% 78%, #ffffff 0 14%, #fde047 30%, #fb923c 62%, rgba(249, 115, 22, 0) 72%);
  border-radius: 50% 50% 50% 50% / 64% 64% 36% 36%;
  transform-origin: 50% 100%;
  animation: launch-flicker 1.1s ease-in-out infinite alternate;
}
@keyframes launch-flicker {
  0% { transform: scale(1, 1) rotate(-2deg); }
  25% { transform: scale(0.9, 1.08) rotate(2deg); }
  50% { transform: scale(1.06, 0.94) rotate(-1deg); }
  75% { transform: scale(0.94, 1.12) rotate(1.5deg); }
  100% { transform: scale(1, 1.02) rotate(-2deg); }
}
.launch-diya-glow {
  position: absolute; bottom: 4px; left: 50%; width: 130px; height: 130px; margin-left: -65px;
  background: radial-gradient(circle, rgba(251, 191, 36, 0.38), transparent 62%);
  animation: launch-glow 1.8s ease-in-out infinite alternate;
}
@keyframes launch-glow { from { opacity: 0.6; transform: scale(0.92); } to { opacity: 1; transform: scale(1.06); } }

/* Rangoli */
.launch-rangoli {
  translate: -50% -50%;
  animation: launch-spin 80s linear infinite, launch-appear 1.4s ease-out both;
}
@keyframes launch-spin { to { transform: rotate(360deg); } }
@keyframes launch-appear { from { opacity: 0; } to { opacity: 0.32; } }

/* Petals */
.launch-petal {
  position: absolute; top: -5vh; border-radius: 60% 0 60% 0; opacity: 0.9;
  animation-name: launch-fall; animation-timing-function: linear; animation-iteration-count: infinite;
}
@keyframes launch-fall {
  from { transform: translate3d(0, -5vh, 0) rotate(0deg); }
  to { transform: translate3d(var(--drift), 110vh, 0) rotate(560deg); }
}

@media (prefers-reduced-motion: reduce) {
  .launch-strand, .launch-diya-flame, .launch-diya-glow, .launch-rangoli, .launch-shimmer,
  .launch-ring, .launch-star { animation: none !important; }
}
`;
