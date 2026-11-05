/* PROBATA SIGN İLE RAPOR İMZASI (2026-11-05, göç 0122; reisim: "o firma için imzalama probata sign üzerinden yapılsın … şimdilik e imza üzerinden
   gidelim"; tasarım 59EF1ZZAJZdg6BztvuiWbr — "önerilerin ve sunumun uygun": K1 firma kapatamaz, K2 "PDF ile imzala" yedek yolu kalır, K3 rapor imzası
   — muayene uzmanı + teknik yönetici, K4 son tarih 7 gün).
   Firmada sign açık = Yönetim'in girdiği iki sır var (sign_anahtari, sign_webhook_sirri). İmza isteği BUGÜNKÜ istek (imza_istegi) — sign alanları
   onun üstüne:
   1) signHazirla (işlem içinde): bugünkü hazırlık (imzaHazirla / teknikImzaHazirla — aynı kesin imzasız PDF, aynı yetki); sign'da açık istek varsa
      onun bağlantısı döner; yoksa PDF + imzacı (oturumdaki kişi) + anahtar.
   2) signGonder (işlem DIŞINDA — ağ): PDF sign'a (rapor no ile; farklı PDF'te revizyon, belge kapanmışsa rapor nosuz), imza isteği (e-imza: "usb",
      7 gün, her_zaman_baglanti) → bağlantı.
   3) signKaydet (işlem içinde): sign kimlikleri + bağlantı (şifreli — firmaya ve isteğe bağlı) bekleyen isteğe.
   Tamamlanma: sign webhook'u (signBildirim) ya da ekranın "Durumu yenile"si (signYenile) — sign'dan imzalı PDF alınır, BUGÜNKÜ yükleme yolundan
   (imzaliYukle / teknikImzaliYukle — önek, kriptografik imza, nitelikli, imzalayan) geçer; iş isteğin SAHİBİNİN yetkisiyle (webhook'ta oturum yok).
   Reddedildi / iptal / süresi doldu: isteğe sign durumu + nedeni; "İmzala" yeniden açılır. Kilit tests/sign-baglanti.test.ts. */
import { createHash } from "node:crypto";
import { coz, sifrele, sirDurumu, sirKullan } from "../../../server/ayar/sir.ts";
import { kiraciIcinde, type Sorgulayici } from "../../../server/db/kiraci.ts";
import { kiraciHavuzu, type KiraciYeri } from "../../../server/db/firma-havuzu.ts";
import { guncelle, tablo } from "../../../server/db/yazici.ts";
import { kayitDosyasi } from "../../../server/dosya/dosya.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { SIGN_TOPLU_EN_COK, SignHatasi, signIstemcisi, signTopluAdresi, webhookDogrula, type SignIstemcisi } from "../../../server/dis/sign.ts";
import type { BelgeVerisi } from "../../../belge/veri.ts";
import type { Kisi } from "../../planlar/server/planlar.ts";
import { imzaHazirla, imzaliYukle, PDF_MODULU, teknikImzaHazirla, teknikImzaliYukle, type RaporYazma } from "./raporlar.ts";

export type Asama = "uzman" | "teknik";
/** sign isteğinin son tarihi (K4) */
export const SIGN_GUN = 7;
const SIGN_ISTEK = tablo({ ad: "imza_istegi", sutunlar: ["sign_belge", "sign_istek", "sign_baglanti", "sign_durum", "sign_neden"] });
const BAGLANTI_AD = "sign_baglanti";

/** firmada probata sign açık mı (Yönetim iki sırrı da girdiyse) */
export async function signAcik(db: Sorgulayici): Promise<boolean> {
  const [a, s] = await Promise.all([sirDurumu(db, "sign_anahtari"), sirDurumu(db, "sign_webhook_sirri")]);
  return a.tanimli && s.tanimli;
}

