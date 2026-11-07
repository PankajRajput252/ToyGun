import { effectivePrice, hasSale } from "../../pages/productUtils";
import type { Product } from "../../pages/ProductCard";

const inr = (n: number) => `₹ ${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/** Product price, with the list price struck through and a "% OFF" chip when a sale discount is live. */
export default function PriceTag({
  item,
  size = "md",
}: {
  item: Pick<Product, "price" | "salePrice" | "discountLabel">;
  size?: "md" | "lg";
}) {
  const priceCls =
    size === "lg"
      ? "text-2xl sm:text-3xl font-bold text-gold-600 dark:text-gold-400 break-all"
      : "text-lg sm:text-xl font-bold break-words leading-tight text-gold-600 dark:text-gold-400";

  if (!hasSale(item)) return <p className={priceCls}>{inr(Number(item.price))}</p>;

  return (
    <div>
      <p className={priceCls}>{inr(effectivePrice(item))}</p>
      <p className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 ${size === "lg" ? "mt-1 text-sm" : "text-[11px]"}`}>
        <span className="text-gray-400 line-through">{inr(Number(item.price))}</span>
        {item.discountLabel && (
          <span className="rounded bg-green-100 px-1.5 py-0.5 font-semibold text-green-700 dark:bg-green-500/15 dark:text-green-400">
            {item.discountLabel}
          </span>
        )}
      </p>
    </div>
  );
}
