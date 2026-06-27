"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { changeOrgMemberRole } from "@/app/actions";
import type { OrgRole } from "@/lib/types";

export default function RoleSelector({
  orgId,
  memberId,
  currentRole,
}: {
  orgId: string;
  memberId: string;
  currentRole: OrgRole;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as OrgRole;
    if (newRole === currentRole) return;
    setError(null);
    startTransition(async () => {
      const result = await changeOrgMemberRole(orgId, memberId, newRole);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="flex items-center gap-1.5">
      <select
        defaultValue={currentRole}
        onChange={handleChange}
        disabled={pending}
        className="rounded-md border border-border bg-surface px-2 py-0.5 text-[11px] font-medium outline-none focus:border-primary disabled:opacity-50"
      >
        <option value="org_admin">Admin</option>
        <option value="member">Standard user</option>
      </select>
      {pending && <span className="text-[11px] text-muted">Saving…</span>}
      {error && <span className="text-[11px] text-competent">{error}</span>}
    </div>
  );
}
