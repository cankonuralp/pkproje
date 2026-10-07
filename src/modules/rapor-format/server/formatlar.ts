/* RAPOR FORMATI — firmanın ekipman türü başına kurduğu SÜRÜMLÜ format tanımı (RAPOR-FORMAT.md §4–5, §7; §8.3 onaylı 2026-10-02; 308).
   Modülün dışa açılan işlevleri; sayfalar ve eylemler yalnız buradan geçer. Format kurucu (düzenleyici ekran, K4) bu işlevlerin üstüne kurulur.
   · Yetki her işlevde, sunucuda (canDo, modül 5 Ekipman türleri — format kurucu türün içinde, KOD-GECIS §3): "gör" ve üstü sürümleri ve tanımı
     görür (denetçi raporu bu tanımdan yazar); BAŞLATMAK, TASLAK KAYDETMEK, YAYINLAMAK yalnız "yaz" (önerilen düzende branş yöneticileri + firma
     yöneticisi). Muhasebe görmez. İstemciden gelen kimlik / sürüm yalnız "hangi kayıt, hangi sürümü gördüm" bilgisidir.
   · Tanım şemadan geçmeden yazılmaz (src/format/tanim.ts); okurken de şemadan geçer.
   · Yayın: KİLİTLİ (Bakanlık) öğe denetimi ENGEL — kaynak SUNUCUDA seçilir: taslağın başladığı hazır şablon (koddan) + türün o an yayındaki
     sürümü (veritabanından); istemcinin yolladığı tanımdaki "kilit" bayrağına güvenilmez. Yayın denetiminin öteki maddeleri UYARI (kural
     uyarıdır; boş bölüm, sınırsız tablo …). Yayındaki eskiye düşer, sıra en büyük + 1; aynı türün işlemleri tür satırı kilitlenerek sıraya girer.
   · Yayınlanan sürüm DEĞİŞMEZ ve silinmez (0022 tetiği); yayın zamanı ve yayınlayan hesap veritabanında damgalanır. */
