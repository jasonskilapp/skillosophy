import { NextRequest } from "next/server";
import { appMode } from "@/lib/config";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

/** Lightweight status poll for the seeker's upload page. */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  if (appMode === "mock") {
    return Response.json({ status: "done" });
  }

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("candidates")
    .select("status, headline, error")
    .eq("id", id)
    .single();

  if (!data) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({
    status: data.status,
    headline: data.headline,
    error: data.error,
  });
}
