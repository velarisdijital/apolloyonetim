"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/types";
import {
  Building2, Receipt, Wallet, BarChart3, Users, CalendarCheck, Shield,
  Smartphone, ChevronRight, Megaphone, Vote, Wrench, MessageCircle,
  Car, PawPrint, FolderOpen, Phone, Siren, Gauge, UserCheck, BookOpen,
  ShieldAlert, ClipboardCheck, Package, ClipboardList, Calendar, Scale,
  FileText, Sparkles, MessageSquareWarning, PackageCheck, Truck, ShieldCheck,
  Camera, Zap, Settings, Star, CheckCircle2, ArrowRight, Play, X,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Dilden bağımsız görsel meta (ikon + renk). Metinler LANDING sözlüğünde.
// Kategori/özellik/rol/adım sıraları sözlükle birebir eşleşir.
// ─────────────────────────────────────────────────────────────
const CATEGORY_META = [
  { color: "blue", icons: [Receipt, Wallet, BarChart3, ClipboardCheck, Settings] },
  { color: "green", icons: [Megaphone, Vote, Users, MessageCircle, ClipboardList] },
  { color: "purple", icons: [Wrench, CalendarCheck, Scale, Package, Sparkles] },
  { color: "orange", icons: [UserCheck, Car, ShieldCheck, Siren, Camera] },
  { color: "pink", icons: [PackageCheck, MessageSquareWarning, PawPrint, BookOpen, ShieldAlert] },
  { color: "cyan", icons: [FileText, Shield, Truck, Zap, FolderOpen, Phone, Calendar, Gauge] },
];

const ROLE_META = [
  { color: "blue", icon: Shield },
  { color: "green", icon: Wrench },
  { color: "purple", icon: ClipboardCheck },
  { color: "orange", icon: Building2 },
  { color: "pink", icon: Users },
];

const STEP_ICONS = [Building2, Users, Wallet, Receipt, Star];
const STAT_VALUES = ["40+", "9", "5", "7/24"];

// Landing dil seçenekleri (sadece 3 dil)
const LANDING_LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: "tr", label: "TR", flag: "🇹🇷" },
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "ru", label: "RU", flag: "🇷🇺" },
];

// ─────────────────────────────────────────────────────────────
// Çeviri tipleri + sözlük (tr / en / ru)
// ─────────────────────────────────────────────────────────────
type CategoryCopy = { title: string; subtitle: string; items: { name: string; desc: string }[] };
type RoleCopy = { role: string; desc: string };
type StepCopy = { title: string; desc: string };

interface LandingCopy {
  nav: { howToUse: string; login: string };
  hero: {
    badge: string;
    titlePre: string; titleHighlight: string; titlePost: string;
    subtitle: string; ctaPrimary: string; ctaSecondary: string;
  };
  statLabels: string[];
  featuresHeading: { title: string; subtitle: string };
  categories: CategoryCopy[];
  allFeatures: string;
  roles: { title: string; subtitle: string; items: RoleCopy[] };
  languages: { title: string; subtitle: string };
  cta: { title: string; subtitle: string };
  footer: { tagline: string; developedBy: string };
  tutorial: { title: string; subtitle: string; steps: StepCopy[]; startButton: string };
}

