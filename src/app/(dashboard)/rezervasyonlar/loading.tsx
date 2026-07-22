export default function RezervasyonlarLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-44 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="h-4 w-60 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>

      {/* Calendar skeleton */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 shadow p-6 space-y-4 animate-pulse">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-6 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-6 w-32 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-6 w-6 rounded bg-gray-200 dark:bg-gray-800" />
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className="h-4 rounded bg-gray-200 dark:bg-gray-800 mx-auto w-8"
            />
          ))}
        </div>

        {/* Calendar grid: 5 rows x 7 columns */}
        {[1, 2, 3, 4, 5].map((row) => (
          <div key={row} className="grid grid-cols-7 gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((col) => (
              <div
                key={col}
                className="h-12 rounded-lg bg-gray-200 dark:bg-gray-800"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
