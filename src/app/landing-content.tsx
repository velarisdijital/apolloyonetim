"use client";

/*
  APOLLO LANDING — cinematic scrub hero + trilingual explanatory body
  THESIS: A building's management chaos becomes one live system. The hero is a
    dusk descent down a façade whose windows light up floor by floor as you scroll;
    each light is a flat joining the system. Refuses the SaaS gradient-hero + pastel
    feature-card template.
  OWN-WORLD: Deep dusk indigo canvas (never black), warm amber window-light accent
    (rare — CTA + emphasis only), cool glass/stone panels. Archivo poster display,
    Inter body, JetBrains Mono kicker labels. Note: dark+amber is a flagged AI reach,
    but amber IS the subject's own material (window light); canvas is indigo not black,
    type is poster-sans not high-contrast serif — deviation stated out loud.
  STORY: Visitor sees the building come alive → understands Apollo runs the whole
    building in one place, in their language, on their own server → signs in.
  FIRST VIEWPORT: full-bleed dusk façade video, mono kicker top-left, poster headline
    over the sky negative space, amber "Giriş Yap" CTA; a vertical amber floor-rail
    fills as you scroll (signature element).
  FORM: scroll-scrubbed hero (10k-websites pipeline) adapted into the Next.js app.
  FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
*/

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Oswald, JetBrains_Mono, Inter } from "next/font/google";
import { useTranslation } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/types";
import { Building2, ArrowRight, ChevronDown } from "lucide-react";

