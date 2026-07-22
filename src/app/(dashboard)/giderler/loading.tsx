export default function GiderlerLoading() {
  return (
    <div className="space-y-6">
      {/* Header + button skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-36 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="h-4 w-56 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        </div>
        <div className="h-10 w-32 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 shadow overflow-hidden">
        {/* Table header */}
        <div className="border-b border-gray-100 dark:border-gray-800 px-6 py-4">
          <div className="flex gap-6">
            <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
          </div>
        </div>

        {/* Table rows */}
        {[
          ["w-40", "w-24", "w-16", "w-32"],
          ["w-48", "w-20", "w-24", "w-28"],
          ["w-36", "w-28", "w-20", "w-24"],
          ["w-44", "w-16", "w-28", "w-36"],
          ["w-32", "w-24", "w-20", "w-28"],
        ].map((widths, row) => (
          <div
            key={row}
            className="border-b border-gray-50 dark:border-gray-800/50 px-6 py-4"
          >
            <div className="flex gap-6 animate-pulse">
              {widths.map((w, col) => (
                <div
                  key={col}
                  className={`h-4 ${w} rounded bg-gray-200 dark:bg-gray-800`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
