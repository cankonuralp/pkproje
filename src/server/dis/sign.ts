/* PROBATA SIGN İSTEMCİSİ (2026-11-05, göç 0122; reisim: "o firma için imzalama probata sign üzerinden yapılsın … şimdilik e imza üzerinden gidelim";
   tasarım 59EF1ZZAJZdg6BztvuiWbr). probata sign'ın API v1'ine sıradan bir müşteri gibi bağlanır (sign deposu TASARIM.md §5 — kod alınmaz):
   · belgeYukle: PDF + rapor no (aynı rapor no + aynı PDF → sign var olan belgeyi verir; farklı PDF → 409 — o zaman revizyon olarak yeniden);
     4 MB'ı aşan PDF parçalı yüklenir (/yuklemeler — tek istek gövdesi sign'da en çok 4 MB).
   · imzaIstegiAc: tek imzacı (uzman), yöntem "usb" (e-imza; mobil imza ileride), her_zaman_baglanti (bağlantı probata'dan açılır), son tarih.
   · belgeGetir (durum + son istek), pdfAl (imzalı PDF), istekIptal, dene (anahtar geçerli mi).
   · webhookDogrula (SAF): X-Probata-Imza "t=<unix>,v1=<hex HMAC-SHA256(sır, '<t>.<gövde>')>", 5 dk, sabit süreli karşılaştırma — sign'ın imza-basligi.ts
     tanımının aynısı.
   Adres PROBATA_SIGN_UC (yalnız yerel / test taklidi değiştirir; varsayılan https://sign.probata.com.tr). Anahtar ve gövde hiçbir günlüğe düşmez.
   Kilit tests/sign-saf.test.ts. */
import { createHmac, timingSafeEqual } from "node:crypto";

export const SIGN_VARSAYILAN = "https://sign.probata.com.tr";
const ucAdresi = (): string => (process.env.PROBATA_SIGN_UC || SIGN_VARSAYILAN).replace(/\/+$/, "");
/** sign'ın tek istek gövdesi sınırının altı (parçalı yüklemeye geçiş) */
export const TEK_YUKLEME_EN_COK = 3_800_000;
const SURE_MS = 20_000;

export class SignHatasi extends Error {
  readonly kod: number;
  readonly hata: string;
  constructor(kod: number, hata: string, mesaj: string) { super(mesaj); this.name = "SignHatasi"; this.kod = kod; this.hata = hata; }
  /** yeniden denenebilir mi (ağ, zaman aşımı, 429, 5xx) */
  get gecici(): boolean { return this.kod === 0 || this.kod === 429 || this.kod >= 500; }
}

export interface SignBelgesi { id: string; durum: string; rapor_no: string | null; mevcut?: boolean }
export interface SignImzaci { id: string; durum: string; baglanti?: string | null; red_nedeni?: string | null }
export interface SignIstek { id: string; durum: string; son_tarih: string | null; imzacilar: SignImzaci[] }
export interface SignBelgeAyrintisi extends SignBelgesi { imza_istegi: SignIstek | null }