import { kilitDenetimi, kilitNormallestir, yayinDenetimi } from "../../../format/motor.ts";
import { FormatTanimi } from "../../../format/tanim.ts";
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { kesinSil } from "../../../server/db/silici.ts";
import { ekle, guncelle, tablo } from "../../../server/db/yazici.ts";
import { canDoEylem, duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { dogrula, hatalar, type DogrulamaHatalari } from "../../../sema/ortak.ts";
import { turOzeti } from "../../ekipman-turleri/server/turler.ts";
import { BaslatGirdisi, sablonBul, YayinNotu } from "../sema.ts";

const MODUL = 5;
/* tanım büyük (bir sürüm onlarca KB) ve yayınlanan sürüm zaten değişmez saklanır → değeri denetim izine yazılmaz, yalnız "değişti" */
const FORMAT = tablo({ ad: "rapor_format", sutunlar: ["tur_id", "durum", "sira", "sema", "tanim", "kaynak", "notu", "olusturan", "yayinlayan"], gizli: ["tanim"] });
const oz = (x: unknown) => JSON.stringify(x);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/** tanımın JSON boyu, bayt (veritabanı CHECK'i 1.000.000 bayt jsonb metni — jsonb ", " ve ": " ile yazar, pay bırakılır) */
export const TANIM_EN_COK = 600_000;

export interface Kisi extends YetkiHesabi { ad: string }
export type FormatDurumu = "taslak" | "yayinda" | "eski";
export interface FormatOzeti {
  id: string; turId: string; sira: number | null; durum: FormatDurumu; kaynak: string | null; kaynakAd: string | null; notu: string | null;
  olusturan: string; yayinlayan: string | null; yayin: string | null; olustu: string; degisti: string; surum: number; bolum: number;
}
export interface FormatAyrintisi extends FormatOzeti { tanim: FormatTanimi | null; denetim: YayinDenetimi | null }
export interface YayinDenetimi { engeller: string[]; uyarilar: string[] }

export type Yazma =
  | { durum: "tamam"; id: string; surum: number }
  | { durum: "gecersiz"; hatalar: DogrulamaHatalari }
  | { durum: "kilitli" } | { durum: "cakisma" } | { durum: "yok" } | { durum: "yetkisiz" };
export type YayinSonucu =
  | { durum: "tamam"; sira: number; uyarilar: string[] }
  | { durum: "engel"; engeller: string[] }
  | { durum: "gecersiz"; hatalar: DogrulamaHatalari }
  | { durum: "cakisma" } | { durum: "yok" } | { durum: "yetkisiz" };

const gorur = (kim: YetkiHesabi) => ["gor", "yaz"].includes(duzey(kim, MODUL));
const degistirir = (kim: YetkiHesabi) => duzey(kim, MODUL) === "yaz";
export const formatDegistirir = degistirir;
const iso = (d: Date | null) => (d ? d.toISOString() : null);

type OzetDb = {
  id: string; tur_id: string; sira: number | null; durum: FormatDurumu; kaynak: string | null; notu: string | null; olusturan: string;
  yayinlayan: string | null; yayin: Date | null; olustu: Date; degisti: Date; surum: number; bolum: number;
};
const OZET_SUTUN = `id::text, tur_id::text, sira, durum, kaynak, notu, olusturan, yayinlayan, yayin, olustu, degisti, surum,
  coalesce(jsonb_array_length(tanim -> 'bolumler'), 0) AS bolum`;
const OZET_SEC = `SELECT ${OZET_SUTUN} FROM rapor_format`;
const ozet = (x: OzetDb): FormatOzeti => ({
  id: x.id, turId: x.tur_id, sira: x.sira, durum: x.durum, kaynak: x.kaynak, kaynakAd: x.kaynak ? sablonBul(x.kaynak)?.ad ?? x.kaynak : null,
  notu: x.notu, olusturan: x.olusturan, yayinlayan: x.yayinlayan, yayin: iso(x.yayin), olustu: iso(x.olustu)!, degisti: iso(x.degisti)!,
  surum: x.surum, bolum: x.bolum,
});
/** taslak üstte, sonra yeniden eskiye */
const sirala = (l: FormatOzeti[]) => l.sort((a, b) => (a.sira === null ? -1 : b.sira === null ? 1 : b.sira - a.sira));

/** tanımı şemadan geçirir; şema dışı (bozulmuş) kayıt null — motor ona dayanarak hiçbir şey çizmez */
function tanimOku(v: unknown): FormatTanimi | null {
  const r = FormatTanimi.safeParse(v);
  return r.success ? r.data : null;
}

/** türün format sürümleri (liste; tanımın kendisi inmez). Görmeyen ya da tür yoksa null. */
export async function formatSurumleri(db: Sorgulayici, kim: Kisi, turId: string): Promise<FormatOzeti[] | null> {
  if (!gorur(kim) || !(await turOzeti(db, turId))) return null;
  return sirala((await db.sorgu<OzetDb>(`${OZET_SEC} WHERE tur_id = $1`, [turId])).rows.map(ozet));
}

/** kilit kaynakları: taslağın başladığı hazır şablon + türün yayındaki sürümü (kendisi hariç) */
async function kilitKaynaklari(db: Sorgulayici, turId: string, kaynak: string | null, haric: string): Promise<FormatTanimi[]> {
  const l: FormatTanimi[] = [];
  const s = kaynak ? sablonBul(kaynak) : null;
  if (s) l.push(s.tanim);
  const y = (await db.sorgu<{ tanim: unknown }>("SELECT tanim FROM rapor_format WHERE tur_id = $1 AND durum = 'yayinda' AND id <> $2", [turId, haric])).rows[0];
  const yt = y ? tanimOku(y.tanim) : null;
  if (yt) l.push(yt);
  return l;
}

async function denetle(db: Sorgulayici, turId: string, kaynak: string | null, id: string, t: FormatTanimi): Promise<YayinDenetimi> {
  const engeller = [...new Set((await kilitKaynaklari(db, turId, kaynak, id)).flatMap((k) => kilitDenetimi(t, k)))];
  return { engeller, uyarilar: yayinDenetimi(t) };
}

/** bir sürümün tanımı + (taslaksa) yayın denetimi. Görmeyen ya da yoksa null. */
export async function formatAyrintisi(db: Sorgulayici, kim: Kisi, id: string): Promise<FormatAyrintisi | null> {
  if (!gorur(kim) || !UUID.test(id)) return null;
  const r = (await db.sorgu<OzetDb & { tanim: unknown }>(`SELECT ${OZET_SUTUN}, tanim FROM rapor_format WHERE id = $1`, [id])).rows[0];
  if (!r) return null;
  const tanim = tanimOku(r.tanim);
  const denetim = r.durum === "taslak" && tanim && degistirir(kim) ? await denetle(db, r.tur_id, r.kaynak, r.id, tanim) : null;
  return { ...ozet(r), tanim, denetim };
}

/** taslak başlat: hazır şablondan ya da türün yayınlanmış bir sürümünden. Taslak varsa onun yerine geçer — istemcinin gördüğü taslak
    sürümüyle (taslakSurumu); görmediği taslağı ezmez. */
export async function taslakBaslat(db: Sorgulayici, kim: Kisi, turId: string, girdi: unknown, taslakSurumu: number | null): Promise<Yazma> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  if (!(await turOzeti(db, turId, { kilitle: true }))) return { durum: "yok" };
  const g = dogrula(BaslatGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: { baslangic: Object.values(g.hatalar)[0] ?? "Başlangıç seçilmeli." } };
  let tanim: FormatTanimi, kaynak: string | null, nereden: string;
  if ("sablon" in g.veri) {
    tanim = structuredClone(sablonBul(g.veri.sablon)!.tanim);
    kaynak = g.veri.sablon; nereden = `şablon ${kaynak}`;
  } else {
    const r = (await db.sorgu<{ tanim: unknown; kaynak: string | null; sira: number }>(
      "SELECT tanim, kaynak, sira FROM rapor_format WHERE id = $1 AND tur_id = $2 AND durum <> 'taslak'", [g.veri.surumId, turId])).rows[0];
    const t = r ? tanimOku(r.tanim) : null;
    if (!r || !t) return { durum: "gecersiz", hatalar: { baslangic: "Sürüm bulunamadı." } };
    tanim = t; kaynak = r.kaynak; nereden = `sürüm ${r.sira}`;
  }
  const mevcut = (await db.sorgu<{ id: string; surum: number }>("SELECT id::text, surum FROM rapor_format WHERE tur_id = $1 AND durum = 'taslak' FOR UPDATE", [turId])).rows[0];
  const iz = { kim: kim.ad, ne: "rapor_format.taslak_baslat", gerekce: nereden };
  if (!mevcut) {
    if (taslakSurumu !== null) return { durum: "cakisma" };   // istemci bir taslak gördü, artık yok (yayınlandı)
    return { durum: "tamam", ...(await ekle(db, FORMAT, { tur_id: turId, durum: "taslak", sema: tanim.sema, tanim, kaynak, olusturan: kim.ad }, iz)) };
  }
  if (taslakSurumu === null || !Number.isSafeInteger(taslakSurumu) || taslakSurumu < 0) return { durum: "cakisma" };
  const r = await guncelle(db, FORMAT, mevcut.id, taslakSurumu, { sema: tanim.sema, tanim, kaynak }, iz);
  if (r.durum === "cakisma" || r.durum === "yok") return { durum: r.durum };
  return { durum: "tamam", id: mevcut.id, surum: r.surum };
}

