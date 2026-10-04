/* YETKİ TANIMI — tek kaynak (KOD-GECIS §4 · 07 · anayasa 7.1 "rol aynaları"). Rol listesi, başlangıç düzeyi tablosu ve özel eylemler BURADA;
   veritabanındaki rol CHECK'i (0002_giris.sql) ve maketin matrisi (docs/assets/maket-veri.js MV.MATRIS) ayna testiyle buna bağlı
   (tests/yetki.test.ts). Bu dosya istemciye de gidebilir (tuşu çizmek için) ama KARAR her istekte sunucuda canDo ile verilir (09-E4). */

export const ROLLER = ["planlama", "denetci", "mekanik_yonetici", "elektrik_yonetici", "firma_yoneticisi", "muhasebe"] as const;
export type Rol = (typeof ROLLER)[number];

/** düzey: yaz (görür ve değiştirir) · gor (görür) · brans (yalnız kendi branşı) · kendi (yalnız kendi kayıtları) · yok — maketle aynı adlar */
export const DUZEYLER = ["yok", "kendi", "brans", "gor", "yaz"] as const;
export type Duzey = (typeof DUZEYLER)[number];

/** modül anahtarı: modül kaydındaki §3.1 numarası (src/modules/moduller.ts) + 7 (ekipman, planın içinde) + 10 (eğitimler) + hareket kaydı */
export type ModulAnahtari = 2 | 3 | 4 | 5 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 18 | 19 | 20 | 21 | 22 | 23 | "hareket";
export type Matris = Record<ModulAnahtari, readonly Duzey[]>;

/** başlangıç düzeni (reisim 2026-09-25, 32) — sıra ROLLER ile aynı: planlama · denetçi · mek. yön. · elk. yön. · firma yön. · muhasebe */
export const MATRIS_ONERI: Matris = {
  13: ["yaz", "kendi", "gor", "gor", "yaz", "yok"], 14: ["gor", "kendi", "brans", "brans", "gor", "yok"], 15: ["yok", "yok", "brans", "brans", "gor", "yok"],
  20: ["gor", "kendi", "gor", "gor", "gor", "yok"], 3: ["yaz", "gor", "gor", "gor", "yaz", "gor"], 11: ["yaz", "yok", "gor", "gor", "yaz", "gor"],
  12: ["yaz", "kendi", "gor", "gor", "yaz", "gor"], 7: ["yaz", "yaz", "gor", "gor", "yaz", "yok"], 8: ["gor", "kendi", "yaz", "yaz", "yaz", "yok"],
  9: ["gor", "kendi", "yaz", "yaz", "yaz", "yok"], 2: ["gor", "kendi", "gor", "gor", "yaz", "yok"], 10: ["gor", "kendi", "yaz", "yaz", "yaz", "yok"],
  18: ["yok", "yok", "yok", "yok", "yaz", "yaz"], 19: ["gor", "kendi", "brans", "brans", "gor", "yok"], 5: ["gor", "gor", "yaz", "yaz", "yaz", "yok"],
  4: ["gor", "gor", "yaz", "yaz", "yaz", "yok"], 21: ["kendi", "kendi", "kendi", "kendi", "yaz", "kendi"], 22: ["yok", "yok", "yok", "yok", "yaz", "yok"],
  23: ["gor", "kendi", "gor", "gor", "yaz", "yok"], hareket: ["yok", "yok", "yok", "yok", "gor", "yok"],
};

/** firma yöneticisinin kendini kilitleyemeyeceği satırlar (rol yetkilerini değiştirse bile): Personel, Firma ayarları, Hareket kaydı */
export const SABIT: Partial<Record<ModulAnahtari, Partial<Record<Rol, Duzey>>>> = {
  2: { firma_yoneticisi: "yaz" }, 22: { firma_yoneticisi: "yaz" }, hareket: { firma_yoneticisi: "gor" },
};

/** branş yöneticisinin branşı: m mekanik · e elektrik */
export const ROL_BRANS: Partial<Record<Rol, "m" | "e">> = { mekanik_yonetici: "m", elektrik_yonetici: "e" };

/** ekranda rol adı (maket MV.ROLLER "ad") */
export const ROL_ADI: Record<Rol, string> = {
  planlama: "Planlama ekibi", denetci: "Denetçi", mekanik_yonetici: "Mekanik yönetici", elektrik_yonetici: "Elektrik yönetici",
  firma_yoneticisi: "Firma yöneticisi", muhasebe: "Muhasebe",
};
