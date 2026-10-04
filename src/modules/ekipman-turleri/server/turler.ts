/* EKİPMAN TÜRLERİ — modülün dışa açılan işlevleri (maket ekipman-turleri.html; modül 5). Sayfalar ve eylemler yalnız buradan geçer.
   Yetki her işlevde, sunucuda (canDo, modül 5): "gör" ve üstü kataloğu ve tür sayfasını görür; DEĞİŞTİRMEK (tür ekle / düzenle, rapor formatı
   yükle / kaldır) yalnız "yaz" düzeyinde (önerilen düzende branş yöneticileri + firma yöneticisi). Yazmalar güvenli yazıcıdan; dosya tek dosya
   yolundan (tür baytlardan, yalnız PDF, kapalı depo). Format sürümü silinmez, kaldırılır; kullanımdaki = kaldırılmamış en yeni sürüm. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ekle, guncelle, tablo } from "../../../server/db/yazici.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { dosyaYukle } from "../../../server/dosya/dosya.ts";
import { canDo, duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { dogrula, type DogrulamaHatalari } from "../../../sema/ortak.ts";
import { guncelStandartlar } from "../../dokumanlar/server/dokumanlar.ts";
import { cihazTuruOzetleri } from "../../olcum-cihazlari/server/cihazlar.ts";
import { BaglantiGirdisi, TurGirdisi, turBransi } from "../sema.ts";

const MODUL = 5;
export const DOSYA_MODULU = "ekipman_turu";
const TUR = tablo({ ad: "ekipman_turu", sutunlar: ["kod", "ad", "grup", "brans", "periyot", "sure", "kontrol_std", "cihaz_turleri"] });
const FORMAT = tablo({ ad: "tur_format", sutunlar: ["tur_id", "sira", "dosya_id", "notu", "kaldirildi"] });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface Kisi extends YetkiHesabi { ad: string }
export interface FormatSurumu { id: string; sira: number; dosyaId: string; dosyaAd: string; notu: string | null; olustu: string; surum: number }
export interface TurSatiri { id: string; kod: string; ad: string; grup: string; brans: "m" | "e"; periyot: number; sure: number | null; format: Pick<FormatSurumu, "sira" | "olustu"> | null }
export interface TurStandardi { no: string; id: string | null; surumAdi: string | null; konu: string | null }
export interface TurKarti extends TurSatiri { surum: number; formatlar: FormatSurumu[]; standartlar: TurStandardi[]; cihazTurleri: { id: string; ad: string }[] }

export type Yazma =
  | { durum: "tamam"; id: string; surum: number }
  | { durum: "gecersiz"; hatalar: DogrulamaHatalari }
  | { durum: "cakisma" } | { durum: "yok" } | { durum: "yetkisiz" };

const gorur = (kim: YetkiHesabi) => canDo(kim, MODUL, "gor") && ["gor", "yaz"].includes(duzey(kim, MODUL));
const degistirir = (kim: YetkiHesabi) => duzey(kim, MODUL) === "yaz";
export const turDegistirir = degistirir;
const gun = (d: Date | string) => (typeof d === "string" ? d : d.toISOString()).slice(0, 10);

/** dosya erişimi (src/server/dosya/erisim.ts): türü görebilen, türün rapor formatı PDF'ini açar */
export async function turDosyasiGorulur(db: Sorgulayici, kisi: YetkiHesabi, kayitId: string): Promise<boolean> {
  if (!gorur(kisi) || !UUID.test(kayitId)) return false;
  return !!(await db.sorgu("SELECT 1 FROM ekipman_turu WHERE id = $1", [kayitId])).rowCount;
}

type TurDb = { id: string; kod: string; ad: string; grup: string; brans: "m" | "e"; periyot: number; sure: number | null; surum: number };
const TUR_SEC = "SELECT id::text, kod, ad, grup, brans, periyot, sure, surum FROM ekipman_turu";
type BagDb = { kontrol_std: string[]; cihaz_turleri: string[] };

export async function turListesi(db: Sorgulayici, kim: Kisi): Promise<TurSatiri[] | null> {
  if (duzey(kim, MODUL) === "yok") return null;
  if (!gorur(kim)) return [];
  const t = await db.sorgu<TurDb>(TUR_SEC);
  const f = await db.sorgu<{ tur_id: string; sira: number; olustu: Date }>(
    "SELECT DISTINCT ON (tur_id) tur_id::text, sira, olustu FROM tur_format WHERE kaldirildi IS NULL ORDER BY tur_id, sira DESC");
  const son = new Map(f.rows.map((x) => [x.tur_id, { sira: x.sira, olustu: gun(x.olustu) }]));
  return t.rows.map(({ surum: _, ...x }) => ({ ...x, format: son.get(x.id) ?? null })).sort((a, b) => a.ad.localeCompare(b.ad, "tr"));
}

