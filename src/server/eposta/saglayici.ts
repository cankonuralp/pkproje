/* E-POSTA SAĞLAYICISI (432; KOD-GECIS Y4 — hesap ve alan adı doğrulaması (SPF / DKIM / DMARC) reisim'de) — tek bağdaştırıcı, HTTP JSON (Resend
   biçimi: POST {from, to, subject, text}, "Authorization: Bearer <anahtar>"). Ortam: PROBATA_EPOSTA_ANAHTAR (sır), PROBATA_EPOSTA_KIMDEN
   ("probata <bildirim@…>"), isteğe bağlı PROBATA_EPOSTA_UC (uç; uçtan uca testte yerel taklit). Anahtar ya da gönderen yoksa sağlayıcı YOK:
   e-postalar kuyrukta "bekliyor" kalır, nedeni yazılır (sessiz kayıp yok). Anahtar ve gövde günlüğe yazılmaz. */
export type GonderimSonucu = { tamam: true } | { tamam: false; neden: string; kalici: boolean };
export interface EpostaSaglayici { gonder(e: { kime: string; konu: string; metin: string }): Promise<GonderimSonucu> }

export const SAGLAYICI_YOK = "E-posta servisi kurulmadı (yönetici: e-posta sağlayıcısı hesabı ve anahtarı); e-posta bekliyor.";
const VARSAYILAN_UC = "https://api.resend.com/emails";

export function epostaSaglayicisi(env: Record<string, string | undefined> = process.env): EpostaSaglayici | null {
  const anahtar = env.PROBATA_EPOSTA_ANAHTAR?.trim(), kimden = env.PROBATA_EPOSTA_KIMDEN?.trim();
  if (!anahtar || !kimden) return null;
  const uc = env.PROBATA_EPOSTA_UC?.trim() || VARSAYILAN_UC;
  return {
    async gonder(e) {
      try {
        const y = await fetch(uc, {
          method: "POST", redirect: "error", signal: AbortSignal.timeout(10_000),
          headers: { Authorization: `Bearer ${anahtar}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from: kimden, to: [e.kime], subject: e.konu, text: e.metin }),
        });
        if (y.ok) return { tamam: true };
        /* 4xx (429 hariç): istek kalıcı olarak reddedildi (adres, gönderen, anahtar) — yeniden denemek düzeltmez */
        return { tamam: false, neden: `Sağlayıcı reddetti (HTTP ${y.status}).`, kalici: y.status >= 400 && y.status < 500 && y.status !== 429 };
      } catch (h) {
        return { tamam: false, neden: (h as Error).name === "TimeoutError" ? "Sağlayıcı 10 sn'de yanıt vermedi." : "Sağlayıcıya bağlanılamadı.", kalici: false };
      }
    },
  };
}
