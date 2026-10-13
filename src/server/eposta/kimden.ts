/* KİMDEN (536; pkproje §11 533–535 — reisim 2026-10-13: "kim mail gönder tuşuna basarsa onun mailinden gitmeli" → "A seçeneğini kabul ediyorum"
   (her firma kendi Resend hesabı) → maket Firma ayarları › E-posta "onaylıyorum") — saf. E-postanın Kimden / Cevap / gizli kopya başlıkları:
   · tuşa basan kişinin adresi firmanın gönderen alan adındaysa (Resend'de doğrulanmış): Kimden = kişi ("Ad Soyad" <kisi@alan>), cevap ona gelir;
   · değilse (kişisel posta) ya da kimse basmadıysa (otomatik): Kimden = Firma bilgileri › Rapor e-postası, kişinin (yoksa firmanın) adıyla; Cevap =
     kişinin adresi. Rapor e-postası da alan adında değilse gönderilmez — e-posta bekler, nedeni yazılır (sessiz kayıp yok);
   · gizli kopya (firma ayarı, başlangıçta kapalı): açıksa gönderen kişi kendi kutusunda bir kopya görür.
   Alan adı küçük harf, tam eşleşme (alt alan adı ayrı alan adıdır). Görünen addan başlığı bozacak işaretler atılır. */

/** alan adı biçimi (küçük harf; etiketler 1–63, en az iki etiket, toplam 3–100) */
export const ALAN_BICIMI = /^(?=.{3,100}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;
/** yazılan alan adını sadeleştirir: boşluk, http(s)://, www., yol ve büyük harf atılır */
export const alanSadelestir = (s: string) => s.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/[/?#].*$/, "");
/** adresin alan adı (küçük harf; yoksa "") */
export const alanAdi = (e: string | null | undefined) => { const m = /@([^@\s]+)$/.exec((e ?? "").trim().toLowerCase()); return m ? m[1] : ""; };

export interface FirmaGonderimi { alan: string; genel: string | null; firmaAd: string; kopya: boolean }
export interface Gonderen { ad: string; eposta: string }
/** kişinin e-postası nereden gider: kendi adresinden · firmanın Rapor e-postasından (kişinin adıyla) · adresi yok (yine Rapor e-postasından) */
export type GonderenYolu = "kendi" | "genel" | "yok";
export const gonderenYolu = (eposta: string | null | undefined, alan: string): GonderenYolu =>
  !eposta ? "yok" : alan && alanAdi(eposta) === alan ? "kendi" : "genel";

export const GENEL_ALAN_DISI = "Rapor e-postası gönderen alan adında değil (Firma ayarları › Firma bilgileri ve E-posta); e-posta bekliyor.";
const gorunenAd = (s: string) => s.replace(/["\\<>\r\n\t]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) || "probata";

export type Kimden = { tamam: true; kimden: string; cevap: string | null; gizli: string | null } | { tamam: false; neden: string };
export function kimdenKur(f: FirmaGonderimi, g: Gonderen | null): Kimden {
  const gizli = f.kopya && g ? g.eposta.toLowerCase() : null;
  if (g && gonderenYolu(g.eposta, f.alan) === "kendi") return { tamam: true, kimden: `"${gorunenAd(g.ad)}" <${g.eposta.toLowerCase()}>`, cevap: null, gizli };
  if (!f.genel || !f.alan || alanAdi(f.genel) !== f.alan) return { tamam: false, neden: GENEL_ALAN_DISI };
  return { tamam: true, kimden: `"${gorunenAd(g ? `${g.ad} · ${f.firmaAd}` : f.firmaAd)}" <${f.genel.trim().toLowerCase()}>`, cevap: g ? g.eposta.toLowerCase() : null, gizli };
}
