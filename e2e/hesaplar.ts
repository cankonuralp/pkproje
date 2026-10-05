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
export const E2E_PLAN = { musteri: "Deneme Plan Sanayi A.Ş.", tesis: "Merkez Fabrika", tesisIci: "İç Fabrika", tesisSaha: "Saha Tesisi" } as const;
/* saha raporu (311): Saha Tesisi'nin ekipmanı (tür HT · Hava tankı, yayında format = hazır şablon KOMPRESOR), türün gerekli ölçüm cihazı türü ve
   denetçinin zimmetindeki, kalibrasyonu geçerli uydurma cihaz */
export const E2E_SAHA = { ekipman: "HT-0201", tur: "Hava tankı", cihazTuru: "Manometre", cihaz: "MN-01", marka: "Deneme", model: "M1", seri: "S-001" } as const;
