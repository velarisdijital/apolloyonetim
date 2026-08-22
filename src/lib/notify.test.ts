import { describe, it, expect, afterEach } from "vitest";
import { smsConfigured, emailConfigured } from "./notify";

describe("notify yapılandırması", () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it("SMS anahtarları yoksa devre dışı", () => {
    delete process.env.NETGSM_USERCODE;
    delete process.env.NETGSM_PASSWORD;
    delete process.env.NETGSM_HEADER;
    expect(smsConfigured()).toBe(false);
  });

  it("SMS anahtarları varsa aktif", () => {
    process.env.NETGSM_USERCODE = "u";
    process.env.NETGSM_PASSWORD = "p";
    process.env.NETGSM_HEADER = "APOLLO";
    expect(smsConfigured()).toBe(true);
  });

  it("SMTP anahtarları yoksa e-posta devre dışı", () => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    expect(emailConfigured()).toBe(false);
  });
});
