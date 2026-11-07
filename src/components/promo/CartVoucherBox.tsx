import { FormEvent, useEffect, useRef, useState } from "react";
import { Loader2, Ticket, X } from "lucide-react";
import { errorMessage } from "../../services/paymentApi";
import { VoucherQuote, voucherUserApi } from "../../services/promoApi";

interface Props {
  /** Orderable cart lines; the voucher is re-checked whenever these change. */
  items: { productId: number; quantity: number }[];
  applied: VoucherQuote | null;
  onChange: (quote: VoucherQuote | null) => void;
  disabled?: boolean;
}

/** "Have a voucher?" field for the cart. The server decides whether the code applies and how much it takes off. */
export default function CartVoucherBox({ items, applied, onChange, disabled }: Props) {
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-validate the applied code when the cart changes (quantities, removals) so the discount stays correct.
  const itemsKey = JSON.stringify(items);
  const lastKey = useRef(itemsKey);
  useEffect(() => {
    if (!applied || itemsKey === lastKey.current) return;
    lastKey.current = itemsKey;
    let cancelled = false;
    voucherUserApi
      .validate(applied.code, items)
      .then((q) => !cancelled && onChange(q))
      .catch((err) => {
        if (cancelled) return;
        onChange(null);
        setError(`${applied.code} was removed: ${errorMessage(err)}`);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey]);

  const apply = async (e: FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (!c) return;
    setChecking(true);
    setError(null);
    try {
      const quote = await voucherUserApi.validate(c, items);
      lastKey.current = itemsKey;
      onChange(quote);
      setCode("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setChecking(false);
    }
  };

  if (applied) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-dashed border-green-500/60 bg-green-50 p-2.5 dark:bg-green-500/10">
        <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm font-bold tracking-wider text-green-700 dark:text-green-400">{applied.code}</p>
          <p className="text-xs text-green-700/80 dark:text-green-400/80">
            {applied.description || "Voucher applied"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setError(null);
          }}
          disabled={disabled}
          title="Remove voucher"
          className="rounded p-0.5 text-green-700 hover:bg-green-100 disabled:opacity-50 dark:text-green-400 dark:hover:bg-green-500/20"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={apply} noValidate>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
          maxLength={20}
          placeholder="Voucher code"
          aria-label="Voucher code"
          disabled={disabled || checking}
          className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm tracking-wider text-gray-900
                     placeholder:font-sans placeholder:tracking-normal placeholder:text-gray-400
                     focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30
                     dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        />
        <button
          type="submit"
          disabled={disabled || checking || !code.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-gray-200 dark:text-gray-900"
        >
          {checking && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Apply
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </form>
  );
}