/** taslağı kaydet (Format kurucu, K4): tanım şemadan geçmezse yazılmaz; yayınlanmış sürüm değişmez ("kilitli") */
export async function taslakKaydet(db: Sorgulayici, kim: Kisi, id: string, surum: number, tanimGirdisi: unknown): Promise<Yazma> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(id)) return { durum: "yok" };
  const boy = (v: unknown) => { try { return Buffer.byteLength(JSON.stringify(v) ?? ""); } catch { return Infinity; } };
  const buyuk = { durum: "gecersiz", hatalar: { tanim: "Tanım okunamadı ya da çok büyük." } } as const;
  if (!boy(tanimGirdisi) || boy(tanimGirdisi) > TANIM_EN_COK) return buyuk;
  const r = (await db.sorgu<{ durum: FormatDurumu; tur_id: string; kaynak: string | null }>(
    "SELECT durum, tur_id::text, kaynak FROM rapor_format WHERE id = $1 FOR UPDATE", [id])).rows[0];
  if (!r) return { durum: "yok" };
  if (r.durum !== "taslak") return { durum: "kilitli" };
  const t = FormatTanimi.safeParse(tanimGirdisi);
  if (!t.success) return { durum: "gecersiz", hatalar: hatalar(t.error) };
  if (boy(t.data) > TANIM_EN_COK) return buyuk;
  if (!Number.isSafeInteger(surum) || surum < 0) return { durum: "cakisma" };
  /* "kilit" yalnız kaynakta kilitli öğede (istemcinin bayrağına güvenilmez — 337–339 incelemesi) */
  const tanim = kilitNormallestir(t.data, await kilitKaynaklari(db, r.tur_id, r.kaynak, id));
  const g = await guncelle(db, FORMAT, id, surum, { sema: tanim.sema, tanim }, { kim: kim.ad, ne: "rapor_format.taslak_kaydet" });
  if (g.durum === "cakisma" || g.durum === "yok") return { durum: g.durum };
  return { durum: "tamam", id, surum: g.surum };
}

