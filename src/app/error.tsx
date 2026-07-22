"use client";

export default function RootError({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-gray-50 dark:bg-gray-950">
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-10 max-w-lg w-full text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <svg
                className="h-8 w-8 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Bir Hata Oluştu
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Sayfa yüklenirken bir hata meydana geldi.
            </p>
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center rounded-lg bg-red-600 px-6 py-3 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
