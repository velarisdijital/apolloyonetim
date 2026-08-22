import { NextRequest, NextResponse } from "next/server";
import { runDailyTasks } from "@/lib/cron-tasks";

export const dynamic = "force-dynamic";

// Günlük görev tetikleyici. CRON_SECRET bearer token ile korunur.
// Sunucu crontab: 0 9 * * * curl -s -H "Authorization: Bearer $CRON_SECRET" https://apolloyonetim.com/api/cron
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
  try {
    const result = await runDailyTasks();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Bilinmeyen hata" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}
export async function POST(req: NextRequest) {
  return handle(req);
}
