"use client";

import { useState } from "react";

export default function OrgSettingsForm({ registerLink }: { registerLink: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(registerLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={registerLink}
        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs outline-none"
      />
      <button
        onClick={copy}
        className="shrink-0 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium transition hover:bg-muted/10"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
