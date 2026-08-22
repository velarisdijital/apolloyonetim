import crypto from "crypto";
import { appUrl, type InitParams, type InitResult, type CallbackResult, type PaymentProvider } from "./index";

// PayTR iFrame API. Dokümantasyon: https://www.paytr.com/entegrasyon
// Gerekli env: PAYTR_MERCHANT_ID, PAYTR_MERCHANT_KEY, PAYTR_MERCHANT_SALT, (opsiyonel) PAYMENT_TEST_MODE
export class PaytrProvider implements PaymentProvider {
  name = "paytr";

  async initCheckout(p: InitParams): Promise<InitResult> {
    const merchant_id = process.env.PAYTR_MERCHANT_ID!;
    const merchant_key = process.env.PAYTR_MERCHANT_KEY!;
    const merchant_salt = process.env.PAYTR_MERCHANT_SALT!;
    const test_mode = process.env.PAYMENT_TEST_MODE === "1" ? "1" : "0";

    const merchant_oid = p.orderId.replace(/[^a-zA-Z0-9]/g, ""); // PayTR: yalnızca alfanümerik
    const payment_amount = Math.round(p.amount * 100); // kuruş, tam sayı
    const user_basket = Buffer.from(
      JSON.stringify([[p.description, String(p.amount.toFixed(2)), 1]])
    ).toString("base64");
    const no_installment = "0";
    const max_installment = "0";
    const currency = "TL";

    const hashStr =
      merchant_id + p.userIp + merchant_oid + p.email + payment_amount +
      user_basket + no_installment + max_installment + currency + test_mode;
    const paytr_token = crypto
      .createHmac("sha256", merchant_key)
      .update(hashStr + merchant_salt)
      .digest("base64");

    const body = new URLSearchParams({
      merchant_id,
      user_ip: p.userIp,
      merchant_oid,
      email: p.email,
      payment_amount: String(payment_amount),
      paytr_token,
      user_basket,
      debug_on: "1",
      no_installment,
      max_installment,
      user_name: p.name,
      user_address: "-",
      user_phone: p.phone || "-",
      merchant_ok_url: `${appUrl()}/aidatlar?odeme=ok`,
      merchant_fail_url: `${appUrl()}/aidatlar?odeme=fail`,
      timeout_limit: "30",
      currency,
      test_mode,
    });

    try {
      const res = await fetch("https://www.paytr.com/odeme/api/get-token", { method: "POST", body });
      const data = (await res.json()) as { status: string; token?: string; reason?: string };
      if (data.status === "success" && data.token) {
        return { ok: true, redirectUrl: `https://www.paytr.com/odeme/guvenli/${data.token}` };
      }
      return { ok: false, error: data.reason || "PayTR token alınamadı" };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "PayTR bağlantı hatası" };
    }
  }

  async handleCallback(req: Request): Promise<CallbackResult> {
    const merchant_key = process.env.PAYTR_MERCHANT_KEY!;
    const merchant_salt = process.env.PAYTR_MERCHANT_SALT!;
    const form = await req.formData();
    const merchant_oid = String(form.get("merchant_oid") || "");
    const status = String(form.get("status") || "");
    const total_amount = String(form.get("total_amount") || "");
    const hash = String(form.get("hash") || "");

    const calc = crypto
      .createHmac("sha256", merchant_key)
      .update(merchant_oid + merchant_salt + status + total_amount)
      .digest("base64");

    if (calc !== hash) {
      return { ok: false, success: false, reply: "PAYTR notification failed: bad hash" };
    }
    return {
      ok: true,
      success: status === "success",
      orderId: merchant_oid,
      amount: Number(total_amount) / 100,
      reply: "OK", // PayTR düz metin "OK" bekler
    };
  }
}
