/* ══ BULUT YEDEK İSTEMCİSİ — ORTAK (2026-11-03; reisim: "yapılsın firma ayarlardan kendi yedeğini otomatik alabiliyo olsun") ═══════════════════
   Firmanın kendi Google Drive / OneDrive hesabına dosya yazar. İki hizmet aynı arayüzle (BulutHizmeti); ayrıntı bulut-google.ts, bulut-onedrive.ts.
   · İzin: OAuth 2.0 yetkilendirme kodu + PKCE (S256). İzin DAR: Google "drive.file" (yalnız probata'nın açtığı dosyalar), OneDrive
     "Files.ReadWrite.AppFolder" (yalnız uygulama klasörü). Yenileme anahtarı çağıranın şifreli sırrında (firma_sir "bulut_erisimi"), burada saklanmaz.
   · probata'nın uygulama kimlikleri ortamda: PROBATA_GOOGLE_ISTEMCI / _SIR, PROBATA_ONEDRIVE_ISTEMCI / _SIR; dönüş adresi PROBATA_BULUT_DONUS (tam
     adres; hizmette kayıtlı adresle AYNI olmalı). Biri yoksa o hizmet kapalı (bulutAyari null — ekranda bağlanamaz). Ortam adları YALNIZ
     src/server/dis/** ve scripts/ içinde (kilit tests/yonetim-anahtari.test.ts).
   · PROBATA_BULUT_UC YALNIZ yerel adres (test taklidi — tests/yardimci/sahte-bulut.ts); başka değer HATA: anahtar başka sunucuya gitmez.
   Bu dosya ortak türler, ayar ve yardımcılar; hizmeti seçen bulut.ts.
   · Hatalar dört türde: BulutKopuk (izin geri alındı / anahtar geçersiz — yeniden bağlanmak gerekir), BulutYetki (erişim anahtarının süresi doldu —
     çağıran yeniler, bir kez dener), BulutDolu (hesapta yer yok), BulutHatasi (geçici: ağ, 429, 5xx — sonra yeniden denenir). İletide yalnız durum
     kodu ve hizmetin hata kodu; hizmetin metni, anahtar, dosya içeriği yazılmaz. Yönlendirme izlenmez; her istek 60 sn. */
export type BulutSaglayici = "gdrive" | "onedrive";
export const BULUT_SAGLAYICILAR: readonly BulutSaglayici[] = ["gdrive", "onedrive"];

export interface BulutAyari { saglayici: BulutSaglayici; istemci: string; sir: string; donus: string; uc: string | null }

const YEREL_UC = /^http:\/\/(127\.0\.0\.1|localhost):\d{2,5}$/;
const YEREL_DONUS = /^http:\/\/([a-z0-9-]+\.)*localhost(:\d{2,5})?\/api\/bulut\/donus$/;
const DONUS = /^https:\/\/[a-z0-9.-]{3,200}\/api\/bulut\/donus$/;

/** ortamdan hizmetin ayarı: kimlik / sır / dönüş adresi yoksa null (hizmet kapalı); biçimsizse HATA (iletide değer yok) */
export function bulutAyari(s: BulutSaglayici, e: Record<string, string | undefined> = process.env): BulutAyari | null {
  const ad = s === "gdrive" ? "GOOGLE" : "ONEDRIVE";
  const istemci = (e[`PROBATA_${ad}_ISTEMCI`] ?? "").trim(), sir = (e[`PROBATA_${ad}_SIR`] ?? "").trim(), donus = (e.PROBATA_BULUT_DONUS ?? "").trim();
  if (!istemci || !sir || !donus) return null;
  if (!/^[A-Za-z0-9._-]{8,200}$/.test(istemci)) throw new Error(`Bulut uygulama kimliği biçimsiz (PROBATA_${ad}_ISTEMCI).`);
  if (sir.length < 8 || sir.length > 300 || /\s/.test(sir)) throw new Error(`Bulut uygulama sırrı biçimsiz (PROBATA_${ad}_SIR).`);
  const uc = (e.PROBATA_BULUT_UC ?? "").replace(/\/+$/, "");
  if (uc && !YEREL_UC.test(uc)) throw new Error("PROBATA_BULUT_UC yalnız yerel adres olabilir (test taklidi).");
  if (!DONUS.test(donus) && !(uc && YEREL_DONUS.test(donus))) throw new Error("PROBATA_BULUT_DONUS https://<alan>/api/bulut/donus biçiminde olmalı.");
  return { saglayici: s, istemci, sir, donus, uc: uc || null };
}