export async function turKarti(db: Sorgulayici, kim: Kisi, id: string): Promise<TurKarti | null> {
  if (!UUID.test(id) || !gorur(kim)) return null;
  const t = (await db.sorgu<TurDb>(`${TUR_SEC} WHERE id = $1`, [id])).rows[0];
  if (!t) return null;
  const f = await db.sorgu<{ id: string; sira: number; dosya_id: string; ad: string; notu: string | null; olustu: Date; surum: number }>(
    `SELECT f.id::text, f.sira, f.dosya_id::text, d.ad, f.notu, f.olustu, f.surum FROM tur_format f JOIN dosya d ON d.id = f.dosya_id AND d.firma_id = f.firma_id
      WHERE f.tur_id = $1 AND f.kaldirildi IS NULL ORDER BY f.sira DESC`, [id]);
  const formatlar = f.rows.map((x) => ({ id: x.id, sira: x.sira, dosyaId: x.dosya_id, dosyaAd: x.ad, notu: x.notu, olustu: gun(x.olustu), surum: x.surum }));
  const b = (await db.sorgu<BagDb>("SELECT kontrol_std, cihaz_turleri::text[] AS cihaz_turleri FROM ekipman_turu WHERE id = $1", [id])).rows[0];
  const [std, ct] = [await guncelStandartlar(db), await cihazTuruOzetleri(db)];
  return {
    ...t, formatlar, format: formatlar[0] ? { sira: formatlar[0].sira, olustu: formatlar[0].olustu } : null,
    standartlar: b.kontrol_std.map((no) => { const g = std.find((x) => x.no === no); return { no, id: g?.id ?? null, surumAdi: g?.surumAdi ?? null, konu: g?.konu ?? null }; }),
    cihazTurleri: b.cihaz_turleri.map((c) => ct.find((x) => x.id === c)).filter((x): x is { id: string; ad: string } => !!x),
  };
}

/** tür ekle (id boş) ya da düzenle. Kod yalnız eklerken; firmada eşsiz (maketle aynı ileti). */
export async function turKaydet(db: Sorgulayici, kim: Kisi, id: string | null, surum: number, girdi: unknown): Promise<Yazma> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  let mevcut: TurDb | undefined;
  if (id) {
    if (!UUID.test(id)) return { durum: "yok" };
    mevcut = (await db.sorgu<TurDb>(`${TUR_SEC} WHERE id = $1`, [id])).rows[0];
    if (!mevcut) return { durum: "yok" };
  }
  const g = dogrula(TurGirdisi, { ...(girdi as object), ...(mevcut ? { kod: mevcut.kod } : {}) });
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const v = g.veri;
  if (!mevcut) {
    const k = (await db.sorgu<{ ad: string }>("SELECT ad FROM ekipman_turu WHERE kod = $1", [v.kod])).rows[0];
    if (k) return { durum: "gecersiz", hatalar: { kod: `${v.kod} kodu ${k.ad} türünde kullanılıyor.` } };
  }
  const degerler = { ad: v.ad, grup: v.grup, brans: turBransi(v), periyot: v.periyot, sure: v.sure };
  if (!mevcut) return { durum: "tamam", ...(await ekle(db, TUR, { kod: v.kod, ...degerler }, { kim: kim.ad, ne: "ekipman_turu.ekle" })) };
  if (!Number.isSafeInteger(surum) || surum < 0) return { durum: "cakisma" };
  const r = await guncelle(db, TUR, mevcut.id, surum, degerler, { kim: kim.ad, ne: "ekipman_turu.guncelle" });
  if (r.durum === "cakisma" || r.durum === "yok") return { durum: r.durum };
  return { durum: "tamam", id: mevcut.id, surum: r.surum };
}

export type FormatSonucu = { durum: "tamam"; sira: number } | { durum: "gecersiz"; hatalar: DogrulamaHatalari } | { durum: "yok" } | { durum: "yetkisiz" };

/** rapor formatı yükle: yalnız PDF (baytlardan), 25 MB; yeni sürüm = en büyük sıra + 1 (kaldırılanlar dahil — numara yeniden verilmez) */
export async function formatYukle(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, turId: string, dosya: { ad: string; bayt: Uint8Array }, notu: string): Promise<FormatSonucu> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(turId) || !(await db.sorgu("SELECT 1 FROM ekipman_turu WHERE id = $1 FOR UPDATE", [turId])).rowCount) return { durum: "yok" };
  const n = notu.trim().replace(/\s+/g, " ");
  if (n.length > 120) return { durum: "gecersiz", hatalar: { not: "En çok 120 karakter." } };
  const y = await dosyaYukle(db, depo, { firmaId, modul: DOSYA_MODULU, kayitId: turId, ad: dosya.ad, bayt: dosya.bayt, izinli: ["pdf"], kim: kim.ad, yukleyen: kim.id });
  if (!y.tamam) {
    return { durum: "gecersiz", hatalar: { dosya: y.neden === "buyuk" ? "PDF en çok 25 MB." : y.neden === "bos" ? "PDF seçilmeli." : "Dosya PDF değil ya da bozuk." } };
  }
  const sira = ((await db.sorgu<{ s: number | null }>("SELECT max(sira) AS s FROM tur_format WHERE tur_id = $1", [turId])).rows[0]?.s ?? 0) + 1;
  await ekle(db, FORMAT, { tur_id: turId, sira, dosya_id: y.id, notu: n || null }, { kim: kim.ad, ne: "ekipman_turu.format_yukle" });
  return { durum: "tamam", sira };
}