const LANDING: Record<"tr" | "en" | "ru", LandingCopy> = {
  // ───────────────────────── TÜRKÇE ─────────────────────────
  tr: {
    nav: { howToUse: "Nasıl Kullanılır?", login: "Giriş Yap" },
    hero: {
      badge: "Mobil uyumlu, her cihazdan erişin",
      titlePre: "Apartman Yönetiminde", titleHighlight: "Yeni Nesil", titlePost: "Deneyim",
      subtitle: "40'dan fazla özellik, 9 dil desteği, 5 farklı kullanıcı rolü. Giderlerden aidatlara, arızalardan güvenliğe her şey tek platformda.",
      ctaPrimary: "Hemen Başlayın", ctaSecondary: "Nasıl Kullanılır?",
    },
    statLabels: ["Özellik", "Dil Desteği", "Kullanıcı Rolü", "Erişim"],
    featuresHeading: {
      title: "Tüm İhtiyaçlarınız Tek Platformda",
      subtitle: "Profesyonel apartman yönetimi için ihtiyacınız olan her şey Apollo'da.",
    },
    categories: [
      {
        title: "Mali Yönetim", subtitle: "Finansal kontrolü elinizde tutun",
        items: [
          { name: "Gider Takibi", desc: "Tüm bina giderlerini kategorize edin, fişleri fotoğraflayın ve anlık takip edin." },
          { name: "Aidat Yönetimi", desc: "Aylık aidat tanımlama, daire bazlı ödeme durumu ve otomatik borçlandırma." },
          { name: "Rapor & Analiz", desc: "Gelir-gider raporları, grafikler, PDF dışa aktarım ve bütçe planlama." },
          { name: "Onay Mekanizması", desc: "Mali işlemler denetçi onayından geçer, şeffaf ve güvenli yönetim." },
          { name: "Gecikme Faizi", desc: "Geciken aidatlara otomatik faiz hesaplama ve bildirim." },
        ],
      },
      {
        title: "İletişim & Karar", subtitle: "Sakinlerinizle güçlü iletişim",
        items: [
          { name: "Duyuru Sistemi", desc: "Önemli bildirimleri anında tüm sakinlere ulaştırın." },
          { name: "Oylama", desc: "Bina kararlarını demokratik şekilde oylayın, sonuçları görün." },
          { name: "Toplantı Kayıtları", desc: "Toplantı tutanaklarını oluşturun ve tüm sakinlerle paylaşın." },
          { name: "Mesajlaşma", desc: "Sakinler ve yönetim arası anlık mesajlaşma, otomatik çeviri desteği." },
          { name: "Anketler", desc: "Sakin memnuniyeti ve bina kararları için detaylı anketler oluşturun." },
        ],
      },
      {
        title: "Bina İşletme", subtitle: "Günlük operasyonları kolaylaştırın",
        items: [
          { name: "Arıza Bildirimi", desc: "Fotoğraflı arıza bildirimi, takip ve çözüm süreci yönetimi." },
          { name: "Rezervasyon", desc: "Ortak alan, spor salonu ve toplantı odası için takvim bazlı rezervasyon." },
          { name: "Bakım Planlama", desc: "Asansör, jeneratör ve tesisat için periyodik bakım takibi." },
          { name: "Demirbaş Takibi", desc: "Bina demirbaşlarını kaydedin, bakım geçmişini izleyin." },
          { name: "Temizlik Takip", desc: "Günlük temizlik fotoğrafları, otomatik 30 gün arşiv." },
        ],
      },
      {
        title: "Güvenlik & Kayıt", subtitle: "Binayı güvende tutun",
        items: [
          { name: "Ziyaretçi Yönetimi", desc: "Ziyaretçi giriş-çıkışlarını kaydedin ve takip edin." },
          { name: "Araç Kayıt", desc: "Sakin ve ziyaretçi araçlarını plaka bazlı kayıt altına alın." },
          { name: "Güvenlik Denetim", desc: "Yangın, elektrik ve yapısal güvenlik denetim kayıtları." },
          { name: "Acil Durum", desc: "Tek tuşla acil durum bildirimi, anlık uyarı sistemi." },
          { name: "Bina Fotoğrafları", desc: "Bina fotoğraf galerisi, kategorili görsel arşiv." },
        ],
      },
      {
        title: "Sakin Hizmetleri", subtitle: "Sakin deneyimini iyileştirin",
        items: [
          { name: "Paket Takibi", desc: "Kargo ve paket teslim durumunu takip edin, bildirim alın." },
          { name: "Şikayet & Öneri", desc: "Anonim veya açık şikayet/öneri sistemi ile geri bildirim." },
          { name: "Evcil Hayvan Kaydı", desc: "Bina sakinlerinin evcil hayvanlarını kayıt altına alın." },
          { name: "Bina Kuralları", desc: "Bina kurallarını dijital olarak yayınlayın ve paylaşın." },
          { name: "Ceza Sistemi", desc: "Kural ihlallerinde kademeli ceza ve uyarı sistemi." },
        ],
      },
      {
        title: "Yönetim & Analiz", subtitle: "Profesyonel bina yönetimi",
        items: [
          { name: "Kira Sözleşmeleri", desc: "Kiracı sözleşmelerini takip edin, süre dolum uyarıları alın." },
          { name: "Sigorta Poliçeleri", desc: "Bina sigortalarını kaydedin, yenileme hatırlatmaları." },
          { name: "Taşınma Bildirimi", desc: "Giriş-çıkış bildirimleri ve kontrol listeleri." },
          { name: "Enerji Analizi", desc: "Sayaç verilerinden aylık tüketim grafikleri ve karşılaştırma." },
          { name: "Belge Yönetimi", desc: "Tüm bina belgelerini dijital arşivde saklayın." },
          { name: "Hizmet Rehberi", desc: "Tesisatçı, elektrikçi gibi hizmet sağlayıcı rehberi." },
          { name: "Etkinlikler", desc: "Bina etkinlikleri oluşturun, katılım takibi yapın." },
          { name: "Sayaç Takibi", desc: "Elektrik, su ve doğalgaz sayaç okumalarını kaydedin." },
        ],
      },
    ],
    allFeatures: "Tüm Özellikler",
    roles: {
      title: "Her Rol İçin Özel Deneyim",
      subtitle: "5 farklı kullanıcı rolü, her birine özel erişim yetkileri",
      items: [
        { role: "Yönetici", desc: "Tam yetki: mali yönetim, personel, raporlar, ayarlar" },
        { role: "Kapıcı", desc: "Gider girişi, arıza takibi, temizlik, paket yönetimi" },
        { role: "Denetçi", desc: "Mali onay, raporları inceleme, enerji analizi" },
        { role: "Ev Sahibi", desc: "Aidat takibi, oylama, duyurular, şikayet bildirimi" },
        { role: "Kiracı", desc: "Arıza bildirimi, paket takibi, duyuruları görme" },
      ],
    },
    languages: {
      title: "9 Dil Desteği",
      subtitle: "Farklı milliyetlerden sakinleriniz kendi dillerinde sistemi kullanabilir.",
    },
    cta: {
      title: "Apollo ile Yönetimi Kolaylaştırın",
      subtitle: "Profesyonel apartman yönetimi için ihtiyacınız olan her şey hazır.",
    },
    footer: {
      tagline: "Apollo Apartman Yönetim Sistemi",
      developedBy: "Velaris Dijital tarafından geliştirilmiştir",
    },
    tutorial: {
      title: "Hızlı Başlangıç Rehberi",
      subtitle: "5 adımda Apollo'yu kullanmaya başlayın",
      steps: [
        { title: "Giriş Yapın", desc: "Yönetici hesabınızla sisteme giriş yapın. İlk girişte bina bilgilerinizi ve daire sayınızı ayarlayın." },
        { title: "Sakinleri Ekleyin", desc: "Sakinler menüsünden daire sakinlerini ekleyin. Her sakin kendi hesabıyla sisteme erişebilir." },
        { title: "Aidatları Tanımlayın", desc: "Aidat ayarlarından aylık aidat tutarını belirleyin. Sistem otomatik olarak borçlandırma yapar." },
        { title: "Giderleri Kaydedin", desc: "Fatura ve giderleri fotoğraflayarak sisteme girin. Denetçi onay mekanizması aktif olur." },
        { title: "Kullanmaya Başlayın", desc: "Duyurular paylaşın, arıza bildirimleri alın, raporları inceleyin. Tüm yönetim tek platformda!" },
      ],
      startButton: "Hemen Başlayın",
    },
  },

  // ───────────────────────── ENGLISH ─────────────────────────
  en: {
    nav: { howToUse: "How it works", login: "Sign In" },
    hero: {
      badge: "Mobile-friendly — access from any device",
      titlePre: "A New-Generation", titleHighlight: "Experience", titlePost: "in Building Management",
      subtitle: "Over 40 features, 9 languages, 5 different user roles. From expenses to dues, from faults to security — everything on one platform.",
      ctaPrimary: "Get Started", ctaSecondary: "How it works",
    },
    statLabels: ["Features", "Languages", "User Roles", "Access"],
    featuresHeading: {
      title: "All Your Needs on One Platform",
      subtitle: "Everything you need for professional building management is in Apollo.",
    },
    categories: [
      {
        title: "Financial Management", subtitle: "Keep financial control in your hands",
        items: [
          { name: "Expense Tracking", desc: "Categorize all building expenses, photograph receipts and track them in real time." },
          { name: "Dues Management", desc: "Set monthly dues, track payment status per apartment and auto-charge balances." },
          { name: "Reports & Analytics", desc: "Income–expense reports, charts, PDF export and budget planning." },
          { name: "Approval Workflow", desc: "Financial transactions pass through auditor approval — transparent and secure management." },
          { name: "Late Interest", desc: "Automatic interest calculation and notifications for overdue dues." },
        ],
      },
      {
        title: "Communication & Decisions", subtitle: "Strong communication with your residents",
        items: [
          { name: "Announcements", desc: "Deliver important notices to all residents instantly." },
          { name: "Voting", desc: "Vote on building decisions democratically and see the results." },
          { name: "Meeting Minutes", desc: "Create meeting minutes and share them with all residents." },
          { name: "Messaging", desc: "Instant messaging between residents and management, with automatic translation." },
          { name: "Surveys", desc: "Create detailed surveys for resident satisfaction and building decisions." },
        ],
      },
      {
        title: "Building Operations", subtitle: "Simplify daily operations",
        items: [
          { name: "Fault Reporting", desc: "Report faults with photos, then track and manage the resolution process." },
          { name: "Reservations", desc: "Calendar-based booking for common areas, the gym and meeting rooms." },
          { name: "Maintenance Planning", desc: "Scheduled maintenance tracking for elevators, generators and plumbing." },
          { name: "Asset Tracking", desc: "Register building assets and monitor their maintenance history." },
          { name: "Cleaning Log", desc: "Daily cleaning photos with an automatic 30-day archive." },
        ],
      },
      {
        title: "Security & Records", subtitle: "Keep the building safe",
        items: [
          { name: "Visitor Management", desc: "Record and track visitor entries and exits." },
          { name: "Vehicle Registry", desc: "Register resident and visitor vehicles by license plate." },
          { name: "Safety Inspections", desc: "Fire, electrical and structural safety inspection records." },
          { name: "Emergency Alerts", desc: "One-tap emergency reporting with instant alerts." },
          { name: "Building Photos", desc: "Building photo gallery with a categorized visual archive." },
        ],
      },
      {
        title: "Resident Services", subtitle: "Improve the resident experience",
        items: [
          { name: "Package Tracking", desc: "Track cargo and parcel delivery status and get notified." },
          { name: "Complaints & Suggestions", desc: "Feedback via an anonymous or open complaint/suggestion system." },
          { name: "Pet Registration", desc: "Register the pets of building residents." },
          { name: "Building Rules", desc: "Publish and share building rules digitally." },
          { name: "Penalty System", desc: "A graduated penalty and warning system for rule violations." },
        ],
      },
      {
        title: "Management & Analytics", subtitle: "Professional building management",
        items: [
          { name: "Lease Contracts", desc: "Track tenant contracts and get expiry reminders." },
          { name: "Insurance Policies", desc: "Record building insurance and get renewal reminders." },
          { name: "Move In/Out", desc: "Move-in and move-out notices and checklists." },
          { name: "Energy Analytics", desc: "Monthly consumption charts and comparisons from meter data." },
          { name: "Document Management", desc: "Store all building documents in a digital archive." },
          { name: "Service Directory", desc: "A directory of service providers such as plumbers and electricians." },
          { name: "Events", desc: "Create building events and track attendance." },
          { name: "Meter Readings", desc: "Record electricity, water and gas meter readings." },
        ],
      },
    ],
    allFeatures: "All Features",
    roles: {
      title: "A Tailored Experience for Every Role",
      subtitle: "5 user roles, each with its own access permissions",
      items: [
        { role: "Manager", desc: "Full access: finances, staff, reports, settings" },
        { role: "Caretaker", desc: "Expense entry, fault tracking, cleaning, package management" },
        { role: "Auditor", desc: "Financial approval, report review, energy analytics" },
        { role: "Owner", desc: "Dues tracking, voting, announcements, complaints" },
        { role: "Tenant", desc: "Report faults, track packages, view announcements" },
      ],
    },
    languages: {
      title: "Support for 9 Languages",
      subtitle: "Residents of different nationalities can use the system in their own language.",
    },
    cta: {
      title: "Simplify Management with Apollo",
      subtitle: "Everything you need for professional building management is ready.",
    },
    footer: {
      tagline: "Apollo Building Management System",
      developedBy: "Developed by Velaris Dijital",
    },
    tutorial: {
      title: "Quick Start Guide",
      subtitle: "Start using Apollo in 5 steps",
      steps: [
        { title: "Sign In", desc: "Sign in with your manager account. On first login, set your building details and number of apartments." },
        { title: "Add Residents", desc: "Add apartment residents from the Residents menu. Each resident can access the system with their own account." },
        { title: "Set Up Dues", desc: "Set the monthly dues amount in dues settings. The system charges balances automatically." },
        { title: "Record Expenses", desc: "Enter invoices and expenses by photographing them. The auditor approval workflow kicks in." },
        { title: "Start Using It", desc: "Share announcements, receive fault reports and review reports. All management on one platform!" },
      ],
      startButton: "Get Started",
    },
  },

  // ───────────────────────── РУССКИЙ ─────────────────────────
  ru: {
    nav: { howToUse: "Как это работает", login: "Войти" },
    hero: {
      badge: "Мобильная версия — доступ с любого устройства",
      titlePre: "Новое поколение", titleHighlight: "управления", titlePost: "жилыми домами",
      subtitle: "Более 40 функций, 9 языков, 5 ролей пользователей. От расходов до взносов, от заявок до безопасности — всё на одной платформе.",
      ctaPrimary: "Начать сейчас", ctaSecondary: "Как это работает",
    },
    statLabels: ["Функций", "Языков", "Ролей", "Доступ"],
    featuresHeading: {
      title: "Все ваши задачи на одной платформе",
      subtitle: "Всё необходимое для профессионального управления домом — в Apollo.",
    },
    categories: [
      {
        title: "Финансовый учёт", subtitle: "Держите финансы под контролем",
        items: [
          { name: "Учёт расходов", desc: "Категоризируйте все расходы дома, фотографируйте чеки и отслеживайте в реальном времени." },
          { name: "Управление взносами", desc: "Задавайте ежемесячные взносы, отслеживайте оплату по квартирам и начисляйте автоматически." },
          { name: "Отчёты и аналитика", desc: "Отчёты о доходах и расходах, графики, экспорт в PDF и планирование бюджета." },
          { name: "Механизм согласования", desc: "Финансовые операции проходят проверку аудитора — прозрачно и безопасно." },
          { name: "Пени за просрочку", desc: "Автоматический расчёт пени по просроченным взносам и уведомления." },
        ],
      },
      {
        title: "Связь и решения", subtitle: "Надёжная связь с жильцами",
        items: [
          { name: "Объявления", desc: "Мгновенно доносите важные уведомления до всех жильцов." },
          { name: "Голосование", desc: "Демократично голосуйте по решениям дома и смотрите результаты." },
          { name: "Протоколы собраний", desc: "Составляйте протоколы собраний и делитесь ими со всеми жильцами." },
          { name: "Сообщения", desc: "Мгновенные сообщения между жильцами и управлением с автопереводом." },
          { name: "Опросы", desc: "Создавайте подробные опросы об удовлетворённости жильцов и решениях дома." },
        ],
      },
      {
        title: "Эксплуатация здания", subtitle: "Упростите ежедневные операции",
        items: [
          { name: "Заявки о неисправностях", desc: "Сообщайте о неисправностях с фото, отслеживайте и управляйте устранением." },
          { name: "Бронирование", desc: "Бронирование общих зон, спортзала и переговорных по календарю." },
          { name: "Планирование обслуживания", desc: "Учёт планового обслуживания лифтов, генераторов и коммуникаций." },
          { name: "Учёт имущества", desc: "Регистрируйте имущество дома и отслеживайте историю обслуживания." },
          { name: "Контроль уборки", desc: "Ежедневные фото уборки и автоархив за 30 дней." },
        ],
      },
      {
        title: "Безопасность и учёт", subtitle: "Держите здание в безопасности",
        items: [
          { name: "Учёт посетителей", desc: "Регистрируйте и отслеживайте вход и выход посетителей." },
          { name: "Учёт автомобилей", desc: "Регистрируйте автомобили жильцов и гостей по номерам." },
          { name: "Проверки безопасности", desc: "Записи проверок пожарной, электрической и конструктивной безопасности." },
          { name: "Экстренные ситуации", desc: "Экстренное оповещение одним нажатием и мгновенные уведомления." },
          { name: "Фото здания", desc: "Фотогалерея дома с категоризированным архивом." },
        ],
      },
      {
        title: "Сервисы для жильцов", subtitle: "Улучшите опыт жильцов",
        items: [
          { name: "Отслеживание посылок", desc: "Отслеживайте доставку посылок и получайте уведомления." },
          { name: "Жалобы и предложения", desc: "Обратная связь через анонимную или открытую систему жалоб и предложений." },
          { name: "Учёт питомцев", desc: "Регистрируйте домашних животных жильцов." },
          { name: "Правила дома", desc: "Публикуйте и распространяйте правила дома в цифровом виде." },
          { name: "Система штрафов", desc: "Поэтапная система штрафов и предупреждений за нарушения." },
        ],
      },
      {
        title: "Управление и аналитика", subtitle: "Профессиональное управление домом",
        items: [
          { name: "Договоры аренды", desc: "Отслеживайте договоры аренды и получайте напоминания об окончании срока." },
          { name: "Страховые полисы", desc: "Записывайте страховки дома и получайте напоминания о продлении." },
          { name: "Переезды", desc: "Уведомления о въезде и выезде и контрольные списки." },
          { name: "Анализ энергии", desc: "Ежемесячные графики потребления и сравнение по данным счётчиков." },
          { name: "Управление документами", desc: "Храните все документы дома в цифровом архиве." },
          { name: "Справочник услуг", desc: "Справочник поставщиков услуг — сантехники, электрики и другие." },
          { name: "Мероприятия", desc: "Создавайте мероприятия дома и отслеживайте участие." },
          { name: "Учёт счётчиков", desc: "Записывайте показания счётчиков электричества, воды и газа." },
        ],
      },
    ],
    allFeatures: "Все функции",
    roles: {
      title: "Особый опыт для каждой роли",
      subtitle: "5 ролей пользователей, у каждой — свои права доступа",
      items: [
        { role: "Управляющий", desc: "Полный доступ: финансы, персонал, отчёты, настройки" },
        { role: "Консьерж", desc: "Ввод расходов, заявки, уборка, управление посылками" },
        { role: "Аудитор", desc: "Финансовое согласование, проверка отчётов, анализ энергии" },
        { role: "Собственник", desc: "Взносы, голосование, объявления, жалобы" },
        { role: "Арендатор", desc: "Заявки, посылки, просмотр объявлений" },
      ],
    },
    languages: {
      title: "Поддержка 9 языков",
      subtitle: "Жильцы разных национальностей могут пользоваться системой на своём языке.",
    },
    cta: {
      title: "Упростите управление с Apollo",
      subtitle: "Всё необходимое для профессионального управления домом уже готово.",
    },
    footer: {
      tagline: "Apollo — система управления домом",
      developedBy: "Разработано Velaris Dijital",
    },
    tutorial: {
      title: "Краткое руководство",
      subtitle: "Начните пользоваться Apollo за 5 шагов",
      steps: [
        { title: "Войдите", desc: "Войдите под учётной записью управляющего. При первом входе укажите данные дома и число квартир." },
        { title: "Добавьте жильцов", desc: "Добавьте жильцов в меню «Жильцы». Каждый жилец получает доступ под своей учётной записью." },
        { title: "Задайте взносы", desc: "Укажите сумму ежемесячных взносов в настройках. Система начисляет их автоматически." },
        { title: "Вносите расходы", desc: "Вносите счета и расходы, фотографируя их. Включается механизм согласования аудитором." },
        { title: "Начните работу", desc: "Публикуйте объявления, принимайте заявки, изучайте отчёты. Всё управление — на одной платформе!" },
      ],
      startButton: "Начать сейчас",
    },
  },
};

