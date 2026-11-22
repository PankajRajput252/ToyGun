import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, CalendarCheck, CalendarClock, CalendarDays, CheckCircle2, Clock, Hourglass, Loader2, LogIn, Mail,
  MessageSquareText, QrCode, Video, X,
} from "lucide-react";
import { Modal } from "../../components/ui/modal";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { PaymentApiError, errorMessage, formatInr } from "../../services/paymentApi";
import ManualPaymentModal from "../../components/payment/ManualPaymentModal";
import {
  ConsultationBooking, ConsultationSlot, ConsultationTopic, consultationApi, dayKey, formatTime, formatWhen,
} from "../../services/consultationApi";

// Book a consultation: pick a topic, a day and a time; we email a Google Meet link.
// Paid topics (price set by admin): booking holds the slot, the user pays by QR / bank transfer and uploads the
// receipt; once an admin approves the payment the booking is confirmed and the Meet link is emailed.

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
  /** Booking whose payment form is open. */
  const [payFor, setPayFor] = useState<ConsultationBooking | null>(null);
  /** Booking whose cancel / reschedule popup is open. */
  const [manage, setManage] = useState<ConsultationBooking | null>(null);

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
  const upcoming = mine.filter((b) => b.status !== "CANCELLED" && new Date(b.endsAt) > new Date());
  const anyPaid = topics.some((t) => isPaid(t.price));

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
      if (b.status === "PENDING_PAYMENT") setPayFor(b);
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
      return true;
    } catch (err) {
      showToast(errorMessage(err), "error");
      return false;
    }
  };

  const rescheduleBooking = async (b: ConsultationBooking, newSlotId: number) => {
    try {
      const moved = await consultationApi.reschedule(b.id, newSlotId);
      showToast(`Rescheduled to ${formatWhen(moved)}. We've emailed you the details.`);
      if (confirmed?.id === b.id) setConfirmed(moved);
      loadMine();
      loadSlots().catch(() => {});
      return true;
    } catch (err) {
      showToast(errorMessage(err), "error");
      // The time may have just been taken: refresh the list
      loadSlots().catch(() => {});
      return false;
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
          <Confirmation booking={confirmed} onPay={() => setPayFor(confirmed)} onDone={() => setConfirmed(null)} />
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
                      {anyPaid && (
                        <span className="mt-1 block text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          {isPaid(t.price) ? formatInr(t.price!) : "Free"}
                        </span>
                      )}
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
                      {isPaid(topic.price) && (
                        <>
                          {" · "}
                          <b className="text-gray-900 dark:text-white">{formatInr(topic.price!)}</b>
                        </>
                      )}
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
                  {booking
                    ? "Booking…"
                    : !isAuthenticated
                      ? "Sign in to book"
                      : topic && isPaid(topic.price)
                        ? `Book & pay ${formatInr(topic.price!)}`
                        : "Confirm booking"}
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
                  <UpcomingItem key={b.id} booking={b} onPay={() => setPayFor(b)} onManage={() => {
                      setManage(b);
                      loadSlots().catch(() => {});
                    }}
                  />
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
              ...(anyPaid ? [[QrCode, "Pay the fee by UPI QR or bank transfer and upload the receipt"]] : []),
              [Mail, anyPaid ? "Once your payment is verified, we email you a Google Meet link" : "We email you the confirmation with a Google Meet link"],
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

      {manage && (
        <CancelOrRescheduleModal
          booking={manage}
          slots={slots.filter((s) => s.id !== manage.slotId)}
          onClose={() => setManage(null)}
          onReschedule={(newSlotId) => rescheduleBooking(manage, newSlotId)}
          onCancel={() => cancelBooking(manage)}
        />
      )}

      {payFor && payFor.amount != null && (
        <ManualPaymentModal
          isOpen
          amount={payFor.amount}
          consultationBookingId={payFor.id}
          description={`Pay for your ${payFor.topicName} consultation (${formatWhen(payFor)}), then upload your receipt. We'll email your Google Meet link once the payment is verified.`}
          onClose={() => setPayFor(null)}
          onSubmitted={() => {
            const done: ConsultationBooking = { ...payFor, paymentStatus: "PENDING", paymentDueAt: null, paymentRejectionReason: null };
            if (confirmed?.id === payFor.id) setConfirmed(done);
            setPayFor(null);
            showToast("Payment submitted. We'll confirm your consultation once it's verified.");
            loadMine();
          }}
        />
      )}
    </div>
  );
}

const isPaid = (price: number | null | undefined) => price != null && price > 0;

