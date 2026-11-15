import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarCheck, CalendarDays, CheckCircle2, Clock, Loader2, LogIn, Mail, MessageSquareText, Video, X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { PaymentApiError, errorMessage } from "../../services/paymentApi";
import {
  ConsultationBooking, ConsultationSlot, ConsultationTopic, consultationApi, dayKey, formatTime, formatWhen,
} from "../../services/consultationApi";

// Book a consultation: pick a topic, a day and a time; we email a Google Meet link.

/** Home opens the Consultation card when it finds this (set before sending a guest to sign in). */
export const OPEN_CONSULTATION_KEY = "bw-open-consultation";

const inputCls =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 " +
  "focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30 " +
  "dark:border-gray-700 dark:bg-gray-900 dark:text-white";

const stepTitle = (n: number, text: string) => (
  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">{n}</span>
    {text}
  </h3>
);

export default function ConsultationPanel() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [topics, setTopics] = useState<ConsultationTopic[]>([]);
  const [slots, setSlots] = useState<ConsultationSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [topicId, setTopicId] = useState<number | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [slotId, setSlotId] = useState<number | null>(null);
  const [phone, setPhone] = useState(user?.mobile ?? "");
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<ConsultationBooking | null>(null);

  const [mine, setMine] = useState<ConsultationBooking[]>([]);

  const loadSlots = useCallback(async () => {
    const s = await consultationApi.slots(30);
    setSlots(s);
    return s;
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([consultationApi.topics(), consultationApi.slots(30)])
      .then(([t, s]) => {
        if (cancelled) return;
        setTopics(t);
        setSlots(s);
        if (t.length === 1) setTopicId(t[0].id);
      })
      .catch((err) => !cancelled && setLoadError(errorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const loadMine = useCallback(() => {
    if (!isAuthenticated) return setMine([]);
    consultationApi.mine().then(setMine).catch(() => {});
  }, [isAuthenticated]);
  useEffect(loadMine, [loadMine]);

  useEffect(() => {
    if (user?.mobile && !phone) setPhone(user.mobile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.mobile]);

  // Days that still have free slots, in the viewer's time zone
  const days = useMemo(() => {
    const map = new Map<string, ConsultationSlot[]>();
    slots.forEach((s) => {
      const k = dayKey(s.startsAt);
      map.set(k, [...(map.get(k) ?? []), s]);
    });
    return Array.from(map.entries()).map(([key, list]) => ({ key, first: list[0].startsAt, slots: list }));
  }, [slots]);

  // Keep a valid day selected
  useEffect(() => {
    if (!days.length) return setDay(null);
    if (!day || !days.some((d) => d.key === day)) setDay(days[0].key);
  }, [days, day]);

  const daySlots = days.find((d) => d.key === day)?.slots ?? [];
  const slot = slots.find((s) => s.id === slotId) ?? null;
  const topic = topics.find((t) => t.id === topicId) ?? null;
  const upcoming = mine.filter((b) => b.status === "CONFIRMED" && new Date(b.endsAt) > new Date());

  const book = async () => {
    if (!topic || !slot) return;
    if (!isAuthenticated) {
      try {
        sessionStorage.setItem(OPEN_CONSULTATION_KEY, "1");
      } catch {
        /* ignore */
      }
      showToast("Please sign in to book your consultation", "info");
      navigate("/signin");
      return;
    }
    const cleanPhone = phone.trim();
    if (cleanPhone && !/^[+]?[0-9 ]{7,15}$/.test(cleanPhone)) {
      setBookError("Enter a valid phone number, or leave it empty.");
      return;
    }
    setBooking(true);
    setBookError(null);
    try {
      const b = await consultationApi.book({ slotId: slot.id, topicId: topic.id, phone: cleanPhone || undefined, notes: notes.trim() || undefined });
      setConfirmed(b);
      setSlotId(null);
      setNotes("");
      loadMine();
      loadSlots().catch(() => {});
      document.getElementById("consultation")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      setBookError(errorMessage(err));
      // Someone else took it, or it's gone: refresh the times
      if (err instanceof PaymentApiError && (err.status === 409 || err.status === 404)) {
        setSlotId(null);
        loadSlots().catch(() => {});
      }
    } finally {
      setBooking(false);
    }
  };

  const cancelBooking = async (b: ConsultationBooking) => {
    try {
      await consultationApi.cancel(b.id);
      showToast("Consultation cancelled. We've emailed you a confirmation.");
      if (confirmed?.id === b.id) setConfirmed(null);
      loadMine();
      loadSlots().catch(() => {});
    } catch (err) {
      showToast(errorMessage(err), "error");
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }
  if (loadError) {
    return <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">{loadError}</div>;
  }

  return (
    <div id="consultation" className="grid gap-6 lg:grid-cols-3 scroll-mt-24">
      <div className="lg:col-span-2 space-y-6">
        {confirmed ? (
          <Confirmation booking={confirmed} onDone={() => setConfirmed(null)} />
        ) : topics.length === 0 ? (
          <EmptyCard icon={MessageSquareText} title="Consultations are opening soon" text="Our experts will be available to book here shortly." />
        ) : (
          <>
            {/* 1. Topic */}
            <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-gray-700 dark:bg-gray-800/60">
              {stepTitle(1, "What would you like to talk about?")}
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {topics.map((t) => {
                  const on = t.id === topicId;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTopicId(t.id)}
                      aria-pressed={on}
                      className={`text-left rounded-xl border-2 p-3 transition ${
                        on
                          ? "border-emerald-500 bg-emerald-500/10"
                          : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-500"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">{t.name}</span>
                        {on && <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />}
                      </span>
                      {t.description && <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{t.description}</span>}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 2. Day and time */}
            <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-gray-700 dark:bg-gray-800/60">
              {stepTitle(2, "Pick a day and time")}
              {days.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  All times are booked right now. New slots are added regularly — please check back soon.
                </p>
              ) : (
                <>
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {days.map((d) => {
                      const on = d.key === day;
                      const date = new Date(d.first);
                      return (
                        <button
                          key={d.key}
                          onClick={() => {
                            setDay(d.key);
                            setSlotId(null);
                          }}
                          aria-pressed={on}
                          className={`flex-shrink-0 w-[4.5rem] rounded-xl border-2 py-2 text-center transition ${
                            on
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-gray-200 text-gray-700 hover:border-gray-300 dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-500"
                          }`}
                        >
                          <span className="block text-[11px] font-medium uppercase opacity-80">
                            {date.toLocaleDateString("en-IN", { weekday: "short" })}
                          </span>
                          <span className="block text-lg font-bold leading-tight">{date.getDate()}</span>
                          <span className="block text-[11px] opacity-80">{date.toLocaleDateString("en-IN", { month: "short" })}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                    {daySlots.map((s) => {
                      const on = s.id === slotId;
                      return (
                        <button
                          key={s.id}
                          onClick={() => setSlotId(s.id)}
                          aria-pressed={on}
                          className={`rounded-lg border px-2 py-2 text-sm font-medium transition ${
                            on
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-gray-300 text-gray-700 hover:border-emerald-500 hover:text-emerald-600 dark:border-gray-600 dark:text-gray-200 dark:hover:text-emerald-400"
                          }`}
                        >
                          {formatTime(s.startsAt)}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    Times are in your time zone · each consultation is {daySlots[0]?.durationMinutes ?? 30} minutes on Google Meet
                  </p>
                </>
              )}
            </section>

            {/* 3. Details + confirm */}
            <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-gray-700 dark:bg-gray-800/60">
              {stepTitle(3, "Your details")}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Phone (optional)</span>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="+91 98765 43210" className={inputCls} />
                </label>
                <div className="text-sm">
                  <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Meeting link goes to</span>
                  <p className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2.5 text-gray-700 dark:border-gray-700 dark:text-gray-300">
                    <Mail className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    <span className="truncate">{isAuthenticated ? user?.email : "Your account email (sign in to book)"}</span>
                  </p>
                </div>
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">What would you like to discuss? (optional)</span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={1000}
                    rows={3}
                    placeholder="A few lines help our expert prepare."
                    className={inputCls}
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-col gap-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-900/60 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {topic && slot ? (
                    <>
                      <b className="text-gray-900 dark:text-white">{topic.name}</b> · {formatWhen(slot)}
                    </>
                  ) : (
                    "Choose a topic and a time to continue."
                  )}
                </p>
                <button
                  onClick={book}
                  disabled={!topic || !slot || booking}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white
                             hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {booking ? <Loader2 className="h-4 w-4 animate-spin" /> : isAuthenticated ? <CalendarCheck className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                  {booking ? "Booking…" : isAuthenticated ? "Confirm booking" : "Sign in to book"}
                </button>
              </div>
              {bookError && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">{bookError}</p>}
            </section>
          </>
        )}
      </div>

      {/* Side: my consultations + how it works */}
      <aside className="space-y-4">
        {isAuthenticated && (
          <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/60">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
              <CalendarDays className="h-4 w-4 text-emerald-500" /> My consultations
            </h3>
            {upcoming.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming consultations.</p>
            ) : (
              <ul className="space-y-3">
                {upcoming.map((b) => (
                  <UpcomingItem key={b.id} booking={b} onCancel={() => cancelBooking(b)} />
                ))}
              </ul>
            )}
          </section>
        )}
        <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/60">
          <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">How it works</h3>
          <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            {[
              [CalendarCheck, "Pick a topic and a free time"],
              [Mail, "We email you the confirmation with a Google Meet link"],
              [Video, "Join the call at your time — no app needed in a browser"],
            ].map(([Icon, text], i) => {
              const I = Icon as typeof Mail;
              return (
                <li key={i} className="flex items-start gap-2.5">
                  <I className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                  {text as string}
                </li>
              );
            })}
          </ol>
        </section>
      </aside>
    </div>
  );
}

function Confirmation({ booking, onDone }: { booking: ConsultationBooking; onDone: () => void }) {
  return (
    <section className="rounded-2xl border-2 border-emerald-500 bg-emerald-500/10 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-8 w-8 flex-shrink-0 text-emerald-500" />
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Your consultation is booked</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            <b>{booking.topicName}</b> · {formatWhen(booking)}
          </p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            A confirmation has been sent to <b>{booking.userEmail}</b>.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {booking.meetLink ? (
              <a
                href={booking.meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                <Video className="h-4 w-4" /> Google Meet link
              </a>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-300">We'll email you the Google Meet link before the call.</p>
            )}
            <button
              onClick={onDone}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-white/50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-white/5"
            >
              Book another
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function UpcomingItem({ booking, onCancel }: { booking: ConsultationBooking; onCancel: () => Promise<void> | void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <li className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
      <p className="text-sm font-semibold text-gray-900 dark:text-white">{booking.topicName}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
        <Clock className="h-3.5 w-3.5" /> {formatWhen(booking)}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {booking.meetLink ? (
          <a
            href={booking.meetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
          >
            <Video className="h-3.5 w-3.5" /> Join
          </a>
        ) : (
          <span className="text-xs text-gray-500">Meet link coming by email</span>
        )}
        {confirming ? (
          <>
            <button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                await onCancel();
                setBusy(false);
                setConfirming(false);
              }}
              className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50"
            >
              {busy && <Loader2 className="h-3 w-3 animate-spin" />} Yes, cancel
            </button>
            <button onClick={() => setConfirming(false)} className="text-xs text-gray-500 hover:underline">
              Keep
            </button>
          </>
        ) : (
          <button onClick={() => setConfirming(true)} className="ml-auto inline-flex items-center gap-1 text-xs text-red-500 hover:underline">
            <X className="h-3.5 w-3.5" /> Cancel
          </button>
        )}
      </div>
    </li>
  );
}

function EmptyCard({ icon: Icon, title, text }: { icon: typeof Mail; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-800/60">
      <Icon className="mx-auto h-10 w-10 text-gray-300" />
      <p className="mt-3 font-semibold text-gray-800 dark:text-white">{title}</p>
      <p className="mt-1 text-sm text-gray-500">{text}</p>
    </div>
  );
}