const display = Oswald({ subsets: ["latin", "latin-ext", "cyrillic"], weight: ["500", "600", "700"], variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin", "latin-ext"], weight: ["500", "700"], variable: "--font-mono" });
const body = Inter({ subsets: ["latin", "latin-ext", "cyrillic"], weight: ["400", "500", "600", "700"], variable: "--font-body" });

const HERO_VIDEO = "/hero/hero-scrub.mp4";
const HERO_POSTER = "/hero/hero-poster.jpg";

const LANDING_LOCALES: { code: Locale; label: string }[] = [
  { code: "tr", label: "TR" }, { code: "en", label: "EN" }, { code: "ru", label: "RU" },
];

// Hero caption bands: range + entrance (copy from L.hero.bands) -------------------
const BANDS = [
  { a: 0.0, b: 0.2, entrance: "drift" },
  { a: 0.26, b: 0.48, entrance: "rise" },
  { a: 0.52, b: 0.72, entrance: "approach" },
];

type Feature = { name: string; desc: string };
type Pillar = { title: string; tagline: string; items: Feature[] };
interface Copy {
  nav: { how: string; login: string };
  hero: {
    kicker: string;
    bands: string[];
    settleTitle: string; settleSub: string;
    cta: string; ctaSecondary: string;
    scrollHint: string;
  };
  problem: { kicker: string; title: string; body: string; before: string[]; after: string };
  how: { kicker: string; title: string; steps: { title: string; desc: string }[] };
  pillars: { kicker: string; title: string; sub: string; items: Pillar[]; allTitle: string };
  roles: { kicker: string; title: string; sub: string; items: { role: string; desc: string }[] };
  diff: { kicker: string; title: string; items: { title: string; desc: string }[] };
  faq: { kicker: string; title: string; items: { q: string; a: string }[] };
  cta: { title: string; sub: string; button: string };
  footer: { tagline: string; by: string };
  langNote: string;
}

const LANGS = [
  { flag: "🇹🇷", name: "Türkçe" }, { flag: "🇬🇧", name: "English" }, { flag: "🇩🇪", name: "Deutsch" },
  { flag: "🇫🇷", name: "Français" }, { flag: "🇸🇦", name: "العربية" }, { flag: "🇷🇺", name: "Русский" },
  { flag: "🇺🇦", name: "Українська" }, { flag: "🇵🇱", name: "Polski" }, { flag: "🇬🇪", name: "ქართული" },
];

const L: Record<"tr" | "en" | "ru", Copy> = {
  // ───────────── TR ─────────────
  tr: {
    nav: { how: "Nasıl çalışır", login: "Giriş Yap" },
    hero: {
      kicker: "APOLLO · APARTMAN & SİTE YÖNETİMİ",
      bands: [
        "Binanızın tamamı. Tek ekranda.",
        "Aidattan arızaya, her kat, her daire.",
        "Yönetici ve tüm sakinler aynı canlı sistemde.",
      ],
      settleTitle: "Apollo ile bina hayat buluyor.",
      settleSub: "40+ modül · 9 dil · 5 rol · kendi sunucunuzda.",
      cta: "Giriş Yap",
      ctaSecondary: "Nasıl çalışır?",
      scrollHint: "Kaydırın",
    },
    problem: {
      kicker: "SORUN",
      title: "Bir binayı yönetmek dağınıktır.",
      body: "Aidat bir Excel'de, borçlular bir defterde, makbuzlar çekmecede, duyurular WhatsApp grubunda kaybolur, arıza çağrıları telefonda. Kimin ne ödediği, hangi işin yapıldığı hiçbir zaman tek yerde değildir.",
      before: ["Excel'de aidat", "Defterde borç", "Çekmecede makbuz", "WhatsApp'ta duyuru", "Telefonda arıza"],
      after: "Apollo hepsini tek canlı sisteme alır.",
    },
    how: {
      kicker: "NASIL ÇALIŞIR",
      title: "Beş adımda düzen.",
      steps: [
        { title: "Binanızı kurun", desc: "Daire sayısını, blokları ve sakinleri bir kez tanımlayın. Sistem yapınızı çıkarır." },
        { title: "Sakinleri davet edin", desc: "Her sakin kendi hesabıyla girer ve sistemi kendi dilinde görür." },
        { title: "Aidatı otomatikleştirin", desc: "Aylık aidat kendiliğinden tahakkuk eder, gecikme faizi hesaplanır, borç herkese görünür." },
        { title: "Gideri onaylayın", desc: "Kapıcı fişi fotoğraflar, denetçi onaylar, harcama şeffaf kayda geçer." },
        { title: "Yönetmeye başlayın", desc: "Duyuru, oylama, arıza, ziyaretçi, sayaç... hepsi tek panelde akar." },
      ],
    },
    pillars: {
      kicker: "SİSTEM",
      title: "İhtiyacınız olan her şey, altı başlıkta.",
      sub: "Her modül fayda için var; hepsi aynı canlı veriden beslenir.",
      allTitle: "40+ modülün tamamı",
      items: [
        { title: "Mali Yönetim", tagline: "Paranın kontrolü sizde.", items: [
          { name: "Gider Takibi", desc: "Tüm giderleri kategorize edin, fişleri fotoğraflayın." },
          { name: "Aidat Yönetimi", desc: "Daire bazlı ödeme durumu ve otomatik borçlandırma." },
          { name: "Rapor & Analiz", desc: "Gelir-gider raporları, grafikler, PDF çıktı." },
          { name: "Onay Mekanizması", desc: "Mali işlemler denetçi onayından geçer." },
          { name: "Gecikme Faizi", desc: "Geciken aidata otomatik faiz ve bildirim." },
        ] },
        { title: "İletişim & Karar", tagline: "Sakinlerle güçlü bağ.", items: [
          { name: "Duyuru Sistemi", desc: "Önemli bildirimleri anında tüm sakinlere ulaştırın." },
          { name: "Oylama", desc: "Bina kararlarını demokratik şekilde oylayın." },
          { name: "Toplantı Kayıtları", desc: "Tutanakları oluşturun ve paylaşın." },
          { name: "Mesajlaşma", desc: "Anlık mesajlaşma, otomatik çeviri desteği." },
          { name: "Anketler", desc: "Memnuniyet ve kararlar için detaylı anket." },
        ] },
        { title: "Bina İşletme", tagline: "Günlük operasyon kolaylaşır.", items: [
          { name: "Arıza Bildirimi", desc: "Fotoğraflı bildirim, takip ve çözüm süreci." },
          { name: "Rezervasyon", desc: "Ortak alan ve tesisler için takvim bazlı rezervasyon." },
          { name: "Bakım Planlama", desc: "Asansör, jeneratör, tesisat için periyodik bakım." },
          { name: "Demirbaş Takibi", desc: "Demirbaşları kaydedin, bakım geçmişini izleyin." },
          { name: "Temizlik Takip", desc: "Günlük fotoğraflar, otomatik 30 gün arşiv." },
        ] },
        { title: "Güvenlik & Kayıt", tagline: "Bina güvende kalır.", items: [
          { name: "Ziyaretçi Yönetimi", desc: "Giriş-çıkışları kaydedin ve takip edin." },
          { name: "Araç Kayıt", desc: "Sakin ve ziyaretçi araçlarını plaka bazlı tutun." },
          { name: "Güvenlik Denetim", desc: "Yangın, elektrik, yapısal denetim kayıtları." },
          { name: "Acil Durum", desc: "Tek tuşla acil bildirim, anlık uyarı." },
          { name: "Bina Fotoğrafları", desc: "Kategorili görsel arşiv." },
        ] },
        { title: "Sakin Hizmetleri", tagline: "Sakin deneyimi iyileşir.", items: [
          { name: "Paket Takibi", desc: "Kargo ve paket teslim durumu, bildirim." },
          { name: "Şikayet & Öneri", desc: "Anonim veya açık geri bildirim sistemi." },
          { name: "Evcil Hayvan Kaydı", desc: "Sakinlerin evcil hayvanlarını kaydedin." },
          { name: "Bina Kuralları", desc: "Kuralları dijital yayınlayın ve paylaşın." },
          { name: "Ceza Sistemi", desc: "İhlallerde kademeli ceza ve uyarı." },
        ] },
        { title: "Yönetim & Analiz", tagline: "Profesyonel bina yönetimi.", items: [
          { name: "Kira Sözleşmeleri", desc: "Sözleşmeleri takip edin, süre dolum uyarısı alın." },
          { name: "Sigorta Poliçeleri", desc: "Sigortaları kaydedin, yenileme hatırlatması." },
          { name: "Taşınma Bildirimi", desc: "Giriş-çıkış bildirimleri ve kontrol listeleri." },
          { name: "Enerji Analizi", desc: "Sayaç verisinden tüketim grafikleri." },
          { name: "Belge Yönetimi", desc: "Tüm belgeleri dijital arşivde saklayın." },
          { name: "Hizmet Rehberi", desc: "Tesisatçı, elektrikçi gibi sağlayıcı rehberi." },
          { name: "Etkinlikler", desc: "Etkinlik oluşturun, katılım takibi yapın." },
          { name: "Sayaç Takibi", desc: "Elektrik, su, doğalgaz okumalarını kaydedin." },
        ] },
      ],
    },
    roles: {
      kicker: "ROLLER",
      title: "Her rol için özel deneyim.",
      sub: "Beş kullanıcı rolü, her birine özel yetki.",
      items: [
        { role: "Yönetici", desc: "Tam yetki: mali yönetim, personel, raporlar, ayarlar." },
        { role: "Kapıcı", desc: "Gider girişi, arıza takibi, temizlik, paket." },
        { role: "Denetçi", desc: "Mali onay, rapor inceleme, enerji analizi." },
        { role: "Ev Sahibi", desc: "Aidat takibi, oylama, duyurular, şikayet." },
        { role: "Kiracı", desc: "Arıza bildirimi, paket takibi, duyuruları görme." },
      ],
    },
    diff: {
      kicker: "NEDEN APOLLO",
      title: "Sizi ayıran dört şey.",
      items: [
        { title: "9 dilde, herkes kendi dilinde", desc: "Türk, Rus, Alman, Ukraynalı, Arap sakinler sistemi kendi dilinde kullanır. Sahildeki yabancı sahipler için birebir." },
        { title: "Kendi sunucunuzda, tam sahiplik", desc: "Veri sizin sunucunuzda kalır. Daire başı aylık kira yok, KVKK'ya uygun." },
        { title: "Cepte native uygulama + PWA", desc: "iOS ve Android için uygulama, tarayıcıdan da yüklenir. Push bildirim." },
        { title: "40+ modül, tek platform", desc: "Giderden sigortaya, oylamadan enerji analizine, ihtiyacınız olan her şey." },
      ],
    },
    faq: {
      kicker: "SORULAR",
      title: "Merak edilenler.",
      items: [
        { q: "Teknik bilgi gerekiyor mu?", a: "Hayır. Yönetici hesabıyla girin, binanızı tanımlayın, gerisi hazır. Sakinler telefonlarından kullanır." },
        { q: "Ödemeleri nasıl takip ediyor?", a: "Her dairenin ödeme durumu, borcu ve gecikmesi anlık görünür; ödemeler işlendikçe bakiye otomatik güncellenir." },
        { q: "Sakinler farklı dil konuşuyor, sorun olur mu?", a: "Olmaz. Her sakin sistemi 9 dilden birinde kullanır, mesajlarda otomatik çeviri vardır." },
        { q: "Verilerim nerede tutuluyor?", a: "Kendi sunucunuzda. Üçüncü bir şirkete kira ödemez, verinizi dışarı çıkarmazsınız." },
      ],
    },
    cta: {
      title: "Binanızı aydınlatmaya hazır mısınız?",
      sub: "Profesyonel bina yönetimi için ihtiyacınız olan her şey hazır.",
      button: "Giriş Yap",
    },
    footer: { tagline: "Apollo Apartman Yönetim Sistemi", by: "Velaris Dijital tarafından geliştirilmiştir" },
    langNote: "9 dil desteği — sakinleriniz kendi dilinde kullanır.",
  },

  // ───────────── EN ─────────────
  en: {
    nav: { how: "How it works", login: "Sign In" },
    hero: {
      kicker: "APOLLO · BUILDING & COMPLEX MANAGEMENT",
      bands: [
        "Your whole building. One screen.",
        "From dues to repairs — every floor, every flat.",
        "Manager and residents, one live system.",
      ],
      settleTitle: "Apollo brings the building to life.",
      settleSub: "40+ modules · 9 languages · 5 roles · on your own server.",
      cta: "Sign In",
      ctaSecondary: "How it works",
      scrollHint: "Scroll",
    },
    problem: {
      kicker: "THE PROBLEM",
      title: "Running a building is chaos.",
      body: "Dues in a spreadsheet, debtors in a notebook, receipts in a drawer, announcements lost in a WhatsApp group, fault calls on the phone. Who paid what and which job got done is never in one place.",
      before: ["Dues in Excel", "Debt in a notebook", "Receipts in a drawer", "Notices on WhatsApp", "Faults by phone"],
      after: "Apollo puts it all in one live system.",
    },
    how: {
      kicker: "HOW IT WORKS",
      title: "Order in five steps.",
      steps: [
        { title: "Set up your building", desc: "Define flats, blocks and residents once. The system maps your structure." },
        { title: "Invite residents", desc: "Each resident signs in with their own account and sees the system in their own language." },
        { title: "Automate dues", desc: "Monthly dues accrue automatically, late interest is calculated, balances are visible to all." },
        { title: "Approve expenses", desc: "The caretaker photographs the receipt, the auditor approves, the spend is logged transparently." },
        { title: "Start managing", desc: "Announcements, voting, faults, visitors, meters — all flow in one panel." },
      ],
    },
    pillars: {
      kicker: "THE SYSTEM",
      title: "Everything you need, in six pillars.",
      sub: "Every module earns its place; all of them run on the same live data.",
      allTitle: "All 40+ modules",
      items: [
        { title: "Financial", tagline: "Money, under control.", items: [
          { name: "Expense Tracking", desc: "Categorize every expense, photograph receipts." },
          { name: "Dues Management", desc: "Per-flat payment status and auto-charging." },
          { name: "Reports & Analytics", desc: "Income–expense reports, charts, PDF export." },
          { name: "Approval Workflow", desc: "Financial transactions pass auditor approval." },
          { name: "Late Interest", desc: "Automatic interest and notices for overdue dues." },
        ] },
        { title: "Communication", tagline: "A strong bond with residents.", items: [
          { name: "Announcements", desc: "Deliver important notices to everyone instantly." },
          { name: "Voting", desc: "Vote on building decisions democratically." },
          { name: "Meeting Minutes", desc: "Create and share meeting minutes." },
          { name: "Messaging", desc: "Instant messaging with automatic translation." },
          { name: "Surveys", desc: "Detailed surveys for satisfaction and decisions." },
        ] },
        { title: "Operations", tagline: "Daily operations, simplified.", items: [
          { name: "Fault Reporting", desc: "Photo reports, tracking and resolution flow." },
          { name: "Reservations", desc: "Calendar booking for common areas and facilities." },
          { name: "Maintenance Planning", desc: "Scheduled upkeep for elevators, generators, plumbing." },
          { name: "Asset Tracking", desc: "Register assets, monitor maintenance history." },
          { name: "Cleaning Log", desc: "Daily photos, automatic 30-day archive." },
        ] },
        { title: "Security", tagline: "The building stays safe.", items: [
          { name: "Visitor Management", desc: "Record and track entries and exits." },
          { name: "Vehicle Registry", desc: "Resident and visitor vehicles by plate." },
          { name: "Safety Inspections", desc: "Fire, electrical and structural records." },
          { name: "Emergency Alerts", desc: "One-tap emergency reporting, instant alerts." },
          { name: "Building Photos", desc: "A categorized visual archive." },
        ] },
        { title: "Resident Services", tagline: "A better resident experience.", items: [
          { name: "Package Tracking", desc: "Parcel delivery status and notifications." },
          { name: "Complaints & Suggestions", desc: "Anonymous or open feedback system." },
          { name: "Pet Registration", desc: "Register residents' pets." },
          { name: "Building Rules", desc: "Publish and share rules digitally." },
          { name: "Penalty System", desc: "Graduated penalties and warnings." },
        ] },
        { title: "Management", tagline: "Professional building management.", items: [
          { name: "Lease Contracts", desc: "Track contracts, get expiry reminders." },
          { name: "Insurance Policies", desc: "Record policies, get renewal reminders." },
          { name: "Move In/Out", desc: "Move notices and checklists." },
          { name: "Energy Analytics", desc: "Consumption charts from meter data." },
          { name: "Document Management", desc: "Keep all documents in a digital archive." },
          { name: "Service Directory", desc: "A directory of plumbers, electricians and more." },
          { name: "Events", desc: "Create events, track attendance." },
          { name: "Meter Readings", desc: "Record electricity, water and gas readings." },
        ] },
      ],
    },
    roles: {
      kicker: "ROLES",
      title: "A tailored experience for every role.",
      sub: "Five user roles, each with its own permissions.",
      items: [
        { role: "Manager", desc: "Full access: finances, staff, reports, settings." },
        { role: "Caretaker", desc: "Expense entry, fault tracking, cleaning, packages." },
        { role: "Auditor", desc: "Financial approval, report review, energy analytics." },
        { role: "Owner", desc: "Dues, voting, announcements, complaints." },
        { role: "Tenant", desc: "Report faults, track packages, view announcements." },
      ],
    },
    diff: {
      kicker: "WHY APOLLO",
      title: "Four things that set you apart.",
      items: [
        { title: "9 languages, everyone in their own", desc: "Turkish, Russian, German, Ukrainian and Arabic residents use the system in their own language. Made for foreign owners on the coast." },
        { title: "On your own server, full ownership", desc: "Data stays on your server. No per-flat monthly rent, KVKK-compliant." },
        { title: "Native mobile + PWA", desc: "Apps for iOS and Android, installable from the browser too. Push notifications." },
        { title: "40+ modules, one platform", desc: "From expenses to insurance, voting to energy analytics — everything you need." },
      ],
    },
    faq: {
      kicker: "QUESTIONS",
      title: "Good to know.",
      items: [
        { q: "Do I need technical skills?", a: "No. Sign in as manager, define your building, the rest is ready. Residents use it from their phones." },
        { q: "How does it track payments?", a: "Each flat's payment status, balance and arrears are visible live; balances update automatically as payments are recorded." },
        { q: "My residents speak different languages — a problem?", a: "No. Each resident uses one of 9 languages, and messages have automatic translation." },
        { q: "Where is my data kept?", a: "On your own server. No rent to a third party, your data never leaves." },
      ],
    },
    cta: {
      title: "Ready to light up your building?",
      sub: "Everything you need for professional building management is ready.",
      button: "Sign In",
    },
    footer: { tagline: "Apollo Building Management System", by: "Developed by Velaris Dijital" },
    langNote: "9 languages — your residents use it in their own tongue.",
  },

  // ───────────── RU ─────────────
  ru: {
    nav: { how: "Как это работает", login: "Войти" },
    hero: {
      kicker: "APOLLO · УПРАВЛЕНИЕ ДОМОМ И ЖК",
      bands: [
        "Весь ваш дом. На одном экране.",
        "От взносов до заявок — каждый этаж, каждая квартира.",
        "Управляющий и жильцы — одна живая система.",
      ],
      settleTitle: "С Apollo дом оживает.",
      settleSub: "40+ модулей · 9 языков · 5 ролей · на вашем сервере.",
      cta: "Войти",
      ctaSecondary: "Как это работает",
      scrollHint: "Листайте",
    },
    problem: {
      kicker: "ПРОБЛЕМА",
      title: "Управлять домом — это хаос.",
      body: "Взносы в таблице, должники в тетради, чеки в ящике, объявления теряются в WhatsApp, заявки — по телефону. Кто сколько заплатил и что сделано — никогда не в одном месте.",
      before: ["Взносы в Excel", "Долги в тетради", "Чеки в ящике", "Объявления в WhatsApp", "Заявки по телефону"],
      after: "Apollo собирает всё в одну живую систему.",
    },
    how: {
      kicker: "КАК ЭТО РАБОТАЕТ",
      title: "Порядок за пять шагов.",
      steps: [
        { title: "Настройте дом", desc: "Один раз задайте квартиры, блоки и жильцов. Система построит структуру." },
        { title: "Пригласите жильцов", desc: "Каждый входит под своей учётной записью и видит систему на своём языке." },
        { title: "Автоматизируйте взносы", desc: "Взносы начисляются сами, считается пеня, баланс виден всем." },
        { title: "Согласуйте расходы", desc: "Консьерж фотографирует чек, аудитор согласует, расход прозрачно фиксируется." },
        { title: "Начните управлять", desc: "Объявления, голосования, заявки, посетители, счётчики — всё в одной панели." },
      ],
    },
    pillars: {
      kicker: "СИСТЕМА",
      title: "Всё нужное — в шести направлениях.",
      sub: "Каждый модуль на своём месте и работает на одних живых данных.",
      allTitle: "Все 40+ модулей",
      items: [
        { title: "Финансы", tagline: "Деньги под контролем.", items: [
          { name: "Учёт расходов", desc: "Категоризируйте расходы, фотографируйте чеки." },
          { name: "Управление взносами", desc: "Статус оплаты по квартирам и автоначисление." },
          { name: "Отчёты и аналитика", desc: "Отчёты доходов-расходов, графики, экспорт в PDF." },
          { name: "Согласование", desc: "Финансовые операции проходят проверку аудитора." },
          { name: "Пени", desc: "Автоматический расчёт пени и уведомления." },
        ] },
        { title: "Связь и решения", tagline: "Крепкая связь с жильцами.", items: [
          { name: "Объявления", desc: "Мгновенно доносите важное до всех жильцов." },
          { name: "Голосование", desc: "Демократично решайте вопросы дома." },
          { name: "Протоколы собраний", desc: "Составляйте и делитесь протоколами." },
          { name: "Сообщения", desc: "Мгновенные сообщения с автопереводом." },
          { name: "Опросы", desc: "Подробные опросы об удовлетворённости и решениях." },
        ] },
        { title: "Эксплуатация", tagline: "Проще ежедневные операции.", items: [
          { name: "Заявки о неисправностях", desc: "Заявки с фото, отслеживание и устранение." },
          { name: "Бронирование", desc: "Бронь общих зон и объектов по календарю." },
          { name: "Планирование обслуживания", desc: "Плановый уход за лифтами, генераторами, коммуникациями." },
          { name: "Учёт имущества", desc: "Регистрируйте имущество, следите за обслуживанием." },
          { name: "Контроль уборки", desc: "Ежедневные фото, автоархив за 30 дней." },
        ] },
        { title: "Безопасность", tagline: "Дом остаётся в безопасности.", items: [
          { name: "Учёт посетителей", desc: "Регистрируйте и отслеживайте вход и выход." },
          { name: "Учёт автомобилей", desc: "Машины жильцов и гостей по номерам." },
          { name: "Проверки безопасности", desc: "Пожарная, электрическая, конструктивная." },
          { name: "Экстренные ситуации", desc: "Оповещение одним нажатием." },
          { name: "Фото здания", desc: "Категоризированный архив." },
        ] },
        { title: "Сервисы для жильцов", tagline: "Лучше опыт жильцов.", items: [
          { name: "Отслеживание посылок", desc: "Статус доставки и уведомления." },
          { name: "Жалобы и предложения", desc: "Анонимная или открытая обратная связь." },
          { name: "Учёт питомцев", desc: "Регистрируйте животных жильцов." },
          { name: "Правила дома", desc: "Публикуйте и распространяйте правила." },
          { name: "Система штрафов", desc: "Поэтапные штрафы и предупреждения." },
        ] },
        { title: "Управление", tagline: "Профессиональное управление домом.", items: [
          { name: "Договоры аренды", desc: "Отслеживайте договоры, получайте напоминания." },
          { name: "Страховые полисы", desc: "Записывайте полисы и напоминания о продлении." },
          { name: "Переезды", desc: "Уведомления и контрольные списки." },
          { name: "Анализ энергии", desc: "Графики потребления по счётчикам." },
          { name: "Документы", desc: "Все документы в цифровом архиве." },
          { name: "Справочник услуг", desc: "Сантехники, электрики и другие." },
          { name: "Мероприятия", desc: "Создавайте события, отслеживайте участие." },
          { name: "Учёт счётчиков", desc: "Показания электричества, воды, газа." },
        ] },
      ],
    },
    roles: {
      kicker: "РОЛИ",
      title: "Особый опыт для каждой роли.",
      sub: "Пять ролей, у каждой — свои права.",
      items: [
        { role: "Управляющий", desc: "Полный доступ: финансы, персонал, отчёты, настройки." },
        { role: "Консьерж", desc: "Ввод расходов, заявки, уборка, посылки." },
        { role: "Аудитор", desc: "Согласование, проверка отчётов, анализ энергии." },
        { role: "Собственник", desc: "Взносы, голосование, объявления, жалобы." },
        { role: "Арендатор", desc: "Заявки, посылки, просмотр объявлений." },
      ],
    },
    diff: {
      kicker: "ПОЧЕМУ APOLLO",
      title: "Четыре отличия.",
      items: [
        { title: "9 языков, каждый на своём", desc: "Турецкие, русские, немецкие, украинские и арабские жильцы — на своём языке. Для иностранных владельцев на побережье." },
        { title: "На вашем сервере, полное владение", desc: "Данные на вашем сервере. Без помесячной платы за квартиру, соответствие закону." },
        { title: "Нативное приложение + PWA", desc: "Приложения для iOS и Android, ставится и из браузера. Push-уведомления." },
        { title: "40+ модулей, одна платформа", desc: "От расходов до страховки, от голосований до анализа энергии — всё нужное." },
      ],
    },
    faq: {
      kicker: "ВОПРОСЫ",
      title: "Полезно знать.",
      items: [
        { q: "Нужны технические навыки?", a: "Нет. Войдите управляющим, задайте дом — остальное готово. Жильцы пользуются с телефона." },
        { q: "Как отслеживаются платежи?", a: "Статус оплаты, баланс и задолженность каждой квартиры видны в реальном времени; баланс обновляется автоматически." },
        { q: "Жильцы говорят на разных языках — это проблема?", a: "Нет. Каждый выбирает один из 9 языков, а в сообщениях есть автоперевод." },
        { q: "Где хранятся данные?", a: "На вашем сервере. Без оплаты третьей стороне, данные не уходят наружу." },
      ],
    },
    cta: {
      title: "Готовы зажечь свой дом?",
      sub: "Всё необходимое для профессионального управления домом уже готово.",
      button: "Войти",
    },
    footer: { tagline: "Apollo — система управления домом", by: "Разработано Velaris Dijital" },
    langNote: "9 языков — жильцы пользуются на своём языке.",
  },
};

export default function LandingContent() {
  const { locale, setLocale } = useTranslation();
  const landingLang: "tr" | "en" | "ru" = locale === "en" ? "en" : locale === "ru" ? "ru" : "tr";
  const t = L[landingLang];

  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const bandRefs = useRef<HTMLDivElement[]>([]);
  const settleRef = useRef<HTMLDivElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);

  // ── Scrub engine ──────────────────────────────────────────────────────────
  useEffect(() => {
    const wrap = wrapRef.current, stage = stageRef.current, video = videoRef.current, rail = railRef.current;
    if (!wrap || !stage || !video) return;

    // Scrub runs everywhere (incl. touch); only reduced-motion falls back to a static poster.
    const GATES = [
      "(prefers-reduced-motion: reduce)",
    ];
    const MQLS = GATES.map((q) => window.matchMedia(q));

    let target = 0, shown = 0, rafId: number | null = null, lastTick = 0;
    let heroOnScreen = true, scrubOn = false, started = false;
    let seekBusy = false, pendingTime: number | null = null;
    const bandCache: { op: number; k: number }[] = BANDS.map(() => ({ op: -1, k: -1 }));
    let settleCache = -1, railCache = -1;

    const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
    const smoothstep = (p: number, e0: number, e1: number) => {
      const x = clamp((p - e0) / (e1 - e0), 0, 1);
      return x * x * (3 - 2 * x);
    };
    const heroProgress = () => {
      const total = wrap.offsetHeight - window.innerHeight;
      return total > 0 ? clamp(-wrap.getBoundingClientRect().top / total, 0, 1) : 0;
    };

    function requestSeek(tm: number) {
      if (!video!.duration) return;
      if (seekBusy) { pendingTime = tm; return; }
      seekBusy = true;
      try { video!.currentTime = tm; } catch { seekBusy = false; }
    }
    video.addEventListener("seeked", () => {
      seekBusy = false;
      if (pendingTime !== null) { const tm = pendingTime; pendingTime = null; requestSeek(tm); }
    });
    video.addEventListener("error", () => { seekBusy = false; pendingTime = null; setVideoFailed(true); });

    function paintCaptions(p: number) {
      BANDS.forEach((band, i) => {
        const el = bandRefs.current[i];
        if (!el) return;
        const f = Math.min(0.02, (band.b - band.a) / 3);
        const easeIn = i === 0 ? 1 : smoothstep(p, band.a, band.a + f);
        const easeOut = 1 - smoothstep(p, band.b - f, band.b);
        const op = clamp(easeIn * easeOut, 0, 1);
        const k = clamp((p - band.a) / Math.max(0.001, Math.min(0.03, (band.b - band.a) * 0.4)), 0, 1);
        const c = bandCache[i];
        if (Math.abs(op - c.op) > 0.004 || Math.abs(k - c.k) > 0.008) {
          c.op = op; c.k = k;
          el.style.opacity = String(op);
          el.style.setProperty("--k", String(k));
          el.style.pointerEvents = op > 0.5 ? "auto" : "none";
        }
      });
      // settle band 0.78 → 1
      const settle = settleRef.current;
      if (settle) {
        const s = clamp((p - 0.78) / 0.16, 0, 1);
        if (Math.abs(s - settleCache) > 0.004) {
          settleCache = s;
          settle.style.opacity = String(smoothstep(p, 0.78, 0.9));
          settle.style.setProperty("--k", String(s));
          settle.style.pointerEvents = s > 0.5 ? "auto" : "none";
        }
      }
      if (rail) {
        const rp = Math.round(p * 100);
        if (rp !== railCache) { railCache = rp; rail.style.setProperty("--p", String(p)); }
      }
    }

    function tick(now: number) {
      const dt = Math.min(100, now - (lastTick || now));
      lastTick = now;
      const k = 0.16;
      shown += (target - shown) * (1 - Math.pow(1 - k, dt / 16.667));
      if (Math.abs(target - shown) < 0.0005) { shown = target; rafId = null; lastTick = 0; }
      else rafId = requestAnimationFrame(tick);
      if (video!.duration) requestSeek(shown * video!.duration);
      paintCaptions(shown);
    }
    function onScroll() {
      target = heroProgress();
      if (rafId === null && heroOnScreen) rafId = requestAnimationFrame(tick);
    }

    function initOnce() {
      if (started) return; started = true;
      video!.poster = HERO_POSTER;
      fetch(HERO_VIDEO).then((r) => r.blob()).then((b) => {
        video!.src = URL.createObjectURL(b);
        video!.load();
        video!.addEventListener("canplay", () => {
          requestSeek(heroProgress() * video!.duration);
          stage!.classList.add("video-ready");
        }, { once: true });
      }).catch(() => setVideoFailed(true));
    }
    function enableScrub() {
      if (scrubOn) return; scrubOn = true;
      initOnce();
      window.addEventListener("scroll", onScroll, { passive: true });
      bandCache.forEach((c) => { c.op = -1; c.k = -1; });
      settleCache = -1; railCache = -1;
      paintCaptions(heroProgress());
      onScroll();
    }
    function disableScrub() {
      if (!scrubOn) return; scrubOn = false;
      window.removeEventListener("scroll", onScroll);
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    }
    function applyMode() {
      const reduced = MQLS.some((m) => m.matches); // only reduced-motion remains a gate
      if (reduced) {
        disableScrub();
        stage!.classList.add("static-mode");
        try { video!.pause(); } catch { /* noop */ }
      } else {
        stage!.classList.remove("static-mode");
        video!.loop = false;
        enableScrub();
      }
    }

    const io = new IntersectionObserver(([e]) => {
      heroOnScreen = e.isIntersecting;
      if (heroOnScreen && scrubOn && rafId === null) rafId = requestAnimationFrame(tick);
    }, { threshold: 0 });
    io.observe(wrap);

    MQLS.forEach((m) => m.addEventListener("change", applyMode));
    applyMode();

    return () => {
      disableScrub();
      io.disconnect();
      MQLS.forEach((m) => m.removeEventListener("change", applyMode));
    };
  }, []);

  // ── Reveal-on-scroll for body sections ────────────────────────────────────
  useEffect(() => {
    const els = Array.from(document.querySelectorAll(".apollo-landing .reveal"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach((el) => io.observe(el));
    // Failsafe: never leave content hidden if the observer never fires.
    const failsafe = setTimeout(() => els.forEach((el) => el.classList.add("in")), 1400);
    return () => { io.disconnect(); clearTimeout(failsafe); };
  }, [landingLang]);

  const cx = `${display.variable} ${mono.variable} ${body.variable} apollo-landing`;

  return (
    <div className={cx}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* fixed environment layer */}
      <div className="env" aria-hidden="true" />

      {/* Header */}
      <header className="hd">
        <div className="hd-in">
          <a className="brand" href="#top" aria-label="Apollo">
            <span className="brand-mark"><Building2 size={18} /></span>
            <span className="brand-name">Apollo</span>
          </a>
          <div className="hd-right">
            <div className="langsw" role="group" aria-label="Dil / Language / Язык">
              {LANDING_LOCALES.map((l) => (
                <button key={l.code} onClick={() => setLocale(l.code)} aria-pressed={locale === l.code}
                  className={locale === l.code ? "on" : ""}>{l.label}</button>
              ))}
            </div>
            <a href="#how" className="hd-link">{t.nav.how}</a>
            <Link href="/giris" className="btn btn-accent btn-sm">{t.nav.login}<ArrowRight size={15} /></Link>
          </div>
        </div>
      </header>

      {/* HERO — scrub */}
      <div className="hero-wrap" ref={wrapRef} id="top">
        <div className="hero-stage" ref={stageRef}>
          <video ref={videoRef} className="hero-video" muted playsInline preload="none" aria-hidden="true" tabIndex={-1} />
          <div className="hero-poster" style={{ backgroundImage: `url(${HERO_POSTER})` }} aria-hidden="true" />
          <div className="scrim" aria-hidden="true" />

          {/* signature: vertical floor-rail that fills as you descend */}
          <div className="rail" ref={railRef} aria-hidden="true">
            <span className="rail-track" />
            <span className="rail-fill" />
          </div>

          <div className="hero-kicker">{t.hero.kicker}</div>

          {/* scroll-driven caption bands */}
          {t.hero.bands.map((text, i) => (
            <div key={i} className={`band band-${BANDS[i].entrance}`} data-i={i}
              ref={(el) => { if (el) bandRefs.current[i] = el; }} style={{ opacity: 0 }}>
              <div className="band-scrim" aria-hidden="true" />
              <h2 className="band-text">{text}</h2>
            </div>
          ))}

          {/* settle */}
          <div className="settle" ref={settleRef} style={{ opacity: 0 }}>
            <h1 className="settle-title">{t.hero.settleTitle}</h1>
            <p className="settle-sub">{t.hero.settleSub}</p>
            <div className="settle-cta">
              <Link href="/giris" className="btn btn-accent">{t.hero.cta}<ArrowRight size={17} /></Link>
              <a href="#how" className="btn btn-ghost">{t.hero.ctaSecondary}</a>
            </div>
          </div>

          {/* static hero (phones / reduced-motion / video failed) */}
          <div className={`static-hero${videoFailed ? " force" : ""}`}>
            <div className="hero-kicker">{t.hero.kicker}</div>
            <h1 className="settle-title">{t.hero.bands[0]}</h1>
            <p className="settle-sub">{t.hero.settleSub}</p>
            <div className="settle-cta">
              <Link href="/giris" className="btn btn-accent">{t.hero.cta}<ArrowRight size={17} /></Link>
              <a href="#how" className="btn btn-ghost">{t.hero.ctaSecondary}</a>
            </div>
          </div>

          <div className="scroll-hint" aria-hidden="true"><span>{t.hero.scrollHint}</span><ChevronDown size={16} /></div>
        </div>
      </div>

      <main id="main">
        {/* PROBLEM */}
        <section className="sec problem reveal">
          <div className="wrap">
            <div className="sec-head">
              <span className="kicker">{t.problem.kicker}</span>
              <h2 className="h2">{t.problem.title}</h2>
            </div>
            <p className="lede">{t.problem.body}</p>
            <div className="before-after">
              <ul className="before">
                {t.problem.before.map((b) => <li key={b}>{b}</li>)}
              </ul>
              <p className="after">{t.problem.after}</p>
            </div>
          </div>
        </section>

        {/* HOW — numbered editorial rows */}
        <section className="sec how reveal" id="how">
          <div className="wrap">
            <div className="sec-head">
              <span className="kicker">{t.how.kicker}</span>
              <h2 className="h2">{t.how.title}</h2>
            </div>
            <ol className="steps">
              {t.how.steps.map((s, i) => (
                <li key={i} className="step">
                  <span className="idx">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="step-t">{s.title}</h3>
                  <p className="step-d">{s.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* PILLARS — capability index */}
        <section className="sec pillars reveal">
          <div className="wrap">
            <div className="sec-head">
              <span className="kicker">{t.pillars.kicker}</span>
              <h2 className="h2">{t.pillars.title}</h2>
              <p className="lede">{t.pillars.sub}</p>
            </div>
            <div className="pillar-grid">
              {t.pillars.items.map((p, i) => (
                <article key={i} className="pillar">
                  <div className="pillar-head">
                    <span className="idx sm">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="pillar-t">{p.title}</h3>
                    <p className="pillar-tag">{p.tagline}</p>
                  </div>
                  <ul className="pillar-feats">
                    {p.items.map((f, j) => (
                      <li key={j}>
                        <span className="pf-name">{f.name}</span>
                        <span className="pf-desc">{f.desc}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
            <div className="all-mods">
              <span className="all-title">{t.pillars.allTitle}</span>
              <p className="mod-line">
                {t.pillars.items.flatMap((p) => p.items.map((f) => f.name)).join("  ·  ")}
              </p>
            </div>
          </div>
        </section>

        {/* ROLES — masthead row */}
        <section className="sec roles reveal">
          <div className="wrap">
            <div className="sec-head">
              <span className="kicker">{t.roles.kicker}</span>
              <h2 className="h2">{t.roles.title}</h2>
              <p className="lede">{t.roles.sub}</p>
            </div>
            <div className="role-grid">
              {t.roles.items.map((r, i) => (
                <div key={i} className="role">
                  <span className="idx sm">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="role-t">{r.role}</h3>
                  <p className="role-d">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DIFFERENTIATORS — numbered claims */}
        <section className="sec diff reveal">
          <div className="wrap">
            <div className="sec-head">
              <span className="kicker">{t.diff.kicker}</span>
              <h2 className="h2">{t.diff.title}</h2>
            </div>
            <div className="diff-list">
              {t.diff.items.map((d, i) => (
                <article key={i} className="diffrow">
                  <span className="idx">{String(i + 1).padStart(2, "0")}</span>
                  <div className="diff-body">
                    <h3 className="diff-t">{d.title}</h3>
                    <p className="diff-d">{d.desc}</p>
                    {i === 0 && (
                      <div className="lang-flags">
                        {LANGS.map((l) => <span key={l.name} title={l.name}>{l.flag}</span>)}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ — hairline rows */}
        <section className="sec faq reveal">
          <div className="wrap">
            <div className="sec-head">
              <span className="kicker">{t.faq.kicker}</span>
              <h2 className="h2">{t.faq.title}</h2>
            </div>
            <div className="faq-list">
              {t.faq.items.map((f, i) => (
                <details key={i} className="faq-item">
                  <summary><span>{f.q}</span><ChevronDown size={18} className="faq-chev" /></summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA — flat band over the ending frame */}
        <section className="sec cta-sec reveal">
          <div className="cta-band" style={{ backgroundImage: `url(/hero/hero-end.jpg)` }}>
            <div className="cta-scrim" aria-hidden="true" />
            <div className="wrap cta-inner">
              <h2 className="cta-title">{t.cta.title}</h2>
              <p className="cta-sub">{t.cta.sub}</p>
              <Link href="/giris" className="btn btn-accent btn-lg">{t.cta.button}<ArrowRight size={18} /></Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="ft">
        <div className="wrap ft-in">
          <div className="brand">
            <span className="brand-mark"><Building2 size={16} /></span>
            <span className="brand-name">Apollo</span>
          </div>
          <p className="ft-tag">{t.footer.tagline}</p>
          <a href="https://velarisdijital.com" target="_blank" rel="noopener noreferrer" className="ft-by">{t.footer.by}</a>
        </div>
      </footer>
    </div>
  );
}

const CSS = `
.apollo-landing{
  --canvas:#0b1220; --canvas-2:#0d1526; --panel:#141f38; --panel-2:#182648;
  --line:#22304e; --accent:#f5a623; --accent-2:#ffbe4d; --accent-ink:#1a1204;
  --sky:#6ea8ff; --text:#eef2fb; --text-2:#a2b2d1; --text-3:#6f80a2;
  --font-d:var(--font-display),"Oswald",system-ui,sans-serif;
  --font-b:var(--font-body),"Inter",system-ui,sans-serif;
  --font-m:var(--font-mono),"JetBrains Mono",ui-monospace,monospace;
  --tshadow:0 1px 2px rgba(4,7,16,.95),0 3px 14px rgba(4,7,16,.7),0 12px 46px rgba(4,7,16,.75);
  --ease:cubic-bezier(.22,.61,.36,1);
  background:var(--canvas); color:var(--text); font-family:var(--font-b);
  -webkit-font-smoothing:antialiased; position:relative; overflow-x:clip; min-height:100vh;
}
.apollo-landing *{box-sizing:border-box}
.apollo-landing .wrap{max-width:1200px;margin:0 auto;padding:0 24px}
.apollo-landing h1,.apollo-landing h2,.apollo-landing h3{font-family:var(--font-d);font-weight:700;letter-spacing:-.02em;line-height:1.04;margin:0}
.apollo-landing a{color:inherit;text-decoration:none}

.env{position:fixed;inset:0;z-index:0;pointer-events:none;
  background:
    radial-gradient(1200px 700px at 78% -8%, rgba(245,166,35,.10), transparent 60%),
    radial-gradient(1000px 800px at 12% 108%, rgba(60,110,220,.14), transparent 60%),
    linear-gradient(180deg,#0b1220,#0a0f1c 60%,#0b1322);
  animation:envdrift 70s ease-in-out infinite alternate}
@keyframes envdrift{from{transform:translate3d(0,0,0)}to{transform:translate3d(0,-2%,0)}}

/* header */
.hd{position:fixed;top:0;left:0;right:0;z-index:60;
  background:linear-gradient(180deg,rgba(9,14,26,.82),rgba(9,14,26,0));
  backdrop-filter:blur(8px)}
.hd-in{max-width:1200px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;justify-content:space-between}
.brand{display:flex;align-items:center;gap:10px}
.brand-mark{width:34px;height:34px;border-radius:5px;display:grid;place-items:center;color:#0b1220;
  background:linear-gradient(135deg,var(--accent),var(--accent-2));box-shadow:0 6px 20px rgba(245,166,35,.35)}
.brand-name{font-family:var(--font-d);font-weight:700;font-size:19px;letter-spacing:-.01em}
.hd-right{display:flex;align-items:center;gap:14px}
.hd-link{font-size:14px;color:var(--text-2);font-weight:500}
.hd-link:hover{color:var(--text)}
.langsw{display:flex;border:1px solid var(--line);border-radius:3px;overflow:hidden;background:rgba(10,16,30,.5)}
.langsw button{font-family:var(--font-m);font-size:12px;font-weight:500;padding:6px 9px;color:var(--text-3);background:none;border:0;cursor:pointer;transition:.2s}
.langsw button:hover{color:var(--text-2)}
.langsw button.on{background:var(--accent);color:var(--accent-ink)}

/* buttons */
.btn{display:inline-flex;align-items:center;gap:8px;font-weight:600;font-size:15px;border-radius:3px;
  padding:12px 20px;cursor:pointer;transition:transform .2s var(--ease),background .2s,box-shadow .2s;border:1px solid transparent;font-family:var(--font-b)}
.btn:hover{transform:translateY(-1px)}
.btn-sm{padding:8px 15px;font-size:14px;border-radius:3px}
.btn-lg{padding:15px 26px;font-size:16px}
.btn-accent{background:linear-gradient(135deg,var(--accent),var(--accent-2));color:var(--accent-ink);
  box-shadow:0 10px 30px rgba(245,166,35,.28)}
.btn-accent:hover{box-shadow:0 14px 40px rgba(245,166,35,.42)}
.btn-ghost{background:rgba(255,255,255,.05);color:var(--text);border-color:var(--line)}
.btn-ghost:hover{background:rgba(255,255,255,.09)}

/* HERO */
.hero-wrap{position:relative;height:440vh;z-index:1}
.hero-stage{position:sticky;top:0;height:100vh;overflow:hidden}
.hero-video,.hero-poster{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.hero-poster{background-size:cover;background-position:center;transition:opacity .8s var(--ease)}
.hero-video{opacity:0;transition:opacity .8s var(--ease);will-change:transform;transform:translateZ(0)}
.hero-stage.video-ready .hero-video{opacity:1}
.hero-stage.video-ready .hero-poster{opacity:0}
.scrim{position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(ellipse 130% 95% at 50% 42%,rgba(8,12,24,0) 30%,rgba(8,12,24,.66) 100%),
  linear-gradient(180deg,rgba(8,12,24,.5),transparent 22%,transparent 62%,rgba(8,12,24,.72))}

.hero-kicker{position:absolute;top:104px;left:0;right:0;text-align:center;font-family:var(--font-m);
  font-size:12.5px;letter-spacing:.28em;color:var(--accent-2);text-shadow:var(--tshadow);z-index:4}

/* rail signature — vertical light bar that fills as you descend */
.rail{position:absolute;right:34px;top:50%;transform:translateY(-50%);height:min(340px,46vh);width:3px;z-index:4}
.rail-track{position:absolute;inset:0;border-radius:3px;background:rgba(255,255,255,.13)}
.rail-fill{position:absolute;left:0;right:0;top:0;height:calc(var(--p,0) * 100%);border-radius:3px;
  background:linear-gradient(180deg,var(--accent-2),var(--accent));box-shadow:0 0 14px rgba(245,166,35,.6)}

.band{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);z-index:3;
  display:flex;justify-content:center;padding:0 24px;text-align:center;text-shadow:var(--tshadow)}
.band-scrim{position:absolute;inset:-10%;pointer-events:none;
  opacity:calc(.3 + .7*var(--k,1));
  background:radial-gradient(ellipse 70% 46% at 50% 50%,rgba(5,8,16,.72) 0%,rgba(5,8,16,.46) 46%,rgba(5,8,16,0) 76%)}
.band-text{position:relative;font-size:clamp(30px,5.4vw,62px);max-width:16ch;color:#fff}
.band-drift .band-text{transform:translateY(calc((1 - var(--k,0)) * -26px))}
.band-rise .band-text{transform:translateY(calc((1 - var(--k,0)) * 30px))}
.band-approach .band-text{transform:scale(calc(.9 + .1*var(--k,0)))}

.settle{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);z-index:5;
  display:flex;flex-direction:column;align-items:center;text-align:center;padding:0 24px;text-shadow:var(--tshadow)}
.settle-title{font-size:clamp(32px,6vw,72px);max-width:15ch;color:#fff;
  transform:translateY(calc((1 - var(--k,0)) * 20px))}
.settle-sub{margin-top:18px;font-family:var(--font-m);font-size:clamp(12px,1.5vw,15px);letter-spacing:.06em;color:var(--text-2);
  opacity:clamp(0,calc((var(--k,0) - .3) * 2.2),1)}
.settle-cta{margin-top:28px;display:flex;gap:14px;flex-wrap:wrap;justify-content:center;
  opacity:clamp(0,calc((var(--k,0) - .5) * 2.6),1)}

.static-hero{position:absolute;inset:0;z-index:6;display:none;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;padding:0 24px;text-shadow:var(--tshadow)}
.static-hero .hero-kicker{position:static;margin-bottom:18px}
.static-hero .settle-title{transform:none}
.static-hero .settle-sub,.static-hero .settle-cta{opacity:1}
.static-hero .settle-sub{margin-top:16px}.static-hero .settle-cta{margin-top:26px}
.hero-stage.static-mode .band,.hero-stage.static-mode .settle,.hero-stage.static-mode .rail,
.hero-stage.static-mode>.hero-kicker,.hero-stage.static-mode .scroll-hint{display:none}
.hero-stage.static-mode .static-hero,.static-hero.force{display:flex}
/* Mobile: hero plays as an autoplay loop; reduced-motion falls back to the poster. */
.hero-stage.static-mode.has-static-video .hero-video{display:block;opacity:1;transition:none}
.hero-stage.static-mode:not(.has-static-video) .hero-video{display:none}

.scroll-hint{position:absolute;bottom:26px;left:50%;transform:translateX(-50%);z-index:4;
  display:flex;flex-direction:column;align-items:center;gap:4px;color:var(--text-2);font-family:var(--font-m);
  font-size:11px;letter-spacing:.2em;text-shadow:var(--tshadow);animation:bob 2.4s ease-in-out infinite}
@keyframes bob{0%,100%{transform:translate(-50%,0)}50%{transform:translate(-50%,6px)}}

/* sections — editorial, hairline-ruled, sharp */
.sec{position:relative;z-index:1;padding:104px 0;border-top:1px solid var(--line)}
.sec:first-of-type{border-top:0}
.sec-head{max-width:60ch}
.kicker{font-family:var(--font-m);font-size:12px;letter-spacing:.3em;color:var(--accent-2);display:block;margin-bottom:20px}
.h2{font-size:clamp(30px,4.6vw,54px);max-width:18ch;margin:0 0 20px;text-transform:uppercase;letter-spacing:-.015em}
.lede{font-size:clamp(16px,1.7vw,19px);color:var(--text-2);max-width:62ch;line-height:1.6;margin:0}

/* the big outlined index numeral — the body signature */
.idx{font-family:var(--font-d);font-weight:700;line-height:.8;color:transparent;
  -webkit-text-stroke:1.2px rgba(245,166,35,.5);font-size:clamp(52px,7vw,90px);letter-spacing:-.02em}
.idx.sm{font-size:32px;-webkit-text-stroke:1px rgba(245,166,35,.5)}

/* problem */
.before-after{margin-top:48px;display:grid;grid-template-columns:1fr;gap:30px}
.before{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:0}
.before li{font-family:var(--font-m);font-size:13px;color:var(--text-3);margin:0 22px 6px 0;
  text-decoration:line-through;text-decoration-color:var(--accent);text-decoration-thickness:1px}
.after{font-family:var(--font-d);font-weight:700;font-size:clamp(21px,2.8vw,32px);color:var(--text);
  text-transform:uppercase;letter-spacing:-.01em;max-width:24ch;margin:0;border-left:3px solid var(--accent);padding-left:22px}

/* how — numbered rows */
.steps{list-style:none;margin:56px 0 0;padding:0}
.step{display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;column-gap:30px;
  padding:34px 0;border-top:1px solid var(--line)}
.step:last-child{border-bottom:1px solid var(--line)}
.step .idx{grid-row:1/3;align-self:start}
.step-t{grid-column:2;align-self:center;font-family:var(--font-d);font-weight:700;
  font-size:clamp(19px,2.2vw,27px);text-transform:uppercase;letter-spacing:-.01em}
.step-d{grid-column:2;font-size:15px;color:var(--text-2);line-height:1.6;max-width:58ch;margin-top:8px}

/* pillars — capability index */
.pillar-grid{margin-top:56px;display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid var(--line)}
.pillar{padding:30px 26px;border-bottom:1px solid var(--line);border-left:1px solid var(--line)}
.pillar:nth-child(3n+1){border-left:0;padding-left:0}
.pillar-head{margin-bottom:18px}
.pillar-head .idx{display:block;margin-bottom:10px}
.pillar-t{font-family:var(--font-d);font-weight:700;font-size:20px;text-transform:uppercase;letter-spacing:-.01em}
.pillar-tag{font-size:13.5px;color:var(--text-2);margin-top:6px}
.pillar-feats{list-style:none;margin:0;padding:0}
.pillar-feats li{padding:11px 0;border-top:1px solid var(--line)}
.pf-name{display:block;font-size:14px;font-weight:600;color:var(--text)}
.pf-desc{display:block;font-size:12.5px;color:var(--text-3);line-height:1.45;margin-top:2px}

.all-mods{margin-top:52px;border-top:1px solid var(--line);padding-top:28px;
  display:grid;grid-template-columns:190px 1fr;gap:26px}
.all-title{font-family:var(--font-m);font-size:12px;letter-spacing:.22em;color:var(--accent-2);text-transform:uppercase}
.mod-line{font-size:13.5px;color:var(--text-3);line-height:1.95;margin:0}

/* roles — masthead columns */
.role-grid{margin-top:56px;display:grid;grid-template-columns:repeat(5,1fr);border-top:1px solid var(--line)}
.role{padding:28px 20px;border-left:1px solid var(--line)}
.role:first-child{border-left:0;padding-left:0}
.role .idx{display:block;margin-bottom:14px}
.role-t{font-family:var(--font-d);font-weight:700;font-size:17px;text-transform:uppercase;margin-bottom:9px}
.role-d{font-size:12.5px;color:var(--text-3);line-height:1.5}

/* diff — numbered claims */
.diff-list{margin-top:56px;border-top:1px solid var(--line)}
.diffrow{display:grid;grid-template-columns:auto 1fr;gap:34px;padding:40px 0;border-bottom:1px solid var(--line);align-items:start}
.diff-body{max-width:60ch}
.diff-t{font-family:var(--font-d);font-weight:700;font-size:clamp(20px,2.4vw,29px);text-transform:uppercase;letter-spacing:-.01em;margin-bottom:12px}
.diff-d{font-size:15px;color:var(--text-2);line-height:1.6}
.lang-flags{margin-top:22px;display:flex;gap:12px;flex-wrap:wrap;font-size:26px}

/* faq — hairline rows */
.faq-list{margin-top:48px;border-top:1px solid var(--line)}
.faq-item{border-bottom:1px solid var(--line)}
.faq-item summary{list-style:none;cursor:pointer;padding:24px 0;font-family:var(--font-d);font-weight:600;
  font-size:clamp(17px,2vw,21px);text-transform:uppercase;letter-spacing:-.005em;
  display:flex;justify-content:space-between;align-items:center;gap:18px}
.faq-item summary::-webkit-details-marker{display:none}
.faq-chev{color:var(--accent-2);transition:transform .3s var(--ease);flex:none}
.faq-item[open] .faq-chev{transform:rotate(180deg)}
.faq-item p{margin:0;padding:2px 0 26px;color:var(--text-2);font-size:15px;line-height:1.65;max-width:70ch}

/* cta — flat band over the ending frame */
.cta-sec{padding:0;border-top:0}
.cta-band{position:relative;background-size:cover;background-position:center 30%;padding:110px 0;overflow:hidden}
.cta-scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,12,24,.74),rgba(8,12,24,.9))}
.cta-inner{position:relative}
.cta-title{font-family:var(--font-d);font-weight:700;font-size:clamp(30px,5vw,62px);text-transform:uppercase;
  letter-spacing:-.015em;max-width:16ch;margin:0 0 18px;text-shadow:var(--tshadow)}
.cta-sub{color:var(--text-2);font-size:17px;max-width:50ch;margin:0 0 34px;line-height:1.6;text-shadow:var(--tshadow)}

/* footer */
.ft{position:relative;z-index:1;border-top:1px solid var(--line);padding:36px 0}
.ft-in{display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap}
.ft-tag{font-size:14px;color:var(--text-2)}
.ft-by{font-size:12px;color:var(--text-3)}
.ft-by:hover{color:var(--accent-2)}

/* reveal */
.reveal{opacity:0;transform:translateY(22px);transition:opacity .7s var(--ease),transform .7s var(--ease)}
.reveal.in{opacity:1;transform:none}

/* responsive */
@media(max-width:1024px){
  .pillar-grid{grid-template-columns:repeat(2,1fr)}
  .pillar:nth-child(3n+1){border-left:1px solid var(--line);padding-left:26px}
  .pillar:nth-child(2n+1){border-left:0;padding-left:0}
  .role-grid{grid-template-columns:repeat(3,1fr)}
}
@media(max-width:820px){
  .hero-wrap{height:320vh}
  .rail{right:18px;height:38vh}
  .hd-link{display:none}
  .sec{padding:66px 0}
  .step{column-gap:20px}
  .step .idx{font-size:42px}
  .pillar-grid,.role-grid{grid-template-columns:1fr}
  .pillar,.role{border-left:0!important;padding-left:0!important}
  .diffrow{grid-template-columns:1fr;gap:14px}
  .all-mods{grid-template-columns:1fr;gap:14px}
}
@media(pointer:coarse){.btn{min-height:44px}}
@media(prefers-reduced-motion:reduce){
  .apollo-landing *{animation:none!important;transition:none!important}
  .reveal{opacity:1;transform:none}
  .env{animation:none}
}
`;
