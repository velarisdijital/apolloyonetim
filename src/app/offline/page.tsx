"use client";

import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-6">
        <WifiOff className="w-8 h-8 text-blue-600 dark:text-blue-400" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Bağlantı Yok
      </h1>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
        İnternet bağlantınız kesilmiş görünüyor. Lütfen bağlantınızı kontrol edip tekrar deneyin.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        Tekrar Dene
      </button>
    </div>
  );
}
