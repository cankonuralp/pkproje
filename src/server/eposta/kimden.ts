/* KİMDEN (536; pkproje §11 533–535 — reisim 2026-10-13: "kim mail gönder tuşuna basarsa onun mailinden gitmeli"; FIRMA-VT §5.8, FV11 — 2026-10-16, K2:
   "resend için tek seçenek var ve o da firmaların kendi mail adresleri ile mail atılması … planlamacı mail gönder dediğinde planlamacının mail adresinden")
   — saf. E-postanın Kimden / Cevap / gizli kopya başlıkları. Gönderim probata'nın TEK Resend hesabından, FİRMANIN alan adıyla (Yönetim'den eklenip
   doğrulanır — firma_gonderim; firmada kilitli):
   · alan adı doğrulanmadıysa gönderilmez — e-posta bekler, nedeni yazılır (sessiz kayıp yok);
   · tuşa basan kişinin adresi firmanın alan adındaysa: Kimden = kişi ("Ad Soyad" <kisi@alan>), cevap ona gelir;
   · değilse (kişisel posta): Kimden = firmanın genel adresi (<yerel>@alan) kişinin adıyla ("Ad · Firma"); Cevap = kişinin adresi;
   · kimse basmadıysa (otomatik): Kimden = genel adres firma adıyla; Cevap = Firma bilgileri › Rapor e-postası (genel adresle aynıysa yok);
   · gizli kopya (firma ayarı, başlangıçta kapalı): açıksa gönderen kişi kendi kutusunda bir kopya görür.
   Alan adı küçük harf, tam eşleşme (alt alan adı ayrı alan adıdır). Görünen addan başlığı bozacak işaretler atılır. */

/** alan adı biçimi (küçük harf; etiketler 1–63, en az iki etiket, toplam 3–100) */
export const ALAN_BICIMI = /^(?=.{3,100}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;
/** genel adresin yerel kısmı (ör. bilgi) — 0099 CHECK ile aynı */
export const YEREL_BICIMI = /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/;
/** yazılan alan adını sadeleştirir: boşluk, http(s)://, www., yol ve büyük harf atılır */
export const alanSadelestir = (s: string) => s.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/[/?#].*$/, "");
/** adresin alan adı (küçük harf; yoksa "") */
export const alanAdi = (e: string | null | undefined) => { const m = /@([^@\s]+)$/.exec((e ?? "").trim().toLowerCase()); return m ? m[1] : ""; };

/** firmanın gönderimi: alan adı ve genel adres (firma_gonderim — Yönetim kurar), doğrulandı mı, görünen ad, gizli kopya, Rapor e-postası (otomatik cevap) */
export interface FirmaGonderimi { alan: string; genel: string; dogrulandi: boolean; firmaAd: string; kopya: boolean; rapor: string | null }
export interface Gonderen { ad: string; eposta: string }
/** kişinin e-postası nereden gider: kendi adresinden · firmanın genel adresinden (kişinin adıyla) · adresi yok (yine genel adresten) */
export type GonderenYolu = "kendi" | "genel" | "yok";
export const gonderenYolu = (eposta: string | null | undefined, alan: string): GonderenYolu =>
  !eposta ? "yok" : alan && alanAdi(eposta) === alan ? "kendi" : "genel";

export const ALAN_DOGRULANMADI = "Firmanın gönderen alan adı henüz doğrulanmadı (probata yönetimi kurar); e-posta bekliyor.";
const gorunenAd = (s: string) => s.replace(/["\\<>\r\n\t]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) || "probata";

export type Kimden = { tamam: true; kimden: string; cevap: string | null; gizli: string | null } | { tamam: false; neden: string };
export function kimdenKur(f: FirmaGonderimi, g: Gonderen | null): Kimden {
  const genel = f.genel.trim().toLowerCase();
  if (!f.dogrulandi || !f.alan || !ALAN_BICIMI.test(f.alan) || alanAdi(genel) !== f.alan) return { tamam: false, neden: ALAN_DOGRULANMADI };
  const gizli = f.kopya && g ? g.eposta.toLowerCase() : null;
  if (g && gonderenYolu(g.eposta, f.alan) === "kendi") return { tamam: true, kimden: `"${gorunenAd(g.ad)}" <${g.eposta.toLowerCase()}>`, cevap: null, gizli };
  const rapor = f.rapor?.trim().toLowerCase() || null;
  const cevap = g ? g.eposta.toLowerCase() : rapor && rapor !== genel ? rapor : null;
  return { tamam: true, kimden: `"${gorunenAd(g ? `${g.ad} · ${f.firmaAd}` : f.firmaAd)}" <${genel}>`, cevap, gizli };
}
