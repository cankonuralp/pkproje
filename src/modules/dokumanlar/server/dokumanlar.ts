/* DÖKÜMANLAR — modülün dışa açılan işlevleri (maket standartlar.html; modül 4, M7). Sayfalar ve eylemler yalnız buradan geçer.
   Yetki her işlevde, sunucuda (canDo, modül 4): "gör" ve üstü standartları, kriterleri ve dökümanları görür, PDF'leri açar (reisim: "muayene
   personellerinin standartlara ulaşabilmesini istiyorum"); YÜKLEMEK / DEĞİŞTİRMEK / KALDIRMAK yalnız "yaz" düzeyinde (yöneticiler). Standart telifli
   belgedir: firmanın kopyası, yalnız firma içinde, kısa ömürlü yetkili indirme (kalıcı bağlantı yok — tek dosya yolu). Sürümlü: yeni sürüm
   eskisini "önceki" yapar; güncel sürüm kaldırılırsa bir önceki yeniden güncel olur. Silme yok (kaldırılan satır ve dosya saklanır). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ekle, guncelle, tablo } from "../../../server/db/yazici.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { dosyaYukle } from "../../../server/dosya/dosya.ts";
import { duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { dogrula, type DogrulamaHatalari } from "../../../sema/ortak.ts";
import { DokumanGirdisi, StandartGirdisi } from "../sema.ts";
import type { StandartOzeti } from "../eslestir.ts";

const MODUL = 4;
export const DOSYA = { standart: "standart", dokuman: "dokuman" } as const;
const STD = tablo({ ad: "standart", sutunlar: ["no", "surum_adi", "konu", "dosya_id", "yukleyen", "bitti", "kaldirildi"] });
const DOK = tablo({ ad: "dokuman", sutunlar: ["ad", "tur", "kod", "rev", "dosya_id", "tarih", "kaldirildi"] });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface Kisi extends YetkiHesabi { ad: string }
export interface StandartSatiri {
  id: string; no: string; surumAdi: string; konu: string; dosyaId: string; boyut: number; yukleyen: string; tarih: string; bitti: string | null; guncel: boolean; surum: number;
}
export interface StandartKarti extends StandartSatiri { surumler: StandartSatiri[]; guncelId: string | null }
export interface DokumanSatiri { id: string; ad: string; tur: string; kod: string | null; rev: string | null; dosyaId: string; tarih: string; surum: number }

export type Yazma =
  | { durum: "tamam"; id: string }
  | { durum: "gecersiz"; hatalar: DogrulamaHatalari }
  | { durum: "cakisma" } | { durum: "yok" } | { durum: "yetkisiz" };

const gorur = (kim: YetkiHesabi) => ["kendi", "brans", "gor", "yaz"].includes(duzey(kim, MODUL));
const degistirir = (kim: YetkiHesabi) => duzey(kim, MODUL) === "yaz";
export const dokumanDegistirir = degistirir;
const bugunTr = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const surumGecerli = (s: number) => Number.isSafeInteger(s) && s >= 0;
const pdfHatasi = (neden: string) => (neden === "buyuk" ? "PDF en çok 25 MB." : "Dosya PDF değil ya da bozuk.");

type StdDb = { id: string; no: string; surum_adi: string; konu: string; dosya_id: string; boyut: string | null; yukleyen: string; olustu: Date; bitti: string | null; surum: number };
const STD_SEC = `SELECT s.id::text, s.no, s.surum_adi, s.konu, s.dosya_id::text, d.boyut::text AS boyut, s.yukleyen, s.olustu, s.bitti::text, s.surum
  FROM standart s LEFT JOIN dosya d ON d.id = s.dosya_id AND d.firma_id = s.firma_id WHERE s.kaldirildi IS NULL AND s.dosya_id IS NOT NULL`;
const stdSatiri = (x: StdDb): StandartSatiri => ({
  id: x.id, no: x.no, surumAdi: x.surum_adi, konu: x.konu, dosyaId: x.dosya_id, boyut: Number(x.boyut ?? 0), yukleyen: x.yukleyen, tarih: x.olustu.toISOString(),
  bitti: x.bitti, guncel: !x.bitti, surum: x.surum,
});

export async function standartListesi(db: Sorgulayici, kim: Kisi): Promise<StandartSatiri[] | null> {
  if (!gorur(kim)) return null;
  return (await db.sorgu<StdDb>(STD_SEC)).rows.map(stdSatiri)
    .sort((a, b) => a.no.localeCompare(b.no, "tr", { numeric: true }) || b.tarih.localeCompare(a.tarih));
}

/** 428: saha raporunun standart penceresi için güncel standartlar (Raporlar okur — src/modules/dokumanlar/eslestir.ts eşler). Dökümanlar'ı
    görmeyen null alır: PDF'i zaten açamaz (dosya ucu aynı yetkiye bakar — standartDosyasiGorulur) */
