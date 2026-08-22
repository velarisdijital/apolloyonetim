import { prisma } from "./prisma";
import { sendSms, sendEmail, smsConfigured, emailConfigured } from "./notify";

// Günlük zamanlanmış görevler. /api/cron endpoint'i (CRON_SECRET korumalı) veya
// sunucu crontab'ı tarafından tetiklenir. Böylece "otomatik borçlandırma / gecikme
// / hatırlatma" gerçekten proaktif çalışır (sayfa açılışına bağlı kalmaz).

export interface DailyTaskResult {
  markedOverdue: number;
  remindersCreated: number;
  ranAt: string;
}

const UNPAID = ["ODENMEDI", "GECIKTI", "KISMI", "ONAY_BEKLIYOR"] as const;

function dayWindow(offsetDays: number) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + offsetDays);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export async function runDailyTasks(): Promise<DailyTaskResult> {
  const now = new Date();

  // 1) Vadesi geçmiş ödenmemiş aidatları GECIKTI yap (tüm binalar, proaktif)
  const overdue = await prisma.duesItem.updateMany({
    where: { durum: "ODENMEDI", dues: { sonOdemeTarihi: { lt: now } } },
    data: { durum: "GECIKTI" },
  });

  // 2) Bugün son gün olan ve 3 gün kalan aidatlar için sakinlere hatırlatma
  let remindersCreated = 0;
  const reminders: { offset: number; baslik: string }[] = [
    { offset: 0, baslik: "Aidat son ödeme günü bugün" },
    { offset: 3, baslik: "Aidat ödemesine 3 gün kaldı" },
  ];

  for (const { offset, baslik } of reminders) {
    const { start, end } = dayWindow(offset);
    const duesList = await prisma.dues.findMany({
      where: { sonOdemeTarihi: { gte: start, lt: end } },
      include: {
        items: {
          where: { durum: { in: UNPAID as unknown as ("ODENMEDI" | "GECIKTI" | "KISMI" | "ONAY_BEKLIYOR")[] } },
          include: { apartment: { include: { residents: { select: { id: true, email: true, telefon: true } } } } },
        },
      },
    });

    const notifications: { baslik: string; mesaj: string; tip: string; link: string; userId: string }[] = [];
    const contacts: { email: string | null; telefon: string | null; mesaj: string }[] = [];
    for (const dues of duesList) {
      const tarih = dues.sonOdemeTarihi.toLocaleDateString("tr-TR");
      const mesaj = `${dues.ay}/${dues.yil} dönemi aidatınızın son ödeme tarihi ${tarih}.`;
      for (const item of dues.items) {
        for (const resident of item.apartment.residents) {
          notifications.push({ baslik, mesaj, tip: "aidat", link: "/aidatlar", userId: resident.id });
          contacts.push({ email: resident.email, telefon: resident.telefon, mesaj });
        }
      }
    }

    if (notifications.length) {
      await prisma.notification.createMany({ data: notifications });
      remindersCreated += notifications.length;
      // Dış kanallar (yapılandırıldıysa): SMS + e-posta
      const smsOn = smsConfigured();
      const mailOn = emailConfigured();
      if (smsOn || mailOn) {
        for (const c of contacts) {
          if (smsOn && c.telefon) await sendSms(c.telefon, `${baslik}: ${c.mesaj}`);
          if (mailOn && c.email) await sendEmail(c.email, baslik, c.mesaj);
        }
      }
    }
  }

  return { markedOverdue: overdue.count, remindersCreated, ranAt: now.toISOString() };
}
