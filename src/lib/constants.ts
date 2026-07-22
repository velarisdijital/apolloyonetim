export const KATEGORI_LABELS: Record<string, string> = {
  ELEKTRIK: "Elektrik",
  SU: "Su",
  DOGALGAZ: "Doğalgaz",
  TEMIZLIK: "Temizlik",
  BAKIM: "Bakım",
  TAMIRAT: "Tamirat",
  ASANSOR: "Asansör",
  SIGORTA: "Sigorta",
  PERSONEL: "Personel",
  DIGER: "Diğer",
};

export const ROL_LABELS: Record<string, string> = {
  MASTER_ADMIN: "Yönetici",
  KAPICI: "Kapıcı",
  DENETCI: "Denetçi",
  EV_SAHIBI: "Ev Sahibi",
  KIRACI: "Kiracı",
};

export const ODEME_DURUM_LABELS: Record<string, string> = {
  ODENMEDI: "Ödenmedi",
  ODENDI: "Ödendi",
  GECIKTI: "Gecikti",
  KISMI: "Kısmi Ödeme",
  ONAY_BEKLIYOR: "Onay Bekliyor",
};

export const ONAY_DURUM_LABELS: Record<string, string> = {
  BEKLEMEDE: "Onay Bekliyor",
  ONAYLANDI: "Onaylandı",
  REDDEDILDI: "Reddedildi",
};

const ALL_ROLES = ["MASTER_ADMIN", "KAPICI", "DENETCI", "EV_SAHIBI", "KIRACI"];
const YONETIM = ["MASTER_ADMIN", "KAPICI"];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MALI = ["MASTER_ADMIN", "DENETCI"];

export const NAV_ITEMS = [
  { href: "/panel", label: "Panel", i18nKey: "panel" as const, icon: "LayoutDashboard", roles: ALL_ROLES },
  { href: "/giderler", label: "Giderler", i18nKey: "expenses" as const, icon: "Receipt", roles: ["MASTER_ADMIN", "KAPICI", "DENETCI", "EV_SAHIBI"] },
  { href: "/onay-bekleyen", label: "Onay Bekleyenler", i18nKey: "pendingApproval" as const, icon: "ClipboardCheck", roles: ["MASTER_ADMIN", "DENETCI"] },
  { href: "/aidatlar", label: "Aidatlar", i18nKey: "dues" as const, icon: "Wallet", roles: ALL_ROLES },
  { href: "/odemeler", label: "Ödemeler", i18nKey: "payments" as const, icon: "CreditCard", roles: YONETIM },
  { href: "/raporlar", label: "Raporlar", i18nKey: "reports" as const, icon: "BarChart3", roles: ["MASTER_ADMIN", "DENETCI", "EV_SAHIBI"] },
  { href: "/toplantilar", label: "Toplantılar", i18nKey: "meetings" as const, icon: "Users", roles: ALL_ROLES },
  { href: "/oylamalar", label: "Oylamalar", i18nKey: "polls" as const, icon: "Vote", roles: ALL_ROLES },
  { href: "/duyurular", label: "Duyurular", i18nKey: "announcements" as const, icon: "Megaphone", roles: ALL_ROLES },
  { href: "/rezervasyonlar", label: "Rezervasyonlar", i18nKey: "reservations" as const, icon: "CalendarCheck", roles: ALL_ROLES },
  { href: "/mesajlar", label: "Mesajlar", i18nKey: "messages" as const, icon: "MessageCircle", roles: ALL_ROLES },
  { href: "/kurallar", label: "Bina Kuralları", i18nKey: "rules" as const, icon: "BookOpen", roles: ALL_ROLES },
  { href: "/arizalar", label: "Arıza Bildir", i18nKey: "maintenance" as const, icon: "Wrench", roles: ALL_ROLES },
  { href: "/sakinler", label: "Sakinler", i18nKey: "residents" as const, icon: "UserCog", roles: ["MASTER_ADMIN"] },
  { href: "/ayarlar", label: "Ayarlar", i18nKey: "settings" as const, icon: "Settings", roles: ALL_ROLES },
];
