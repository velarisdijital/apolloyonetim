"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2, Receipt, Wallet, BarChart3, Users, CalendarCheck, Shield,
  Smartphone, ChevronRight, Megaphone, Vote, Wrench, MessageCircle,
  Car, PawPrint, FolderOpen, Phone, Siren, Gauge, UserCheck, BookOpen,
  ShieldAlert, ClipboardCheck, Package, ClipboardList, Calendar, Scale,
  FileText, Sparkles, MessageSquareWarning, PackageCheck, Truck, ShieldCheck,
  Camera, Zap, Settings, Star, CheckCircle2, ArrowRight, Play, X,
} from "lucide-react";

const FEATURE_CATEGORIES = [
  {
    title: "Mali Yönetim",
    subtitle: "Finansal kontrolü elinizde tutun",
    color: "blue",
    features: [
      { icon: Receipt, name: "Gider Takibi", desc: "Tüm bina giderlerini kategorize edin, fişleri fotoğraflayın ve anlık takip edin." },
      { icon: Wallet, name: "Aidat Yönetimi", desc: "Aylık aidat tanımlama, daire bazlı ödeme durumu ve otomatik borçlandırma." },
      { icon: BarChart3, name: "Rapor & Analiz", desc: "Gelir-gider raporları, grafikler, PDF dışa aktarım ve bütçe planlama." },
      { icon: ClipboardCheck, name: "Onay Mekanizması", desc: "Mali işlemler denetçi onayından geçer, şeffaf ve güvenli yönetim." },
      { icon: Settings, name: "Gecikme Faizi", desc: "Geciken aidatlara otomatik faiz hesaplama ve bildirim." },
    ],
  },
  {
    title: "İletişim & Karar",
    subtitle: "Sakinlerinizle güçlü iletişim",
    color: "green",
    features: [
      { icon: Megaphone, name: "Duyuru Sistemi", desc: "Önemli bildirimleri anında tüm sakinlere ulaştırın." },
      { icon: Vote, name: "Oylama", desc: "Bina kararlarını demokratik şekilde oylayın, sonuçları görün." },
      { icon: Users, name: "Toplantı Kayıtları", desc: "Toplantı tutanaklarını oluşturun ve tüm sakinlerle paylaşın." },
      { icon: MessageCircle, name: "Mesajlaşma", desc: "Sakinler ve yönetim arası anlık mesajlaşma, otomatik çeviri desteği." },
      { icon: ClipboardList, name: "Anketler", desc: "Sakin memnuniyeti ve bina kararları için detaylı anketler oluşturun." },
    ],
  },
  {
    title: "Bina İşletme",
    subtitle: "Günlük operasyonları kolaylaştırın",
    color: "purple",
    features: [
      { icon: Wrench, name: "Arıza Bildirimi", desc: "Fotoğraflı arıza bildirimi, takip ve çözüm süreci yönetimi." },
      { icon: CalendarCheck, name: "Rezervasyon", desc: "Ortak alan, spor salonu ve toplantı odası için takvim bazlı rezervasyon." },
      { icon: Scale, name: "Bakım Planlama", desc: "Asansör, jeneratör ve tesisat için periyodik bakım takibi." },
      { icon: Package, name: "Demirbaş Takibi", desc: "Bina demirbaşlarını kaydedin, bakım geçmişini izleyin." },
      { icon: Sparkles, name: "Temizlik Takip", desc: "Günlük temizlik fotoğrafları, otomatik 30 gün arşiv." },
    ],
  },
  {
    title: "Güvenlik & Kayıt",
    subtitle: "Binayı güvende tutun",
    color: "orange",
    features: [
      { icon: UserCheck, name: "Ziyaretçi Yönetimi", desc: "Ziyaretçi giriş-çıkışlarını kaydedin ve takip edin." },
      { icon: Car, name: "Araç Kayıt", desc: "Sakin ve ziyaretçi araçlarını plaka bazlı kayıt altına alın." },
      { icon: ShieldCheck, name: "Güvenlik Denetim", desc: "Yangın, elektrik ve yapısal güvenlik denetim kayıtları." },
      { icon: Siren, name: "Acil Durum", desc: "Tek tuşla acil durum bildirimi, anlık uyarı sistemi." },
      { icon: Camera, name: "Bina Fotoğrafları", desc: "Bina fotoğraf galerisi, kategorili görsel arşiv." },
    ],
  },
  {
    title: "Sakin Hizmetleri",
    subtitle: "Sakin deneyimini iyileştirin",
    color: "pink",
    features: [
      { icon: PackageCheck, name: "Paket Takibi", desc: "Kargo ve paket teslim durumunu takip edin, bildirim alın." },
      { icon: MessageSquareWarning, name: "Şikayet & Öneri", desc: "Anonim veya açık şikayet/öneri sistemi ile geri bildirim." },
      { icon: PawPrint, name: "Evcil Hayvan Kaydı", desc: "Bina sakinlerinin evcil hayvanlarını kayıt altına alın." },
      { icon: BookOpen, name: "Bina Kuralları", desc: "Bina kurallarını dijital olarak yayınlayın ve paylaşın." },
      { icon: ShieldAlert, name: "Ceza Sistemi", desc: "Kural ihlallerinde kademeli ceza ve uyarı sistemi." },
    ],
  },
  {
    title: "Yönetim & Analiz",
    subtitle: "Profesyonel bina yönetimi",
    color: "cyan",
    features: [
      { icon: FileText, name: "Kira Sözleşmeleri", desc: "Kiracı sözleşmelerini takip edin, süre dolum uyarıları alın." },
      { icon: Shield, name: "Sigorta Poliçeleri", desc: "Bina sigortalarını kaydedin, yenileme hatırlatmaları." },
      { icon: Truck, name: "Taşınma Bildirimi", desc: "Giriş-çıkış bildirimleri ve kontrol listeleri." },
      { icon: Zap, name: "Enerji Analizi", desc: "Sayaç verilerinden aylık tüketim grafikleri ve karşılaştırma." },
      { icon: FolderOpen, name: "Belge Yönetimi", desc: "Tüm bina belgelerini dijital arşivde saklayın." },
      { icon: Phone, name: "Hizmet Rehberi", desc: "Tesisatçı, elektrikçi gibi hizmet sağlayıcı rehberi." },
      { icon: Calendar, name: "Etkinlikler", desc: "Bina etkinlikleri oluşturun, katılım takibi yapın." },
      { icon: Gauge, name: "Sayaç Takibi", desc: "Elektrik, su ve doğalgaz sayaç okumalarını kaydedin." },
    ],
  },
];

