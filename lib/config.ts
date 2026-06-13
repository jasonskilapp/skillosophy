/**
 * Runtime configuration and mode detection.
 *
 * Discova runs in one of two modes:
 *  - "live"  — Supabase env vars are present; real auth, storage, and DB are used.
 *  - "mock"  — no Supabase config; the app serves seed data so every screen is
 *              viewable before any keys are wired up.
 *
 * Anthropic is independent: analysis runs for real when ANTHROPIC_API_KEY is set,
 * otherwise uploads fall back to a seeded sample report.
 */

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const anthropicApiKey = process.env.ANTHROPIC_API_KEY ?? "";
export const isAnthropicConfigured = Boolean(anthropicApiKey);

/** Model used for resume analysis. Override with ANTHROPIC_MODEL. */
export const anthropicModel =
  process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

/** Storage bucket name for uploaded resumes. */
export const RESUME_BUCKET = "resumes";

export type AppMode = "live" | "mock";
export const appMode: AppMode = isSupabaseConfigured ? "live" : "mock";