interface IstekSatiri {
  id: string; rapor_id: string; revizyon: number; asama: Asama; surum: number; hesap_id: string | null; pdf_dosya: string;
  sign_belge: string | null; sign_istek: string | null; sign_baglanti: string | null; sign_durum: string | null; sign_neden: string | null;
}
const ISTEK_SUTUN = `id::text, rapor_id::text, revizyon, asama, surum, hesap_id::text, pdf_dosya::text, sign_belge, sign_istek, sign_baglanti, sign_durum, sign_neden`;
async function bekleyen(db: Sorgulayici, raporId: string, asama: Asama): Promise<IstekSatiri | null> {
  return (await db.sorgu<IstekSatiri>(
    `SELECT ${ISTEK_SUTUN} FROM imza_istegi i WHERE i.rapor_id = $1 AND i.asama = $2 AND i.durum = 'bekliyor'
       AND i.revizyon = (SELECT r.revizyon FROM rapor r WHERE r.id = i.rapor_id) ORDER BY i.olustu DESC LIMIT 1`, [raporId, asama])).rows[0] ?? null;
}

/** ekran için: sign açık mı ve bekleyen isteğin sign durumu */
export interface SignEkrani { acik: boolean; durum: "yok" | "bekliyor" | "reddedildi" | "iptal" | "hata"; neden: string | null; sonTarih: string | null }
export async function signEkrani(db: Sorgulayici, raporId: string, asama: Asama): Promise<SignEkrani> {
  const acik = await signAcik(db);
  if (!acik) return { acik, durum: "yok", neden: null, sonTarih: null };
  const i = await bekleyen(db, raporId, asama);
  const durum = !i?.sign_istek ? "yok" : (i.sign_durum ?? "bekliyor") as SignEkrani["durum"];
  return { acik, durum, neden: i?.sign_neden ?? null, sonTarih: null };
}

/* ── 1 · hazırla (işlem içinde) ── */
export type SignHazirlik =
  /** açık istek: bağlantısı (üyeye bağlı toplu istekte null — sign'ın toplu sayfası) ve sign'daki belge */
  | { tur: "acik"; baglanti: string | null; belge: string }
  | { tur: "gonder"; istekId: string; istekSurum: number; anahtar: string; pdf: Uint8Array; ad: string; raporNo: string; imzaci: { ad: string; eposta: string };
      oncekiBelge: string | null }
  | { tur: "hata"; y: RaporYazma };
export async function signHazirla(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, id: string, asama: Asama,
  uret: (v: BelgeVerisi) => Promise<Uint8Array>): Promise<SignHazirlik> {
  if (!(await signAcik(db))) return { tur: "hata", y: { durum: "red", neden: "Bu firmada probata sign bağlı değil." } };
  const h = asama === "uzman" ? await imzaHazirla(db, depo, kim, firmaId, id, uret) : await teknikImzaHazirla(db, depo, kim, firmaId, id, uret);
  if (h.durum !== "tamam") return { tur: "hata", y: h };
  const i = await bekleyen(db, id, asama);
  if (!i) return { tur: "hata", y: { durum: "cakisma" } };
  if (i.sign_istek && i.sign_belge && (i.sign_durum ?? "bekliyor") === "bekliyor") {
    return { tur: "acik", baglanti: i.sign_baglanti ? coz(i.sign_baglanti, firmaId, BAGLANTI_AD) : null, belge: i.sign_belge };
  }
  const anahtar = await sirKullan(db, "sign_anahtari");
  if (!anahtar) return { tur: "hata", y: { durum: "red", neden: "Bu firmada probata sign bağlı değil." } };
  const d = await kayitDosyasi(db, PDF_MODULU, id, i.pdf_dosya);
  if (!d) return { tur: "hata", y: { durum: "red", neden: "İmzaya hazırlanan PDF bulunamadı; yeniden deneyin." } };
  const pdf = await depo.oku(d.anahtar, db);
  const r = (await db.sorgu<{ no: string; revizyon: number }>("SELECT no, revizyon FROM rapor WHERE id = $1", [id])).rows[0]!;
  const no = r.revizyon > 0 ? `${r.no}-R${r.revizyon}` : r.no;
  const e = (await db.sorgu<{ eposta: string; ad: string }>("SELECT eposta, ad FROM hesap WHERE id = $1", [kim.id])).rows[0];
  if (!e?.eposta) return { tur: "hata", y: { durum: "red", neden: "Hesabınızda e-posta yok; probata sign imzacıyı e-postasıyla tanır." } };
  return { tur: "gonder", istekId: i.id, istekSurum: i.surum, anahtar, pdf, ad: d.ad || `${no}.pdf`, raporNo: asama === "teknik" ? `${no} · teknik` : no,
    imzaci: { ad: kim.ad || e.ad, eposta: e.eposta }, oncekiBelge: i.sign_belge };
}