const STATS = [
  { value: "40+", label: "Özellik" },
  { value: "9", label: "Dil Desteği" },
  { value: "5", label: "Kullanıcı Rolü" },
  { value: "7/24", label: "Erişim" },
];

const TUTORIAL_STEPS = [
  { step: 1, title: "Giriş Yapın", desc: "Yönetici hesabınızla sisteme giriş yapın. İlk girişte bina bilgilerinizi ve daire sayınızı ayarlayın.", icon: Building2 },
  { step: 2, title: "Sakinleri Ekleyin", desc: "Sakinler menüsünden daire sakinlerini ekleyin. Her sakin kendi hesabıyla sisteme erişebilir.", icon: Users },
  { step: 3, title: "Aidatları Tanımlayın", desc: "Aidat ayarlarından aylık aidat tutarını belirleyin. Sistem otomatik olarak borçlandırma yapar.", icon: Wallet },
  { step: 4, title: "Giderleri Kaydedin", desc: "Fatura ve giderleri fotoğraflayarak sisteme girin. Denetçi onay mekanizması aktif olur.", icon: Receipt },
  { step: 5, title: "Kullanmaya Başlayın", desc: "Duyurular paylaşın, arıza bildirimleri alın, raporları inceleyin. Tüm yönetim tek platformda!", icon: Star },
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
  const [showTutorial, setShowTutorial] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);

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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTutorial(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Play className="w-4 h-4" />
              Nasıl Kullanılır?
            </button>
            <Link href="/giris" className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">
              Giriş Yap
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
              Mobil uyumlu, her cihazdan erişin
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-[1.1] tracking-tight">
              Apartman Yönetiminde
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Yeni Nesil </span>
              Deneyim
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              40&apos;dan fazla özellik, 9 dil desteği, 5 farklı kullanıcı rolü. Giderlerden aidatlara, arızalardan güvenliğe her şey tek platformda.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/giris" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-base hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl shadow-blue-500/25">
                Hemen Başlayın
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button
                onClick={() => setShowTutorial(true)}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-base hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
              >
                <Play className="w-5 h-5" />
                Nasıl Kullanılır?
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {STATS.map((s) => (
              <div key={s.label} className="text-center p-4 rounded-2xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50">
                <div className="text-3xl font-extrabold text-gray-900 dark:text-white">{s.value}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{s.label}</div>
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
              Tüm İhtiyaçlarınız Tek Platformda
            </h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Profesyonel apartman yönetimi için ihtiyacınız olan her şey Apollo&apos;da.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {FEATURE_CATEGORIES.map((cat, i) => {
              const c = COLOR_MAP[cat.color];
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
            const cat = FEATURE_CATEGORIES[activeCategory];
            const c = COLOR_MAP[cat.color];
            return (
              <div>
                <div className="text-center mb-8">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${c.badge}`}>
                    {cat.subtitle}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {cat.features.map((f) => (
                    <div
                      key={f.name}
                      className={`group rounded-2xl border ${c.border} ${c.bg} p-6 hover:shadow-lg transition-all`}
                    >
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center mb-4 shadow-sm`}>
                        <f.icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{f.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{f.desc}</p>
                    </div>
                  ))}
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
            Tüm Özellikler
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {FEATURE_CATEGORIES.flatMap((cat) =>
              cat.features.map((f) => {
                const c = COLOR_MAP[cat.color];
                return (
                  <div key={f.name} className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                    <f.icon className={`w-4 h-4 flex-shrink-0 ${c.icon}`} />
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
              Her Rol İçin Özel Deneyim
            </h2>
            <p className="mt-4 text-gray-500 dark:text-gray-400">5 farklı kullanıcı rolü, her birine özel erişim yetkileri</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { role: "Yönetici", desc: "Tam yetki: mali yönetim, personel, raporlar, ayarlar", color: "blue", icon: Shield },
              { role: "Kapıcı", desc: "Gider girişi, arıza takibi, temizlik, paket yönetimi", color: "green", icon: Wrench },
              { role: "Denetçi", desc: "Mali onay, raporları inceleme, enerji analizi", color: "purple", icon: ClipboardCheck },
              { role: "Ev Sahibi", desc: "Aidat takibi, oylama, duyurular, şikayet bildirimi", color: "orange", icon: Building2 },
              { role: "Kiracı", desc: "Arıza bildirimi, paket takibi, duyuruları görme", color: "pink", icon: Users },
            ].map((r) => {
              const c = COLOR_MAP[r.color];
              return (
                <div key={r.role} className={`rounded-2xl border ${c.border} p-6 text-center`}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center mx-auto mb-4 shadow-sm`}>
                    <r.icon className="w-6 h-6 text-white" />
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">9 Dil Desteği</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Farklı milliyetlerden sakinleriniz kendi dillerinde sistemi kullanabilir.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { flag: "🇹🇷", name: "Türkçe" }, { flag: "🇬🇧", name: "English" }, { flag: "🇩🇪", name: "Deutsch" },
              { flag: "🇫🇷", name: "Français" }, { flag: "🇸🇦", name: "العربية" }, { flag: "🇷🇺", name: "Русский" },
              { flag: "🇺🇦", name: "Українська" }, { flag: "🇵🇱", name: "Polski" }, { flag: "🇬🇪", name: "ქართული" },
            ].map((l) => (
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
                Apollo ile Yönetimi Kolaylaştırın
              </h2>
              <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
                Profesyonel apartman yönetimi için ihtiyacınız olan her şey hazır.
              </p>
              <Link href="/giris" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-blue-700 font-semibold text-base hover:bg-blue-50 transition-colors shadow-lg">
                Giriş Yap
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
            Apollo Apartman Yönetim Sistemi
          </p>
          <a
            href="https://velarisdijital.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
          >
            Velaris Dijital tarafından geliştirilmiştir
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
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Hızlı Başlangıç Rehberi</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">5 adımda Apollo&apos;yu kullanmaya başlayın</p>
              </div>
              <button onClick={() => setShowTutorial(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {TUTORIAL_STEPS.map((s, i) => (
                <div key={s.step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20">
                      {s.step}
                    </div>
                    {i < TUTORIAL_STEPS.length - 1 && <div className="w-0.5 flex-1 bg-blue-200 dark:bg-blue-800 mt-2" />}
                  </div>
                  <div className="pb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <s.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">{s.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
              <div className="pt-2">
                <Link
                  href="/giris"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25"
                  onClick={() => setShowTutorial(false)}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Hemen Başlayın
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
