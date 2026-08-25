"use client";

import { useEffect } from "react";

export default function PrintButton() {
  useEffect(() => {
    window.print();
  }, []);

  return (
    <div className="no-print" style={{
      display: "flex", alignItems: "center", gap: 12,
      marginBottom: 24, padding: "12px 16px",
      background: "#f8fafc", borderRadius: 8, border: "1px solid #cbd5e1",
    }}>
      <button
        onClick={() => window.print()}
        style={{
          background: "#0d7a6b", color: "#fff", border: "none",
          borderRadius: 6, padding: "8px 20px", fontSize: 14, fontWeight: 600,
          cursor: "pointer", letterSpacing: 0.2,
        }}
      >
        Save as PDF / Print
      </button>
      <span style={{ fontSize: 13, color: "#64748b" }}>
        Use your browser's print dialog · set Destination to "Save as PDF" for best results
      </span>
    </div>
  );
}