/* ── 2 · sign'a gönder (işlem dışında) ── */
const sonTarih = (simdi: Date): string => {
  /* Türkiye saati (+03:00), gün sonu */
  const t = new Date(simdi.getTime() + SIGN_GUN * 86_400_000 + 3 * 3_600_000);
  return `${t.toISOString().slice(0, 10)}T23:59:00+03:00`;
};
/** toplu: istek imzacının sign üyeliğine bağlanır (her_zaman_baglanti false — sign'ın toplu imzası, PIN bir kez); üye değilse bağlantı gelir */
export async function signGonder(h: Extract<SignHazirlik, { tur: "gonder" }>, istemci: SignIstemcisi = signIstemcisi(h.anahtar), simdi = new Date(),
  secenek: { toplu?: boolean } = {}): Promise<{ belge: string; istek: string; baglanti: string | null }> {
  const yukle = async () => {
    try { return await istemci.belgeYukle(h.pdf, { ad: h.ad, raporNo: h.raporNo }); }
    catch (e) {
      /* aynı rapor no, farklı PDF (yeniden hazırlanmış): yeni sürüm olarak */
      if (e instanceof SignHatasi && e.kod === 409) return istemci.belgeYukle(h.pdf, { ad: h.ad, raporNo: h.raporNo, revizyon: true });
      throw e;
    }
  };
  let b = await yukle();
  /* kapanmış belge (iptal edilmiş) yeniden imzaya açılmaz: rapor nosuz yeni belge */
  if (b.durum === "iptal" || b.durum === "tamamlandi") b = await istemci.belgeYukle(h.pdf, { ad: h.ad, raporNo: null });
  /* belgede açık bir istek kalmışsa (önceki deneme kaydedilemeden düştü) iptal edilir, yenisi açılır */
  if (b.durum === "imzada") {
    const a = await istemci.belgeGetir(b.id);
    if (a.imza_istegi && a.imza_istegi.durum === "acik") await istemci.istekIptal(a.imza_istegi.id);
    if (a.imza_istegi) b = await istemci.belgeYukle(h.pdf, { ad: h.ad, raporNo: null });
  }
  const i = await istemci.imzaIstegiAc(b.id, { ad: h.imzaci.ad, eposta: h.imzaci.eposta, sonTarih: sonTarih(simdi),
    mesaj: `probata · ${h.raporNo}`, herZamanBaglanti: !secenek.toplu });
  const baglanti = i.imzacilar[0]?.baglanti ?? null;
  /* toplu istek üyeye bağlandıysa bağlantı yok — üye sign'ın toplu sayfasında imzalar */
  if (secenek.toplu && !baglanti && i.imzacilar[0]?.uye) return { belge: b.id, istek: i.id, baglanti: null };
  if (!baglanti || !/^https:\/\/[^\s]+$/.test(baglanti) && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(baglanti)) {
    throw new SignHatasi(502, "baglanti", "probata sign imza bağlantısı vermedi.");
  }
  return { belge: b.id, istek: i.id, baglanti };
}

