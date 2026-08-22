import nodemailer, { type Transporter } from "nodemailer";

// Birleşik bildirim katmanı: uygulama-içi + SMS (NetGSM) + e-posta (SMTP).
// Tüm dış kanallar env ile yapılandırılır; anahtar yoksa sessizce devre dışı kalır.
// Böylece her firma kendi .env'ine kendi sağlayıcı anahtarlarını girer.

// ─────────────── SMS (NetGSM) ───────────────
export function smsConfigured(): boolean {
  return !!(process.env.NETGSM_USERCODE && process.env.NETGSM_PASSWORD && process.env.NETGSM_HEADER);
}

export async function sendSms(to: string, message: string): Promise<boolean> {
  if (!smsConfigured()) return false;
  const gsm = to.replace(/\D/g, "").replace(/^90/, "").replace(/^0/, "");
  if (gsm.length < 10) return false;
  try {
    const url = new URL("https://api.netgsm.com.tr/sms/send/get");
    url.searchParams.set("usercode", process.env.NETGSM_USERCODE!);
    url.searchParams.set("password", process.env.NETGSM_PASSWORD!);
    url.searchParams.set("msgheader", process.env.NETGSM_HEADER!);
    url.searchParams.set("message", message);
    url.searchParams.set("gsmno", "0" + gsm);
    const res = await fetch(url.toString());
    const text = (await res.text()).trim();
    // NetGSM: "00 <jobid>" veya "01/02.." başarı; "20/30/40/70" hata kodları
    return res.ok && /^0[012]\b/.test(text);
  } catch {
    return false;
  }
}

// ─────────────── E-posta (SMTP / nodemailer) ───────────────
let transporter: Transporter | null = null;
let transporterTried = false;

export function emailConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter(): Transporter | null {
  if (transporterTried) return transporter;
  transporterTried = true;
  if (!emailConfigured()) return null;
  const port = Number(process.env.SMTP_PORT || 587);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
  });
  return transporter;
}

export async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  const t = getTransporter();
  if (!t) return false;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER!;
  try {
    await t.sendMail({ from, to, subject, text });
    return true;
  } catch {
    return false;
  }
}

// ─────────────── Birleşik gönderim ───────────────
export interface NotifyData {
  baslik: string;
  mesaj: string;
  tip: string;
  link?: string;
}

/**
 * Bir kullanıcıya bildirim: her zaman uygulama-içi; istenirse SMS + e-posta.
 * Dış kanallar yalnızca yapılandırılmış + kullanıcının iletişim bilgisi varsa gönderilir.
 */
export async function notifyUser(
  userId: string,
  data: NotifyData,
  channels: { sms?: boolean; email?: boolean } = {}
): Promise<void> {
  const { prisma } = await import("./prisma");
  await prisma.notification.create({ data: { ...data, userId } });
  if (!channels.sms && !channels.email) return;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, telefon: true },
  });
  if (!user) return;
  if (channels.sms && user.telefon) await sendSms(user.telefon, `${data.baslik}: ${data.mesaj}`);
  if (channels.email && user.email) await sendEmail(user.email, data.baslik, data.mesaj);
}
