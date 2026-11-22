import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Printer, ScrollText } from "lucide-react";
import TermsAndConditions, { TERMS_LAST_UPDATED, TERMS_SECTIONS } from "../components/auth/TermsAndConditions";

/**
 * Public Terms and Conditions page (/terms). The text lives in components/auth/TermsAndConditions.tsx,
 * which the sign-up modal also uses, so there is one copy to keep up to date.
 * Link to a section with a hash, e.g. /terms#terms-6 for consultations.
 */
export default function TermsPage() {
  const { hash } = useLocation();

  useEffect(() => {
    document.title = "Terms and Conditions · Bandookwale";
  }, []);

  // Jump to a section when opened with #terms-N (after the lazy page has rendered)
  useEffect(() => {
    if (!hash) return;
    const t = window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" }), 50);
    return () => window.clearTimeout(t);
  }, [hash]);

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-6 dark:bg-gray-950 sm:px-6 sm:py-10 print:bg-white print:p-0">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to Bandookwale
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-white dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <Printer className="h-4 w-4" /> Print / save PDF
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
          {/* Contents */}
          <nav aria-label="Contents" className="print:hidden lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Contents</p>
              <ol className="space-y-1 text-sm">
                {TERMS_SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
                        window.history.replaceState(null, "", `#${s.id}`);
                      }}
                      className="block rounded-md px-2 py-1 text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>

          {/* Terms */}
          <main className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8 print:border-0 print:shadow-none">
            <header className="mb-6 border-b border-gray-200 pb-5 dark:border-gray-800">
              <p className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                <ScrollText className="h-4 w-4" /> Legal
              </p>
              <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Terms and Conditions</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Last updated: {TERMS_LAST_UPDATED}</p>
              <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                These Terms govern your use of bandookwale.com, purchases from the Bandookwale store and marketplace, and
                consultations booked through the website. Please read them carefully.
              </p>
            </header>
            <TermsAndConditions showHeader={false} />
          </main>
        </div>
      </div>
    </div>
  );
}