/** yayından önce: engeller (kilitli öğe) ve uyarılar — pencerede gösterilir; yayında sunucu yeniden hesaplar. Yalnız "yaz", yalnız taslak. */
export async function yayinDenetle(db: Sorgulayici, kim: Kisi, id: string): Promise<YayinDenetimi | null> {
  if (!degistirir(kim) || !UUID.test(id)) return null;
  const r = (await db.sorgu<{ tur_id: string; kaynak: string | null; durum: FormatDurumu; tanim: unknown }>(
    "SELECT tur_id::text, kaynak, durum, tanim FROM rapor_format WHERE id = $1", [id])).rows[0];
  const t = r?.durum === "taslak" ? tanimOku(r.tanim) : null;
  return r && t ? denetle(db, r.tur_id, r.kaynak, id, t) : null;
}

/** taslağı yayınla: kilitli öğe engeli varsa yayınlanmaz (liste döner); varsa yayındaki eskiye düşer; yeni sıra en büyük + 1 */
export async function yayinla(db: Sorgulayici, kim: Kisi, id: string, surum: number, notu: unknown): Promise<YayinSonucu> {
  if (!degistirir(kim)) return { durum: "yetkisiz" };
  if (!UUID.test(id)) return { durum: "yok" };
  const n = dogrula(YayinNotu, notu ?? "");
  if (!n.tamam) return { durum: "gecersiz", hatalar: { notu: Object.values(n.hatalar)[0]! } };
  const tur = (await db.sorgu<{ tur_id: string }>("SELECT tur_id::text FROM rapor_format WHERE id = $1", [id])).rows[0];
  if (!tur || !(await turOzeti(db, tur.tur_id, { kilitle: true }))) return { durum: "yok" };
  /* tür kilitlendikten SONRA yeniden oku: beklerken başkası yayınlamış olabilir */
  const r = (await db.sorgu<{ durum: FormatDurumu; surum: number; kaynak: string | null; tanim: unknown }>(
    "SELECT durum, surum, kaynak, tanim FROM rapor_format WHERE id = $1 FOR UPDATE", [id])).rows[0];
  if (!r) return { durum: "yok" };
  if (r.durum !== "taslak" || !Number.isSafeInteger(surum) || r.surum !== surum) return { durum: "cakisma" };
  const okunan = tanimOku(r.tanim);
  if (!okunan) return { durum: "gecersiz", hatalar: { tanim: "Tanım okunamadı." } };
  /* savunma derinliği: yayınlanan sürüm de kilidi yalnız kaynakta kilitli öğede taşır (sonraki taslakların kilit kaynağı bu sürüm) */
  const t = kilitNormallestir(okunan, await kilitKaynaklari(db, tur.tur_id, r.kaynak, id));
  const d = await denetle(db, tur.tur_id, r.kaynak, id, t);
  if (d.engeller.length) return { durum: "engel", engeller: d.engeller };
  const onceki = (await db.sorgu<{ id: string; surum: number }>(
    "SELECT id::text, surum FROM rapor_format WHERE tur_id = $1 AND durum = 'yayinda' FOR UPDATE", [tur.tur_id])).rows[0];
  if (onceki) {
    const e = await guncelle(db, FORMAT, onceki.id, onceki.surum, { durum: "eski" }, { kim: kim.ad, ne: "rapor_format.eskidi" });
    if (e.durum !== "tamam") return { durum: "cakisma" };
  }
  const sira = ((await db.sorgu<{ s: number | null }>("SELECT max(sira) AS s FROM rapor_format WHERE tur_id = $1", [tur.tur_id])).rows[0]?.s ?? 0) + 1;
  const g = await guncelle(db, FORMAT, id, surum, { durum: "yayinda", sira, notu: n.veri, yayinlayan: kim.ad, ...(oz(t) === oz(okunan) ? {} : { tanim: t }) },
    { kim: kim.ad, ne: "rapor_format.yayinla", gerekce: n.veri ?? undefined });
  if (g.durum !== "tamam") return { durum: "cakisma" };
  return { durum: "tamam", sira, uyarilar: d.uyarilar };
}

