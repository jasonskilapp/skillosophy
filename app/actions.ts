"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { appMode, RESUME_BUCKET } from "@/lib/config";
import { DEMO_COOKIE, getSession, homePathForRole } from "@/lib/auth";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { runAnalysis } from "@/lib/pipeline";
import type { Role } from "@/lib/types";

type ActionResult = { error?: string; ok?: boolean; message?: string };

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

/** Mock-mode quick login as a demo role. */
export async function demoLogin(role: Role): Promise<void> {
  const store = await cookies();
  store.set(DEMO_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect(homePathForRole(role));
}

/** Live-mode email/password sign-in. */
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
  redirect(session ? homePathForRole(session.role) : "/");
}

export async function signOut(): Promise<void> {
  if (appMode === "mock") {
    const store = await cookies();
    store.delete(DEMO_COOKIE);
  } else {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}

// ---------------------------------------------------------------------------
// Admin: create recruiter accounts
// ---------------------------------------------------------------------------

export async function createRecruiter(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Not authorized." };
  }

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
    return {
      ok: true,
      message: `Demo mode: recruiter "${name}" would be created (not persisted without Supabase).`,
    };
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  if (error) return { error: error.message };

  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user!.id,
    role: "recruiter",
    full_name: name,
    email,
  });
  if (profileError) return { error: profileError.message };

  return { ok: true, message: `Recruiter ${name} created.` };
}

// ---------------------------------------------------------------------------
// Recruiter: create an invite (shareable link)
// ---------------------------------------------------------------------------

function makeToken(): string {
  // URL-safe random token.
  return (
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2) +
    Date.now().toString(36)
  );
}

export async function createInvite(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult & { token?: string }> {
  const session = await getSession();
  if (!session || session.role !== "recruiter") {
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

  return { ok: true, token, message: "Invite link generated." };
}

// ---------------------------------------------------------------------------
// Seeker: accept invite + create account
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
    role: "seeker",
    full_name: name,
    email,
  });

  // Link the invite to this seeker.
  await admin
    .from("invites")
    .update({ status: "accepted", seeker_id: data.user.id })
    .eq("token", token);

  redirect("/seeker/upload");
}

// ---------------------------------------------------------------------------
// Seeker: upload a resume and kick off analysis
// ---------------------------------------------------------------------------

export async function submitResume(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult & { candidateId?: string }> {
  const session = await getSession();
  if (!session || session.role !== "seeker") {
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
        "Demo mode: in a live setup your resume would be analyzed and shared with the recruiter. Connect Supabase and an Anthropic key to enable real analysis.",
    };
  }

  const admin = createSupabaseAdminClient();

  // Find the invite that brought this seeker in, for recruiter + meeting context.
  const { data: invite } = await admin
    .from("invites")
    .select("id, recruiter_id, recruiter_name, meeting_date, candidate_name")
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

  // Kick off analysis without blocking the response; the page polls for status.
  void runAnalysis(row.id).catch(() => {});

  return {
    ok: true,
    candidateId: row.id,
    message: "Resume uploaded — analysis is running.",
  };
}
