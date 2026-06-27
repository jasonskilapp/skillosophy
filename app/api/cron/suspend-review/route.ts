import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { sendSuspendReviewEmail } from "@/lib/email";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.skillosophyapp.com";

export async function GET(request: NextRequest) {
  // Vercel sends this header on cron invocations; reject everything else.
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Find members suspended for ≥ 30 days that haven't had a review email sent.
  const { data: suspended, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, organization_id, suspended_at, organizations(id, name)",
    )
    .eq("member_status", "suspended")
    .lte("suspended_at", thirtyDaysAgo)
    .is("suspend_review_sent_at", null);

  if (error) {
    console.error("[cron/suspend-review] query failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!suspended || suspended.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  // Group suspended members by organization so we can fetch org admins once per org.
  const byOrg = new Map<
    string,
    { orgName: string; members: typeof suspended }
  >();
  for (const row of suspended) {
    const org = Array.isArray(row.organizations)
      ? row.organizations[0]
      : row.organizations;
    const orgId = org?.id ?? row.organization_id;
    const orgName = org?.name ?? "your organization";
    if (!orgId) continue;
    if (!byOrg.has(orgId)) byOrg.set(orgId, { orgName, members: [] });
    byOrg.get(orgId)!.members.push(row);
  }

  let emailsSent = 0;

  for (const [orgId, { orgName, members }] of byOrg) {
    // Fetch active org admins.
    const { data: admins } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("organization_id", orgId)
      .eq("org_role", "org_admin")
      .eq("member_status", "active");

    if (!admins || admins.length === 0) continue;

    const manageUrl = `${SITE_URL}/platform/${orgId}`;

    for (const member of members) {
      for (const admin of admins) {
        try {
          await sendSuspendReviewEmail({
            toName: admin.full_name ?? admin.email,
            toEmail: admin.email,
            memberName: member.full_name ?? member.email,
            memberEmail: member.email,
            orgName,
            suspendedAt: member.suspended_at!,
            manageUrl,
          });
          emailsSent++;
        } catch (err) {
          console.error(
            `[cron/suspend-review] email failed for ${member.email} → ${admin.email}:`,
            err,
          );
        }
      }

      // Mark review sent so this member isn't emailed again tomorrow.
      await supabase
        .from("profiles")
        .update({ suspend_review_sent_at: new Date().toISOString() })
        .eq("id", member.id);
    }
  }

  return NextResponse.json({ processed: suspended.length, emailsSent });
}
