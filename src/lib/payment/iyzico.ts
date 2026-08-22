import { appUrl, type InitParams, type InitResult, type CallbackResult, type PaymentProvider } from "./index";

// iyzico Checkout Form. Dokümantasyon: https://dev.iyzipay.com
// Gerekli env: IYZICO_API_KEY, IYZICO_SECRET_KEY, IYZICO_URI
//   (sandbox: https://sandbox-api.iyzipay.com — prod: https://api.iyzipay.com)
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

function client(): any {
  const Iyzipay = require("iyzipay");
  return new Iyzipay({
    apiKey: process.env.IYZICO_API_KEY!,
    secretKey: process.env.IYZICO_SECRET_KEY!,
    uri: process.env.IYZICO_URI || "https://sandbox-api.iyzipay.com",
  });
}

export class IyzicoProvider implements PaymentProvider {
  name = "iyzico";

  async initCheckout(p: InitParams): Promise<InitResult> {
    const iyzipay = client();
    const [ad, ...rest] = p.name.trim().split(" ");
    const soyad = rest.join(" ") || ad;
    const price = p.amount.toFixed(2);

    const request = {
      locale: "tr",
      conversationId: p.orderId,
      price,
      paidPrice: price,
      currency: "TRY",
      basketId: p.orderId,
      paymentGroup: "PRODUCT",
      callbackUrl: `${appUrl()}/api/odeme/callback/iyzico`,
      buyer: {
        id: p.orderId,
        name: ad,
        surname: soyad,
        gsmNumber: p.phone || "+905000000000",
        email: p.email,
        identityNumber: "11111111111",
        registrationAddress: "-",
        ip: p.userIp,
        city: "Istanbul",
        country: "Turkey",
      },
      shippingAddress: { contactName: p.name, city: "Istanbul", country: "Turkey", address: "-" },
      billingAddress: { contactName: p.name, city: "Istanbul", country: "Turkey", address: "-" },
      basketItems: [
        { id: p.orderId, name: p.description, category1: "Aidat", itemType: "VIRTUAL", price },
      ],
    };

    return new Promise<InitResult>((resolve) => {
      iyzipay.checkoutFormInitialize.create(request, (err: any, result: any) => {
        if (err || !result || result.status !== "success") {
          resolve({ ok: false, error: (result && result.errorMessage) || (err && err.message) || "iyzico başlatılamadı" });
          return;
        }
        resolve({ ok: true, redirectUrl: result.paymentPageUrl });
      });
    });
  }

  async handleCallback(req: Request): Promise<CallbackResult> {
    const form = await req.formData();
    const token = String(form.get("token") || "");
    if (!token) return { ok: false, success: false };
    const iyzipay = client();

    return new Promise<CallbackResult>((resolve) => {
      iyzipay.checkoutForm.retrieve({ locale: "tr", token }, (err: any, result: any) => {
        if (err || !result || result.status !== "success") {
          resolve({ ok: false, success: false });
          return;
        }
        resolve({
          ok: true,
          success: result.paymentStatus === "SUCCESS",
          orderId: result.conversationId,
          amount: Number(result.paidPrice),
        });
      });
    });
  }
}