export async function raporStandartlari(db: Sorgulayici, kim: YetkiHesabi): Promise<StandartOzeti[] | null> {
  if (!gorur(kim)) return null;
  return (await db.sorgu<StdDb>(`${STD_SEC} AND s.bitti IS NULL`)).rows.map((x) => ({ id: x.id, no: x.no, surumAdi: x.surum_adi, konu: x.konu, dosyaId: x.dosya_id }));
}

export async function standartKarti(db: Sorgulayici, kim: Kisi, id: string): Promise<StandartKarti | null> {
  if (!gorur(kim) || !UUID.test(id)) return null;
  const x = (await db.sorgu<StdDb>(`${STD_SEC} AND s.id = $1`, [id])).rows[0];
  if (!x) return null;
  const surumler = (await db.sorgu<StdDb>(`${STD_SEC} AND s.no = $1 ORDER BY s.olustu DESC`, [x.no])).rows.map(stdSatiri);
  return { ...stdSatiri(x), surumler, guncelId: surumler.find((s) => s.guncel)?.id ?? null };
}

/** Ekipman türleri ve raporlar için: güncel sürümler (numara → sürüm). Yetki ÇAĞIRANDA. */
export async function guncelStandartlar(db: Sorgulayici): Promise<{ id: string; no: string; surumAdi: string; konu: string }[]> {
  return (await db.sorgu<{ id: string; no: string; surum_adi: string; konu: string }>(
    "SELECT id::text, no, surum_adi, konu FROM standart WHERE kaldirildi IS NULL AND bitti IS NULL")).rows
    .map((x) => ({ id: x.id, no: x.no, surumAdi: x.surum_adi, konu: x.konu })).sort((a, b) => a.no.localeCompare(b.no, "tr", { numeric: true }));
}

/** standart yükle: aynı numarada güncel sürüm varsa o "önceki" olur (bitti = bugün), konu boşsa eskisinden. Aynı numara + sürüm ikinci kez yüklenmez. */
export async function standartYukle(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, girdi: unknown, pdf: { ad: string; bayt: Uint8Array } | null): Promise<Yazma> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  const g = dogrula(StandartGirdisi, girdi);
  const hatalar: DogrulamaHatalari = g.tamam ? {} : { ...g.hatalar };
  if (!pdf) hatalar.dosya = "PDF dosyası eklenmeli.";
  if (!g.tamam || !pdf) return { durum: "gecersiz", hatalar };
  const v = g.veri;
  const ayni = (await db.sorgu<{ id: string; surum_adi: string; surum: number; bitti: string | null }>(
    "SELECT id::text, surum_adi, surum, bitti::text FROM standart WHERE no = $1 AND kaldirildi IS NULL FOR UPDATE", [v.no])).rows;
  if (ayni.some((x) => x.surum_adi === v.surum)) return { durum: "gecersiz", hatalar: { surum: "Bu sürüm kütüphanede var." } };
  const guncel = ayni.find((x) => !x.bitti);
  if (guncel) await guncelle(db, STD, guncel.id, guncel.surum, { bitti: bugunTr() }, { kim: kim.ad, ne: "standart.onceki", gerekce: `${v.no}:${v.surum} yüklendi` });
  const r = await ekle(db, STD, { no: v.no, surum_adi: v.surum, konu: v.konu, yukleyen: kim.ad }, { kim: kim.ad, ne: "standart.yukle" });
  const y = await dosyaYukle(db, depo, { firmaId, modul: DOSYA.standart, kayitId: r.id, ad: pdf.ad, bayt: pdf.bayt, izinli: ["pdf"], kim: kim.ad, yukleyen: kim.id });
  if (!y.tamam) throw new DosyaHatasi(pdfHatasi(y.neden));
  await guncelle(db, STD, r.id, r.surum, { dosya_id: y.id }, { kim: kim.ad, ne: "standart.dosya" });
  return { durum: "tamam", id: r.id };
}

/** sürüm kaldır: güncelse bir önceki (en son biten) yeniden güncel olur; dosya saklanır */
export async function standartKaldir(db: Sorgulayici, kim: Kisi, id: string, surum: number): Promise<Yazma & { guncel?: string | null }> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(id)) return { durum: "yok" };
  if (!surumGecerli(surum)) return { durum: "cakisma" };
  const x = (await db.sorgu<{ no: string; bitti: string | null }>("SELECT no, bitti::text FROM standart WHERE id = $1 AND kaldirildi IS NULL FOR UPDATE", [id])).rows[0];
  if (!x) return { durum: "yok" };
  const r = await guncelle(db, STD, id, surum, { kaldirildi: new Date().toISOString() }, { kim: kim.ad, ne: "standart.kaldir" });
  if (r.durum === "cakisma" || r.durum === "yok") return { durum: r.durum };
  let guncel: string | null = null;
  if (!x.bitti) {
    const onceki = (await db.sorgu<{ id: string; surum: number }>(
      "SELECT id::text, surum FROM standart WHERE no = $1 AND kaldirildi IS NULL ORDER BY bitti DESC NULLS LAST, olustu DESC LIMIT 1 FOR UPDATE", [x.no])).rows[0];
    if (onceki) { await guncelle(db, STD, onceki.id, onceki.surum, { bitti: null }, { kim: kim.ad, ne: "standart.yeniden_guncel" }); guncel = onceki.id; }
  }
  return { durum: "tamam", id, guncel };
}