type Getir = typeof fetch;
export interface SignIstemcisi {
  dene(): Promise<void>;
  belgeYukle(pdf: Uint8Array, p: { ad: string; raporNo: string | null; revizyon?: boolean }): Promise<SignBelgesi>;
  imzaIstegiAc(belgeId: string, p: { ad: string; eposta: string; sonTarih: string; mesaj?: string }): Promise<SignIstek>;
  belgeGetir(belgeId: string): Promise<SignBelgeAyrintisi>;
  pdfAl(belgeId: string): Promise<Uint8Array>;
  istekIptal(istekId: string): Promise<void>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const kimlik = (x: unknown, ne: string): string => {
  if (typeof x !== "string" || !UUID.test(x)) throw new SignHatasi(502, "bicim", `sign'ın cevabında ${ne} kimliği yok.`);
  return x;
};

/** anahtar: psk_<önek>_<gizli> (sign'ın biçimi); getir: yalnız testler taklit verir */
export function signIstemcisi(anahtar: string, getir: Getir = fetch): SignIstemcisi {
  if (!/^psk_[A-Za-z0-9]+_[A-Za-z0-9_-]+$/.test(anahtar)) throw new SignHatasi(400, "anahtar", "sign API anahtarı biçimi geçersiz (psk_ ile başlar).");
  const istek = async (yontem: string, yol: string, govde?: BodyInit, tur?: string): Promise<Response> => {
    let y: Response;
    try {
      y = await getir(`${ucAdresi()}/api/v1${yol}`, {
        method: yontem, body: govde, redirect: "manual", signal: AbortSignal.timeout(SURE_MS),
        headers: { Authorization: `Bearer ${anahtar}`, "User-Agent": "probata", ...(tur ? { "Content-Type": tur } : {}) },
      });
    } catch { throw new SignHatasi(0, "ag", "probata sign'a ulaşılamadı; biraz sonra yeniden deneyin."); }
    if (y.ok) return y;
    const j = await y.json().catch(() => null) as { hata?: { kod?: unknown; mesaj?: unknown } } | null;
    const kod = typeof j?.hata?.kod === "string" ? j.hata.kod : "hata";
    const mesaj = y.status === 401 ? "sign API anahtarı kabul edilmedi."
      : typeof j?.hata?.mesaj === "string" ? j.hata.mesaj.slice(0, 300) : `probata sign isteği reddetti (${y.status}).`;
    throw new SignHatasi(y.status, kod, mesaj);
  };
  const json = async <T,>(y: Response): Promise<T> => {
    try { return await y.json() as T; } catch { throw new SignHatasi(502, "bicim", "sign'ın cevabı okunamadı."); }
  };
  const sorgu = (p: { ad: string; raporNo: string | null; revizyon?: boolean }) => {
    const q = new URLSearchParams({ ad: p.ad.slice(0, 200) });
    if (p.raporNo) q.set("rapor_no", p.raporNo.slice(0, 80));
    if (p.revizyon) q.set("revizyon", "true");
    return q.toString();
  };
  const belge = (j: Record<string, unknown>): SignBelgesi =>
    ({ id: kimlik(j.id, "belge"), durum: String(j.durum ?? ""), rapor_no: typeof j.rapor_no === "string" ? j.rapor_no : null, mevcut: j.mevcut === true });
  const istekOku = (j: Record<string, unknown>): SignIstek => ({
    id: kimlik(j.id, "istek"), durum: String(j.durum ?? ""), son_tarih: typeof j.son_tarih === "string" ? j.son_tarih : null,
    imzacilar: (Array.isArray(j.imzacilar) ? j.imzacilar : []).map((x: Record<string, unknown>) => ({ id: String(x.id ?? ""), durum: String(x.durum ?? ""),
      baglanti: typeof x.baglanti === "string" ? x.baglanti : null, red_nedeni: typeof x.red_nedeni === "string" ? x.red_nedeni : null })),
  });
  return {
    async dene() { await istek("GET", "/belgeler?boy=1"); },
    async belgeYukle(pdf, p) {
      if (pdf.byteLength <= TEK_YUKLEME_EN_COK) {
        return belge(await json(await istek("POST", `/belgeler?${sorgu(p)}`, new Blob([new Uint8Array(pdf)], { type: "application/pdf" }), "application/pdf")));
      }
      /* parçalı yükleme (sign: /yuklemeler → parçalar → birleştir) */
      const a = await json<{ id?: unknown; parca_boyu?: unknown; parca_sayisi?: unknown }>(
        await istek("POST", "/yuklemeler", JSON.stringify({ boyut: pdf.byteLength }), "application/json"));
      const id = kimlik(a.id, "yükleme"), boy = Number(a.parca_boyu), sayi = Number(a.parca_sayisi);
      if (!(boy > 0) || !(sayi > 0)) throw new SignHatasi(502, "bicim", "sign'ın parçalı yükleme cevabı okunamadı.");
      for (let s = 0; s < sayi; s++) {
        await istek("PUT", `/yuklemeler/${id}/parcalar/${s}`, new Blob([new Uint8Array(pdf.subarray(s * boy, Math.min(pdf.byteLength, (s + 1) * boy)))]), "application/octet-stream");
      }
      return belge(await json(await istek("POST", `/yuklemeler/${id}/belge?${sorgu(p)}`)));
    },
    async imzaIstegiAc(belgeId, p) {
      const govde = { imzacilar: [{ ad: p.ad.slice(0, 200), eposta: p.eposta, yontem: "usb" }], son_tarih: p.sonTarih, her_zaman_baglanti: true,
        ...(p.mesaj ? { mesaj: p.mesaj.slice(0, 2000) } : {}) };
      return istekOku(await json(await istek("POST", `/belgeler/${kimlik(belgeId, "belge")}/imza-istekleri`, JSON.stringify(govde), "application/json")));
    },
    async belgeGetir(belgeId) {
      const j = await json<Record<string, unknown>>(await istek("GET", `/belgeler/${kimlik(belgeId, "belge")}`));
      const i = j.imza_istegi && typeof j.imza_istegi === "object" ? istekOku(j.imza_istegi as Record<string, unknown>) : null;
      return { ...belge(j), imza_istegi: i };
    },
    async pdfAl(belgeId) {
      return new Uint8Array(await (await istek("GET", `/belgeler/${kimlik(belgeId, "belge")}/pdf?surum=son`)).arrayBuffer());
    },
    async istekIptal(istekId) { await istek("POST", `/imza-istekleri/${kimlik(istekId, "istek")}/iptal`); },
  };
}

/** webhook imza başlığı (sign'ın imza-basligi.ts tanımı): bu gövdenin bu sırla imzası mı ve zamanı 5 dk içinde mi */
export const WEBHOOK_TOLERANS_SN = 300;
export function webhookImzasi(sir: string, t: number, govde: string): string {
  return createHmac("sha256", sir).update(`${t}.${govde}`, "utf8").digest("hex");
}
export function webhookDogrula(baslik: string | null | undefined, govde: string, sir: string, simdi: Date = new Date()): boolean {
  if (typeof baslik !== "string" || baslik.length > 1000 || !sir) return false;
  const parca = baslik.split(",").map((x) => x.trim().split("=", 2) as [string, string | undefined]);
  const t = parca.find(([k]) => k === "t")?.[1];
  if (!t || !/^\d{1,12}$/.test(t)) return false;
  if (Math.abs(Math.floor(simdi.getTime() / 1000) - Number(t)) > WEBHOOK_TOLERANS_SN) return false;
  const beklenen = Buffer.from(webhookImzasi(sir, Number(t), govde), "hex");
  return parca.some(([k, v]) => k === "v1" && !!v && /^[0-9a-f]{64}$/.test(v) && timingSafeEqual(Buffer.from(v, "hex"), beklenen));
}
