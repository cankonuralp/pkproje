/* Uçtan uca testlerin UYDURMA firması ve hesapları — yalnız scripts/e2e-sunucu.ts'in açtığı GEÇİCİ veritabanına yazılır (test bitince silinir).
   Gerçek kişi / firma değildir (CLAUDE.md §7); parola yalnız bu geçici veritabanı içindir, yayında böyle bir hesap yoktur. */
export const E2E_FIRMA = { kisaAd: "deneme", ad: "Deneme Muayene", raporKodu: "DM", baskaKisaAd: "baska" } as const;
export const E2E_PAROLA = "deneme-parola-2026";
export const E2E_HESAPLAR = {
  yonetici: { eposta: "yonetici@deneme.example", ad: "Deneme Yönetici", roller: ["firma_yoneticisi"] },
  denetci: { eposta: "denetci@deneme.example", ad: "Deneme Denetçi", roller: ["denetci"] },
  muhasebe: { eposta: "muhasebe@deneme.example", ad: "Deneme Muhasebe", roller: ["muhasebe"] },
  kilit: { eposta: "kilit@deneme.example", ad: "Deneme Kilit", roller: ["planlama"] },
  /* Onaylar (314): mekanik branş yöneticisi — Hava tankı (mekanik) raporlarını onaylar / geri gönderir */
  mekanik: { eposta: "mekanik@deneme.example", ad: "Deneme Mekanik", roller: ["mekanik_yonetici"] },
} as const;
/* geçici parolayla ilk giriş (durum "ilk"): her proje (genişlik) kendi hesabını değiştirir — testler birbirinin parolasını bozmasın */
export const E2E_ILK = ["masaustu", "tablet", "telefon"].map((p) => ({ eposta: `ilk-${p}@deneme.example`, ad: "Deneme İlk Giriş", roller: ["denetci"] }));
export const E2E_KAPI = 3100;
/* plan aç (309): her firmaya tohumlanan uydurma müşteri ve tesis (scripts/e2e-sunucu.ts); plan içi (310) ayrı tesiste — ekipman ekler, öteki testin
   ekipman sayısını bozmasın; saha raporu (311) üçüncü tesiste — her proje kendi planını açar, rapor plan × ekipman başına tek */
export const E2E_PLAN = { musteri: "Deneme Plan Sanayi A.Ş.", tesis: "Merkez Fabrika", tesisIci: "İç Fabrika", tesisSaha: "Saha Tesisi",
  /* müşteri paneli (319): müşterinin e-postası = ana girişin kullanıcı adı (uydurma) */
  musteriEposta: "plan@deneme-musteri.example" } as const;
/* saha raporu (311): Saha Tesisi'nin ekipmanı (tür HT · Hava tankı, yayında format = hazır şablon KOMPRESOR), türün gerekli ölçüm cihazı türü ve
   denetçinin zimmetindeki, kalibrasyonu geçerli uydurma cihaz */
export const E2E_SAHA = { ekipman: "HT-0201", tur: "Hava tankı", cihazTuru: "Manometre", cihaz: "MN-01", marka: "Deneme", model: "M1", seri: "S-001" } as const;
/* muhasebe (327): ayrı tesis; her projenin tamamlanmış planı (bir imzalı rapor, fiyat listesinden 900,00 TL) ve kaydedeceği fatura numarası */
export const E2E_MUHASEBE = {
  tesis: "Muhasebe Tesisi",
  plan: { masaustu: "P-0125-901", tablet: "P-0125-902", telefon: "P-0125-903" },
  fatura: { masaustu: "DMF2026000000901", tablet: "DMF2026000000902", telefon: "DMF2026000000903" },
} as const;
/* fotoğraftan okuma (351): AYRI uydurma firma (öteki testlerin plan / rapor sayılarına dokunmasın) — yapay zekâ açık, anahtarı uydurma; test sunucusu
   yerel bir Anthropic taklidi açar (PROBATA_YZ_UC), gerçek hizmete istek gitmez. Her proje kendi ekipmanının raporunda okur. */
export const E2E_YZ = {
  firma: { kisaAd: "yzdeneme", ad: "YZ Deneme Muayene", raporKodu: "YZ" },
  yonetici: { eposta: "yonetici@yzdeneme.example", ad: "YZ Yönetici" },
  planlama: { eposta: "planlama@yzdeneme.example", ad: "YZ Planlama" },
  denetci: { eposta: "denetci@yzdeneme.example", ad: "YZ Denetçi" },
  anahtar: "sk-ant-e2e-deneme-anahtar-0001",
  tesis: "YZ Tesisi",
  ekipman: { masaustu: "EP-0301", tablet: "EP-0302", telefon: "EP-0303" } as Record<string, string>,
  /* saklama süresi (387): ayrı tesiste, süresi 10 gün sonra dolacak imzalı rapor (Uyarılar + Firma ayarları › Saklama süresi dolacak raporlar) */
  saklama: { tesis: "YZ Arşiv Tesisi", ekipman: "EP-0950", plan: "P-0121-950", rapor: "YZ-0121-950-00001" },
} as const;
/* gece işi (378): uçtan uca sunucunun zamanlayıcı sırrı — UYDURMA, yalnız geçici test sunucusunda (yayında Vercel ortam değişkeni CRON_SECRET) */
export const E2E_ZAMANLI_SIR = "e2e-zamanli-is-sirri-uydurma-0000000001";
/* yönetim (348): yönetim adresi ve uydurma yöneticiler (yalnız geçici test veritabanı). Doğrulama anahtarı uydurma Base32; test kodu onunla üretir.
   347–348 incelemesi: üç genişlik tek sunucuda da koşabilsin (yerelde `npm run test:e2e`) — her proje KENDİ "ilk" ve kurulmuş yöneticisini ve kendi
   açacağı firmayı kullanır (E2E_ILK gibi); kurulmuş yönetici de proje başına (aynı zaman adımındaki kod yeniden oynatma sayılmasın). */
const YONETIM_EK = { masaustu: "a", tablet: "b", telefon: "c" } as const;
export const E2E_YONETIM_PROJELER = Object.keys(YONETIM_EK) as (keyof typeof YONETIM_EK)[];
export const E2E_YONETIM = {
  alan: "yonetim.localhost",
  hazirla: "hazirla@probata-yonetim.example",
  anahtar: "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP",
  geciciParola: "Gecici-yonetim-2026",
  yeniParola: "yonetim-yeni-parola-2026",
  proje: (p: string) => {
    const ek = YONETIM_EK[p as keyof typeof YONETIM_EK] ?? "x";
    return {
      ilk: `ilk-${p}@probata-yonetim.example`,
      etkin: `etkin-${p}@probata-yonetim.example`,
      firma: { unvan: "Yeni Muayene Deneme Ltd. Şti.", alt: `yenideneme${ek}`, kod: `Y${ek.toUpperCase()}`, yon: "Yeni Deneme Yöneticisi", eposta: `yonetici@yenideneme${ek}.example` },
    };
  },
};
