"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/lib/i18n/context";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Copy, Scale, ChevronDown, ChevronUp } from "lucide-react";

interface HukukiSablon {
  id: number;
  baslik: string;
  kategori: string;
  icerik: string;
}

const kategorRenkleri: Record<string, string> = {
  Toplanti: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Yonetim: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Mali: "bg-green-100 text-green-800 dark:bg-green-100 dark:text-green-200",
  Kurallar: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  Sozlesme: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const sablonlar: HukukiSablon[] = [
  {
    id: 1,
    baslik: "Kat Malikleri Kurulu Toplanti Tutanagi",
    kategori: "Toplanti",
    icerik: `KAT MALİKLERİ KURULU TOPLANTI TUTANAĞI

Toplantı Tarihi: [TARİH]
Toplantı Saati: [SAAT]
Toplantı Yeri: [TOPLANTI YERİ]
Bina Adresi: [ADRES]

Toplam Kat Maliki Sayısı: [TOPLAM KAT MALİKİ SAYISI]
Toplantıya Katılan Kat Maliki Sayısı: [KATILAN SAYI]
Vekaletle Temsil Edilen Kat Maliki Sayısı: [VEKALET SAYISI]

GÜNDEM MADDELERİ:

1. Açılış ve yoklama
2. Divan heyetinin oluşturulması
3. [GÜNDEM MADDESİ 3]
4. [GÜNDEM MADDESİ 4]
5. [GÜNDEM MADDESİ 5]
6. Dilek ve temenniler
7. Kapanış

ALINAN KARARLAR:

Karar 1: [KARAR METNİ]
Oy durumu: Kabul: [KABUL SAYISI] / Red: [RED SAYISI] / Çekimser: [ÇEKİMSER SAYISI]

Karar 2: [KARAR METNİ]
Oy durumu: Kabul: [KABUL SAYISI] / Red: [RED SAYISI] / Çekimser: [ÇEKİMSER SAYISI]

Karar 3: [KARAR METNİ]
Oy durumu: Kabul: [KABUL SAYISI] / Red: [RED SAYISI] / Çekimser: [ÇEKİMSER SAYISI]

İşbu tutanak, toplantıya katılan kat maliklerinin huzurunda düzenlenmiş ve aşağıda imzalanmıştır.

Divan Başkanı: [AD SOYAD] - İmza
Katip: [AD SOYAD] - İmza

Katılımcılar:
[AD SOYAD] - Daire [DAİRE NO] - İmza
[AD SOYAD] - Daire [DAİRE NO] - İmza
[AD SOYAD] - Daire [DAİRE NO] - İmza`,
  },
  {
    id: 2,
    baslik: "Apartman Yonetim Plani",
    kategori: "Yonetim",
    icerik: `APARTMAN YÖNETİM PLANI

BİNA BİLGİLERİ:
Bina Adı: [BİNA ADI]
Adres: [ADRES]
Ada/Parsel: [ADA NO] / [PARSEL NO]
Toplam Bağımsız Bölüm Sayısı: [BÖLÜM SAYISI]
Kat Sayısı: [KAT SAYISI]
Yapım Yılı: [YAPIM YILI]

MADDE 1 - AMAÇ
Bu yönetim planı, 634 sayılı Kat Mülkiyeti Kanunu hükümlerine göre, [BİNA ADI] apartmanının yönetim esaslarını düzenler.

MADDE 2 - YÖNETİCİ SEÇİMİ
a) Yönetici, kat malikleri kurulunca bir yıl için seçilir.
b) Yönetici, kat maliklerinden biri veya dışarıdan bir kişi olabilir.
c) Yönetici, her yıl yapılacak olağan genel kurul toplantısında seçilir.

MADDE 3 - YÖNETİCİNİN GÖREVLERİ
a) Kat malikleri kurulu kararlarını uygulamak
b) Anagayrimenkulün bakımını, korunmasını ve onarımını sağlamak
c) Ortak giderleri toplamak ve harcamaları yapmak
d) Bütçeyi hazırlamak ve genel kurula sunmak
e) Defterleri tutmak ve belgeleri saklamak

MADDE 4 - ORTAK ALANLAR
Aşağıdaki alanlar ortak alan olarak belirlenmiştir:
a) Giriş holü ve merdiven boşlukları
b) Asansör ve asansör makine dairesi
c) Çatı ve çatı terası
d) Bahçe ve otopark alanları
e) Sığınak
f) Kapıcı dairesi
g) Su deposu ve kazan dairesi

MADDE 5 - AİDAT VE GİDERLER
a) Aidatlar, her ayın [GÜN] tarihine kadar yöneticiye veya bina hesabına ödenir.
b) Ortak giderler, arsa payı oranında paylaştırılır.
c) Aidat miktarı, yıllık genel kurul toplantısında belirlenir.
d) Zamanında ödenmeyen aidatlara aylık %[FAİZ ORANI] gecikme faizi uygulanır.

MADDE 6 - DENETİM
a) Denetçi, kat malikleri kurulunca bir yıl için seçilir.
b) Denetçi, yöneticinin hesaplarını ve işlemlerini denetler.
c) Denetçi, denetim raporunu genel kurula sunar.

İşbu yönetim planı [TARİH] tarihinde kat malikleri kurulunca kabul edilmiştir.`,
  },
  {
    id: 3,
    baslik: "Aidat Ihtar Yazisi",
    kategori: "Mali",
    icerik: `AİDAT İHTAR YAZISI

Tarih: [TARİH]
Sayı: [YAZI SAYISI]

Sayın [AD SOYAD]
Daire No: [DAİRE NO]
Adres: [ADRES]

Konu: Gecikmiş Aidat Borcu Hakkında İhtar

Sayın [AD SOYAD],

[BİNA ADI] apartmanı kat maliki/kiracısı olarak, aşağıda belirtilen aylara ait aidat borçlarınızın ödenmediği tespit edilmiştir.

BORÇ DETAYI:
| Dönem         | Tutar      | Gecikme Faizi | Toplam     |
|---------------|------------|---------------|------------|
| [AY/YIL]      | [TUTAR] TL | [FAİZ] TL    | [TOPLAM] TL|
| [AY/YIL]      | [TUTAR] TL | [FAİZ] TL    | [TOPLAM] TL|
| [AY/YIL]      | [TUTAR] TL | [FAİZ] TL    | [TOPLAM] TL|

Toplam Borç: [TOPLAM BORÇ] TL

634 sayılı Kat Mülkiyeti Kanunu'nun 20. maddesi gereğince, kat maliklerinin ortak giderlere katılma yükümlülüğü bulunmaktadır. Aynı kanunun 22. maddesi uyarınca, aidatını zamanında ödemeyen kat malikinden gecikme tazminatı talep edilebilir.

İşbu ihtarın tebliğinden itibaren 15 (on beş) gün içinde toplam [TOPLAM BORÇ] TL borcunuzun aşağıdaki hesaba ödenmesini, aksi takdirde yasal yollara başvurulacağını ihtar ederiz.

Banka: [BANKA ADI]
IBAN: [IBAN NUMARASI]
Hesap Sahibi: [BİNA ADI] Apartmanı Yönetimi

Saygılarımızla,

[YÖNETİCİ AD SOYAD]
Apartman Yöneticisi
Tel: [TELEFON]`,
  },
  {
    id: 4,
    baslik: "Ortak Alan Kullanim Kurallari",
    kategori: "Kurallar",
    icerik: `ORTAK ALAN KULLANIM KURALLARI

[BİNA ADI] APARTMANI
Yürürlük Tarihi: [TARİH]

Aşağıdaki kurallar, 634 sayılı Kat Mülkiyeti Kanunu ve apartman yönetim planı çerçevesinde, tüm kat malikleri, kiracılar ve sakinler için bağlayıcıdır.

1. GENEL KURALLAR
1.1. Ortak alanlarda temizlik ve düzene özen gösterilecektir.
1.2. Ortak alanlara kişisel eşya bırakılmayacaktır.
1.3. Merdiven boşluklarına ve koridorlara ayakkabılık, bisiklet vb. konulmayacaktır.
1.4. Apartman giriş kapısı saat 22:00'den sonra kilitli tutulacaktır.

2. GÜRÜLTÜ VE HUZUR
2.1. Hafta içi 22:00 - 08:00 arası, hafta sonu 23:00 - 10:00 arası sessizlik saatleridir.
2.2. Tadilat çalışmaları hafta içi 09:00 - 18:00, Cumartesi 10:00 - 16:00 arası yapılabilir. Pazar günleri tadilat yapılamaz.
2.3. Müzik ve televizyon sesi komşuları rahatsız etmeyecek düzeyde tutulacaktır.

3. OTOPARK KULLANIMI
3.1. Her daireye tahsis edilen park yeri kullanılacaktır.
3.2. Misafir araçları sadece misafir park alanını kullanabilir.
3.3. Otopark alanında araç yıkama ve tamir yapılamaz.
3.4. Otopark alanına motor, kamyon, karavan vb. park edilemez.

4. ASANSÖR KULLANIMI
4.1. Asansör kapasitesinin üzerinde yükleme yapılmayacaktır.
4.2. Taşınma ve büyük eşya taşıma işlemleri için yöneticiden izin alınacaktır.
4.3. Asansörde sigara içilmeyecektir.

5. BAHÇe VE YEŞİL ALANLAR
5.1. Bahçe bitkileri korunacak, izinsiz müdahale yapılmayacaktır.
5.2. Evcil hayvanlar bahçede tasmalı gezdirilecek ve atıklar toplanacaktır.
5.3. Bahçede mangal ve ateş yakılması yasaktır (yönetim kurulu izni hariç).

6. ÇÖP VE ATIK YÖNETİMİ
6.1. Çöpler kapalı poşetlerde, belirlenen çöp alanına bırakılacaktır.
6.2. Geri dönüşüm kurallarına uyulacaktır.
6.3. Büyük hacimli atıklar (mobilya, beyaz eşya vb.) için yönetim bilgilendirilecektir.

7. YAPTIRIMLAR
7.1. Kurallara aykırı davranışlar yönetim tarafından yazılı olarak uyarılır.
7.2. Tekrarlayan ihlallerde kat malikleri kurulu kararıyla ceza uygulanabilir.
7.3. Ağır ihlallerde 634 sayılı Kat Mülkiyeti Kanunu'nun 33. maddesi uyarınca hakimden müdahale istenebilir.

Bu kurallar [TARİH] tarihli kat malikleri kurulu toplantısında kabul edilmiştir.

Yönetim Kurulu`,
  },
  {
    id: 5,
    baslik: "Tahliye Ihbarnamesi",
    kategori: "Yonetim",
    icerik: `TAHLİYE İHBARNAMESİ

Tarih: [TARİH]
İhbarname No: [İHBARNAME NO]

Gönderen:
[YÖNETİCİ AD SOYAD]
[BİNA ADI] Apartmanı Yönetimi
Adres: [ADRES]

Muhatap:
[KİRACI AD SOYAD]
Daire No: [DAİRE NO]
Adres: [ADRES]

KONU: Tahliye İhbarı

Sayın [KİRACI AD SOYAD],

[BİNA ADI] apartmanı [DAİRE NO] numaralı dairede kiracı olarak bulunmaktanız.

Tahliye Sebebi:
[ ] Kira sözleşmesi süresinin sona ermesi (6098 sayılı TBK md. 347)
[ ] Kira bedelinin ödenmemesi (6098 sayılı TBK md. 315)
[ ] Komşulara karşı yükümlülüklere aykırı davranış (6098 sayılı TBK md. 316)
[ ] Kat mülkiyeti kanununa aykırı kullanım (634 sayılı KMK md. 24)
[ ] Diğer: [SEBEP]

Açıklama:
[TAHLİYE SEBEBİNİN DETAYLI AÇIKLAMASI]

6098 sayılı Türk Borçlar Kanunu'nun ilgili hükümleri ve 634 sayılı Kat Mülkiyeti Kanunu uyarınca, işbu ihbarnamenin tarafınıza tebliğinden itibaren [SÜRE] gün içinde belirtilen daireyi tahliye etmenizi ihtar ederiz.

Tahliye gerçekleşmediği takdirde, yasal haklarımızın tamamını saklı tutarak tahliye davası ve ilgili tüm hukuki yollara başvurulacaktır.

Bilgilerinize sunarız.

Saygılarımızla,

[YÖNETİCİ AD SOYAD]
[BİNA ADI] Apartmanı Yöneticisi
Tel: [TELEFON]
İmza:

NOT: Bu ihbarname noter aracılığıyla veya iadeli taahhütlü posta ile gönderilmelidir.`,
  },
  {
    id: 6,
    baslik: "Genel Kurul Karar Defteri",
    kategori: "Toplanti",
    icerik: `GENEL KURUL KARAR DEFTERİ

[BİNA ADI] APARTMANI
KARAR DEFTERİ

Defter No: [DEFTER NO]
Sayfa No: [SAYFA NO]

---

KARAR NO: [KARAR NO]
KARAR TARİHİ: [TARİH]
TOPLANTI TARİHİ: [TOPLANTI TARİHİ]
TOPLANTI TÜRÜ: [ ] Olağan  [ ] Olağanüstü

TOPLANTIYA KATILAN KAT MALİKLERİ:
Toplam Kat Maliki: [TOPLAM SAYI]
Katılan: [KATILAN SAYI]
Vekaletle: [VEKALET SAYISI]
Toplantı Yeter Sayısı: [ ] Sağlandı  [ ] Sağlanamadı (İkinci toplantıya ertelendi)

KARAR KONUSU:
[KARAR KONUSU]

KARAR METNİ:
[KARAR METNİ DETAYLI AÇIKLAMA]

Yapılan müzakereler sonucunda;

Lehte oy: [LEHTE OY SAYISI]
Aleyhte oy: [ALEYHTE OY SAYISI]
Çekimser: [ÇEKİMSER SAYISI]

ile [KABUL EDİLMİŞTİR / REDDEDİLMİŞTİR].

UYGULAMA:
Sorumlu: [SORUMLU KİŞİ/BİRİM]
Süre: [UYGULAMA SÜRESİ]
Bütçe: [ÖNGÖRÜLEN BÜTÇE] TL

İMZALAR:

Yönetici: [AD SOYAD] _______________
Denetçi: [AD SOYAD] _______________
Divan Başkanı: [AD SOYAD] _______________

---

Bu karar 634 sayılı Kat Mülkiyeti Kanunu'nun 32. ve 34. maddeleri uyarınca alınmıştır.`,
  },
  {
    id: 7,
    baslik: "Tadilat Izin Belgesi",
    kategori: "Yonetim",
    icerik: `TADİLAT İZİN BELGESİ

[BİNA ADI] APARTMANI YÖNETİMİ

Belge No: [BELGE NO]
Tarih: [TARİH]

BAŞVURU SAHİBİ BİLGİLERİ:
Ad Soyad: [AD SOYAD]
Daire No: [DAİRE NO]
Telefon: [TELEFON]
E-posta: [E-POSTA]
Malik / Kiracı: [ ] Malik  [ ] Kiracı

TADİLAT DETAYLARI:
Tadilat Türü: [ ] Boya/Badana  [ ] Banyo/Mutfak  [ ] Zemin Döşeme  [ ] Tesisat
              [ ] Elektrik  [ ] Duvar Yıkma/Örme  [ ] Balkon  [ ] Diğer: [BELİRTİNİZ]

Tahmini Başlangıç Tarihi: [BAŞLANGIÇ TARİHİ]
Tahmini Bitiş Tarihi: [BİTİŞ TARİHİ]
Tahmini Süre: [SÜRE] gün

Yapılacak İşlerin Detayı:
[TADİLAT İŞLERİNİN DETAYLI AÇIKLAMASI]

Taşeron/Usta Bilgileri:
Firma/Kişi Adı: [FİRMA ADI]
Yetkili: [YETKİLİ AD SOYAD]
Telefon: [TELEFON]

ŞARTLAR VE TAAHHÜTLER:
1. Tadilat çalışmaları hafta içi 09:00-18:00, Cumartesi 10:00-16:00 saatleri arasında yapılacaktır.
2. Pazar ve resmi tatil günlerinde çalışma yapılmayacaktır.
3. Ortak alanlara zarar verilmeyecek, kullanılan alanlar günlük temizlenecektir.
4. Moloz ve inşaat atıkları aynı gün binadan uzaklaştırılacaktır.
5. Asansör kullanımı için yönetim ile koordinasyon sağlanacaktır.
6. Binanın taşıyıcı elemanlarına müdahale edilmeyecektir.
7. Komşu dairelere su basması, toz, gürültü gibi olumsuzluklara karşı önlem alınacaktır.
8. Oluşabilecek her türlü hasardan başvuru sahibi sorumludur.

ONAY:

Başvuru Sahibi: [AD SOYAD]     İmza: _______________     Tarih: [TARİH]

Yönetici: [AD SOYAD]           İmza: _______________     Tarih: [TARİH]

[ ] ONAYLANDI    [ ] REDDEDİLDİ

Red Gerekçesi (varsa): [GEREKÇE]`,
  },
  {
    id: 8,
    baslik: "Kapici Is Sozlesmesi",
    kategori: "Sozlesme",
    icerik: `KAPICI İŞ SÖZLEŞMESİ

Tarih: [TARİH]

TARAFLAR:

İŞVEREN:
[BİNA ADI] Apartmanı Yönetimi adına
Yönetici: [YÖNETİCİ AD SOYAD]
Adres: [ADRES]
Vergi Dairesi / No: [VERGİ DAİRESİ] / [VERGİ NO]

İŞÇİ:
Ad Soyad: [KAPICI AD SOYAD]
T.C. Kimlik No: [TC KİMLİK NO]
Adres: [ADRES]
Telefon: [TELEFON]

MADDE 1 - SÖZLEŞMENİN KONUSU
Bu sözleşme, [BİNA ADI] apartmanında kapıcı (apartman görevlisi) olarak çalışacak olan [KAPICI AD SOYAD] ile apartman yönetimi arasındaki iş ilişkisini düzenler.

MADDE 2 - SÜRE
Sözleşme [BAŞLANGIÇ TARİHİ] tarihinde başlar. [ ] Belirsiz süreli  [ ] [BİTİŞ TARİHİ] tarihine kadar belirli süreli

MADDE 3 - ÇALIŞMA SAATLERİ
Günlük çalışma süresi 7,5 saattir. Haftalık çalışma süresi 45 saati geçemez.
Çalışma Saatleri: [BAŞLANGIÇ SAATİ] - [BİTİŞ SAATİ]
Hafta tatili: [GÜN]

MADDE 4 - ÜCRET
Aylık brüt ücret: [ÜCRET] TL
Ödeme günü: Her ayın [GÜN]. günü
Ödeme şekli: [ ] Banka havalesi  [ ] Elden

MADDE 5 - LOJMAN
[ ] İşçiye lojman tahsis edilmiştir.
    Lojman adresi: [LOJMAN ADRESİ]
    Lojman kullanım şartları: İş sözleşmesi sona erdiğinde [SÜRE] gün içinde tahliye edilecektir.
[ ] Lojman tahsis edilmemiştir.

MADDE 6 - GÖREVLERİ
a) Bina ortak alanlarının günlük temizliği
b) Çöplerin toplanması ve çöp alanına taşınması
c) Bahçe bakımı ve sulama
d) Kış aylarında kar ve buz temizliği
e) Kalorifer/kazan dairesinin işletilmesi (varsa)
f) Bina güvenliğinin sağlanması
g) Tesisatla ilgili küçük onarımlar
h) Yöneticinin vereceği diğer bina ile ilgili görevler

MADDE 7 - SOSYAL HAKLAR
a) SGK primi işveren tarafından yatırılır.
b) Yıllık izin hakları 4857 sayılı İş Kanunu hükümlerine tabidir.
c) Ulusal bayram ve genel tatil günlerinde çalışma halinde yasal ücret uygulanır.

MADDE 8 - FESİH
Sözleşmenin feshi, 4857 sayılı İş Kanunu hükümlerine tabidir. Bildirim süreleri kanuni düzenlemelere uygun olarak uygulanır.

MADDE 9 - DİĞER HÜKÜMLER
a) Bu sözleşmede yer almayan konularda 4857 sayılı İş Kanunu ve ilgili mevzuat hükümleri uygulanır.
b) Sözleşmeden doğan uyuşmazlıklarda [ŞEHİR] Mahkemeleri ve İcra Daireleri yetkilidir.

İşbu sözleşme [TARİH] tarihinde iki nüsha olarak düzenlenmiş ve taraflarca imzalanmıştır.

İŞVEREN                              İŞÇİ
[YÖNETİCİ AD SOYAD]                  [KAPICI AD SOYAD]
İmza: _______________                İmza: _______________`,
  },
];

export default function HukukiSablonlarPage() {
  const { data: _session } = useSession();
  const { t: _t } = useTranslation();
  void _session; void _t;
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopy = async (icerik: string, baslik: string) => {
    try {
      await navigator.clipboard.writeText(icerik);
      toast.success(`"${baslik}" sablonu panoya kopyalandi`);
    } catch {
      toast.error("Kopyalama basarisiz oldu");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Scale className="h-7 w-7 text-primary" />
          Hukuki Sablonlar
        </h1>
        <p className="text-muted-foreground mt-1">
          Apartman yonetimi icin hazir hukuki belge sablonlari
        </p>
      </div>

      {/* Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Toplam Sablon</p>
              <p className="text-2xl font-bold">{sablonlar.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates */}
      <div className="space-y-3">
        {sablonlar.map((sablon) => (
          <Card key={sablon.id}>
            <CardHeader
              className="cursor-pointer select-none"
              onClick={() => toggleExpand(sablon.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">{sablon.baslik}</CardTitle>
                  <Badge
                    variant="secondary"
                    className={kategorRenkleri[sablon.kategori] || ""}
                  >
                    {sablon.kategori}
                  </Badge>
                </div>
                {expandedIds.has(sablon.id) ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            {expandedIds.has(sablon.id) && (
              <CardContent>
                <div className="space-y-4">
                  <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm font-mono leading-relaxed overflow-x-auto">
                    {sablon.icerik}
                  </pre>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(sablon.icerik, sablon.baslik)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Kopyala
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
