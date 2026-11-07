/* PROBATA SIGN GÖMÜLÜ PENCERE — SAF (2026-11-07; sign bağlantı rehberi §4, §7). Tarayıcıda çalışır, sunucu modülü içe aktarmaz.
   · GOMULU_IZIN: iframe'in allow özniteliği — rehberle AYNEN (USB e-imza imzacının bilgisayarındaki uygulamayla 127.0.0.1'de konuşur; Chrome'un
     yerel ağ izni çerçevede bu özniteliği ister; eski ve yeni adlar, tanımayan tarayıcı yok sayar). Eksikse imza uygulamasına ulaşılamaz.
   · signHaberi: window "message" olayından YALNIZ beklenen kökenden (açılan gömülü adresin kökeni — sign'ın firma adresi; sabit yazılmaz) ve
     kaynak "probata-sign" olan haberi alır: hazir · imzalandi · reddedildi · kapali · toplu_bitti (imzalanan / atlanan belge kimlikleri).
     Haber YALNIZ ekranı günceller (pencere kapanır, liste tazelenir, bildirim); raporun durumu değişmez — kesin sonuç webhook / API.
   Kilit tests/sign-gomulu.test.ts; olumsuz kanıt tests/bozan/sign-gomulu.bozan.ts. */

export const GOMULU_IZIN = "local-network-access; local-network; loopback-network";

export type SignHaberi =
  | { tur: "hazir" | "imzalandi" | "reddedildi" | "kapali" }
  | { tur: "toplu_bitti"; imzalanan: string[]; atlanan: string[] };

/** adresin kökeni (https://<kısa ad>.sign.probata.com.tr); okunamazsa null */
export function kokeni(adres: string | null): string | null {
  if (!adres) return null;
  try { return new URL(adres).origin; } catch { return null; }
}

const kimlikler = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && /^[0-9a-f-]{36}$/.test(x)).slice(0, 500) : [];

/** gelen ileti sign'ın haberi mi: köken açılan pencerenin kökeni ve kaynak "probata-sign"; değilse null */
export function signHaberi(e: { origin: string; data: unknown }, beklenenKoken: string | null): SignHaberi | null {
  if (!beklenenKoken || e.origin !== beklenenKoken) return null;
  const d = e.data;
  if (!d || typeof d !== "object") return null;
  const x = d as Record<string, unknown>;
  if (x.kaynak !== "probata-sign") return null;
  switch (x.tur) {
    case "hazir": case "imzalandi": case "reddedildi": case "kapali": return { tur: x.tur };
    case "toplu_bitti": return { tur: "toplu_bitti", imzalanan: kimlikler(x.imzalanan), atlanan: kimlikler(x.atlanan) };
    default: return null;
  }
}
