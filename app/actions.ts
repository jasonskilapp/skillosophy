"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { appMode, RESUME_BUCKET } from "@/lib/config";
import {
  DEMO_COOKIE,
  type DemoRole,
  getSession,
  homePathForSession,
} from "@/lib/auth";
import { getSeatUsage, suggestCustomerCode } from "@/lib/data";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { runAnalysis } from "@/lib/pipeline";
import { sendTeamInviteEmail, sendCandidateInviteEmail } from "@/lib/email";
import type { OrgRole, OrgType } from "@/lib/types";

type ActionResult = {
  error?: string;
  ok?: boolean;
  message?: string;
  token?: string;
};

function makeToken(): string {
  return (
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2) +
    Date.now().toString(36)
  );
}

export async function resetPassword(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const email = formData.get("email") as string;
  if (!email) return { error: "Email is required." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "https://www.skillosophyapp.com/update-password",
  });

  if (error) return { error: error.message };
  return { ok: true };
}

export async function updatePassword(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const password = formData.get("password") as string;
  if (!password || password.length < 8)
    return { error: "Password must be at least 8 characters." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: error.message };
  redirect("/login");
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) || `org-${Date.now().toString(36)}`
  );
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

export async function demoLogin(role: DemoRole): Promise<void> {
  const store = await cookies();
  store.set(DEMO_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  const session = (await getSession())!;
  redirect(homePathForSession(session));
}

export async function signIn(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  const session = await getSession();
  redirect(session ? homePathForSession(session) : "/");
}

export async function signOut(): Promise<void> {
  if (appMode === "mock") {
    (await cookies()).delete(DEMO_COOKIE);
  } else {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}

// ---------------------------------------------------------------------------
// Platform admin: create an organization + its first admin (contract-gated)
// ---------------------------------------------------------------------------

export async function createOrganization(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.accountType !== "platform_admin") {
    return { error: "Not authorized." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "campus") as OrgType;
  const seatLimit = parseInt(String(formData.get("seatLimit") ?? ""), 10);
  const adminName = String(formData.get("adminName") ?? "").trim();
  const adminEmail = String(formData.get("adminEmail") ?? "").trim();
  const providedCode = String(formData.get("customerCode") ?? "")
    .trim()
    .toUpperCase();

  if (!name) return { error: "Organization name is required." };
  if (!adminName || !adminEmail) {
    return { error: "The first admin's name and email are required." };
  }
  if (!Number.isFinite(seatLimit) || seatLimit < 1) {
    return { error: "Seat limit must be a positive number." };
  }
  if (type !== "campus" && type !== "newcomer") {
    return { error: "Invalid organization type." };
  }
  if (providedCode && !/^[A-Z0-9-]{2,32}$/.test(providedCode)) {
    return { error: "Customer code may use letters, numbers, and dashes only." };
  }

  const token = makeToken();
  const customerCode = providedCode || (await suggestCustomerCode());

  if (appMode === "mock") {
    return {
      ok: true,
      token,
      message: `Demo mode: "${name}" (${customerCode}) would be created and ${adminName} invited as admin (not persisted).`,
    };
  }

  const admin = createSupabaseAdminClient();

  // Insert the org. If the auto-suggested code lost a race, retry once with a
  // fresh suggestion; a manually-entered duplicate is reported to the admin.
  let org: { id: string } | null = null;
  let code = customerCode;
  for (let attempt = 0; attempt < 2 && !org; attempt++) {
    const { data, error } = await admin
      .from("organizations")
      .insert({
        name,
        slug: slugify(name),
        customer_code: code,
        type,
        seat_limit: seatLimit,
        status: "active",
        created_by: session.userId,
      })
      .select("id")
      .single();

    if (data) {
      org = data;
      break;
    }
    const duplicateCode =
      error?.code === "23505" || /duplicate|already exists/i.test(error?.message ?? "");
    if (duplicateCode && /customer_code/i.test(error?.message ?? "")) {
      if (providedCode) {
        return { error: `Customer code ${code} is already in use.` };
      }
      code = await suggestCustomerCode(); // auto: try the next one
      continue;
    }
    return { error: error?.message ?? "Could not create organization." };
  }
  if (!org) {
    return { error: "Could not assign a unique customer code. Try again." };
  }

  const expires = new Date();
  expires.setDate(expires.getDate() + 14);
  const { error: inviteError } = await admin.from("team_invites").insert({
    organization_id: org.id,
    token,
    email: adminEmail,
    name: adminName,
    org_role: "org_admin",
    invited_by: session.userId,
    status: "pending",
    expires_at: expires.toISOString(),
  });
  if (inviteError) return { error: inviteError.message };

  await sendTeamInviteEmail({
    toName: adminName,
    toEmail: adminEmail,
    token,
    orgName: name,
    role: "org_admin",
  }).catch(console.error);

  return {
    ok: true,
    token,
    message: `"${name}" created as ${code}. An invitation email has been sent to ${adminName}.`,
  };
}

// ---------------------------------------------------------------------------
// Platform admin: update an organization
// ---------------------------------------------------------------------------

export async function updateOrganization(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.accountType !== "platform_admin") {
    return { error: "Not authorized." };
  }

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "") as OrgType;
  const seatLimit = parseInt(String(formData.get("seatLimit") ?? ""), 10);
  const status = String(formData.get("status") ?? "") as "active" | "suspended";
  const customerCode = String(formData.get("customerCode") ?? "")
    .trim()
    .toUpperCase();

  if (!id) return { error: "Organization ID is required." };
  if (!name) return { error: "Organization name is required." };
  if (type !== "campus" && type !== "newcomer") {
    return { error: "Invalid organization type." };
  }
  if (!Number.isFinite(seatLimit) || seatLimit < 1) {
    return { error: "Seat limit must be a positive number." };
  }
  if (status !== "active" && status !== "suspended") {
    return { error: "Invalid status." };
  }
  if (customerCode && !/^[A-Z0-9-]{2,32}$/.test(customerCode)) {
    return { error: "Customer code may use letters, numbers, and dashes only." };
  }

  if (appMode === "mock") {
    return { ok: true, message: "Demo mode: changes not persisted." };
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("organizations")
    .update({
      name,
      slug: slugify(name),
      type,
      seat_limit: seatLimit,
      status,
      ...(customerCode ? { customer_code: customerCode } : {}),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  return { ok: true, message: "Organization updated." };
}

// ---------------------------------------------------------------------------
// Platform admin: add a note to an organization
// ---------------------------------------------------------------------------

export async function addOrgNote(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.accountType !== "platform_admin") {
    return { error: "Not authorized." };
  }

  const orgId = String(formData.get("orgId") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!orgId) return { error: "Organization ID is required." };
  if (!content) return { error: "Note content is required." };

  if (appMode === "mock") {
    return { ok: true, message: "Demo mode: note not persisted." };
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("org_notes").insert({
    organization_id: orgId,
    content,
    created_by: session.userId,
    created_by_name: session.name,
    created_by_email: session.email,
  });

  if (error) return { error: error.message };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Platform admin: change an org member's role
// ---------------------------------------------------------------------------

export async function changeOrgMemberRole(
  orgId: string,
  memberId: string,
  newRole: "org_admin" | "member",
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.accountType !== "platform_admin") {
    return { error: "Not authorized." };
  }
  if (appMode === "mock") return { ok: true };

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("id", memberId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!profile) return { error: "Member not found in this organization." };

  const { error } = await admin
    .from("profiles")
    .update({ org_role: newRole })
    .eq("id", memberId);
  if (error) return { error: error.message };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Platform admin: suspend / reactivate / inactivate an org member
// ---------------------------------------------------------------------------

async function setMemberStatus(
  orgId: string,
  memberId: string,
  memberStatus: "active" | "suspended" | "inactive",
  banned: boolean,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.accountType !== "platform_admin") {
    return { error: "Not authorized." };
  }
  if (appMode === "mock") {
    return { ok: true };
  }
  const admin = createSupabaseAdminClient();
  // Verify member belongs to this org before acting.
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("id", memberId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!profile) return { error: "Member not found in this organization." };

  const now = new Date().toISOString();
  const profileUpdate: Record<string, unknown> = { member_status: memberStatus };
  if (memberStatus === "suspended") {
    profileUpdate.suspended_at = now;
    profileUpdate.suspend_review_sent_at = null;
  } else {
    // Reactivating or inactivating — clear the suspension clock.
    profileUpdate.suspended_at = null;
    profileUpdate.suspend_review_sent_at = null;
  }

  const [{ error: profileErr }, { error: authErr }] = await Promise.all([
    admin.from("profiles").update(profileUpdate).eq("id", memberId),
    admin.auth.admin.updateUserById(memberId, {
      ban_duration: banned ? "876600h" : "none",
    }),
  ]);

  if (profileErr) return { error: profileErr.message };
  if (authErr) return { error: authErr.message };
  return { ok: true };
}

export async function suspendOrgMember(
  orgId: string,
  memberId: string,
): Promise<ActionResult> {
  return setMemberStatus(orgId, memberId, "suspended", true);
}

export async function reactivateOrgMember(
  orgId: string,
  memberId: string,
): Promise<ActionResult> {
  return setMemberStatus(orgId, memberId, "active", false);
}

export async function inactivateOrgMember(
  orgId: string,
  memberId: string,
): Promise<ActionResult> {
  return setMemberStatus(orgId, memberId, "inactive", true);
}

// ---------------------------------------------------------------------------
// Platform admin: cancel a pending team invite
// ---------------------------------------------------------------------------

export async function cancelTeamInvite(
  orgId: string,
  inviteId: string,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.accountType !== "platform_admin") {
    return { error: "Not authorized." };
  }
  if (appMode === "mock") return { ok: true };

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("team_invites")
    .update({ status: "cancelled" })
    .eq("id", inviteId)
    .eq("organization_id", orgId);
  if (error) return { error: error.message };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Org admin: invite a teammate (seat-capped)
// ---------------------------------------------------------------------------

export async function createTeamInvite(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (
    !session ||
    session.accountType !== "org_member" ||
    session.orgRole !== "org_admin" ||
    !session.organizationId
  ) {
    return { error: "Not authorized." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const orgRole = String(formData.get("orgRole") ?? "member") as OrgRole;
  if (!email) return { error: "An email is required." };

  const token = makeToken();

  if (appMode === "mock") {
    return {
      ok: true,
      token,
      message: "Demo invite link generated (not persisted without Supabase).",
    };
  }

  // Seat enforcement: active members + pending invites must stay under the cap.
  const admin = createSupabaseAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("seat_limit")
    .eq("id", session.organizationId)
    .single();
  const seatLimit = org?.seat_limit ?? 0;
  const usage = await getSeatUsage(session.organizationId, seatLimit);
  if (usage.full) {
    return {
      error: `All ${seatLimit} seats are in use. Contact Skillosophy to add more before inviting another teammate.`,
    };
  }

  const expires = new Date();
  expires.setDate(expires.getDate() + 14);
  const { error } = await admin.from("team_invites").insert({
    organization_id: session.organizationId,
    token,
    email,
    name: name || null,
    org_role: orgRole === "org_admin" ? "org_admin" : "member",
    invited_by: session.userId,
    status: "pending",
    expires_at: expires.toISOString(),
  });
  if (error) return { error: error.message };

  const emailError = await sendTeamInviteEmail({
    toName: name || email,
    toEmail: email,
    token,
    orgName: session.organizationName ?? "your organization",
    role: orgRole,
  }).then(() => null).catch((e: Error) => e.message);

  if (emailError) console.error("[email] team invite failed:", emailError);

  return {
    ok: true,
    token,
    message: emailError
      ? `Invite link generated but email failed: ${emailError}`
      : `Invitation sent to ${email}.`,
  };
}

// ---------------------------------------------------------------------------
// Accept a team invite (set password, join the org)
// ---------------------------------------------------------------------------

export async function acceptTeamInvite(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const token = String(formData.get("token") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!name || !email || !password) {
    return { error: "Name, email, and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (appMode === "mock") {
    const store = await cookies();
    store.set(DEMO_COOKIE, "org_admin", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    redirect("/dashboard");
  }

  const admin = createSupabaseAdminClient();
  const { data: invite } = await admin
    .from("team_invites")
    .select("id, organization_id, org_role, status, expires_at")
    .eq("token", token)
    .maybeSingle();
  if (!invite || invite.status !== "pending") {
    return { error: "This invite is invalid or has already been used." };
  }
  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
    return { error: "This invite has expired. Ask for a new one." };
  }

  const { data: created, error: signUpError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });
  if (signUpError || !created.user) {
    return { error: signUpError?.message ?? "Could not create the account." };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    account_type: "org_member",
    organization_id: invite.organization_id,
    org_role: invite.org_role,
    role: "recruiter", // legacy column
    full_name: name,
    email,
  });
  if (profileError) return { error: profileError.message };

  await admin
    .from("team_invites")
    .update({ status: "accepted" })
    .eq("id", invite.id);

  // Sign the new member in.
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signInWithPassword({ email, password });
  redirect("/dashboard");
}

// ---------------------------------------------------------------------------
// Member: create a candidate invite (org-stamped)
// ---------------------------------------------------------------------------

export async function createInvite(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.accountType !== "org_member" || !session.organizationId) {
    return { error: "Not authorized." };
  }

  const candidateName = String(formData.get("candidateName") ?? "").trim();
  const candidateEmail = String(formData.get("candidateEmail") ?? "").trim();
  const meetingDate = String(formData.get("meetingDate") ?? "").trim();
  if (!meetingDate) return { error: "A meeting date is required." };

  const token = makeToken();

  if (appMode === "mock") {
    return {
      ok: true,
      token,
      message: "Demo invite link generated (not persisted without Supabase).",
    };
  }

  const admin = createSupabaseAdminClient();
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);
  const { error } = await admin.from("invites").insert({
    organization_id: session.organizationId,
    token,
    recruiter_id: session.userId,
    recruiter_name: session.name,
    candidate_name: candidateName || null,
    candidate_email: candidateEmail || null,
    meeting_date: new Date(meetingDate).toISOString(),
    status: "pending",
    expires_at: expires.toISOString(),
  });
  if (error) return { error: error.message };

  if (candidateEmail) {
    await sendCandidateInviteEmail({
      toEmail: candidateEmail,
      token,
      orgName: session.organizationName ?? "your advisor",
    }).catch(console.error);
  }

  return {
    ok: true,
    token,
    message: candidateEmail
      ? `Invite sent to ${candidateEmail}.`
      : "Invite link generated.",
  };
}

// ---------------------------------------------------------------------------
// Seeker: accept a candidate invite + create account
// ---------------------------------------------------------------------------

export async function acceptInvite(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const token = String(formData.get("token") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!name || !email || !password) {
    return { error: "Name, email, and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (appMode === "mock") {
    const store = await cookies();
    store.set(DEMO_COOKIE, "seeker", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    redirect("/seeker/upload");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };
  if (!data.user) {
    return { error: "Check your email to confirm your account, then sign in." };
  }

  const admin = createSupabaseAdminClient();
  await admin.from("profiles").insert({
    id: data.user.id,
    account_type: "seeker",
    role: "seeker", // legacy column
    full_name: name,
    email,
  });
  await admin
    .from("invites")
    .update({ status: "accepted", seeker_id: data.user.id })
    .eq("token", token);

  redirect("/seeker/upload");
}

// ---------------------------------------------------------------------------
// Seeker: upload a resume and kick off analysis (org-stamped)
// ---------------------------------------------------------------------------

export async function submitResume(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult & { candidateId?: string }> {
  const session = await getSession();
  if (!session || session.accountType !== "seeker") {
    return { error: "Not authorized." };
  }

  const file = formData.get("resume") as File | null;
  if (!file || file.size === 0) return { error: "Please choose a file." };
  if (!/\.(pdf|docx)$/i.test(file.name)) {
    return { error: "Upload a PDF or Word (.docx) file." };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { error: "File is too large (max 10 MB)." };
  }

  if (appMode === "mock") {
    return {
      ok: true,
      message:
        "Demo mode: in a live setup your resume would be analyzed and shared with your advisor. Connect Supabase and an Anthropic key to enable real analysis.",
    };
  }

  const admin = createSupabaseAdminClient();
  const { data: invite } = await admin
    .from("invites")
    .select(
      "id, organization_id, recruiter_id, recruiter_name, meeting_date, candidate_name",
    )
    .eq("seeker_id", session.userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const path = `${session.userId}/${Date.now()}-${file.name}`;
  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await admin.storage
    .from(RESUME_BUCKET)
    .upload(path, Buffer.from(arrayBuffer), {
      contentType: file.type || undefined,
      upsert: true,
    });
  if (uploadError) return { error: uploadError.message };

  const { data: row, error: insertError } = await admin
    .from("candidates")
    .insert({
      organization_id: invite?.organization_id ?? null,
      recruiter_id: invite?.recruiter_id ?? null,
      recruiter_name: invite?.recruiter_name ?? null,
      seeker_id: session.userId,
      invite_id: invite?.id ?? null,
      name: invite?.candidate_name || session.name,
      email: session.email,
      meeting_date: invite?.meeting_date ?? null,
      file_path: path,
      file_name: file.name,
      status: "processing",
    })
    .select("id")
    .single();
  if (insertError || !row) {
    return { error: insertError?.message ?? "Could not save the upload." };
  }

  void runAnalysis(row.id).catch(() => {});

  return {
    ok: true,
    candidateId: row.id,
    message: "Resume uploaded — analysis is running.",
  };
}
