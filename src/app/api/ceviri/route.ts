import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import translate from "google-translate-api-x";

const cache = new Map<string, { text: string; ts: number }>();
const CACHE_TTL = 1000 * 60 * 60;

function getCacheKey(text: string, to: string): string {
  return `${to}:${text.substring(0, 200)}`;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();
  const { texts, to } = body as { texts: { id: string; text: string }[]; to: string };

  if (!texts || !to || !Array.isArray(texts)) {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const now = Date.now();
  const results: Record<string, string> = {};
  const toTranslate: { id: string; text: string }[] = [];

  for (const item of texts) {
    const key = getCacheKey(item.text, to);
    const cached = cache.get(key);
    if (cached && now - cached.ts < CACHE_TTL) {
      results[item.id] = cached.text;
    } else {
      toTranslate.push(item);
    }
  }

  if (toTranslate.length > 0) {
    try {
      const batchTexts = toTranslate.map(t => t.text);
      const res = await translate(batchTexts, { to, autoCorrect: false });

      const responses = Array.isArray(res) ? res : [res];
      for (let i = 0; i < toTranslate.length; i++) {
        const translated = responses[i]?.text || toTranslate[i].text;
        results[toTranslate[i].id] = translated;

        const key = getCacheKey(toTranslate[i].text, to);
        cache.set(key, { text: translated, ts: now });
      }
    } catch {
      for (const item of toTranslate) {
        results[item.id] = item.text;
      }
    }
  }

  if (cache.size > 5000) {
    const entries = Array.from(cache.entries());
    entries.sort((a, b) => a[1].ts - b[1].ts);
    for (let i = 0; i < entries.length - 3000; i++) {
      cache.delete(entries[i][0]);
    }
  }

  return NextResponse.json({ translations: results });
}