/* ── 3 · kaydet (işlem içinde) ── */
export async function signKaydet(db: Sorgulayici, kim: Kisi, firmaId: string, istekId: string, s: { belge: string; istek: string; baglanti: string | null }): Promise<boolean> {
  const i = (await db.sorgu<{ surum: number }>("SELECT surum FROM imza_istegi WHERE id = $1 AND durum = 'bekliyor'", [istekId])).rows[0];
  if (!i) return false;
  const g = await guncelle(db, SIGN_ISTEK, istekId, i.surum, { sign_belge: s.belge, sign_istek: s.istek, sign_baglanti: s.baglanti ? sifrele(s.baglanti, firmaId, BAGLANTI_AD) : null,
    sign_durum: "bekliyor", sign_neden: null }, { kim: kim.ad, ne: "rapor.sign_istek" });
  return g.durum === "tamam";
}

/** reddedildi / iptal / hata: isteğe sign durumu (istek bekliyor kalır — elle yol ve yeniden "İmzala" açık) */
async function signDurumYaz(db: Sorgulayici, i: IstekSatiri, durum: "reddedildi" | "iptal" | "hata", neden: string | null, kim: string): Promise<void> {
  const g = await guncelle(db, SIGN_ISTEK, i.id, i.surum, { sign_durum: durum, sign_neden: neden ? neden.slice(0, 400) : null }, { kim, ne: `rapor.sign_${durum}` });
  if (g.durum !== "tamam") throw new Error("imza isteği bu arada değişti");
}

/* ── tamamla: sign'daki belgenin durumu → imzalı PDF bugünkü yükleme yolundan ── */
export interface IslemCalistir { <T>(hesapId: string | null, is: (db: Sorgulayici) => Promise<T>): Promise<T> }
/** firmanın kiracı işlemi (webhook: oturum yok — hesap isteğin sahibi; null: kişi bağlamı yok) */
export const firmaCalistirici = (k: KiraciYeri): IslemCalistir => (hesapId, is) =>
  kiraciIcinde(kiraciHavuzu(k), k.firmaId, is, hesapId ? { hesapId } : {});

