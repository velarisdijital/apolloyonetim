import { describe, it, expect } from "vitest";
import { checkRateLimit, resetRateLimit } from "./rate-limit";

describe("rate-limit", () => {
  it("limite kadar izin verir, sonra engeller", () => {
    const key = "test:" + Math.random();
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit(key, 3, 60_000).allowed).toBe(true);
    }
    const blocked = checkRateLimit(key, 3, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("reset sonrası tekrar izin verir", () => {
    const key = "test2:" + Math.random();
    checkRateLimit(key, 1, 60_000);
    expect(checkRateLimit(key, 1, 60_000).allowed).toBe(false);
    resetRateLimit(key);
    expect(checkRateLimit(key, 1, 60_000).allowed).toBe(true);
  });

  it("farklı anahtarlar birbirini etkilemez", () => {
    const a = "a:" + Math.random();
    const b = "b:" + Math.random();
    checkRateLimit(a, 1, 60_000);
    expect(checkRateLimit(a, 1, 60_000).allowed).toBe(false);
    expect(checkRateLimit(b, 1, 60_000).allowed).toBe(true);
  });
});