/** Raporlar için: türün YAYINDAKİ formatı (yeni rapor bununla açılır, RAPOR-FORMAT §5); yoksa null. Yetki ÇAĞIRANDA. */
export async function yayindakiFormat(db: Sorgulayici, turId: string): Promise<{ id: string; sira: number; tanim: FormatTanimi } | null> {
  if (!UUID.test(turId)) return null;
  const r = (await db.sorgu<{ id: string; sira: number; tanim: unknown }>(
    "SELECT id::text, sira, tanim FROM rapor_format WHERE tur_id = $1 AND durum = 'yayinda'", [turId])).rows[0];
  const t = r ? tanimOku(r.tanim) : null;
  return r && t ? { id: r.id, sira: r.sira, tanim: t } : null;
}

/** Raporlar / PDF için: raporun açıldığı sürüm (imzalı raporun PDF'i o sürümle yeniden çizilir, §5); taslak verilmez. Yetki ÇAĞIRANDA. */
export async function formatSurumuOku(db: Sorgulayici, id: string): Promise<{ id: string; turId: string; sira: number; durum: FormatDurumu; tanim: FormatTanimi } | null> {
  if (!UUID.test(id)) return null;
  const r = (await db.sorgu<{ id: string; tur_id: string; sira: number; durum: FormatDurumu; tanim: unknown }>(
    "SELECT id::text, tur_id::text, sira, durum, tanim FROM rapor_format WHERE id = $1 AND durum <> 'taslak'", [id])).rows[0];
  const t = r ? tanimOku(r.tanim) : null;
  return r && t ? { id: r.id, turId: r.tur_id, sira: r.sira, durum: r.durum, tanim: t } : null;
}

/* ── TASLAĞI SİL (370; reisim 2026-10-07 "eklenebilen şeyler silinemiyor"; §9 elli üçüncü tur) — yalnız yönetici (kayit_sil, modül 5) ve yalnız hiç
   yayınlanmamış taslak (veritabanında, göç 0065); yayınlanmış / eski sürüm silinmez (0022). Tanım izde kalır. */
export const formatSilebilir = (kim: YetkiHesabi) => canDoEylem(kim, "kayit_sil", { modul: MODUL });
export async function taslakSil(db: Sorgulayici, kim: Kisi, id: string): Promise<Yazma> {
  if (!formatSilebilir(kim)) return { durum: "yetkisiz" };
  const r = await kesinSil(db, "rapor_format", id, kim.ad);
  if (r.durum === "kullanildi") return { durum: "kilitli" };
  return r.durum === "tamam" ? { durum: "tamam", id, surum: 0 } : { durum: "yok" };
}