export type SignSonuc = { durum: "tamam"; bildirim: string } | { durum: "bekliyor" } | { durum: "kapandi"; neden: string } | { durum: "hata"; neden: string };
/** isteğin sign'daki durumuna göre sonuçlandır. calistir: firmanın işlemi; depo: dosya deposu */
export async function signSonuclandir(calistir: IslemCalistir, depo: Depo, firmaId: string, istekId: string,
  istemciKur: (anahtar: string) => SignIstemcisi = (a) => signIstemcisi(a)): Promise<SignSonuc> {
  const on = await calistir(null, async (db) => {
    const i = (await db.sorgu<IstekSatiri>(`SELECT ${ISTEK_SUTUN} FROM imza_istegi WHERE id = $1`, [istekId])).rows[0];
    return i ? { i, anahtar: await sirKullan(db, "sign_anahtari") } : null;
  });
  if (!on || !on.i.sign_belge || !on.i.hesap_id) return { durum: "hata", neden: "İmza isteği bulunamadı." };
  const { i } = on;
  if (!on.anahtar) return { durum: "hata", neden: "Bu firmada probata sign bağlı değil." };
  const istemci = istemciKur(on.anahtar);
  const b = await istemci.belgeGetir(i.sign_belge!);
  const ist = b.imza_istegi && (!i.sign_istek || b.imza_istegi.id === i.sign_istek) ? b.imza_istegi : null;
  if (b.durum !== "tamamlandi") {
    const kapandi = ist && ["reddedildi", "iptal", "suresi_doldu"].includes(ist.durum) ? ist.durum : b.durum === "reddedildi" ? "reddedildi" : b.durum === "iptal" ? "iptal" : null;
    if (!kapandi) return { durum: "bekliyor" };
    const neden = kapandi === "reddedildi" ? `İmzacı reddetti${ist?.imzacilar.find((x) => x.red_nedeni)?.red_nedeni ? `: ${ist.imzacilar.find((x) => x.red_nedeni)!.red_nedeni}` : ""}.`
      : kapandi === "suresi_doldu" ? "probata sign'daki imza isteğinin süresi doldu." : "probata sign'daki imza isteği iptal edildi.";
    await calistir(i.hesap_id, (db) => signDurumYaz(db, i, kapandi === "reddedildi" ? "reddedildi" : "iptal", neden, "probata sign"));
    return { durum: "kapandi", neden };
  }
  const pdf = await istemci.pdfAl(i.sign_belge!);
  const y = await calistir(i.hesap_id, async (db) => {
    /* isteğin sahibi kişinin yetkisiyle — bugünkü yükleme yolu */
    const h = (await db.sorgu<{ id: string; ad: string; roller: Kisi["roller"] }>("SELECT id::text, ad, roller FROM hesap WHERE id = $1", [i.hesap_id])).rows[0];
    if (!h) return { durum: "yok" } as RaporYazma;
    const kim: Kisi = { id: h.id, ad: h.ad, roller: h.roller };
    const r = (await db.sorgu<{ surum: number }>("SELECT surum FROM rapor WHERE id = $1", [i.rapor_id])).rows[0];
    if (!r) return { durum: "yok" } as RaporYazma;
    const dosya = { ad: `${i.rapor_id.slice(0, 8)}-imzali.pdf`, bayt: pdf };
    return i.asama === "uzman" ? imzaliYukle(db, depo, kim, firmaId, i.rapor_id, r.surum, dosya) : teknikImzaliYukle(db, depo, kim, firmaId, i.rapor_id, r.surum, dosya);
  });
  if (y.durum === "tamam") return { durum: "tamam", bildirim: y.bildirim };
  const neden = y.durum === "gecersiz" ? Object.values(y.hatalar)[0] ?? "İmzalı PDF denetimden geçmedi." : y.durum === "red" ? y.neden
    : y.durum === "cakisma" ? "Rapor bu arada değişti; Durumu yenile'ye basın." : "İmzalı PDF işlenemedi.";
  /* denetimden geçmeyen imza: neden isteğe yazılır (istek bekliyor kalır) */
  if (y.durum !== "cakisma") await calistir(i.hesap_id, async (db) => {
    const t = (await db.sorgu<IstekSatiri>(`SELECT ${ISTEK_SUTUN} FROM imza_istegi WHERE id = $1 AND durum = 'bekliyor'`, [istekId])).rows[0];
    if (t) await signDurumYaz(db, t, "hata", neden, "probata sign");
  });
  return { durum: "hata", neden };
}

/* ── webhook ── */
export type BildirimSonucu = { kod: 200 | 202; ileti: string } | { kod: 400 | 401 | 404 | 503; ileti: string };
/** sign'ın bildirimi: imza (X-Probata-Imza) firmanın webhook sırrıyla doğrulanır; aynı gönderim iki kez işlenmez; belge.tamamlandi / imza.reddedildi /
    istek.iptal o belgenin isteğini sonuçlandırır. Geçici hata (sign'a ulaşılamadı) 503 — sign yeniden dener */
