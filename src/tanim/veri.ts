/* SABİT TANIMLARIN VERİSİ ve şemaları — saf (tarayıcıya da gider: formların seçenekleri buradan). Karma adlı dosyalar ve uç: tanimlar.ts (sunucu).
   İçerik onaylı maketten ve onaylı kararlardan; alan bilgisi uydurulmaz. */
import { z } from "../sema/ortak.ts";

const durum = z.object({ ad: z.string().min(1), rozet: z.enum(["bekliyor", "kabul", "denetimde", "tamam", "red", "notr"]) });

export const TANIM_SEMALARI = {
  /** plan ve rapor durum adları (maket MV.PLAN_DURUM, MV.RAPOR_DURUM; KOD-GECIS §5) */
  durumlar: z.object({ plan: z.record(z.string().regex(/^[a-z]+$/), durum), rapor: z.record(z.string().regex(/^[a-z]+$/), durum) }),
  /** Ek-III grupları + "Diğer (Ek-III dışı)" (pkproje §4.6, maket MV.GRUPLAR) */
  ek3_gruplari: z.array(z.object({ k: z.string().regex(/^[a-z]+$/), ad: z.string().min(1), b: z.enum(["m", "e"]).nullable() })),
  /** meslekler ve izin verdikleri Ek-III grupları — yürürlükteki Ek-III metninden (pkproje §4.6; maket MV.MESLEKLER). "Teknisyen" yetkili kişi OLAMAZ. */
  meslekler: z.array(z.object({ k: z.string().regex(/^[a-z-]+$/), ad: z.string().min(1), b: z.enum(["m", "e", ""]), g: z.array(z.string()) })),
  /** sigorta açma eğrisi çarpanları (KOD-GECIS §8: B 5 · C 10 · D 15) */
  egri_carpanlari: z.record(z.enum(["B", "C", "D"]), z.number().int().positive()),
  /** yasal mesai sınırları (KOD-GECIS §7, AA2): günlük en çok 660 dk, yıllık fazla çalışma en çok 270 saat */
  mesai_sinirlari: z.object({ gunluk_ust_dk: z.literal(660), yillik_fazla_saat: z.literal(270) }),
  /** resmî tatiller (417; KOD-GECIS Y9 — izin iş günü hesabı): 2429 sayılı Ulusal Bayram ve Genel Tatiller Hakkında Kanun'un sabit günleri (ay-gün) +
      dini bayramlar yıl yıl, Diyanet dini günler takviminden (vakithesaplama / mobil.diyanet.gov.tr; her yıl eklenir — listede olmayan yılın bayramı
      tatil sayılmaz). Yarım günler (arife, 28 Ekim öğleden sonra) iş günü sayılır. */
  resmi_tatiller: z.object({
    sabit: z.array(z.object({ gun: z.string().regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/), ad: z.string().min(1) })),
    dini: z.array(z.object({ yil: z.number().int().min(2026), ad: z.enum(["Ramazan Bayramı", "Kurban Bayramı"]), gunler: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(3).max(4) })),
  }),
} as const;
export type TanimAdi = keyof typeof TANIM_SEMALARI;

