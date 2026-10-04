/* MÜŞTERİLER — modülün dışa açılan işlevleri (maket musteriler.html; modül 3). Sayfalar ve eylemler yalnız buradan geçer.
   Yetki her işlevde, sunucuda (canDo, modül 3): "gör" ve üstü listeyi ve kartları görür; DEĞİŞTİRMEK yalnız "yaz" düzeyinde (önerilen düzende
   planlama + firma yöneticisi). "Kendi" / "branş" düzeyi müşteride plan modülü gelene kadar hiçbir kayıt göstermez (varsayılan kapalı).
   Yazmalar güvenli yazıcıdan (sürüm kilidi + denetim izi). Tekrar eden vergi / SGK no UYARIDIR: onaysız ilk kayıt "uyari" döner, "Yine de kaydet"
   (onay) ile kaydedilir (karar 45, 46). Silme yok, PASİF (karar 48). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ekle, guncelle, tablo, type Iz } from "../../../server/db/yazici.ts";
import { duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { dogrula, type DogrulamaHatalari } from "../../../sema/ortak.ts";
import { kisaAd, MusteriGirdisi, TesisGirdisi } from "../sema.ts";

const MODUL = 3;
const MUSTERI = tablo({ ad: "musteri", sutunlar: ["unvan", "kisa", "vd", "vno", "eposta", "tel", "ilgili", "pasif"] });
const TESIS = tablo({ ad: "tesis", sutunlar: ["musteri_id", "ad", "adres", "il", "ilce", "sgk", "pasif", "musteriyle"] });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface Kisi extends YetkiHesabi { ad: string }

export interface TesisSatiri { id: string; musteriId: string; ad: string; adres: string | null; il: string | null; ilce: string | null; sgk: string | null; pasif: string | null }
export interface MusteriSatiri {
  id: string; unvan: string; kisa: string; vno: string | null; eposta: string | null; pasif: string | null; tesisler: TesisSatiri[];
}
export interface MusteriKarti extends MusteriSatiri { vd: string | null; tel: string | null; ilgili: string | null; acilis: string; surum: number }
export interface TesisKarti extends TesisSatiri { surum: number; musteri: { id: string; unvan: string; kisa: string; pasif: string | null } }

export type Yazma =
  | { durum: "tamam"; id: string; surum: number }
  | { durum: "uyari"; uyarilar: DogrulamaHatalari }
  | { durum: "gecersiz"; hatalar: DogrulamaHatalari }
  | { durum: "red"; neden: string }
  | { durum: "cakisma" } | { durum: "yok" } | { durum: "yetkisiz" };

/** Türkiye takvim günü (pasif tarihi) */
const bugun = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

const gorur = (kim: YetkiHesabi) => ["gor", "yaz"].includes(duzey(kim, MODUL));
const degistirir = (kim: YetkiHesabi) => duzey(kim, MODUL) === "yaz";
export const musteriDegistirir = degistirir;

type TesisSatirDb = { id: string; musteri_id: string; ad: string; adres: string | null; il: string | null; ilce: string | null; sgk: string | null; pasif: string | null };
const tesisSatiri = (t: TesisSatirDb): TesisSatiri => ({ id: t.id, musteriId: t.musteri_id, ad: t.ad, adres: t.adres, il: t.il, ilce: t.ilce, sgk: t.sgk, pasif: t.pasif });
const TESIS_SEC = "SELECT id::text, musteri_id::text, ad, adres, il, ilce, sgk, pasif FROM tesis";

/** liste: firmanın bütün müşterileri (pasifler dahil; ekran Görünüm seçicisiyle ayırır) + tesisleri; yetkisi yoksa null */
export async function musteriListesi(db: Sorgulayici, kim: Kisi): Promise<MusteriSatiri[] | null> {
  const d = duzey(kim, MODUL);
  if (d === "yok") return null;
  if (!gorur(kim)) return [];
  const m = await db.sorgu<{ id: string; unvan: string; kisa: string; vno: string | null; eposta: string | null; pasif: string | null }>(
    "SELECT id::text, unvan, kisa, vno, eposta, pasif FROM musteri");
  const t = await db.sorgu<TesisSatirDb>(TESIS_SEC);
  const tesisleri = new Map<string, TesisSatiri[]>();
  for (const x of t.rows) { const l = tesisleri.get(x.musteri_id) ?? []; l.push(tesisSatiri(x)); tesisleri.set(x.musteri_id, l); }
  return m.rows
    .map((x) => ({ ...x, tesisler: (tesisleri.get(x.id) ?? []).sort((a, b) => a.ad.localeCompare(b.ad, "tr")) }))
    .sort((a, b) => a.unvan.localeCompare(b.unvan, "tr"));
}

