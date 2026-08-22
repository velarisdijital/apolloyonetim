// Ödeme sağlayıcı soyutlaması. PAYMENT_PROVIDER env'i ile iyzico veya PayTR seçilir.
// Anahtarlar env'de; boşsa ödeme devre dışı (getProvider null döner).
// Her firma kendi merchant hesabını açıp anahtarlarını .env'e girer.

export interface InitParams {
  orderId: string; // Payment.id (BEKLEMEDE) — sipariş referansı
  amount: number; // TL (ondalık)
  email: string;
  name: string;
  phone?: string;
  userIp: string;
  description: string;
}

export interface InitResult {
  ok: boolean;
  redirectUrl?: string; // ödeme sayfası / iframe URL'i
  error?: string;
}

export interface CallbackResult {
  ok: boolean; // imza/doğrulama geçerli mi
  success: boolean; // ödeme başarılı mı
  orderId?: string; // Payment.id
  amount?: number;
  reply?: string; // sağlayıcıya döndürülecek yanıt (PayTR "OK" bekler)
}

export interface PaymentProvider {
  name: string;
  initCheckout(p: InitParams): Promise<InitResult>;
  handleCallback(req: Request): Promise<CallbackResult>;
}

export function appUrl(): string {
  return process.env.APP_URL || process.env.NEXTAUTH_URL || "https://apolloyonetim.com";
}

export function paymentEnabled(): boolean {
  return getProvider() !== null;
}

export function getProvider(): PaymentProvider | null {
  const p = (process.env.PAYMENT_PROVIDER || "").toLowerCase();
  if (p === "iyzico") {
    if (!process.env.IYZICO_API_KEY || !process.env.IYZICO_SECRET_KEY) return null;
    // Dinamik import yerine tekil require: SDK CommonJS
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { IyzicoProvider } = require("./iyzico");
    return new IyzicoProvider();
  }
  if (p === "paytr") {
    if (!process.env.PAYTR_MERCHANT_ID || !process.env.PAYTR_MERCHANT_KEY || !process.env.PAYTR_MERCHANT_SALT) return null;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PaytrProvider } = require("./paytr");
    return new PaytrProvider();
  }
  return null;
}