/** format sürümünü kaldır (silinmez; kullanımdaki kaldırılınca bir önceki kullanıma girer — maket 2026-09-28) */
export async function formatKaldir(db: Sorgulayici, kim: Kisi, formatId: string, surum: number): Promise<Yazma> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(formatId)) return { durum: "yok" };
  if (!Number.isSafeInteger(surum) || surum < 0) return { durum: "cakisma" };
  const r = await guncelle(db, FORMAT, formatId, surum, { kaldirildi: new Date().toISOString() }, { kim: kim.ad, ne: "ekipman_turu.format_kaldir" });
  if (r.durum === "cakisma" || r.durum === "yok") return { durum: r.durum };
  return { durum: "tamam", id: formatId, surum: r.surum };
}

/** bağlantı seçenekleri (pencere için): güncel standartlar + firmanın cihaz türleri; yalnız "yaz" */
export async function baglantiSecenekleri(db: Sorgulayici, kim: Kisi): Promise<{ standartlar: { no: string; konu: string }[]; cihazTurleri: { id: string; ad: string }[] } | null> {
  if (!degistirir(kim)) return null;
  return { standartlar: (await guncelStandartlar(db)).map(({ no, konu }) => ({ no, konu })), cihazTurleri: await cihazTuruOzetleri(db) };
}

/** kontrol metodu standartları + kullanılacak ölçüm cihazı türleri: standart kütüphanede güncel sürümü olan numara, cihaz türü bu firmanın olmalı */
export async function baglantiKaydet(db: Sorgulayici, kim: Kisi, id: string, surum: number, girdi: unknown): Promise<Yazma> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(id) || !(await db.sorgu("SELECT 1 FROM ekipman_turu WHERE id = $1", [id])).rowCount) return { durum: "yok" };
  const g = dogrula(BaglantiGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  const nolar = new Set((await guncelStandartlar(db)).map((x) => x.no)), turler = new Set((await cihazTuruOzetleri(db)).map((x) => x.id));
  if (g.veri.standartlar.some((n) => !nolar.has(n))) return { durum: "gecersiz", hatalar: { standartlar: "Standart kütüphanede yok." } };
  if (g.veri.cihazTurleri.some((c) => !turler.has(c))) return { durum: "gecersiz", hatalar: { cihazTurleri: "Cihaz türü bulunamadı." } };
  if (!Number.isSafeInteger(surum) || surum < 0) return { durum: "cakisma" };
  const r = await guncelle(db, TUR, id, surum, { kontrol_std: g.veri.standartlar, cihaz_turleri: g.veri.cihazTurleri }, { kim: kim.ad, ne: "ekipman_turu.baglanti" });
  if (r.durum === "cakisma" || r.durum === "yok") return { durum: r.durum };
  return { durum: "tamam", id, surum: r.surum };
}

/** Dökümanlar için: standardı (numarayla) kontrol metodu olarak kullanan türler. Yetki ÇAĞIRANDA. */
export async function standardiKullananTurler(db: Sorgulayici, no: string): Promise<{ id: string; ad: string; brans: "m" | "e" }[]> {
  return (await db.sorgu<{ id: string; ad: string; brans: "m" | "e" }>("SELECT id::text, ad, brans FROM ekipman_turu WHERE $1 = ANY (kontrol_std)", [no])).rows
    .sort((a, b) => a.ad.localeCompare(b.ad, "tr"));
}

/** Rapor formatı için (src/modules/rapor-format): tek türün kimliği, adı, kodu, branşı; yoksa null. kilitle: türün satırı işlem sonuna dek
    kilitlenir — aynı türün format işlemleri (taslak başlat, yayınla) sıraya girer, iki yayın aynı sırayı alamaz. Yetki ÇAĞIRANDA. */
export async function turOzeti(db: Sorgulayici, id: string, secenek: { kilitle?: boolean } = {}): Promise<{ id: string; ad: string; kod: string; brans: "m" | "e" } | null> {
  if (!UUID.test(id)) return null;
  return (await db.sorgu<{ id: string; ad: string; kod: string; brans: "m" | "e" }>(
    `SELECT id::text, ad, kod, brans FROM ekipman_turu WHERE id = $1${secenek.kilitle ? " FOR UPDATE" : ""}`, [id])).rows[0] ?? null;
}

/** Personel (ekipman ataması) ve Planlar (plan özeti) için: bütün türlerin adı, kodu, branşı, Ek-III grubu, periyodu. Yetki ÇAĞIRANDA. */
export async function turOzetleri(db: Sorgulayici): Promise<{ id: string; ad: string; kod: string; brans: "m" | "e"; grup: string; periyot: number }[]> {
  return (await db.sorgu<{ id: string; ad: string; kod: string; brans: "m" | "e"; grup: string; periyot: number }>("SELECT id::text, ad, kod, brans, grup, periyot FROM ekipman_turu")).rows
    .sort((a, b) => (a.brans === b.brans ? a.ad.localeCompare(b.ad, "tr") : a.brans === "m" ? -1 : 1));
}
