/* KURULUM HATASININ SINIFI (FIRMA-VT §5.12; FV10 — 2026-10-16) — yalnız sunucuda (Yönetim API istemcisinin hata türlerini tanır). Yeniden denenen: 429,
   5xx, bağlantı, zaman aşımı, henüz geçmeyen parola; kalıcı ("Sürdür" ister): 402 ödeme, 401/403 yetki, biçim, sertifika, izin dışı sunucu, göç,
   INIT_FAILED, öteki SQL hataları. */
import { BicimHatasi, YonetimHatasi } from "../../../server/dis/supabase-yonetim.ts";
import type { KurulumHatasi } from "../kurulum-adim.ts";

const kodu = (h: unknown): string | undefined => {
  const k = h && typeof h === "object" ? (h as { code?: unknown }).code : undefined;
  return typeof k === "string" && /^[A-Z0-9_]{2,40}$/.test(k) ? k : undefined;
};
export function hataSinifi(h: unknown): KurulumHatasi {
  if (h instanceof YonetimHatasi) {
    if (h.durum === 429) return { sinif: "yeniden", kod: "oran_siniri" };
    if (h.durum >= 500) return { sinif: "yeniden", kod: "sunucu" };
    if (h.durum === 402) return { sinif: "kalici", kod: "odeme" };
    if (h.durum === 401 || h.durum === 403) return { sinif: "kalici", kod: "yetki" };
    if (h.kod) return { sinif: "kalici", kod: `sql_${h.kod.toLowerCase()}` };
    return { sinif: "kalici", kod: `istek_${h.durum}` };
  }
  if (h instanceof BicimHatasi) return { sinif: "kalici", kod: "bicim" };
  const k = kodu(h);
  if (k && /^(ECONNREFUSED|ECONNRESET|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|EHOSTUNREACH|ENETUNREACH|57P01|57P03|53300)$/.test(k)) return { sinif: "yeniden", kod: "baglanti" };
  if (k === "28P01") return { sinif: "yeniden", kod: "parola" };
  if (k && /CERT|TLS|SSL/.test(k)) return { sinif: "kalici", kod: "sertifika" };
  if (k && /^[0-9A-Z]{5}$/.test(k)) return { sinif: "kalici", kod: `vt_${k.toLowerCase()}` };
  const ileti = h instanceof Error ? h.message : "";
  if (/izin listesinde|yerel adres/.test(ileti)) return { sinif: "kalici", kod: "sunucu_izin" };
  if (/göç|değiştirilmiş|koddan ileride/i.test(ileti)) return { sinif: "kalici", kod: "goc" };
  if (/proje açılamadı|INIT_FAILED/i.test(ileti)) return { sinif: "kalici", kod: "init_failed" };
  if (/timeout|zaman|abort/i.test(ileti)) return { sinif: "yeniden", kod: "zaman" };
  return { sinif: "yeniden", kod: "bilinmeyen" };
}
