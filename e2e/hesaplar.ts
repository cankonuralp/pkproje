/* Uçtan uca testlerin UYDURMA firması ve hesapları — yalnız scripts/e2e-sunucu.ts'in açtığı GEÇİCİ veritabanına yazılır (test bitince silinir).
   Gerçek kişi / firma değildir (CLAUDE.md §7); parola yalnız bu geçici veritabanı içindir, yayında böyle bir hesap yoktur. */
export const E2E_FIRMA = { kisaAd: "deneme", ad: "Deneme Muayene", raporKodu: "DM", baskaKisaAd: "baska" } as const;
export const E2E_PAROLA = "deneme-parola-2026";
export const E2E_HESAPLAR = {
  yonetici: { eposta: "yonetici@deneme.example", ad: "Deneme Yönetici", roller: ["firma_yoneticisi"] },
  denetci: { eposta: "denetci@deneme.example", ad: "Deneme Denetçi", roller: ["denetci"] },
  muhasebe: { eposta: "muhasebe@deneme.example", ad: "Deneme Muhasebe", roller: ["muhasebe"] },
  kilit: { eposta: "kilit@deneme.example", ad: "Deneme Kilit", roller: ["planlama"] },
} as const;
export const E2E_KAPI = 3100;
