"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  suspendOrgMember,
  reactivateOrgMember,
  inactivateOrgMember,
  cancelTeamInvite,
} from "@/app/actions";

interface Props {
  orgId: string;
  memberId: string;
  accountStatus: "active" | "suspended" | "inactive";
  isInvite: boolean;
}

export default function MemberActions({
  orgId,
  memberId,
  accountStatus,
  isInvite,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmInactivate, setConfirmInactivate] = useState(false);
  const router = useRouter();

  const act = (fn: () => Promise<{ error?: string; ok?: boolean }>) => {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  };

  if (accountStatus === "inactive") {
    return <span className="text-[11px] text-muted italic">Deactivated</span>;
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {error && (
        <span className="text-[11px] text-competent">{error}</span>
      )}

      {isInvite ? (
        <Btn
          label="Cancel invite"
          pending={pending}
          variant="danger"
          onClick={() => act(() => cancelTeamInvite(orgId, memberId))}
        />
      ) : (
        <>
          {accountStatus === "active" && (
            <Btn
              label="Suspend"
              pending={pending}
              variant="warning"
              onClick={() => act(() => suspendOrgMember(orgId, memberId))}
            />
          )}
          {accountStatus === "suspended" && (
            <Btn
              label="Reactivate"
              pending={pending}
              variant="success"
              onClick={() => act(() => reactivateOrgMember(orgId, memberId))}
            />
          )}
          {confirmInactivate ? (
            <>
              <span className="text-[11px] text-muted">Are you sure?</span>
              <Btn
                label="Confirm deactivate"
                pending={pending}
                variant="danger"
                onClick={() => {
                  setConfirmInactivate(false);
                  act(() => inactivateOrgMember(orgId, memberId));
                }}
              />
              <Btn
                label="Cancel"
                pending={false}
                variant="neutral"
                onClick={() => setConfirmInactivate(false)}
              />
            </>
          ) : (
            <Btn
              label="Deactivate"
              pending={pending}
              variant="danger"
              onClick={() => setConfirmInactivate(true)}
            />
          )}
        </>
      )}
    </div>
  );
}

function Btn({
  label,
  pending,
  variant,
  onClick,
}: {
  label: string;
  pending: boolean;
  variant: "warning" | "danger" | "success" | "neutral";
  onClick: () => void;
}) {
  const colors = {
    warning: "border-amber-300 text-amber-700 hover:bg-amber-50",
    danger: "border-competent/40 text-competent hover:bg-competent/5",
    success: "border-primary/40 text-primary hover:bg-primary/5",
    neutral: "border-border text-muted hover:bg-foundational-soft",
  };
  return (
    <button
      onClick={onClick}
      disabled={pending}
      className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition disabled:opacity-50 ${colors[variant]}`}
    >
      {pending ? "…" : label}
    </button>
  );
}