const LANGUAGE_CHIPS = [
  { flag: "🇹🇷", name: "Türkçe" }, { flag: "🇬🇧", name: "English" }, { flag: "🇩🇪", name: "Deutsch" },
  { flag: "🇫🇷", name: "Français" }, { flag: "🇸🇦", name: "العربية" }, { flag: "🇷🇺", name: "Русский" },
  { flag: "🇺🇦", name: "Українська" }, { flag: "🇵🇱", name: "Polski" }, { flag: "🇬🇪", name: "ქართული" },
];

const COLOR_MAP: Record<string, { bg: string; border: string; icon: string; badge: string; gradient: string }> = {
  blue: { bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800", icon: "text-blue-600 dark:text-blue-400", badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300", gradient: "from-blue-500 to-blue-600" },
  green: { bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800", icon: "text-emerald-600 dark:text-emerald-400", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300", gradient: "from-emerald-500 to-emerald-600" },
  purple: { bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-200 dark:border-purple-800", icon: "text-purple-600 dark:text-purple-400", badge: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300", gradient: "from-purple-500 to-purple-600" },
  orange: { bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-200 dark:border-orange-800", icon: "text-orange-600 dark:text-orange-400", badge: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300", gradient: "from-orange-500 to-orange-600" },
  pink: { bg: "bg-pink-50 dark:bg-pink-950/30", border: "border-pink-200 dark:border-pink-800", icon: "text-pink-600 dark:text-pink-400", badge: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300", gradient: "from-pink-500 to-pink-600" },
  cyan: { bg: "bg-cyan-50 dark:bg-cyan-950/30", border: "border-cyan-200 dark:border-cyan-800", icon: "text-cyan-600 dark:text-cyan-400", badge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300", gradient: "from-cyan-500 to-cyan-600" },
};

export default function LandingContent() {
  const { locale, setLocale } = useTranslation();
  const [showTutorial, setShowTutorial] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);

  // Landing yalnızca 3 dilde; diğer diller seçiliyse Türkçe metne düş.
  const landingLang: "tr" | "en" | "ru" =
    locale === "en" ? "en" : locale === "ru" ? "ru" : "tr";
  const L = LANDING[landingLang];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">Apollo</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Dil değiştirici (TR / EN / RU) */}
            <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
              {LANDING_LOCALES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLocale(l.code)}
                  aria-pressed={locale === l.code}
                  className={`px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                    locale === l.code
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowTutorial(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Play className="w-4 h-4" />
              {L.nav.howToUse}
            </button>
            <Link href="/giris" className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">
              {L.nav.login}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950" />
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234f46e5' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-sm font-medium mb-8">
              <Smartphone className="w-4 h-4" />
              {L.hero.badge}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-[1.1] tracking-tight">
              {L.hero.titlePre}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> {L.hero.titleHighlight} </span>
              {L.hero.titlePost}
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              {L.hero.subtitle}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/giris" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-base hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl shadow-blue-500/25">
                {L.hero.ctaPrimary}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button
                onClick={() => setShowTutorial(true)}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-base hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
              >
                <Play className="w-5 h-5" />
                {L.hero.ctaSecondary}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {STAT_VALUES.map((value, i) => (
              <div key={i} className="text-center p-4 rounded-2xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50">
                <div className="text-3xl font-extrabold text-gray-900 dark:text-white">{value}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{L.statLabels[i]}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - Tab-based Categories */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              {L.featuresHeading.title}
            </h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              {L.featuresHeading.subtitle}
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {L.categories.map((cat, i) => {
              const c = COLOR_MAP[CATEGORY_META[i].color];
              return (
                <button
                  key={cat.title}
                  onClick={() => setActiveCategory(i)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeCategory === i
                      ? `${c.badge} shadow-sm`
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {cat.title}
                </button>
              );
            })}
          </div>

          {/* Active Category Features */}
          {(() => {
            const cat = L.categories[activeCategory];
            const meta = CATEGORY_META[activeCategory];
            const c = COLOR_MAP[meta.color];
            return (
              <div>
                <div className="text-center mb-8">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${c.badge}`}>
                    {cat.subtitle}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {cat.items.map((f, j) => {
                    const Icon = meta.icons[j];
                    return (
                      <div
                        key={f.name}
                        className={`group rounded-2xl border ${c.border} ${c.bg} p-6 hover:shadow-lg transition-all`}
                      >
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center mb-4 shadow-sm`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{f.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{f.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* All Features Grid Summary */}
      <section className="py-16 bg-gray-50/80 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-10">
            {L.allFeatures}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {CATEGORY_META.flatMap((meta, i) =>
              L.categories[i].items.map((f, j) => {
                const Icon = meta.icons[j];
                const c = COLOR_MAP[meta.color];
                return (
                  <div key={`${i}-${f.name}`} className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${c.icon}`} />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{f.name}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              {L.roles.title}
            </h2>
            <p className="mt-4 text-gray-500 dark:text-gray-400">{L.roles.subtitle}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {L.roles.items.map((r, i) => {
              const meta = ROLE_META[i];
              const c = COLOR_MAP[meta.color];
              const Icon = meta.icon;
              return (
                <div key={r.role} className={`rounded-2xl border ${c.border} p-6 text-center`}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center mx-auto mb-4 shadow-sm`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">{r.role}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{r.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Language Support */}
      <section className="py-16 bg-gray-50/80 dark:bg-gray-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{L.languages.title}</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">{L.languages.subtitle}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {LANGUAGE_CHIPS.map((l) => (
              <div key={l.name} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                <span className="text-xl">{l.flag}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{l.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="relative rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-10 sm:p-16 text-center overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 20l5.66-5.66 1.41 1.41L1.41 21.41 0 20zm0-18.58L2.83 4.24l1.41-1.41L1.41 0H0v1.41zM20 18.59l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59zM20 0l5.66 5.66-1.41 1.41L20 2.83l-4.24 4.24-1.41-1.41L20 0z'/%3E%3C/g%3E%3C/svg%3E\")" }} />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                {L.cta.title}
              </h2>
              <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
                {L.cta.subtitle}
              </p>
              <Link href="/giris" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-blue-700 font-semibold text-base hover:bg-blue-50 transition-colors shadow-lg">
                {L.nav.login}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">Apollo</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {L.footer.tagline}
          </p>
          <a
            href="https://velarisdijital.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
          >
            {L.footer.developedBy}
          </a>
        </div>
      </footer>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTutorial(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{L.tutorial.title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{L.tutorial.subtitle}</p>
              </div>
              <button onClick={() => setShowTutorial(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {L.tutorial.steps.map((s, i) => {
                const Icon = STEP_ICONS[i];
                return (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20">
                        {i + 1}
                      </div>
                      {i < L.tutorial.steps.length - 1 && <div className="w-0.5 flex-1 bg-blue-200 dark:bg-blue-800 mt-2" />}
                    </div>
                    <div className="pb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <h3 className="font-semibold text-gray-900 dark:text-white">{s.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
              <div className="pt-2">
                <Link
                  href="/giris"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25"
                  onClick={() => setShowTutorial(false)}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {L.tutorial.startButton}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
