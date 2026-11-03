import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ExternalLink, Loader2, RefreshCw, Search, Trash2 } from "lucide-react";
import { Modal } from "../../components/ui/modal";
import { sellProductApi, usersApi } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import type { Product } from "../ProductCard";
import { mapProduct, productUrl } from "../productUtils";
import { removeRecentlyViewed } from "../recentlyViewed";

// Products posted by normal users (isStoreProduct=false) — admins can review and remove them.
const PAGE_SIZE = 20;

export default function AdminUserListings() {
  const { showToast } = useToast();
  const [page, setPage] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  // nodeId → display name; products only carry the seller's node id
  const [sellerNames, setSellerNames] = useState<Record<string, string>>({});
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await sellProductApi.getAll(page, PAGE_SIZE, "ACTIVE", null, false);
      setProducts(res.content.map(mapProduct));
      setTotal(res.totalElements);
    } catch (err: any) {
      setError(err?.message || "Could not load listings.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  // Look up names for sellers we haven't seen yet
  useEffect(() => {
    const missing = [...new Set(products.map((p) => p.sellerId).filter((id): id is string => !!id))]
      .filter((id) => !(id in sellerNames));
    if (!missing.length) return;
    Promise.all(missing.map((id) => usersApi.getNameByNodeId(id).then((name) => [id, name || id]).catch(() => [id, id])))
      .then((pairs) => setSellerNames((prev) => ({ ...prev, ...Object.fromEntries(pairs) })));
  }, [products, sellerNames]);

  const sellerLabel = (p: Product) => (p.sellerId ? sellerNames[p.sellerId] ?? p.sellerId : "—");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        sellerLabel(p).toLowerCase().includes(q) ||
        p.sellerId?.toLowerCase().includes(q) ||
        String(p.id).includes(q)
    );
  }, [products, search, sellerNames]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const confirmDelete = async () => {
    if (toDelete?.id == null) return;
    try {
      setDeleting(true);
      await sellProductApi.delete(toDelete.id);
      removeRecentlyViewed(toDelete.id);
      showToast("Listing deleted");
      setToDelete(null);
      // step back a page if we just emptied this one
      if (products.length === 1 && page > 0) setPage((p) => p - 1);
      else load();
    } catch (err: any) {
      showToast(`Failed to delete: ${err?.message || "Please try again."}`, "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-6 dark:bg-gray-900 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Listings</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Products posted by users on the marketplace. Remove anything that breaks the rules.
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, seller or ad ID on this page"
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">{total} listings</span>
        </div>

        {error ? (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">{error}</div>
        ) : loading && !products.length ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center text-sm text-gray-500 shadow-sm dark:bg-gray-800">
            {search ? "No listings match your search." : "No user listings yet."}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-900/40 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Posted by</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3">Posted</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {visible.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-[220px]">
                          <img src={p.images[0]} alt="" className="h-12 w-12 flex-shrink-0 rounded-lg object-cover bg-gray-100" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-gray-900 dark:text-white max-w-[260px]">{p.title}</p>
                            <p className="text-xs text-gray-400">Ad #{p.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        <p>{sellerLabel(p)}</p>
                        {p.sellerId && sellerLabel(p) !== p.sellerId && (
                          <p className="font-mono text-xs text-gray-400">{p.sellerId}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-[180px] truncate">{p.location || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                        ₹{Number(p.price || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-300">{p.date}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={productUrl(p.id)}
                            target="_blank"
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> View
                          </Link>
                          <button
                            onClick={() => setToDelete(p)}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-end gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span>Page {page + 1} of {totalPages}</span>
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0 || loading} aria-label="Previous page"
                  className="rounded-lg border border-gray-300 p-1.5 disabled:opacity-40 dark:border-gray-700">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => setPage((p) => p + 1)} disabled={page + 1 >= totalPages || loading} aria-label="Next page"
                  className="rounded-lg border border-gray-300 p-1.5 disabled:opacity-40 dark:border-gray-700">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {toDelete && (
        <Modal isOpen onClose={() => !deleting && setToDelete(null)} className="max-w-sm p-6">
          <h2 className="pr-10 text-lg font-bold text-gray-900 dark:text-white">Delete this listing?</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            “{toDelete.title}” by {sellerLabel(toDelete)} will be removed from the marketplace. This can't be undone.
          </p>
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => setToDelete(null)}
              disabled={deleting}
              className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleting}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
