/* MÜŞTERİLER — modülün dışa açılan işlevleri (maket musteriler.html; modül 3). Sayfalar ve eylemler yalnız buradan geçer.
   Yetki her işlevde, sunucuda (canDo, modül 3): "gör" ve üstü listeyi ve kartları görür; DEĞİŞTİRMEK yalnız "yaz" düzeyinde (önerilen düzende
   planlama + firma yöneticisi). "Kendi" / "branş" düzeyi müşteride plan modülü gelene kadar hiçbir kayıt göstermez (varsayılan kapalı).
   Yazmalar güvenli yazıcıdan (sürüm kilidi + denetim izi). Tekrar eden vergi / SGK no UYARIDIR: onaysız ilk kayıt "uyari" döner, "Yine de kaydet"
   (onay) ile kaydedilir (karar 45, 46). Kullanılmış müşteri / tesis silinmez, PASİF (karar 48); 364 (§9 elli üçüncü tur): hiç kullanılmamış (deneme)
   müşteri ve tesis yalnız yöneticiye kesin silinir (kayit_sil, modül 3; tanım veritabanında, göç 0060). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { kesinSil, kullanimlar, type Kullanim } from "../../../server/db/silici.ts";
import { ekle, guncelle, tablo, type Iz } from "../../../server/db/yazici.ts";
import { canDoEylem, duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { kullanimMetni } from "../../../components/sil/metin.ts";
import { dogrula, type DogrulamaHatalari } from "../../../sema/ortak.ts";
import { kisaAd, MusteriGirdisi, TesisGirdisi } from "../sema.ts";
import { anaGirisDurumu, anaGirisEpostasi } from "./girisler.ts";

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
  | { durum: "tamam"; id: string; surum: number; bildirim?: string }
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
    (müşteri girişinin kullanıcı adı). E-posta değişince ana giriş sıfırlanır (yeni adrese yeni geçici parola): önce uyarı, sonra bildirim
    (319 incelemesi). E-posta denetimleri yalnız e-posta DEĞİŞİNCE (değişmeyen kartın başka alanı her zaman kaydedilir). */
