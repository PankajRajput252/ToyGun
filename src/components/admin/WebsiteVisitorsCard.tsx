import { useEffect, useState } from "react";
import { Globe, Loader2 } from "lucide-react";
import { VisitDay, VisitStats, VisitTotals, visitApi } from "../../services/visitApi";
import { errorMessage } from "../../services/paymentApi";

// Admin dashboard: how many people visited the website (guests included).

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

const fmt = (n: number) => n.toLocaleString("en-IN");
const dayLabel = (iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", opts);

function Tile({ label, totals, note }: { label: string; totals: VisitTotals; note?: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-[#14142a] p-3 sm:p-4">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">{label}</p>
      <p className="mt-1 text-2xl sm:text-3xl font-bold leading-none text-white tabular-nums">{fmt(totals.visitors)}</p>
      <p className="mt-1.5 text-xs text-gray-500">
        {fmt(totals.visits)} visit{totals.visits === 1 ? "" : "s"} · {fmt(totals.loggedInVisitors)} signed in
      </p>
      {note && <p className="mt-0.5 text-xs text-gray-400">{note}</p>}
    </div>
  );
}

function DailyChart({ days }: { days: VisitDay[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...days.map((d) => d.visitors));
  const h = hover != null ? days[hover] : null;
  const labelEvery = days.length > 31 ? 15 : days.length > 10 ? 7 : 1;

  return (
    <div>
      <div className="relative">
        {/* y max + baseline (recessive) */}
        <span className="absolute -top-1 left-0 text-[10px] text-gray-500 tabular-nums">{fmt(max)}</span>
        <div
          className="flex h-40 items-end gap-[2px] border-b border-gray-700 pl-8"
          onMouseLeave={() => setHover(null)}
          role="img"
          aria-label={`Daily website visitors for the last ${days.length} days`}
        >
          {days.map((d, i) => (
            <div
              key={d.date}
              className="flex h-full flex-1 cursor-default items-end"
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              tabIndex={0}
              aria-label={`${dayLabel(d.date)}: ${d.visitors} visitors, ${d.visits} visits`}
            >
              <div
                className={`w-full rounded-t-[4px] transition-colors ${hover === i ? "bg-amber-300" : "bg-amber-500"}`}
                style={{ height: d.visitors ? `${Math.max(2, (d.visitors / max) * 100)}%` : "0" }}
              />
            </div>
          ))}
        </div>

        {/* tooltip */}
        {h && (
          <div
            className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-gray-700 bg-gray-900 px-2.5 py-1.5 text-xs shadow-lg"
            style={{ left: `calc(2rem + (100% - 2rem) * ${(hover! + 0.5) / days.length})` }}
          >
            <p className="font-semibold text-white">{dayLabel(h.date, { weekday: "short", day: "numeric", month: "short" })}</p>
            <p className="text-gray-300">
              <span className="tabular-nums text-white">{fmt(h.visitors)}</span> visitors ·{" "}
              <span className="tabular-nums text-white">{fmt(h.visits)}</span> visits
            </p>
          </div>
        )}
      </div>

      {/* x labels */}
      <div className="mt-1 flex gap-[2px] pl-8 text-[10px] text-gray-500">
        {days.map((d, i) => (
          <span key={d.date} className="flex-1 overflow-visible whitespace-nowrap text-center">
            {i === days.length - 1 ? "Today" : (days.length - 1 - i) % labelEvery === 0 ? dayLabel(d.date) : ""}
          </span>
        ))}
      </div>

      {/* table view for screen readers */}
      <table className="sr-only">
        <caption>Daily website visitors</caption>
        <thead>
          <tr><th>Date</th><th>Visitors</th><th>Visits</th></tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.date}><td>{d.date}</td><td>{d.visitors}</td><td>{d.visits}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function WebsiteVisitorsCard() {
  const [range, setRange] = useState<Range>(30);
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    visitApi
      .stats(range)
      .then((s) => !cancelled && setStats(s))
      .catch((err) => !cancelled && setError(errorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [range]);

  const diff = stats ? stats.today.visitors - stats.yesterday.visitors : 0;
  const vsYesterday = stats
    ? `${diff === 0 ? "Same as" : diff > 0 ? `${fmt(diff)} more than` : `${fmt(-diff)} fewer than`} yesterday (${fmt(stats.yesterday.visitors)})`
    : undefined;

  return (
    <section className="mb-8 rounded-2xl border border-gray-800 bg-[#1a1a2e] p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-white">
            <Globe className="h-4 w-4 text-yellow-400" />
            Website Visitors
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">
            People who opened the site, guests included (each browser counted once per day). Admin visits are not counted.
          </p>
        </div>
        <div className="flex rounded-lg bg-gray-800 p-1" role="group" aria-label="Chart range">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              aria-pressed={range === r}
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                range === r ? "bg-yellow-500 text-black" : "text-gray-400 hover:text-white"
              }`}
            >
              {r} days
            </button>
          ))}
        </div>
      </div>

      {loading && !stats ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
        </div>
      ) : error ? (
        <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">Couldn't load visitor stats: {error}</p>
      ) : stats ? (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tile label="Today" totals={stats.today} note={vsYesterday} />
            <Tile label="Last 7 days" totals={stats.last7Days} />
            <Tile label="Last 30 days" totals={stats.last30Days} />
            <Tile label="All time" totals={stats.allTime} />
          </div>
          <p className="mb-3 text-xs font-medium text-gray-400">Unique visitors per day</p>
          <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <DailyChart days={stats.daily} />
          </div>
        </>
      ) : null}
    </section>
  );
}
