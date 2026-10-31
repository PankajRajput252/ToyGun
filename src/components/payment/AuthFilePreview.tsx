import { useEffect, useState } from "react";
import { ExternalLink, FileText, ImageOff, Loader2 } from "lucide-react";
import { fetchFileBlob, errorMessage } from "../../services/paymentApi";

/**
 * Loads a protected file (QR image / receipt) with the auth header and returns a blob: URL.
 * The URL is revoked automatically when the path changes or the component unmounts.
 */
export function useAuthFile(path: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  const [type, setType] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!path) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setUrl(null);
    fetchFileBlob(path)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setType(blob.type);
        setUrl(objectUrl);
      })
      .catch((err) => !cancelled && setError(errorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);

  return { url, type, loading, error };
}

/** An <img> for a protected image (e.g. the admin's QR code). */
export function AuthImage({ path, alt, className }: { path: string; alt: string; className?: string }) {
  const { url, loading, error } = useAuthFile(path);
  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className ?? ""}`}>
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }
  if (error || !url) {
    return (
      <div className={`flex flex-col items-center justify-center gap-1 bg-gray-100 text-xs text-gray-500 dark:bg-gray-800 ${className ?? ""}`}>
        <ImageOff className="h-6 w-6" />
        {error ?? "Image unavailable"}
      </div>
    );
  }
  return <img src={url} alt={alt} className={className} />;
}

/** Appends query parameters to a path that may already contain a query string. */
function withQuery(path: string, params: Record<string, string | number | undefined>): string {
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  if (!query) return path;
  return `${path}${path.includes("?") ? "&" : "?"}${query}`;
}

/** Shows a receipt inline: images as <img>, PDFs in an <iframe>, with an "open in new tab" link. */
export function ReceiptPreview({ path, fileName, productIds }: { path: string; fileName?: string; productIds?: number[] }) {
  const { url, type, loading, error } = useAuthFile(withQuery(path, { productIds: productIds?.join(",") }));

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }
  if (error || !url) {
    return (
      <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">
        Could not load the receipt. {error}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {type === "application/pdf" ? (
        <iframe src={url} title={fileName ?? "Receipt"} className="h-96 w-full rounded-xl border dark:border-gray-700" />
      ) : (
        <img
          src={url}
          alt={fileName ?? "Payment receipt"}
          className="max-h-[28rem] w-full rounded-xl border object-contain bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
        />
      )}
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gold-600 hover:underline dark:text-gold-400"
      >
        {type === "application/pdf" ? <FileText className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
        Open {fileName ? `"${fileName}"` : "receipt"} in a new tab
      </a>
    </div>
  );
}
