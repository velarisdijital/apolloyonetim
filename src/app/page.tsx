import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Receipt,
  Wallet,
  BarChart3,
  Users,
  CalendarCheck,
  Shield,
  Smartphone,
  Bell,
  ChevronRight,
  Megaphone,
  Vote,
} from "lucide-react";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/panel");

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">Apollo</span>
          </div>
          <Link
            href="/giris"
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Giriş Yap
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
              <Shield className="w-3.5 h-3.5" />
              Profesyonel Apartman Yönetimi
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight">
              Binanızı{" "}
              <span className="text-blue-600 dark:text-blue-400">akıllıca</span>{" "}
              yönetin
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Giderler, aidatlar, ödemeler, duyurular ve daha fazlası — tek bir
              platformda. Yöneticiler, kapıcılar ve ev sahipleri için tasarlandı.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/giris"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-base hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25"
              >
                Hemen Başlayın
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Her ihtiyaca tek çözüm
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Apartman yönetiminin tüm süreçlerini dijitale taşıyın
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Receipt className="w-6 h-6" />}
              title="Gider Yönetimi"
              description="Fatura, bakım ve tamirat giderlerini kategorize edin. Fiş fotoğraflarını yükleyin."
              color="blue"
            />
            <FeatureCard
              icon={<Wallet className="w-6 h-6" />}
              title="Aidat Takibi"
              description="Aylık aidat tanımlayın, daire bazlı ödeme durumunu anlık takip edin."
              color="green"
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Raporlar"
              description="Gelir-gider dağılımı, aylık trendler ve tahsilat oranlarını görselleştirin."
              color="purple"
            />
            <FeatureCard
              icon={<Megaphone className="w-6 h-6" />}
              title="Duyurular"
              description="Bina sakinlerine anlık duyuru yayınlayın, önemli bildirimleri öne çıkarın."
              color="orange"
            />
            <FeatureCard
              icon={<Vote className="w-6 h-6" />}
              title="Oylama"
              description="Bina kararlarını demokratik şekilde alın. Online oylama ve sonuç takibi."
              color="pink"
            />
            <FeatureCard
              icon={<CalendarCheck className="w-6 h-6" />}
              title="Rezervasyon"
              description="Ortak alanları takvim üzerinden kolayca rezerve edin. Çakışma kontrolü otomatik."
              color="amber"
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Sakin Yönetimi"
              description="Kullanıcıları rollerine göre yönetin. Yönetici, kapıcı ve ev sahibi rolleri."
              color="cyan"
            />
            <FeatureCard
              icon={<Bell className="w-6 h-6" />}
              title="Bildirimler"
              description="Yeni duyuru, ödeme hatırlatması ve toplantı bildirimlerini kaçırmayın."
              color="red"
            />
            <FeatureCard
              icon={<Smartphone className="w-6 h-6" />}
              title="Mobil Uyumlu"
              description="PWA desteğiyle telefonunuza kurun. Her cihazdan rahatça erişin."
              color="indigo"
            />
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Herkese özel deneyim
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Rol bazlı erişim ile herkes yalnızca ilgili alanları görür
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            <RoleCard
              title="Yönetici"
              items={[
                "Gider ve aidat yönetimi",
                "Ödeme takibi ve raporlar",
                "Kullanıcı ve bina yönetimi",
                "Duyuru ve oylama oluşturma",
              ]}
              color="blue"
            />
            <RoleCard
              title="Kapıcı"
              items={[
                "Gider girişi ve fiş yükleme",
                "Ödeme kaydetme",
                "Toplantı ve duyuruları görüntüleme",
                "Bildirim takibi",
              ]}
              color="green"
            />
            <RoleCard
              title="Ev Sahibi"
              items={[
                "Aidat ve ödeme durumu",
                "Gider ve raporları görüntüleme",
                "Oylama ve duyurular",
                "Rezervasyon yapma",
              ]}
              color="purple"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="relative rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-10 sm:p-16 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzR6bTAtMzBWMkgydjJoMzR6TTIgMzBoMnYtMkgydjJ6bTM0IDB2LTJIMnYyaDM0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Binanızı dijitalleştirin
              </h2>
              <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
                Apollo ile apartman yönetimi artık daha kolay, daha şeffaf ve
                daha verimli.
              </p>
              <Link
                href="/giris"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-blue-700 font-semibold text-base hover:bg-blue-50 transition-colors"
              >
                Giriş Yap
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">Apollo</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Apollo Yönetim Sistemi
          </p>
        </div>
      </footer>
    </div>
  );
}

const COLOR_MAP: Record<string, { bg: string; icon: string }> = {
  blue: { bg: "bg-blue-100 dark:bg-blue-900/40", icon: "text-blue-600 dark:text-blue-400" },
  green: { bg: "bg-green-100 dark:bg-green-900/40", icon: "text-green-600 dark:text-green-400" },
  purple: { bg: "bg-purple-100 dark:bg-purple-900/40", icon: "text-purple-600 dark:text-purple-400" },
  orange: { bg: "bg-orange-100 dark:bg-orange-900/40", icon: "text-orange-600 dark:text-orange-400" },
  pink: { bg: "bg-pink-100 dark:bg-pink-900/40", icon: "text-pink-600 dark:text-pink-400" },
  amber: { bg: "bg-amber-100 dark:bg-amber-900/40", icon: "text-amber-600 dark:text-amber-400" },
  cyan: { bg: "bg-cyan-100 dark:bg-cyan-900/40", icon: "text-cyan-600 dark:text-cyan-400" },
  red: { bg: "bg-red-100 dark:bg-red-900/40", icon: "text-red-600 dark:text-red-400" },
  indigo: { bg: "bg-indigo-100 dark:bg-indigo-900/40", icon: "text-indigo-600 dark:text-indigo-400" },
};

function FeatureCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <div className="group rounded-2xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700 transition-all">
      <div className={`w-12 h-12 rounded-xl ${c.bg} ${c.icon} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

function RoleCard({
  title,
  items,
  color,
}: {
  title: string;
  items: string[];
  color: string;
}) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
      <div className={`w-10 h-10 rounded-lg ${c.bg} ${c.icon} flex items-center justify-center mb-4`}>
        <Shield className="w-5 h-5" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
            <ChevronRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
