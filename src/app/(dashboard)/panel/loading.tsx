export default function PanelLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="h-4 w-64 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>

      {/* 4 stat card skeletons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-white dark:bg-gray-900 shadow p-5 space-y-3 animate-pulse"
          >
            <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-7 w-28 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-800" />
          </div>
        ))}
      </div>

      {/* 2 larger card skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-white dark:bg-gray-900 shadow p-6 space-y-4 animate-pulse"
          >
            <div className="h-5 w-36 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="space-y-3">
              <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-3 w-5/6 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-3 w-4/6 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
