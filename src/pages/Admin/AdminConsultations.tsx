import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays, CalendarPlus, CheckCircle2, Copy, ExternalLink, Link2, Loader2, Mail, Pencil, Phone, Plus,
  RefreshCw, Tags, Trash2, Unplug, Video, X,
} from "lucide-react";
import { Modal } from "../../components/ui/modal";
import { useToast } from "../../context/ToastContext";
import { PaymentApiError, errorMessage, formatDateTime, formatInr } from "../../services/paymentApi";
import {
  AdminSlot, ConsultationBooking, ConsultationTopic, GoogleStatus, consultationAdminApi, dayKey, formatDay, formatTime,
  formatWhen, isoDate,
} from "../../services/consultationApi";

// Admin: consultation topics, bookable time slots, bookings, and the Google account that creates Meet links.

const inputCls =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 " +
  "focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30 " +
  "dark:border-gray-700 dark:bg-gray-900 dark:text-white";
const cardCls = "rounded-xl border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-5";
const btnOutline =
  "inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 " +
  "disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700";
const btnPrimary =
  "inline-flex items-center gap-1.5 rounded-lg bg-gold-500 px-3 py-2 text-sm font-semibold text-white hover:bg-gold-600 disabled:opacity-50";
const label = (text: string) => <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{text}</span>;

type Tab = "bookings" | "slots" | "topics";

export default function AdminConsultations() {
  const [tab, setTab] = useState<Tab>("bookings");
  const [google, setGoogle] = useState<GoogleStatus | null>(null);

  const loadGoogle = useCallback(() => {
    consultationAdminApi.googleStatus().then(setGoogle).catch(() => setGoogle(null));
  }, []);
  useEffect(loadGoogle, [loadGoogle]);

  const tabBtn = (t: Tab, text: string, Icon: typeof Tags) => (
    <button
      onClick={() => setTab(t)}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
        tab === t ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white" : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
      }`}
    >
      <Icon className="h-4 w-4" /> {text}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-6 dark:bg-gray-900 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Consultations</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Users pick a topic and a free slot; they get an email with a Google Meet link right away. For topics with a fee,
            the slot is held until you approve their payment in Payment approvals.
          </p>
        </div>

        <GoogleCard status={google} onChanged={loadGoogle} />

        <div className="flex w-fit flex-wrap gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          {tabBtn("bookings", "Bookings", CalendarDays)}
          {tabBtn("slots", "Time slots", CalendarPlus)}
          {tabBtn("topics", "Topics", Tags)}
        </div>

        {tab === "bookings" && <BookingsTab googleConnected={!!google?.connected} />}
        {tab === "slots" && <SlotsTab />}
        {tab === "topics" && <TopicsTab />}
      </div>
    </div>
  );
}

// ─── Google account ───────────────────────────────────────────────────────────

function GoogleCard({ status, onChanged }: { status: GoogleStatus | null; onChanged: () => void }) {
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  // Back from Google's consent page: ?google=connected | ?google=error&message=…
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const result = q.get("google");
    if (!result) return;
    if (result === "connected") showToast("Google account connected — new bookings get a Meet link automatically");
    else showToast(q.get("message") || "Couldn't connect the Google account", "error");
    onChanged();
    navigate(location.pathname, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const connect = async () => {
    setBusy(true);
    try {
      const { url } = await consultationAdminApi.googleAuthorizeUrl();
      window.location.assign(url);
    } catch (err) {
      showToast(errorMessage(err), "error");
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      await consultationAdminApi.disconnectGoogle();
      showToast("Google account disconnected", "info");
      setConfirmDisconnect(false);
      onChanged();
    } catch (err) {
      showToast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${cardCls} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${status?.connected ? "bg-emerald-500" : "bg-gray-400"} text-white`}>
          <Video className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white">Google Meet links</p>
          {!status ? (
            <p className="text-sm text-gray-500">Checking…</p>
          ) : !status.configured ? (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Not set up on the server yet. Bookings still work, but you'll need to add Meet links by hand.
            </p>
          ) : status.connected ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Connected as <b>{status.accountEmail ?? "Google account"}</b>. Every booking gets its own Meet link and calendar invite.
            </p>
          ) : (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Connect the Google account that will host the calls, so bookings get a Meet link automatically.
            </p>
          )}
        </div>
      </div>
      {status?.configured && (
        status.connected ? (
          confirmDisconnect ? (
            <div className="flex gap-2">
              <button onClick={disconnect} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Disconnect
              </button>
              <button onClick={() => setConfirmDisconnect(false)} className={btnOutline}>Keep</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDisconnect(true)} className={btnOutline}>
              <Unplug className="h-4 w-4" /> Disconnect
            </button>
          )
        ) : (
          <button onClick={connect} disabled={busy} className={btnPrimary}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />} Connect Google account
          </button>
        )
      )}
    </div>
  );
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

