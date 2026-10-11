// Grey placeholder shaped like ProductCard, shown while products load.
export default function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-pulse">
      <div className="aspect-square bg-gray-200 dark:bg-gray-800" />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-5 w-1/2 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-3.5 w-full rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-3.5 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="flex justify-between mt-1">
          <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-3 w-1/5 rounded bg-gray-200 dark:bg-gray-800" />
        </div>
        <div className="h-8 w-full rounded-lg bg-gray-200 dark:bg-gray-800 mt-1" />
      </div>
    </div>
  );
}
