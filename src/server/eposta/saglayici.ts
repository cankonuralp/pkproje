/* E-POSTA SAĞLAYICISI (432; KOD-GECIS Y4) — tek bağdaştırıcı, HTTP JSON (Resend biçimi: POST {from, to, subject, text, reply_to?, bcc?},
   "Authorization: Bearer <anahtar>"). 536 (reisim 2026-10-13: "A seçeneğini kabul ediyorum" — her firma KENDİ Resend hesabı): anahtar FİRMANIN
   (Firma ayarları › E-posta; şifreli sır, firma.ts çözer); ortamdaki ortak anahtar / gönderen kalktı. Kimden / Cevap / gizli kopya kimden.ts'ten.
   İsteğe bağlı PROBATA_EPOSTA_UC (uç; uçtan uca testte yerel taklit). Anahtar yoksa sağlayıcı YOK: e-postalar kuyrukta "bekliyor" kalır, nedeni
   yazılır (sessiz kayıp yok). Anahtar ve gövde günlüğe yazılmaz.
   FIRMA-VT FV11 (2026-10-16, §5.8): anahtar probata'nın Resend hesabında FİRMANIN alan adına bağlı gönderme anahtarı (Yönetim kurar; firmada kilitli);
   açık User-Agent "probata"; kuyruk satırının kimliğiyle Idempotency-Key — yanıtı kaybolan istek yeniden denenince e-posta İKİ KEZ gitmez. */
export type GonderimSonucu = { tamam: true } | { tamam: false; neden: string; kalici: boolean };
export interface Gonderim { kimden: string; kime: string; cevap: string | null; gizli: string | null; konu: string; metin: string; /** kuyruk satırı */ kimlik?: string }
export interface EpostaSaglayici { gonder(e: Gonderim): Promise<GonderimSonucu> }

export const SAGLAYICI_YOK = "E-posta gönderimi kurulmadı (probata yönetimi firmanın alan adını ekleyip doğrular); e-posta bekliyor.";
const VARSAYILAN_UC = "https://api.resend.com/emails";

export function epostaSaglayicisi(anahtar: string | null | undefined, env: Record<string, string | undefined> = process.env): EpostaSaglayici | null {
  const a = anahtar?.trim();
  if (!a) return null;
  const uc = env.PROBATA_EPOSTA_UC?.trim() || VARSAYILAN_UC;
  return {
    async gonder(e) {
      try {
        const y = await fetch(uc, {
          method: "POST", redirect: "error", signal: AbortSignal.timeout(10_000),
          headers: { Authorization: `Bearer ${a}`, "Content-Type": "application/json", "User-Agent": "probata",
            ...(e.kimlik && /^[0-9a-f-]{36}$/.test(e.kimlik) ? { "Idempotency-Key": `eposta/${e.kimlik}` } : {}) },
          body: JSON.stringify({ from: e.kimden, to: [e.kime], subject: e.konu, text: e.metin, ...(e.cevap ? { reply_to: [e.cevap] } : {}), ...(e.gizli ? { bcc: [e.gizli] } : {}) }),
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
