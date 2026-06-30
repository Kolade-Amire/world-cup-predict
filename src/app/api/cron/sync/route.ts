import { NextRequest, NextResponse } from "next/server";
import { syncFixtures, syncSquads } from "@/lib/sync";

export const dynamic = "force-dynamic";

// Resync endpoint hit by a scheduler (Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`;
// external crons can pass `?secret=...`). Refreshes fixtures/results in the DB.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "CRON_SECRET not set" }, { status: 500 });
  }
  const bearer = req.headers.get("authorization")?.replace("Bearer ", "");
  const provided = bearer ?? new URL(req.url).searchParams.get("secret");
  if (provided !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncFixtures();
    const squads = await syncSquads();
    return NextResponse.json({ ok: true, ...result, squads });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "error" },
      { status: 500 }
    );
  }
}
