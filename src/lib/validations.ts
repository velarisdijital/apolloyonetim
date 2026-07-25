import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(1, "Şifre gereklidir"),
});

export const giderSchema = z.object({
  aciklama: z.string().min(1, "Açıklama gereklidir"),
  tutar: z.number().positive("Tutar sıfırdan büyük olmalıdır"),
  kategori: z.enum([
    "ELEKTRIK", "SU", "DOGALGAZ", "TEMIZLIK", "BAKIM",
    "TAMIRAT", "ASANSOR", "SIGORTA", "PERSONEL", "DIGER",
  ]),
  tarih: z.string().min(1, "Tarih gereklidir"),
  fisYolu: z.string().optional(),
  fisAdi: z.string().optional(),
});

export const aidatSchema = z.object({
  ay: z.number().min(1).max(12),
  yil: z.number().min(2020).max(2100),
  tutarKisi: z.number().positive("Tutar sıfırdan büyük olmalıdır"),
  aciklama: z.string().optional(),
  sonOdemeTarihi: z.string().min(1, "Son ödeme tarihi gereklidir"),
});

export const odemeSchema = z.object({
  duesItemId: z.string().min(1, "Aidat kalemi gereklidir"),
  tutar: z.number().positive("Tutar sıfırdan büyük olmalıdır"),
  aciklama: z.string().optional(),
  apartmentId: z.string().min(1),
  userId: z.string().optional(),
});

export const toplantiSchema = z.object({
  baslik: z.string().min(1, "Başlık gereklidir"),
  tarih: z.string().min(1, "Tarih gereklidir"),
  icerik: z.string().min(1, "İçerik gereklidir"),
  katilimcilar: z.string().optional(),
});

export const oylamaSchema = z.object({
  soru: z.string().min(1, "Soru gereklidir"),
  secenekler: z.array(z.string().min(1)).min(2, "En az 2 seçenek gereklidir"),
  bitisTarihi: z.string().min(1, "Bitiş tarihi gereklidir"),
});

export const duyuruSchema = z.object({
  baslik: z.string().min(1, "Başlık gereklidir"),
  icerik: z.string().min(1, "İçerik gereklidir"),
  onemli: z.boolean().optional(),
});

export const rezervasyonSchema = z.object({
  tarih: z.string().min(1, "Tarih gereklidir"),
  baslangicSaati: z.number().min(0).max(23),
  bitisSaati: z.number().min(1).max(24),
  aciklama: z.string().optional(),
  ortakAlanId: z.string().optional(),
});

export const arizaSchema = z.object({
  baslik: z.string().min(1, "Başlık gereklidir"),
  aciklama: z.string().min(1, "Açıklama gereklidir"),
  konum: z.string().min(1, "Konum gereklidir"),
  oncelik: z.enum(["DUSUK", "NORMAL", "YUKSEK", "ACIL"]).optional(),
  fotograflar: z.array(z.string()).optional(),
  tahminiMaliyet: z.number().positive().optional(),
});

export const kullaniciSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  ad: z.string().min(1, "Ad gereklidir"),
  soyad: z.string().min(1, "Soyad gereklidir"),
  telefon: z.string().optional(),
  rol: z.enum(["MASTER_ADMIN", "KAPICI", "DENETCI", "EV_SAHIBI", "KIRACI"]),
  apartmentId: z.string().optional(),
});