export async function musteriKaydet(db: Sorgulayici, kim: Kisi, id: string | null, surum: number, girdi: unknown, onay: boolean): Promise<Yazma> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  const g = dogrula(MusteriGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const v = g.veri, digeri = id && UUID.test(id) ? id : "00000000-0000-0000-0000-000000000000";
  /* güncellemede kaydın şimdiki e-postası (satır kilitli: ana giriş işlemleri de müşteriyi önce kilitler — aynı sıra) */
  const eski = id ? (await db.sorgu<{ eposta: string | null }>("SELECT eposta FROM musteri WHERE id = $1 FOR UPDATE", [digeri])).rows[0] : undefined;
  if (id && !eski) return { durum: "yok" };
  const epostaDegisti = v.eposta !== (eski?.eposta ?? null);
  if (v.eposta && epostaDegisti) {
    const e = await db.sorgu("SELECT 1 FROM musteri WHERE eposta = $1 AND id <> $2", [v.eposta, digeri]);
    if (e.rowCount) return { durum: "gecersiz", hatalar: { eposta: "Bu e-posta başka bir müşteride kayıtlı." } };
    /* 0030: e-posta müşteri girişinin kullanıcı adı — firmada personel hesabıyla ya da başka bir girişle çakışmaz */
    const g2 = await db.sorgu("SELECT 1 FROM hesap WHERE eposta = $1 UNION ALL SELECT 1 FROM musteri_hesap WHERE eposta = $1 AND NOT (ana AND musteri_id = $2::uuid)", [v.eposta, digeri]);
    if (g2.rowCount) return { durum: "gecersiz", hatalar: { eposta: "Bu e-posta firmada bir girişin kullanıcı adı (personel ya da müşteri girişi)." } };
  }
  /* ana giriş kullanılıyorsa (geçici parola verilmiş ya da müşteri giriyor) e-posta değişince sıfırlanır */
  const anaDurum = id && epostaDegisti ? await anaGirisDurumu(db, digeri) : null;
  const anaSifir = anaDurum === "ilk" || anaDurum === "etkin";
  if (!onay) {
    const u: Record<string, string> = {};
    if (v.vno) {
      const a = (await db.sorgu<{ kisa: string }>("SELECT kisa FROM musteri WHERE vno = $1 AND id <> $2 ORDER BY kisa LIMIT 1", [v.vno, digeri])).rows[0];
      if (a) u.vno = `Bu vergi no ${a.kisa} müşterisinde de kayıtlı. Aynı müşteri olabilir.`;
    }
    if (anaSifir) u.eposta = v.eposta
      ? "E-posta değişince müşteri girişi sıfırlanır: müşteri yeni adrese vereceğiniz geçici parolayla girer."
      : "E-posta silinince müşteri girişi kapanır.";
    if (Object.keys(u).length) return { durum: "uyari", uyarilar: u };
  }
  const degerler = { unvan: v.unvan, kisa: kisaAd(v), vd: v.vd, vno: v.vno, eposta: v.eposta, tel: v.tel, ilgili: v.ilgili };
  if (!id) {
    const r = await ekle(db, MUSTERI, degerler, { kim: kim.ad, ne: "musteri.ekle", gerekce: onay ? "uyarı görüldü, yine de kaydedildi" : undefined });
    return { durum: "tamam", ...r };
  }
  if (!surumGecerli(surum)) return { durum: "cakisma" };
  try {
    const r = await guncelle(db, MUSTERI, id, surum, degerler, { kim: kim.ad, ne: "musteri.guncelle", gerekce: onay ? "uyarı görüldü, yine de kaydedildi" : undefined });
    const c = cevir(r); if (c) return c;
    /* ana girişin kullanıcı adı müşterinin e-postasıyla gider (yeni adrese yeni geçici parola; e-posta silinirse giriş pasif). Ana giriş yukarıda
       kilitlendi ve e-posta danışma kilidiyle tutuldu: burada çakışma olmaz; olursa YARIM kayıt kalmasın — işlem geri alınır (319 incelemesi) */
    if ((await anaGirisEpostasi(db, kim, id, v.eposta)) === "cakisma") throw new Error("müşteri girişi e-postayla birlikte güncellenemedi");
    const bildirim = anaSifir ? (v.eposta ? "Müşteri güncellendi. Müşteri girişi sıfırlandı; yeni geçici parola verin." : "Müşteri güncellendi. Müşteri girişi kapandı (e-posta silindi).") : undefined;
    return { durum: "tamam", id, surum: (r as { surum: number }).surum, ...(bildirim ? { bildirim } : {}) };
  } catch (h) {
    /* veritabanı (0033): e-posta bu arada bir girişin kullanıcı adı oldu */
    const e = h as { code?: string; constraint?: string };
    if (e.code === "23505" && e.constraint === "giris_eposta") return { durum: "gecersiz", hatalar: { eposta: "Bu e-posta firmada bir girişin kullanıcı adı (personel ya da müşteri girişi)." } };
    throw h;
  }
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

/** öteki modüller için müşteri + tesis özeti (yetki ÇAĞIRANDA; Sözleşmeler kendi düzeyine göre gösterir). Pasif müşteri ve tesis dahil, işaretli. */
export async function musteriOzetleri(db: Sorgulayici): Promise<{ id: string; unvan: string; kisa: string; vd: string | null; vno: string | null; pasif: boolean;
  tesisler: { id: string; ad: string; adres: string | null; il: string | null; ilce: string | null; sgk: string | null; pasif: boolean }[] }[]> {
  const m = (await db.sorgu<{ id: string; unvan: string; kisa: string; vd: string | null; vno: string | null; pasif: string | null }>("SELECT id::text, unvan, kisa, vd, vno, pasif FROM musteri")).rows;
  const t = (await db.sorgu<TesisSatirDb>(TESIS_SEC)).rows;
  return m.map((x) => ({ id: x.id, unvan: x.unvan, kisa: x.kisa, vd: x.vd, vno: x.vno, pasif: !!x.pasif,
    tesisler: t.filter((y) => y.musteri_id === x.id).map((y) => ({ id: y.id, ad: y.ad, adres: y.adres, il: y.il, ilce: y.ilce, sgk: y.sgk, pasif: !!y.pasif })).sort((a, b) => a.ad.localeCompare(b.ad, "tr")) }))
    .sort((a, b) => a.kisa.localeCompare(b.kisa, "tr"));
}

/** Teklifler için (teklif sayfasının "İlgili kişi"si, teklif belgesinin müşteri bilgileri — 325): müşterinin ünvanı, vergi bilgisi, e-postası,
    telefonu, ilgili kişisi; yoksa null. Yetki ÇAĞIRANDA. */
export async function musteriIletisim(db: Sorgulayici, id: string): Promise<{ unvan: string; vd: string | null; vno: string | null; eposta: string | null;
  tel: string | null; ilgili: string | null } | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  return (await db.sorgu<{ unvan: string; vd: string | null; vno: string | null; eposta: string | null; tel: string | null; ilgili: string | null }>(
    "SELECT unvan, vd, vno, eposta, tel, ilgili FROM musteri WHERE id = $1", [id])).rows[0] ?? null;
}