export async function signBildirim(calistir: IslemCalistir, depo: Depo, firmaId: string, g: { govde: string; imza: string | null; gonderim: string | null },
  istemciKur?: (anahtar: string) => SignIstemcisi, simdi = new Date()): Promise<BildirimSonucu> {
  const sir = await calistir(null, (db) => sirKullan(db, "sign_webhook_sirri"));
  if (!sir) return { kod: 404, ileti: "Bu firmada probata sign bağlı değil." };
  if (!webhookDogrula(g.imza, g.govde, sir, simdi)) return { kod: 401, ileti: "İmza doğrulanamadı." };
  let j: { id?: unknown; olay?: unknown; veri?: { belge_id?: unknown } };
  try { j = JSON.parse(g.govde); } catch { return { kod: 400, ileti: "Gövde okunamadı." }; }
  const gonderim = String(g.gonderim ?? j.id ?? "");
  const olay = String(j.olay ?? "");
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(gonderim) || !/^[a-z_.]{3,40}$/.test(olay)) return { kod: 400, ileti: "Bildirim kimliği ya da olayı geçersiz." };
  if (olay === "deneme") return { kod: 200, ileti: "Deneme bildirimi alındı." };
  const belge = typeof j.veri?.belge_id === "string" && /^[0-9a-f-]{36}$/.test(j.veri.belge_id) ? j.veri.belge_id : null;
  if (!["belge.tamamlandi", "imza.reddedildi", "istek.iptal"].includes(olay) || !belge) return { kod: 200, ileti: "Olay yok sayıldı." };
  /* aynı gönderim: bir kez */
  const yeni = await calistir(null, async (db) => ((await db.sorgu(
    "INSERT INTO sign_bildirim (id, olay) VALUES ($1, $2) ON CONFLICT DO NOTHING", [gonderim, olay])).rowCount ?? 0) > 0);
  if (!yeni) return { kod: 200, ileti: "Bildirim daha önce işlendi." };
  const istek = await calistir(null, async (db) => (await db.sorgu<{ id: string }>(
    "SELECT id::text FROM imza_istegi WHERE sign_belge = $1 AND durum = 'bekliyor' ORDER BY olustu DESC LIMIT 1", [belge])).rows[0]?.id ?? null);
  if (!istek) return { kod: 200, ileti: "Bekleyen istek yok." };
  try {
    const s = await signSonuclandir(calistir, depo, firmaId, istek, istemciKur);
    return { kod: 200, ileti: s.durum };
  } catch (e) {
    /* geçici (sign'a ulaşılamadı): kayıt geri alınır, sign yeniden dener */
    if (e instanceof SignHatasi && e.gecici) {
      await calistir(null, (db) => db.sorgu("DELETE FROM sign_bildirim WHERE id = $1", [gonderim])).catch(() => undefined);
      return { kod: 503, ileti: "probata sign'a ulaşılamadı." };
    }
    throw e;
  }
}

/** ekranın "İptal et"i: sign'daki istek iptal, isteğe "iptal" (elle yol ve yeniden "İmzala" açık) */
export async function signIptalHazirla(db: Sorgulayici, kim: Kisi, raporId: string, asama: Asama): Promise<{ istek: IstekSatiri; anahtar: string } | null> {
  const i = await bekleyen(db, raporId, asama);
  if (!i?.sign_istek || i.hesap_id !== kim.id || (i.sign_durum ?? "bekliyor") !== "bekliyor") return null;
  const anahtar = await sirKullan(db, "sign_anahtari");
  return anahtar ? { istek: i, anahtar } : null;
}
export async function signIptalYaz(db: Sorgulayici, kim: Kisi, istekId: string): Promise<void> {
  const i = (await db.sorgu<IstekSatiri>(`SELECT ${ISTEK_SUTUN} FROM imza_istegi WHERE id = $1 AND durum = 'bekliyor'`, [istekId])).rows[0];
  if (i) await signDurumYaz(db, i, "iptal", "İmza isteği iptal edildi.", kim.ad);
}
/** ekranın "Durumu yenile"si için isteğin kimliği (yalnız sahibine) */
export async function signYenilenecek(db: Sorgulayici, kim: Kisi, raporId: string, asama: Asama): Promise<string | null> {
  const i = await bekleyen(db, raporId, asama);
  return i?.sign_istek && i.hesap_id === kim.id ? i.id : null;
}
export { SIGN_TOPLU_EN_COK, SignHatasi, signTopluAdresi };
/** sign'daki isteği iptal (işlem dışında) */
export const signIptalGonder = (anahtar: string, istek: string) => signIstemcisi(anahtar).istekIptal(istek);
/** imzalı PDF özeti (test ve iz için) */
export const pdfOzeti = (b: Uint8Array) => createHash("sha256").update(b).digest("hex");