function BookingsTab({ googleConnected }: { googleConnected: boolean }) {
  const { showToast } = useToast();
  const [range, setRange] = useState<"upcoming" | "past">("upcoming");
  const [list, setList] = useState<ConsultationBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [linkFor, setLinkFor] = useState<ConsultationBooking | null>(null);
  const [cancelFor, setCancelFor] = useState<ConsultationBooking | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data =
        range === "upcoming"
          ? await consultationAdminApi.bookings(isoDate(0), isoDate(120))
          : await consultationAdminApi.bookings(isoDate(-120), isoDate(0));
      const now = Date.now();
      setList(
        range === "upcoming"
          ? data.filter((b) => new Date(b.endsAt).getTime() > now)
          : data.filter((b) => new Date(b.endsAt).getTime() <= now).reverse()
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [range]);
  useEffect(() => {
    load();
  }, [load]);

  const replace = (b: ConsultationBooking) => setList((l) => l.map((x) => (x.id === b.id ? b : x)));

  const retry = async (b: ConsultationBooking) => {
    setBusyId(b.id);
    try {
      replace(await consultationAdminApi.retryMeetLink(b.id));
      showToast("Meet link created and emailed to the user");
    } catch (err) {
      showToast(errorMessage(err), "error");
    } finally {
      setBusyId(null);
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Link copied", "info");
    } catch {
      showToast("Couldn't copy — select the link and copy it manually", "error");
    }
  };

  const confirmedCount = list.filter((b) => b.status === "CONFIRMED").length;
  const awaitingCount = list.filter((b) => b.status === "PENDING_PAYMENT").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          {(["upcoming", "past"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize ${
                range === r ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white" : "text-gray-500"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <button onClick={load} className={btnOutline}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorBox text={error} />
      ) : list.length === 0 ? (
        <Empty icon={CalendarDays} title={range === "upcoming" ? "No upcoming bookings" : "No past bookings in the last 4 months"} text={range === "upcoming" ? "Make sure there are free time slots and active topics." : ""} />
      ) : (
        <>
          {range === "upcoming" && (
            <p className="text-sm text-gray-500">
              {confirmedCount} confirmed{awaitingCount > 0 && ` · ${awaitingCount} awaiting payment`}
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {list.map((b) => {
              const cancelled = b.status === "CANCELLED";
              const awaiting = b.status === "PENDING_PAYMENT";
              return (
                <div key={b.id} className={`${cardCls} ${cancelled ? "opacity-60" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white">{b.topicName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{formatWhen(b)}</p>
                    </div>
                    <span
                      className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        cancelled
                          ? "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                          : awaiting
                            ? "bg-amber-400/20 text-amber-700 dark:text-amber-300"
                            : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      }`}
                    >
                      {cancelled
                        ? `Cancelled${b.cancelledBy === "USER" ? " by user" : ""}`
                        : awaiting
                          ? `#${b.id} ${b.paymentStatus === "PENDING" ? "Payment to verify" : "Awaiting payment"}`
                          : `#${b.id} Confirmed`}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <p className="font-medium">{b.userName || "—"}</p>
                    <p className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-gray-400" /> {b.userEmail}</p>
                    {b.phone && <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-gray-400" /> {b.phone}</p>}
                    {b.notes && <p className="mt-2 whitespace-pre-line rounded-lg bg-gray-50 p-2 text-xs dark:bg-gray-900/60">{b.notes}</p>}
                    {cancelled && b.cancelReason && <p className="text-xs text-gray-500">Reason: {b.cancelReason}</p>}
                    {b.amount != null && (
                      <p className="text-xs text-gray-500">
                        Fee {formatInr(b.amount)}
                        {b.paymentStatus && ` · payment ${b.paymentStatus.toLowerCase()}`}
                        {b.paymentId && ` (#${b.paymentId})`}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      Booked {formatDateTime(b.createdAt)}
                      {b.reschedulesLeft === 0 && " · rescheduled by user"}
                    </p>
                  </div>

                  {awaiting && (
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {b.paymentStatus === "PENDING"
                          ? "Approve the payment in Payment approvals to confirm and send the Meet link."
                          : b.paymentDueAt
                            ? `Slot held until ${formatTime(b.paymentDueAt)} for the user to pay.`
                            : "Waiting for the user to pay."}
                      </span>
                      {range === "upcoming" && (
                        <button onClick={() => setCancelFor(b)} className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">
                          <X className="h-3.5 w-3.5" /> Cancel
                        </button>
                      )}
                    </div>
                  )}
                  {!cancelled && !awaiting && (
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-700">
                      {b.meetLink ? (
                        <>
                          <a href={b.meetLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500">
                            <ExternalLink className="h-3.5 w-3.5" /> Open Meet
                          </a>
                          <button onClick={() => copy(b.meetLink!)} className={btnOutline}>
                            <Copy className="h-3.5 w-3.5" /> Copy
                          </button>
                        </>
                      ) : (
                        <span className="text-sm font-medium text-red-600 dark:text-red-400">No Meet link yet</span>
                      )}
                      {range === "upcoming" && (
                        <>
                          {googleConnected && !b.meetLink && (
                            <button onClick={() => retry(b)} disabled={busyId === b.id} className={btnOutline}>
                              {busyId === b.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Create Meet link
                            </button>
                          )}
                          <button onClick={() => setLinkFor(b)} className={btnOutline}>
                            <Pencil className="h-3.5 w-3.5" /> {b.meetLink ? "Change link" : "Add link"}
                          </button>
                          <button onClick={() => setCancelFor(b)} className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">
                            <X className="h-3.5 w-3.5" /> Cancel
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {linkFor && (
        <MeetLinkModal
          booking={linkFor}
          googleConnected={googleConnected}
          onClose={() => setLinkFor(null)}
          onSaved={(b) => {
            replace(b);
            setLinkFor(null);
            showToast("Link saved and emailed to the user");
          }}
        />
      )}
      {cancelFor && (
        <CancelModal
          booking={cancelFor}
          onClose={() => setCancelFor(null)}
          onCancelled={(b) => {
            replace(b);
            setCancelFor(null);
            showToast("Booking cancelled; the user has been emailed and the slot is free again");
          }}
        />
      )}
    </div>
  );
}

function MeetLinkModal({ booking, googleConnected, onClose, onSaved }: {
  booking: ConsultationBooking; googleConnected: boolean; onClose: () => void; onSaved: (b: ConsultationBooking) => void;
}) {
  const [link, setLink] = useState(booking.meetLink ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const generate = async () => {
    setSaving(true);
    setErr(null);
    try {
      onSaved(await consultationAdminApi.retryMeetLink(booking.id));
    } catch (error) {
      setErr(errorMessage(error));
      setSaving(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^https:\/\/\S+$/.test(link.trim())) return setErr("Paste the full link, starting with https://");
    setSaving(true);
    setErr(null);
    try {
      onSaved(await consultationAdminApi.setMeetLink(booking.id, link.trim()));
    } catch (error) {
      setErr(errorMessage(error));
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={saving ? () => {} : onClose} className="max-w-md p-6">
      <form onSubmit={submit}>
        <h2 className="pr-10 text-lg font-bold text-gray-900 dark:text-white">Meeting link</h2>
        <p className="mt-1 text-sm text-gray-500">{booking.topicName} · {formatWhen(booking)}</p>

        {googleConnected ? (
          <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3">
            <button
              type="button"
              onClick={generate}
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
              Generate Google Meet link
            </button>
            <p className="mt-2 text-center text-xs text-gray-500">Creates the meeting and emails the user. Or paste your own link below.</p>
          </div>
        ) : (
          <p className="mt-4 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
            To generate links automatically, connect a Google account in the “Google Meet links” card at the top of this page.
            New bookings then get a Meet link on their own.
          </p>
        )}

        <label className="mt-4 block">
          {label("Google Meet (or other) link")}
          <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://meet.google.com/abc-defg-hij" className={inputCls} autoFocus />
        </label>
        <p className="mt-2 text-xs text-gray-500">The user is emailed this link when you save.</p>
        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving} className={btnOutline}>Cancel</button>
          <button type="submit" disabled={saving} className={btnPrimary}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save & email
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CancelModal({ booking, onClose, onCancelled }: { booking: ConsultationBooking; onClose: () => void; onCancelled: (b: ConsultationBooking) => void }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setSaving(true);
    setErr(null);
    try {
      onCancelled(await consultationAdminApi.cancelBooking(booking.id, reason.trim()));
    } catch (error) {
      setErr(errorMessage(error));
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={saving ? () => {} : onClose} className="max-w-md p-6">
      <h2 className="pr-10 text-lg font-bold text-gray-900 dark:text-white">Cancel this consultation?</h2>
      <p className="mt-1 text-sm text-gray-500">
        {booking.userName || booking.userEmail} · {booking.topicName} · {formatWhen(booking)}
      </p>
      <label className="mt-4 block">
        {label("Reason (optional, included in the email to the user)")}
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} rows={3} className={inputCls} />
      </label>
      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onClose} disabled={saving} className={btnOutline}>Keep booking</button>
        <button onClick={submit} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Cancel booking
        </button>
      </div>
    </Modal>
  );
}

// ─── Slots ────────────────────────────────────────────────────────────────────

const WEEKDAYS = [
  [1, "Mon"], [2, "Tue"], [3, "Wed"], [4, "Thu"], [5, "Fri"], [6, "Sat"], [7, "Sun"],
] as const;

function SlotsTab() {
  const { showToast } = useToast();
  const [slots, setSlots] = useState<AdminSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  // Generator form
  const [fromDate, setFromDate] = useState(isoDate(1));
  const [toDate, setToDate] = useState(isoDate(14));
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [dayStart, setDayStart] = useState("10:00");
  const [dayEnd, setDayEnd] = useState("18:00");
  const [duration, setDuration] = useState(30);
  const [gap, setGap] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [formErr, setFormErr] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSlots(await consultationAdminApi.slots(isoDate(0), isoDate(45)));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const generate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormErr({});
    if (!weekdays.length) return setFormError("Pick at least one weekday.");
    setGenerating(true);
    try {
      const r = await consultationAdminApi.generateSlots({ fromDate, toDate, weekdays, dayStart, dayEnd, durationMinutes: duration, breakMinutes: gap });
      showToast(r.created ? `${r.created} slot${r.created === 1 ? "" : "s"} added${r.skipped ? ` (${r.skipped} skipped: past or overlapping)` : ""}` : "No new slots — they already exist or are in the past", r.created ? "success" : "info");
      load();
    } catch (err) {
      if (err instanceof PaymentApiError) setFormErr(err.fieldErrors);
      setFormError(errorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const remove = async (s: AdminSlot) => {
    setBusyId(s.id);
    try {
      await consultationAdminApi.deleteSlot(s.id);
      setSlots((l) => l.filter((x) => x.id !== s.id));
    } catch (err) {
      showToast(errorMessage(err), "error");
    } finally {
      setBusyId(null);
    }
  };

  const byDay = useMemo(() => {
    const now = Date.now();
    const map = new Map<string, AdminSlot[]>();
    slots
      .filter((s) => new Date(s.endsAt).getTime() > now)
      .forEach((s) => map.set(dayKey(s.startsAt), [...(map.get(dayKey(s.startsAt)) ?? []), s]));
    return Array.from(map.values());
  }, [slots]);

  // Preview how many slots one day gets with these settings
  const perDay = useMemo(() => {
    const [sh, sm] = dayStart.split(":").map(Number);
    const [eh, em] = dayEnd.split(":").map(Number);
    const total = eh * 60 + em - (sh * 60 + sm);
    if (!(total >= duration)) return 0;
    return Math.floor((total + gap) / (duration + gap));
  }, [dayStart, dayEnd, duration, gap]);

  return (
    <div className="space-y-6">
      <form onSubmit={generate} className={cardCls} noValidate>
        <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
          <CalendarPlus className="h-5 w-5 text-gold-500" /> Add available times
        </h2>
        <p className="mt-1 text-sm text-gray-500">Times are India time (IST). Existing or overlapping times are skipped.</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">{label("From date")}<input type="date" value={fromDate} min={isoDate(0)} onChange={(e) => setFromDate(e.target.value)} className={inputCls} /></label>
          <label className="block">{label("To date")}<input type="date" value={toDate} min={fromDate} onChange={(e) => setToDate(e.target.value)} className={inputCls} /></label>
          <label className="block">{label("Day starts")}<input type="time" value={dayStart} onChange={(e) => setDayStart(e.target.value)} className={inputCls} /></label>
          <label className="block">{label("Day ends")}<input type="time" value={dayEnd} onChange={(e) => setDayEnd(e.target.value)} className={inputCls} /></label>
          <label className="block">
            {label("Each consultation")}
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={inputCls}>
              {[15, 20, 30, 45, 60, 90].map((m) => <option key={m} value={m}>{m} minutes</option>)}
            </select>
          </label>
          <label className="block">
            {label("Break between")}
            <select value={gap} onChange={(e) => setGap(Number(e.target.value))} className={inputCls}>
              {[0, 5, 10, 15, 30].map((m) => <option key={m} value={m}>{m ? `${m} minutes` : "No break"}</option>)}
            </select>
          </label>
          <div className="sm:col-span-2">
            {label("Days of the week")}
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map(([n, name]) => {
                const on = weekdays.includes(n);
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setWeekdays((w) => (on ? w.filter((x) => x !== n) : [...w, n].sort()))}
                    className={`rounded-lg border px-2.5 py-1.5 text-sm font-medium ${on ? "border-gold-500 bg-gold-500 text-white" : "border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300"}`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {Object.values(formErr).map((m) => <p key={m} className="mt-2 text-xs text-red-500">{m}</p>)}
        {formError && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">{formError}</p>}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-500">{perDay} slot{perDay === 1 ? "" : "s"} per selected day</p>
          <button type="submit" disabled={generating || perDay === 0} className={btnPrimary}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add slots
          </button>
        </div>
      </form>

      <div>
        <h2 className="mb-3 font-semibold text-gray-900 dark:text-white">Next 45 days</h2>
        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorBox text={error} />
        ) : byDay.length === 0 ? (
          <Empty icon={CalendarDays} title="No upcoming slots" text="Add available times above so users can book." />
        ) : (
          <div className="space-y-3">
            {byDay.map((day) => (
              <div key={day[0].id} className={cardCls}>
                <p className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {formatDay(day[0].startsAt)}
                  <span className="ml-2 font-normal text-gray-400">{day.filter((s) => !s.booked).length} free · {day.filter((s) => s.booked).length} booked</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {day.map((s) =>
                    s.booked ? (
                      <span key={s.id} title={`${s.bookedByName ?? "Booked"} · ${s.topicName ?? ""}`} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5" /> {formatTime(s.startsAt)}
                        <span className="max-w-[8rem] truncate text-xs font-normal">· {s.bookedByName ?? "booked"}</span>
                      </span>
                    ) : (
                      <span key={s.id} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 py-1 pl-2.5 pr-1 text-sm text-gray-700 dark:border-gray-600 dark:text-gray-200">
                        {formatTime(s.startsAt)}
                        <button onClick={() => remove(s)} disabled={busyId === s.id} title="Remove this time" className="rounded p-0.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10">
                          {busyId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                        </button>
                      </span>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Topics ───────────────────────────────────────────────────────────────────

function TopicsTab() {
  const { showToast } = useToast();
  const [topics, setTopics] = useState<ConsultationTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ConsultationTopic | "new" | null>(null);
  const [toDelete, setToDelete] = useState<ConsultationTopic | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTopics(await consultationAdminApi.topics());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (t: ConsultationTopic) => {
    try {
      const u = await consultationAdminApi.updateTopic(t.id, { name: t.name, description: t.description, sortOrder: t.sortOrder, price: t.price, active: !t.active });
      setTopics((l) => l.map((x) => (x.id === u.id ? u : x)));
    } catch (err) {
      showToast(errorMessage(err), "error");
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setBusy(true);
    try {
      await consultationAdminApi.deleteTopic(toDelete.id);
      setTopics((l) => l.filter((x) => x.id !== toDelete.id));
      showToast(`${toDelete.name} deleted`);
      setToDelete(null);
    } catch (err) {
      showToast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setEditing("new")} className={btnPrimary}>
          <Plus className="h-4 w-4" /> New topic
        </button>
      </div>
      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorBox text={error} />
      ) : topics.length === 0 ? (
        <Empty icon={Tags} title="No topics yet" text="Add topics like Business, Guns and Accessories. Users choose one when booking." />
      ) : (
        <>
        {!topics.some((t) => t.price != null && t.price > 0) && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            All topics are free, so users aren't asked to pay. To charge for a consultation, click <b>Edit</b> on a topic and set its fee.
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {topics.map((t) => (
            <div key={t.id} className={`${cardCls} ${t.active ? "" : "opacity-60"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white">{t.name}</p>
                  {t.description && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{t.description}</p>}
                  <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {t.price != null && t.price > 0 ? formatInr(t.price) : "Free"}
                  </p>
                </div>
                <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${t.active ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}>
                  {t.active ? "Shown" : "Hidden"}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => setEditing(t)} className={btnOutline}><Pencil className="h-3.5 w-3.5" /> Edit</button>
                <button onClick={() => toggle(t)} className={btnOutline}>{t.active ? "Hide" : "Show"}</button>
                <button onClick={() => setToDelete(t)} className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        </>
      )}

      {editing && (
        <TopicEditor
          topic={editing === "new" ? undefined : editing}
          nextOrder={topics.length ? Math.max(...topics.map((t) => t.sortOrder)) + 1 : 0}
          onClose={() => setEditing(null)}
          onSaved={(t, isNew) => {
            setTopics((l) => (isNew ? [...l, t] : l.map((x) => (x.id === t.id ? t : x))).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)));
            setEditing(null);
            showToast(isNew ? `Topic ${t.name} added` : "Topic updated");
          }}
        />
      )}
      {toDelete && (
        <Modal isOpen onClose={() => setToDelete(null)} className="max-w-md p-6">
          <h2 className="pr-10 text-lg font-bold text-gray-900 dark:text-white">Delete topic {toDelete.name}?</h2>
          <p className="mt-2 text-sm text-gray-500">Existing bookings keep the topic name. To stop new bookings for now, use Hide instead.</p>
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={() => setToDelete(null)} className={btnOutline}>Cancel</button>
            <button onClick={confirmDelete} disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function TopicEditor({ topic, nextOrder, onClose, onSaved }: {
  topic?: ConsultationTopic; nextOrder: number; onClose: () => void; onSaved: (t: ConsultationTopic, isNew: boolean) => void;
}) {
  const [name, setName] = useState(topic?.name ?? "");
  const [description, setDescription] = useState(topic?.description ?? "");
  const [sortOrder, setSortOrder] = useState(String(topic?.sortOrder ?? nextOrder));
  const [active, setActive] = useState(topic?.active ?? true);
  const [price, setPrice] = useState(topic?.price != null && topic.price > 0 ? String(topic.price) : "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setErr("Enter a name.");
    const order = Number(sortOrder);
    if (!Number.isInteger(order) || order < 0) return setErr("Order must be a whole number, 0 or more.");
    const priceText = price.trim();
    if (priceText && !/^\d{1,7}(\.\d{1,2})?$/.test(priceText)) return setErr("Enter the fee in rupees, e.g. 499 or 499.50 (leave empty for free).");
    const fee = priceText ? Number(priceText) : 0;
    setSaving(true);
    setErr(null);
    const body = { name: name.trim(), description: description.trim() || null, sortOrder: order, active, price: fee > 0 ? fee : null };
    try {
      const saved = topic ? await consultationAdminApi.updateTopic(topic.id, body) : await consultationAdminApi.createTopic(body);
      onSaved(saved, !topic);
    } catch (error) {
      setErr(errorMessage(error));
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={saving ? () => {} : onClose} className="max-w-md p-6">
      <form onSubmit={submit} noValidate>
        <h2 className="pr-10 text-lg font-bold text-gray-900 dark:text-white">{topic ? `Edit ${topic.name}` : "New topic"}</h2>
        <div className="mt-4 space-y-4">
          <label className="block">{label("Name")}<input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Gun licence & legal" className={inputCls} autoFocus /></label>
          <label className="block">
            {label("Short description (shown to users, optional)")}
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} rows={2} placeholder="Help with paperwork, renewals and rules" className={inputCls} />
          </label>
          <label className="block">
            {label("Consultation fee in ₹ (leave empty for free)")}
            <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="e.g. 499" className={inputCls} />
            <span className="mt-1 block text-xs text-gray-500">
              Users pay this by UPI QR / bank transfer when booking. The booking is confirmed when you approve the payment.
              Changing the fee doesn't affect existing bookings.
            </span>
          </label>
          <label className="block">{label("Order (lower shows first)")}<input value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} inputMode="numeric" className={inputCls} /></label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-gold-500 focus:ring-gold-500" />
            Show to users
          </label>
        </div>
        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving} className={btnOutline}>Cancel</button>
          <button type="submit" disabled={saving} className={btnPrimary}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save</button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Small pieces ─────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex h-40 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
    </div>
  );
}

function ErrorBox({ text }: { text: string }) {
  return <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">{text}</div>;
}

function Empty({ icon: Icon, title, text }: { icon: typeof Tags; title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-white p-10 text-center shadow-sm dark:bg-gray-800">
      <Icon className="mx-auto h-10 w-10 text-gray-300" />
      <p className="mt-3 font-semibold text-gray-800 dark:text-white">{title}</p>
      {text && <p className="mt-1 text-sm text-gray-500">{text}</p>}
    </div>
  );
}
