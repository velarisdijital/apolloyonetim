export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="h-4 w-64 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>

      {/* Card skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-white dark:bg-gray-900 shadow p-6 space-y-4 animate-pulse"
          >
            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-6 w-32 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
