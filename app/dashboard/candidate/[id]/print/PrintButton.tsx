"use client";

import { useEffect } from "react";

export default function PrintButton() {
  useEffect(() => {
    window.print();
  }, []);

  return (
    <div className="mb-8 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 print:hidden">
      <button
        onClick={() => window.print()}
        className="rounded-md bg-gray-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
      >
        Save as PDF / Print
      </button>
      <span className="text-sm text-gray-500">or close this tab to go back</span>
    </div>
  );
}