export const TANIMLAR: { [A in TanimAdi]: z.infer<(typeof TANIM_SEMALARI)[A]> } = {
  durumlar: {
    plan: {
      bekliyor: { ad: "Kabul bekliyor", rozet: "bekliyor" }, kabul: { ad: "Kabul edildi", rozet: "kabul" },
      denetimde: { ad: "Denetimde", rozet: "denetimde" }, tamam: { ad: "Tamamlandı", rozet: "tamam" }, red: { ad: "Reddedildi", rozet: "red" },
    },
    rapor: {
      taslak: { ad: "Yeni", rozet: "bekliyor" }, geri: { ad: "Yeni", rozet: "bekliyor" }, onayda: { ad: "Teknik yönetici onayında", rozet: "kabul" },
      onaylandi: { ad: "Muayene uzmanı imzası", rozet: "denetimde" }, imzada: { ad: "İmzaya gönderildi", rozet: "notr" }, imzali: { ad: "Tamamlandı", rozet: "tamam" },
    },
  },
  ek3_gruplari: [
    { k: "basincli", ad: "Basınçlı kap ve tesisatlar", b: "m" }, { k: "kaldirma", ad: "Kaldırma ve iletme", b: "m" },
    { k: "iskele", ad: "İskeleler", b: "m" }, { k: "diger", ad: "Diğer tesisatlar, tezgâhlar, iş makineleri", b: "m" },
    { k: "elektrik", ad: "Elektrik tesisatları", b: "e" }, { k: "ekdisi", ad: "Diğer (Ek-III dışı)", b: null },
  ],
  meslekler: [
    { k: "mak-muh", ad: "Makine mühendisi", b: "m", g: ["basincli", "kaldirma", "iskele", "diger"] },
    { k: "met-muh", ad: "Metalürji ve malzeme mühendisi", b: "m", g: ["basincli", "kaldirma", "diger"] },
    { k: "mkt-muh", ad: "Mekatronik mühendisi", b: "m", g: ["basincli", "kaldirma", "diger"] },
    { k: "ima-muh", ad: "İmalat mühendisi", b: "m", g: ["basincli", "kaldirma", "diger"] },
    { k: "kim-muh", ad: "Kimya mühendisi", b: "m", g: ["basincli"] },
    { k: "uca-muh", ad: "Uçak mühendisi", b: "m", g: ["basincli"] },
    { k: "ins-muh", ad: "İnşaat mühendisi", b: "m", g: ["iskele"] },
    { k: "mak-tek", ad: "Makine teknikeri", b: "m", g: ["basincli", "kaldirma", "diger"] },
    { k: "mak-ytek", ad: "Makine yüksek teknikeri", b: "m", g: ["basincli", "kaldirma", "diger"] },
    { k: "ins-tek", ad: "İnşaat teknikeri", b: "m", g: ["iskele"] },
    { k: "tog-mak", ad: "Teknik öğretmen (makine / metal eğitimi)", b: "m", g: ["basincli", "kaldirma", "iskele", "diger"] },
    { k: "tog-ins", ad: "Teknik öğretmen (inşaat / yapı eğitimi)", b: "m", g: ["iskele"] },
    { k: "elk-muh", ad: "Elektrik mühendisi", b: "e", g: ["elektrik"] },
    { k: "ee-muh", ad: "Elektrik-elektronik mühendisi", b: "e", g: ["elektrik"] },
    { k: "tog-elk", ad: "Teknik öğretmen (elektrik eğitimi)", b: "e", g: ["elektrik"] },
    { k: "elk-tek", ad: "Elektrik teknikeri", b: "e", g: ["elektrik"] },
    { k: "elk-ytek", ad: "Elektrik yüksek teknikeri", b: "e", g: ["elektrik"] },
    { k: "teknisyen", ad: "Teknisyen", b: "", g: [] },
    { k: "diger", ad: "Diğer meslek", b: "", g: [] },
  ],
  egri_carpanlari: { B: 5, C: 10, D: 15 },
  mesai_sinirlari: { gunluk_ust_dk: 660, yillik_fazla_saat: 270 },
  resmi_tatiller: {
    sabit: [
      { gun: "01-01", ad: "Yılbaşı" }, { gun: "04-23", ad: "Ulusal Egemenlik ve Çocuk Bayramı" }, { gun: "05-01", ad: "Emek ve Dayanışma Günü" },
      { gun: "05-19", ad: "Atatürk'ü Anma, Gençlik ve Spor Bayramı" }, { gun: "07-15", ad: "Demokrasi ve Millî Birlik Günü" },
      { gun: "08-30", ad: "Zafer Bayramı" }, { gun: "10-29", ad: "Cumhuriyet Bayramı" },
    ],
    dini: [
      { yil: 2026, ad: "Ramazan Bayramı", gunler: ["2026-03-20", "2026-03-21", "2026-03-22"] },
      { yil: 2026, ad: "Kurban Bayramı", gunler: ["2026-05-27", "2026-05-28", "2026-05-29", "2026-05-30"] },
      { yil: 2027, ad: "Ramazan Bayramı", gunler: ["2027-03-09", "2027-03-10", "2027-03-11"] },
      { yil: 2027, ad: "Kurban Bayramı", gunler: ["2027-05-16", "2027-05-17", "2027-05-18", "2027-05-19"] },
      { yil: 2028, ad: "Ramazan Bayramı", gunler: ["2028-02-26", "2028-02-27", "2028-02-28"] },
      { yil: 2028, ad: "Kurban Bayramı", gunler: ["2028-05-05", "2028-05-06", "2028-05-07", "2028-05-08"] },
    ],
  },
};