export async function dokumanListesi(db: Sorgulayici, kim: Kisi): Promise<DokumanSatiri[] | null> {
  if (!gorur(kim)) return null;
  return (await db.sorgu<{ id: string; ad: string; tur: string; kod: string | null; rev: string | null; dosya_id: string; tarih: string; surum: number }>(
    "SELECT id::text, ad, tur, kod, rev, dosya_id::text, tarih::text, surum FROM dokuman WHERE kaldirildi IS NULL ORDER BY tarih DESC, olustu DESC")).rows
    .map((x) => ({ id: x.id, ad: x.ad, tur: x.tur, kod: x.kod, rev: x.rev, dosyaId: x.dosya_id, tarih: x.tarih, surum: x.surum }));
}

/** döküman yükle (id boş) ya da dosyasını değiştir (id + yeni PDF; tarih bugün olur) */
export async function dokumanKaydet(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, id: string | null, surum: number, girdi: unknown,
  pdf: { ad: string; bayt: Uint8Array } | null): Promise<Yazma> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  if (id) {
    if (!UUID.test(id) || !(await db.sorgu("SELECT 1 FROM dokuman WHERE id = $1 AND kaldirildi IS NULL", [id])).rowCount) return { durum: "yok" };
    if (!surumGecerli(surum)) return { durum: "cakisma" };
    if (!pdf) return { durum: "gecersiz", hatalar: { dosya: "PDF dosyası eklenmeli." } };
    const y = await dosyaYukle(db, depo, { firmaId, modul: DOSYA.dokuman, kayitId: id, ad: pdf.ad, bayt: pdf.bayt, izinli: ["pdf"], kim: kim.ad, yukleyen: kim.id });
    if (!y.tamam) return { durum: "gecersiz", hatalar: { dosya: pdfHatasi(y.neden) } };
    const r = await guncelle(db, DOK, id, surum, { dosya_id: y.id, tarih: bugunTr() }, { kim: kim.ad, ne: "dokuman.dosya_degistir" });
    if (r.durum === "cakisma" || r.durum === "yok") return { durum: r.durum };
    return { durum: "tamam", id };
  }
  const g = dogrula(DokumanGirdisi, girdi);
  const hatalar: DogrulamaHatalari = g.tamam ? {} : { ...g.hatalar };
  if (!pdf) hatalar.dosya = "PDF dosyası eklenmeli.";
  if (!g.tamam || !pdf) return { durum: "gecersiz", hatalar };
  const v = g.veri;
  const r = await ekle(db, DOK, { ad: v.ad, tur: v.tur, kod: v.kod, rev: v.rev }, { kim: kim.ad, ne: "dokuman.yukle" });
  const y = await dosyaYukle(db, depo, { firmaId, modul: DOSYA.dokuman, kayitId: r.id, ad: pdf.ad, bayt: pdf.bayt, izinli: ["pdf"], kim: kim.ad, yukleyen: kim.id });
  if (!y.tamam) throw new DosyaHatasi(pdfHatasi(y.neden));
  await guncelle(db, DOK, r.id, r.surum, { dosya_id: y.id }, { kim: kim.ad, ne: "dokuman.dosya" });
  return { durum: "tamam", id: r.id };
}

export async function dokumanKaldir(db: Sorgulayici, kim: Kisi, id: string, surum: number): Promise<Yazma> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(id)) return { durum: "yok" };
  if (!surumGecerli(surum)) return { durum: "cakisma" };
  const r = await guncelle(db, DOK, id, surum, { kaldirildi: new Date().toISOString() }, { kim: kim.ad, ne: "dokuman.kaldir" });
  if (r.durum === "cakisma" || r.durum === "yok") return { durum: r.durum };
  return { durum: "tamam", id };
}

/** yeni kayıtla gelen PDF reddedilirse kayıt da yazılmaz (işlem düşer); eylem bunu dosya alanının iletisine çevirir */
export class DosyaHatasi extends Error {}

/** dosya erişimi (src/server/dosya/erisim.ts): modülü gören, kaydı (kaldırılmış önceki sürümler dahil) açar */
export async function standartDosyasiGorulur(db: Sorgulayici, kisi: YetkiHesabi, kayitId: string): Promise<boolean> {
  if (!gorur(kisi) || !UUID.test(kayitId)) return false;
  return !!(await db.sorgu("SELECT 1 FROM standart WHERE id = $1", [kayitId])).rowCount;
}
export async function dokumanDosyasiGorulur(db: Sorgulayici, kisi: YetkiHesabi, kayitId: string): Promise<boolean> {
  if (!gorur(kisi) || !UUID.test(kayitId)) return false;
  return !!(await db.sorgu("SELECT 1 FROM dokuman WHERE id = $1 AND kaldirildi IS NULL", [kayitId])).rowCount;
}