/** Raporlar için: tesisin adı, müşterisinin ünvanı / kısa adı, e-postası, telefonu (raporun künyesine kopyalanır); yoksa null. Yetki ÇAĞIRANDA. */
export async function tesisMusteriIletisim(db: Sorgulayici, tesisId: string): Promise<{ tesisAd: string; unvan: string; kisa: string; eposta: string | null; tel: string | null } | null> {
  if (!/^[0-9a-f-]{36}$/.test(tesisId)) return null;
  return (await db.sorgu<{ tesisAd: string; unvan: string; kisa: string; eposta: string | null; tel: string | null }>(
    `SELECT t.ad AS "tesisAd", m.unvan, m.kisa, m.eposta, m.tel FROM tesis t JOIN musteri m ON m.id = t.musteri_id AND m.firma_id = t.firma_id WHERE t.id = $1`, [tesisId])).rows[0] ?? null;
}

/* ── KESİN SİLME (364; reisim 2026-10-07 "eklenebilen şeyler silinemiyor"; §9 elli üçüncü tur) — yalnız yönetici (kayit_sil, modül 3) ve yalnız hiç
   kullanılmamış kayıt. Müşteri: tesisleri ve hiç girilmemiş girişleriyle birlikte. Kullanılmış kayıt pasife alınır (karar 48). */
export type SilYaniti = { durum: "tamam"; ad: string } | { durum: "red"; neden: string } | { durum: "yok" } | { durum: "yetkisiz" };
const silebilir = (kim: YetkiHesabi) => canDoEylem(kim, "kayit_sil", { modul: MODUL });

/** müşteri / tesis sayfası: "Sil" çizilir mi (silebilen + kullanılmamış); değiştirene kullanım sayımları (Pasife al penceresi nedeni söyler) */
export async function silmeDurumu(db: Sorgulayici, kim: YetkiHesabi, tur: "musteri" | "tesis", id: string): Promise<{ sil: boolean; kullanim: Kullanim | null }> {
  if (!degistirir(kim) || !UUID.test(id)) return { sil: false, kullanim: null };
  const k = (await kullanimlar(db, tur, [id])).get(id) ?? null;
  return { sil: silebilir(kim) && !k, kullanim: k };
}

export async function musteriSil(db: Sorgulayici, kim: Kisi, id: string): Promise<SilYaniti> {
  if (!silebilir(kim)) return { durum: "yetkisiz" };
  const r = await kesinSil(db, "musteri", id, kim.ad);
  if (r.durum === "kullanildi") return { durum: "red", neden: `Müşteri silinemez: ${kullanimMetni(r.kullanim) || "başka kayıtlarda"} kullanıldı. Pasife alın.` };
  return r;
}

export async function tesisSil(db: Sorgulayici, kim: Kisi, id: string): Promise<SilYaniti> {
  if (!silebilir(kim)) return { durum: "yetkisiz" };
  const r = await kesinSil(db, "tesis", id, kim.ad);
  if (r.durum === "kullanildi") return { durum: "red", neden: `Tesis silinemez: ${kullanimMetni(r.kullanim) || "başka kayıtlarda"} kullanıldı. Pasife alın.` };
  return r;
}
