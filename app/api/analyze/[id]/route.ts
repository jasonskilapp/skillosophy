import { type NextRequest, NextResponse } from "next/server";
import { runAnalysis } from "@/lib/pipeline";

/**
 * POST /api/analyze/:id
 *
 * Long-running route that runs resume analysis for a candidate.
 * Called internally by the upload server action immediately after the file is
 * saved. Separated from the upload action so Vercel gives it its own function
 * lifecycle — the upload action returns in milliseconds while this runs for
 * up to 5 minutes.
 *
 * Protected by a shared secret so it cannot be triggered externally.
 */
export const maxDuration = 300; // 5 minutes — covers even large scanned PDFs

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const secret = process.env.ANALYZE_SECRET;
  const authHeader = req.headers.get("x-analyze-secret");

  if (!secret || authHeader !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing candidate id" }, { status: 400 });
  }

  // Run analysis — errors are caught inside runAnalysis and written to the DB.
  await runAnalysis(id);

  return NextResponse.json({ ok: true });
}