export class BulutKopuk extends Error {
  constructor(ne: string) { super(ne); this.name = "BulutKopuk"; }
}
export class BulutYetki extends Error {
  constructor() { super("Erişim anahtarının süresi doldu"); this.name = "BulutYetki"; }
}
export class BulutDolu extends Error {
  constructor() { super("Hesapta yer kalmadı"); this.name = "BulutDolu"; }
}
export class BulutHatasi extends Error {
  readonly durum: number;
  constructor(durum: number, kod = "") { super(`Bulut hizmeti yanıt vermedi (${durum}${kod ? ` ${kod}` : ""})`); this.name = "BulutHatasi"; this.durum = durum; }
}

/** hizmetteki klasör / dosya kimlikleri (Google Drive) — çağıranın kalıcı kaydı (bulut_yer) */
export interface YerDeposu { al(yol: string): Promise<string | null>; koy(yol: string, id: string): Promise<void>; sil(onek: string): Promise<void> }
export interface Yukleme { yol: readonly string[]; ad: string; bayt: Uint8Array; tur: string }
export interface Anahtarlar { erisim: string; yenileme: string | null }

export interface BulutHizmeti {
  /** izin ekranının adresi (tarayıcı oraya gider) */
  izinAdresi(durum: string, meydan: string): string;
  /** dönüşteki kod → anahtarlar (yenileme anahtarı şart) */
  kodTakas(kod: string, dogrulayici: string): Promise<{ erisim: string; yenileme: string }>;
  /** yenileme → yeni erişim anahtarı (OneDrive yenileme anahtarını da yeniler: dönen yenileme saklanır) */
  yenile(yenileme: string): Promise<Anahtarlar>;
  /** bağlanan hesabın adresi */
  hesap(erisim: string): Promise<string>;
  /** izni geri bırak (yapılamazsa sessiz — bağlantı yine de kesilir) */
  birak(yenileme: string): Promise<void>;
  /** dosyayı yerine yazar; aynı adda dosya varsa içeriği değişir (kopya oluşmaz) */
  yukle(erisim: string, y: Yukleme, yerler: YerDeposu): Promise<void>;
}

/* ── ortak yardımcılar (iki istemci) ── */
export const ISTEK_MS = 60_000;
/** form gövdeli belirteç isteği; hata gövdesinden yalnız "error" kodu okunur */
export async function belirtecIstegi(uc: string, govde: Record<string, string>): Promise<Record<string, unknown>> {
  let y: Response;
  try {
    y = await fetch(uc, { method: "POST", redirect: "error", signal: AbortSignal.timeout(ISTEK_MS),
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json", "User-Agent": "probata" }, body: new URLSearchParams(govde) });
  } catch { throw new BulutHatasi(0, "ağ"); }
  const j = await jsonOku(y);
  if (y.ok) return j;
  const kod = typeof j.error === "string" ? j.error.slice(0, 40) : "";
  if (kod === "invalid_grant" || kod === "unauthorized_client" || kod === "invalid_client") throw new BulutKopuk(kod === "invalid_grant" ? "İzin geri alınmış ya da süresi dolmuş." : "Uygulama kimliği reddedildi.");
  throw new BulutHatasi(y.status, kod);
}
export async function jsonOku(y: Response): Promise<Record<string, unknown>> {
  const m = await y.text();
  if (!m) return {};
  try { const j = JSON.parse(m) as unknown; return j && typeof j === "object" && !Array.isArray(j) ? j as Record<string, unknown> : {}; } catch { return {}; }
}
export const metin = (x: unknown, en = 4000): x is string => typeof x === "string" && x.length > 0 && x.length <= en;
/** 429 / 503'ün Retry-After'ı (en çok 10 sn) */
export function bekleme(y: Response): number | null {
  if (y.status !== 429 && y.status !== 503) return null;
  const b = y.headers.get("retry-after");
  const sn = b && /^\d+$/.test(b.trim()) ? Number(b.trim()) : 2;
  return sn <= 10 ? sn * 1000 : null;
}
