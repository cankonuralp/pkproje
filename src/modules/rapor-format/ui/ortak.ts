/* Rapor formatı ekranlarının ortak parçaları (sunucu ve istemci bileşenleri aynı adları kullanır) */
import type { RozetTuru } from "../../../components/sayfa/Sayfa";
import type { FormatDurumu, FormatOzeti } from "../server/formatlar";

export const tarihYaz = (iso: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join(".") : "—");
export const DURUM_ROZET: Record<FormatDurumu, readonly [RozetTuru, string]> = { taslak: ["bekliyor", "Taslak"], yayinda: ["tamam", "Yayında"], eski: ["notr", "Eski"] };
/** blok adları (maket MV.FORMAT_BLOK) */
export const BLOK_ADI = {
  bilgi: "Bilgi alanları", liste: "Kontrol listesi", olcum: "Ölçüm tablosu", test: "Test değerleri", cihaz: "Ölçüm cihazları",
  foto: "Fotoğraflar", kusur: "Kusur açıklamaları", sonuc: "Sonuç ve kanaat", not: "Not / yorum", imza: "İmza alanları",
} as const;
/** "Taslak" ya da "Sürüm N" */
export const surumAdi = (x: Pick<FormatOzeti, "sira">) => (x.sira === null ? "Taslak" : `Sürüm ${x.sira}`);