/** müşteri kartı: görme yetkisi yoksa ya da başka firmanın / olmayan kaydıysa null (ayrım yapılmaz) */
export async function musteriKarti(db: Sorgulayici, kim: Kisi, id: string): Promise<MusteriKarti | null> {
  if (!UUID.test(id) || !gorur(kim)) return null;
  const x = (await db.sorgu<{ id: string; unvan: string; kisa: string; vd: string | null; vno: string | null; eposta: string | null; tel: string | null; ilgili: string | null; acilis: string; pasif: string | null; surum: number }>(
    "SELECT id::text, unvan, kisa, vd, vno, eposta, tel, ilgili, acilis, pasif, surum FROM musteri WHERE id = $1", [id])).rows[0];
  if (!x) return null;
  const t = await db.sorgu<TesisSatirDb>(`${TESIS_SEC} WHERE musteri_id = $1`, [id]);
  return { ...x, tesisler: t.rows.map(tesisSatiri).sort((a, b) => (a.pasif ? 1 : 0) - (b.pasif ? 1 : 0) || a.ad.localeCompare(b.ad, "tr")) };
}

export async function tesisKarti(db: Sorgulayici, kim: Kisi, id: string): Promise<TesisKarti | null> {
  if (!UUID.test(id) || !gorur(kim)) return null;
  const x = (await db.sorgu<TesisSatirDb & { surum: number; m_unvan: string; m_kisa: string; m_pasif: string | null }>(
    `SELECT t.id::text, t.musteri_id::text, t.ad, t.adres, t.il, t.ilce, t.sgk, t.pasif, t.surum, m.unvan AS m_unvan, m.kisa AS m_kisa, m.pasif AS m_pasif
       FROM tesis t JOIN musteri m ON m.id = t.musteri_id AND m.firma_id = t.firma_id WHERE t.id = $1`, [id])).rows[0];
  if (!x) return null;
  return { ...tesisSatiri(x), surum: x.surum, musteri: { id: x.musteri_id, unvan: x.m_unvan, kisa: x.m_kisa, pasif: x.m_pasif } };
}

/** istemcinin yolladığı sürüm bozuksa yazıcı hata fırlatmasın: "başkası değiştirdi" gibi davranılır */
const surumGecerli = (s: number) => Number.isSafeInteger(s) && s >= 0;
const cevir = (r: { durum: string }): Yazma | null =>
  r.durum === "cakisma" ? { durum: "cakisma" } : r.durum === "yok" ? { durum: "yok" } : null;

/** müşteri ekle (id boş) ya da güncelle. Aynı vergi no başka müşteride → uyarı (onay ile geçer); aynı e-posta başka müşteride → hata
    (müşteri girişinin kullanıcı adı). */
export async function musteriKaydet(db: Sorgulayici, kim: Kisi, id: string | null, surum: number, girdi: unknown, onay: boolean): Promise<Yazma> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  const g = dogrula(MusteriGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const v = g.veri, digeri = id && UUID.test(id) ? id : "00000000-0000-0000-0000-000000000000";
  if (v.eposta) {
    const e = await db.sorgu("SELECT 1 FROM musteri WHERE eposta = $1 AND id <> $2", [v.eposta, digeri]);
    if (e.rowCount) return { durum: "gecersiz", hatalar: { eposta: "Bu e-posta başka bir müşteride kayıtlı." } };
  }
  if (v.vno && !onay) {
    const a = (await db.sorgu<{ kisa: string }>("SELECT kisa FROM musteri WHERE vno = $1 AND id <> $2 ORDER BY kisa LIMIT 1", [v.vno, digeri])).rows[0];
    if (a) return { durum: "uyari", uyarilar: { vno: `Bu vergi no ${a.kisa} müşterisinde de kayıtlı. Aynı müşteri olabilir.` } };
  }
  const degerler = { unvan: v.unvan, kisa: kisaAd(v), vd: v.vd, vno: v.vno, eposta: v.eposta, tel: v.tel, ilgili: v.ilgili };
  if (!id) {
    const r = await ekle(db, MUSTERI, degerler, { kim: kim.ad, ne: "musteri.ekle", gerekce: onay ? "uyarı görüldü, yine de kaydedildi" : undefined });
    return { durum: "tamam", ...r };
  }
  if (!surumGecerli(surum)) return { durum: "cakisma" };
  const r = await guncelle(db, MUSTERI, id, surum, degerler, { kim: kim.ad, ne: "musteri.guncelle", gerekce: onay ? "uyarı görüldü, yine de kaydedildi" : undefined });
  return cevir(r) ?? { durum: "tamam", id, surum: (r as { surum: number }).surum };
}

