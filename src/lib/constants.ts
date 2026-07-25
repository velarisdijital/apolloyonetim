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
  { href: "/cezalar", label: "Ceza Sistemi", i18nKey: "penalties" as const, icon: "ShieldAlert", roles: ALL_ROLES },
  { href: "/arizalar", label: "Arıza Bildir", i18nKey: "maintenance" as const, icon: "Wrench", roles: ALL_ROLES },
  { href: "/sayaclar", label: "Sayaçlar", i18nKey: "meters" as const, icon: "Gauge", roles: YONETIM },
  { href: "/ziyaretciler", label: "Ziyaretçiler", i18nKey: "visitors" as const, icon: "UserCheck", roles: YONETIM },
  { href: "/araclar", label: "Araçlar", i18nKey: "vehicles" as const, icon: "Car", roles: ALL_ROLES },
  { href: "/evcil-hayvanlar", label: "Evcil Hayvanlar", i18nKey: "pets" as const, icon: "PawPrint", roles: ALL_ROLES },
  { href: "/belgeler", label: "Belgeler", i18nKey: "documents" as const, icon: "FolderOpen", roles: ALL_ROLES },
  { href: "/hizmet-rehberi", label: "Hizmet Rehberi", i18nKey: "services" as const, icon: "Phone", roles: ALL_ROLES },
  { href: "/acil-durum", label: "Acil Durum", i18nKey: "emergency" as const, icon: "Siren", roles: ALL_ROLES },
  { href: "/demirbaslar", label: "Demirbaşlar", i18nKey: "demirbaslar" as const, icon: "Package", roles: YONETIM },
  { href: "/bakim-planlama", label: "Bakım Planlama", i18nKey: "bakimPlanlama" as const, icon: "Wrench", roles: YONETIM },
  { href: "/gorevler", label: "Görevler", i18nKey: "gorevler" as const, icon: "ClipboardList", roles: ALL_ROLES },
  { href: "/anketler", label: "Anketler", i18nKey: "anketler" as const, icon: "BarChart3", roles: ALL_ROLES },
  { href: "/etkinlikler", label: "Etkinlikler", i18nKey: "etkinlikler" as const, icon: "Calendar", roles: ALL_ROLES },
  { href: "/stok", label: "Stok Takibi", i18nKey: "stok" as const, icon: "Package", roles: YONETIM },
  { href: "/hukuki", label: "Hukuki Şablonlar", i18nKey: "hukuki" as const, icon: "Scale", roles: ALL_ROLES },
  { href: "/aidat-ayar", label: "Aidat Ayarları", i18nKey: "aidatAyar" as const, icon: "Settings", roles: ["MASTER_ADMIN"] },
  { href: "/personel", label: "Personel", i18nKey: "personel" as const, icon: "UserCog", roles: ["MASTER_ADMIN"] },
  { href: "/kira-sozlesmeleri", label: "Kira Sözleşmeleri", i18nKey: "kiraSozlesmeleri" as const, icon: "FileText", roles: ["MASTER_ADMIN"] },
  { href: "/temizlik", label: "Temizlik Takip", i18nKey: "temizlik" as const, icon: "Sparkles", roles: YONETIM },
  { href: "/sikayetler", label: "Şikayetler", i18nKey: "sikayetler" as const, icon: "MessageSquareWarning", roles: ALL_ROLES },
  { href: "/paketler", label: "Paketler", i18nKey: "paketler" as const, icon: "PackageCheck", roles: ALL_ROLES },
  { href: "/sigortalar", label: "Sigortalar", i18nKey: "sigortalar" as const, icon: "Shield", roles: ["MASTER_ADMIN"] },
  { href: "/tasinma", label: "Taşınma", i18nKey: "tasinma" as const, icon: "Truck", roles: ALL_ROLES },
  { href: "/guvenlik-denetim", label: "Güvenlik Denetim", i18nKey: "guvenlikDenetim" as const, icon: "ShieldCheck", roles: YONETIM },
  { href: "/bina-fotograf", label: "Bina Fotoğrafları", i18nKey: "binaFotograf" as const, icon: "Camera", roles: ALL_ROLES },
  { href: "/enerji-analiz", label: "Enerji Analizi", i18nKey: "enerjiAnaliz" as const, icon: "Zap", roles: ["MASTER_ADMIN", "DENETCI"] },
  { href: "/sakinler", label: "Sakinler", i18nKey: "residents" as const, icon: "UserCog", roles: ["MASTER_ADMIN"] },
  { href: "/ayarlar", label: "Ayarlar", i18nKey: "settings" as const, icon: "Settings", roles: ALL_ROLES },
];
