// Basit in-memory rate limiter (tek pm2 instance için yeterli).
// Brute-force / kötüye kullanımı yavaşlatmak için login ve hassas uçlarda kullanılır.

type Bucket = { count: number; reset: number };

const store = new Map<string, Bucket>();
let lastSweep = 0;

function sweep(now: number) {
  // Ara sıra süresi dolmuş kayıtları temizle (bellek şişmesini önle)
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  store.forEach((b, k) => {
    if (now > b.reset) store.delete(k);
  });
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number; // saniye
}

/**
 * Sabit pencere rate limit.
 * @param key benzersiz anahtar (ör. "login:1.2.3.4")
 * @param limit pencere içindeki izinli istek sayısı
 * @param windowMs pencere süresi (ms)
 */
export function checkRateLimit(key: string, limit = 5, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const b = store.get(key);
  if (!b || now > b.reset) {
    store.set(key, { count: 1, reset: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }
  if (b.count >= limit) {
    return { allowed: false, remaining: 0, retryAfter: Math.max(1, Math.ceil((b.reset - now) / 1000)) };
  }
  b.count++;
  return { allowed: true, remaining: limit - b.count, retryAfter: 0 };
}

/** Başarılı işlemden sonra sayacı sıfırlamak için (ör. doğru şifre girildiğinde). */
export function resetRateLimit(key: string) {
  store.delete(key);
}

/** İstek başlıklarından istemci IP'sini çıkarır (nginx reverse proxy arkasında). */
export function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return headers.get("x-real-ip") || "unknown";
}