/** tesis ekle (id boş; müşterinin altına) ya da güncelle. Pasif müşteriye tesis eklenmez. Aynı SGK DETSİS NO başka tesiste → uyarı. */
export async function tesisKaydet(db: Sorgulayici, kim: Kisi, musteriId: string, id: string | null, surum: number, girdi: unknown, onay: boolean): Promise<Yazma> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(musteriId)) return { durum: "yok" };
  const g = dogrula(TesisGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const m = (await db.sorgu<{ pasif: string | null }>("SELECT pasif FROM musteri WHERE id = $1", [musteriId])).rows[0];
  if (!m) return { durum: "yok" };
  if (id) {
    const t = (await db.sorgu<{ musteri_id: string }>("SELECT musteri_id::text FROM tesis WHERE id = $1", [UUID.test(id) ? id : null])).rows[0];
    if (!t || t.musteri_id !== musteriId) return { durum: "yok" };   // tesis başka müşteriye taşınmaz (karar 47)
  } else if (m.pasif) return { durum: "red", neden: "Müşteri pasif; önce müşteriyi yeniden etkinleştirin." };
  const v = g.veri;
  if (v.sgk && !onay) {
    const a = (await db.sorgu<{ ad: string; kisa: string }>(
      "SELECT t.ad, m.kisa FROM tesis t JOIN musteri m ON m.id = t.musteri_id WHERE t.sgk = $1 AND t.id <> $2 ORDER BY m.kisa, t.ad LIMIT 1",
      [v.sgk, id ?? "00000000-0000-0000-0000-000000000000"])).rows[0];
    if (a) return { durum: "uyari", uyarilar: { sgk: `Bu SGK DETSİS NO ${a.kisa} / ${a.ad} tesisinde de kayıtlı. Aynı tesis olabilir.` } };
  }
  const degerler = { ad: v.ad, adres: v.adres, il: v.il, ilce: v.il ? v.ilce : null, sgk: v.sgk };
  const iz: Iz = { kim: kim.ad, ne: id ? "tesis.guncelle" : "tesis.ekle", gerekce: onay ? "uyarı görüldü, yine de kaydedildi" : undefined };
  if (!id) return { durum: "tamam", ...(await ekle(db, TESIS, { musteri_id: musteriId, ...degerler }, iz)) };
  if (!surumGecerli(surum)) return { durum: "cakisma" };
  const r = await guncelle(db, TESIS, id, surum, degerler, iz);
  return cevir(r) ?? { durum: "tamam", id, surum: (r as { surum: number }).surum };
}

/** pasif yap / yeniden etkinleştir (karar 48). Müşteri pasif olunca etkin tesisleri onunla pasif olur; müşteri dönünce yalnız onlar döner. */
export async function musteriPasif(db: Sorgulayici, kim: Kisi, id: string, surum: number, pasif: boolean): Promise<Yazma> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  if (!surumGecerli(surum)) return { durum: "cakisma" };
  const gun = bugun();
  const r = await guncelle(db, MUSTERI, id, surum, { pasif: pasif ? gun : null }, { kim: kim.ad, ne: pasif ? "musteri.pasif" : "musteri.etkinlestir" });
  const c = cevir(r); if (c) return c;
  const tesisler = await db.sorgu<{ id: string; surum: number }>(
    pasif ? "SELECT id::text, surum FROM tesis WHERE musteri_id = $1 AND pasif IS NULL" : "SELECT id::text, surum FROM tesis WHERE musteri_id = $1 AND musteriyle",
    [id]);
  for (const t of tesisler.rows) {
    await guncelle(db, TESIS, t.id, t.surum, pasif ? { pasif: gun, musteriyle: true } : { pasif: null, musteriyle: false },
      { kim: kim.ad, ne: pasif ? "tesis.pasif" : "tesis.etkinlestir", gerekce: "müşteriyle birlikte" });
  }
  return { durum: "tamam", id, surum: (r as { surum: number }).surum };
}

export async function tesisPasif(db: Sorgulayici, kim: Kisi, id: string, surum: number, pasif: boolean): Promise<Yazma> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(id)) return { durum: "yok" };
  if (!surumGecerli(surum)) return { durum: "cakisma" };
  if (!pasif) {
    const m = (await db.sorgu<{ pasif: string | null }>("SELECT m.pasif FROM tesis t JOIN musteri m ON m.id = t.musteri_id WHERE t.id = $1", [id])).rows[0];
    if (!m) return { durum: "yok" };
    if (m.pasif) return { durum: "red", neden: "Müşteri pasif; önce müşteriyi yeniden etkinleştirin." };
  }
  const r = await guncelle(db, TESIS, id, surum, pasif ? { pasif: bugun(), musteriyle: false } : { pasif: null, musteriyle: false },
    { kim: kim.ad, ne: pasif ? "tesis.pasif" : "tesis.etkinlestir" });
  return cevir(r) ?? { durum: "tamam", id, surum: (r as { surum: number }).surum };
}