/** "Pay by 4:30 pm" for a held booking. */
const payByText = (b: ConsultationBooking) => (b.paymentDueAt ? `Pay by ${formatTime(b.paymentDueAt)} to keep this time` : null);

function Confirmation({ booking, onPay, onDone }: { booking: ConsultationBooking; onPay: () => void; onDone: () => void }) {
  if (booking.status === "PENDING_PAYMENT") {
    const underReview = booking.paymentStatus === "PENDING";
    return (
      <section className="rounded-2xl border-2 border-amber-400 bg-amber-400/10 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <Hourglass className="h-8 w-8 flex-shrink-0 text-amber-500" />
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {underReview ? "Payment submitted — waiting for admin approval" : "Your time is held — complete the payment"}
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              <b>{booking.topicName}</b> · {formatWhen(booking)} · <b>{formatInr(booking.amount ?? 0)}</b>
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {underReview
                ? <>Your booking is not confirmed yet. Once an admin approves the payment, we'll confirm it and email the Google Meet link to <b>{booking.userEmail}</b>.</>
                : payByText(booking) ?? "Pay to confirm this consultation."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {!underReview && (
                <button
                  onClick={onPay}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  <QrCode className="h-4 w-4" /> Pay {formatInr(booking.amount ?? 0)}
                </button>
              )}
              <button
                onClick={onDone}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-white/50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-white/5"
              >
                {underReview ? "Book another" : "Back"}
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }
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

function UpcomingItem({ booking, onPay, onManage }: {
  booking: ConsultationBooking; onPay: () => void; onManage: () => void;
}) {
  const awaitingPayment = booking.status === "PENDING_PAYMENT";
  const underReview = awaitingPayment && booking.paymentStatus === "PENDING";
  return (
    <li className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
      <p className="text-sm font-semibold text-gray-900 dark:text-white">{booking.topicName}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
        <Clock className="h-3.5 w-3.5" /> {formatWhen(booking)}
      </p>
      {awaitingPayment && (
        <div className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          {underReview ? (
            <>Payment of {formatInr(booking.amount ?? 0)} submitted — waiting for admin approval. Not confirmed yet.</>
          ) : (
            <>
              {booking.paymentStatus === "REJECTED"
                ? <>Payment rejected{booking.paymentRejectionReason ? `: ${booking.paymentRejectionReason}` : ""}. Please pay again.</>
                : <>Awaiting payment of {formatInr(booking.amount ?? 0)}.</>}
              {payByText(booking) && <span className="block">{payByText(booking)}</span>}
            </>
          )}
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {awaitingPayment ? (
          !underReview && (
            <button
              onClick={onPay}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
            >
              <QrCode className="h-3.5 w-3.5" /> Pay now
            </button>
          )
        ) : booking.meetLink ? (
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
        <button onClick={onManage} className="ml-auto inline-flex items-center gap-1 text-xs text-red-500 hover:underline">
          <X className="h-3.5 w-3.5" /> {booking.reschedulesLeft > 0 ? "Cancel / reschedule" : "Cancel"}
        </button>
      </div>
    </li>
  );
}

/**
 * Shown when the user wants to cancel: offers moving to another free slot first.
 * A paid, confirmed consultation can still be cancelled, but the fee is not refunded.
 */
function CancelOrRescheduleModal({ booking, slots, onClose, onReschedule, onCancel }: {
  booking: ConsultationBooking;
  slots: ConsultationSlot[];
  onClose: () => void;
  onReschedule: (slotId: number) => Promise<boolean>;
  onCancel: () => Promise<boolean>;
}) {
  const [busy, setBusy] = useState<"move" | "cancel" | null>(null);
  const [slotId, setSlotId] = useState<number | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const days = useMemo(() => {
    const map = new Map<string, ConsultationSlot[]>();
    slots.forEach((s) => map.set(dayKey(s.startsAt), [...(map.get(dayKey(s.startsAt)) ?? []), s]));
    return Array.from(map.entries()).map(([key, list]) => ({ key, slots: list }));
  }, [slots]);
  const [pickedDay, setDay] = useState<string | null>(null);
  // Slots refresh while the popup is open: fall back to the first day that still has times
  const day = days.some((d) => d.key === pickedDay) ? pickedDay : (days[0]?.key ?? null);
  const daySlots = days.find((d) => d.key === day)?.slots ?? [];
  const chosen = slots.find((s) => s.id === slotId) ?? null;

  const paid = booking.status === "CONFIRMED" && booking.amount != null;
  const canReschedule = booking.reschedulesLeft > 0;
  const underReview = booking.status === "PENDING_PAYMENT" && booking.paymentStatus === "PENDING";

  const run = async (kind: "move" | "cancel") => {
    setBusy(kind);
    const ok = kind === "move" ? await onReschedule(slotId!) : await onCancel();
    setBusy(null);
    if (ok) onClose();
    else if (kind === "move") setSlotId(null);
  };

  return (
    <Modal isOpen onClose={busy ? () => {} : onClose} className="max-w-lg p-5 sm:p-6" showCloseButton={!busy}>
      <h2 className="pr-10 text-lg font-bold text-gray-900 dark:text-white">{canReschedule ? "Can't make it?" : "Cancel consultation?"}</h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
        <b>{booking.topicName}</b> · {formatWhen(booking)}
      </p>

      {/* Reschedule */}
      <section className="mt-5 rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
          <CalendarClock className="h-4 w-4 text-emerald-500" /> Reschedule to another time
        </h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {canReschedule
            ? `${booking.amount != null ? "Your payment stays with the booking — nothing to pay again. " : ""}You can reschedule only once.`
            : ""}
        </p>
        {!canReschedule ? (
          <p className="mt-2 rounded-lg bg-gray-100 p-3 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            This booking has already been rescheduled once and can't be moved again.
          </p>
        ) : days.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">No other times are free right now. Please check back later.</p>
        ) : (
          <>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {days.map((d) => {
                const on = d.key === day;
                const date = new Date(d.slots[0].startsAt);
                return (
                  <button
                    key={d.key}
                    onClick={() => {
                      setDay(d.key);
                      setSlotId(null);
                    }}
                    aria-pressed={on}
                    className={`flex-shrink-0 w-14 rounded-lg border py-1.5 text-center text-xs transition ${
                      on ? "border-emerald-500 bg-emerald-500 text-white" : "border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-200"
                    }`}
                  >
                    <span className="block uppercase opacity-80">{date.toLocaleDateString("en-IN", { weekday: "short" })}</span>
                    <span className="block text-base font-bold leading-tight">{date.getDate()}</span>
                    <span className="block opacity-80">{date.toLocaleDateString("en-IN", { month: "short" })}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {daySlots.map((s) => {
                const on = s.id === slotId;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSlotId(s.id)}
                    aria-pressed={on}
                    className={`rounded-lg border px-2 py-1.5 text-sm font-medium transition ${
                      on
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-gray-300 text-gray-700 hover:border-emerald-500 dark:border-gray-600 dark:text-gray-200"
                    }`}
                  >
                    {formatTime(s.startsAt)}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => run("move")}
              disabled={!chosen || busy !== null}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === "move" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
              {chosen ? `Move to ${formatWhen(chosen)}` : "Choose a new time"}
            </button>
          </>
        )}
      </section>

      {/* Cancel */}
      <section className="mt-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
        <h3 className="flex items-center justify-between gap-2 text-sm font-semibold text-gray-900 dark:text-white">
          Cancel the consultation
          <a href="/terms#terms-6" target="_blank" rel="noopener noreferrer" className="text-xs font-normal text-gray-500 underline hover:text-gray-700 dark:hover:text-gray-300">
            Consultation terms
          </a>
        </h3>
        {underReview ? (
          <p className="mt-1 text-sm text-gray-500">
            Your payment is waiting for admin approval, so this booking can't be cancelled right now. You can still reschedule it above.
          </p>
        ) : (
          <>
            {paid ? (
              <p className="mt-2 flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>
                  The consultation fee of <b>{formatInr(booking.amount!)}</b> is <b>non-refundable</b>. If you cancel, the money will not be
                  returned.{canReschedule && " Reschedule instead to keep your payment."}
                </span>
              </p>
            ) : (
              <p className="mt-1 text-sm text-gray-500">The time will be released for others to book.</p>
            )}
            {paid && (
              <label className="mt-3 flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={confirmCancel}
                  onChange={(e) => setConfirmCancel(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                I understand my payment will not be refunded
              </label>
            )}
            <button
              onClick={() => run("cancel")}
              disabled={busy !== null || (paid && !confirmCancel)}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === "cancel" && <Loader2 className="h-4 w-4 animate-spin" />}
              {paid ? "Cancel without refund" : "Cancel booking"}
            </button>
          </>
        )}
      </section>

      <div className="mt-4 flex justify-end">
        <button onClick={onClose} disabled={busy !== null} className="text-sm text-gray-500 hover:underline disabled:opacity-50">
          Keep my booking
        </button>
      </div>
    </Modal>
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
