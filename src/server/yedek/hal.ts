/* YEDEKTEN FİRMANIN HÂLİ (2026-11-04; aylık doğrulama ve geri yükleme — maket claude.ai THfrK3AzKkg9S7DiRVKKF4). Son tam kopya + ondan SONRAKİ
   aylık değişiklik dosyaları sırayla: her satır birincil anahtarıyla; değişiklik satırın son hâlini yazar, silme kaldırır. Tam kopyadan önceki
   değişiklikler (aynı ayın dosyasında olabilir) atlanır — tam kopya onları zaten içerir; geri yüklemeden sonra alınan yeni tam kopyanın öncesi de.
   Üç kaynak:
   · drive — firmanın Google Drive / OneDrive'ı (Veri yedeği/Tam kopya YYYY.zip + Aylık/YYYY-AA.zip); hâlin anı son gece gönderimi;
   · arsiv — probata arşivi (tam + kapanmış aylar) + bu ayın değişiklik kaydı, bugünden (İstanbul) önceki kısmı; anı bugünün başı;
   · once — geri yüklemeden önce alınan kopya (yedek_arsiv "once").
   Okuma işlemin dışında (Drive isteği kiracı işlemi açık tutmaz); ZIP'ler bellekte açılır (sınır HAL_BAYT). */
import type { Havuz, Sorgulayici } from "../db/kiraci.ts";
import { kiraciIcinde } from "../db/kiraci.ts";
import type { Depo } from "../dosya/depo.ts";
import { ayarOku } from "../ayar/ayar.ts";
import { zipAc } from "../../components/disa/oku.ts";
import { BulutYetki, type BulutHizmeti } from "../dis/bulut.ts";
import { arsivOku } from "./arsiv.ts";
import { baglantiOku, yenilemeAnahtari, yenilemeYaz, yerDeposu } from "./kayit.ts";
import { YEDEK_TABLOLARI } from "./tablolar.ts";
import { ayDosyasi } from "./veri.ts";
import { ayDosyasiAdi, ayKlasoru, donemi, tamKopyaAdi, veriKlasoru } from "./yol.ts";

/** bir ZIP'in açılmış en büyük boyu ve bütün hâlin indirme sınırı */
export const HAL_BAYT = 1024 * 1024 * 1024;
const ZIP_ADET = 2000;

export type HalKaynagi = "drive" | "arsiv" | "once";
export type Satir = Record<string, unknown>;
export interface YedekHali {
  kaynak: HalKaynagi;
  /** hâlin anı (bu andan sonraki girişler hâlde yok) */
  an: Date;
  /** tam kopyanın alındığı an */
  tam: Date;
  /** tablo → satırlar (gizli sütunsuz) */
  tablolar: Record<string, Satir[]>;
  /** okunan dosyalar (bilgi) */
  dosyalar: string[];
}

export class HalHatasi extends Error {
  constructor(m: string) { super(m); this.name = "HalHatasi"; }
}

interface TamDosya { olusturuldu: Date; tablolar: Record<string, Satir[]> }
interface AyDosya { donem: string; satirlar: Record<string, { silindi: boolean; zaman: string; satir: Satir }[]> }

const metin = (b: Uint8Array) => new TextDecoder().decode(b);
function satirlar(b: Uint8Array): unknown[] {
  return metin(b).split("\n").filter((x) => x.trim()).map((x) => JSON.parse(x) as unknown);
}

/** tam kopya ZIP'i (tablolar/<tablo>.jsonl + bilgi.json) */
export async function tamOku(z: Uint8Array): Promise<TamDosya> {
  const l = await zipAc(z, HAL_BAYT, ZIP_ADET);
  const bilgi = l.find((x) => x.ad === "bilgi.json");
  if (!bilgi) throw new HalHatasi("tam kopyada bilgi.json yok");
  const b = JSON.parse(metin(bilgi.bayt)) as { tur?: string; olusturuldu?: string };
  if (b.tur !== "tam" || !b.olusturuldu || Number.isNaN(Date.parse(b.olusturuldu))) throw new HalHatasi("tam kopyanın bilgisi biçimsiz");
  const tablolar: Record<string, Satir[]> = {};
  for (const x of l) {
    /* zipAc klasörü atar: tablolar/<tablo>.jsonl → <tablo>.jsonl */
    const m = /^([a-z_]{1,40})\.jsonl$/.exec(x.ad);
    if (!m || !Object.hasOwn(YEDEK_TABLOLARI, m[1]!)) continue;
    tablolar[m[1]!] = satirlar(x.bayt).filter((r): r is Satir => !!r && typeof r === "object" && !Array.isArray(r));
  }
  return { olusturuldu: new Date(b.olusturuldu), tablolar };
}

/** aylık değişiklik ZIP'i (degisiklikler/<tablo>.jsonl + bilgi.json) */
export async function ayOku(z: Uint8Array): Promise<AyDosya> {
  const l = await zipAc(z, HAL_BAYT, ZIP_ADET);
  const bilgi = l.find((x) => x.ad === "bilgi.json");
  if (!bilgi) throw new HalHatasi("aylık dosyada bilgi.json yok");
  const b = JSON.parse(metin(bilgi.bayt)) as { tur?: string; donem?: string };
  if (b.tur !== "ay" || !b.donem || !/^\d{4}-\d{2}$/.test(b.donem)) throw new HalHatasi("aylık dosyanın bilgisi biçimsiz");
  const out: AyDosya["satirlar"] = {};
  for (const x of l) {
    /* degisiklikler/<tablo>.jsonl (zipAc klasörü atar) */
    const m = /^([a-z_]{1,40})\.jsonl$/.exec(x.ad);
    if (!m || !Object.hasOwn(YEDEK_TABLOLARI, m[1]!)) continue;
    out[m[1]!] = satirlar(x.bayt).filter((r): r is { silindi: boolean; zaman: string; satir: Satir } => {
      const o = r as Record<string, unknown> | null;
      return !!o && typeof o.silindi === "boolean" && typeof o.zaman === "string" && !!o.satir && typeof o.satir === "object";
    });
  }
  return { donem: b.donem, satirlar: out };
}

/** satırın anahtarı (birincil anahtar sütunlarının değerleri) */
export const anahtar = (r: Satir, pk: readonly string[]) => pk.map((k) => String(r[k] ?? "")).join("|");

/** SAF: tam kopya + aylar → hâl. kesim: bu andan SONRAKİ değişiklikler alınmaz (arşiv kaynağında bugün) */
export function haliKur(tam: TamDosya, aylar: readonly AyDosya[], pk: Readonly<Record<string, readonly string[]>>, kesim: Date | null): Record<string, Satir[]> {
  const m = new Map<string, Map<string, Satir>>();
  for (const t of Object.keys(YEDEK_TABLOLARI)) {
    const p = pk[t];
    if (!p?.length) throw new HalHatasi(`${t}: birincil anahtar bilinmiyor`);
    m.set(t, new Map((tam.tablolar[t] ?? []).map((r) => [anahtar(r, p), r])));
  }
  const bas = tam.olusturuldu.getTime(), son = kesim?.getTime() ?? Infinity;
  for (const a of [...aylar].sort((x, y) => x.donem.localeCompare(y.donem))) {
    for (const [t, l] of Object.entries(a.satirlar)) {
      const tablo = m.get(t), p = pk[t];
      if (!tablo || !p) continue;
      for (const d of [...l].sort((x, y) => x.zaman.localeCompare(y.zaman))) {
        const z = Date.parse(d.zaman);
        if (!(z > bas) || z >= son) continue;
        const k = anahtar(d.satir, p);
        if (d.silindi) tablo.delete(k); else tablo.set(k, d.satir);
      }
    }
  }
  return Object.fromEntries([...m].map(([t, x]) => [t, [...x.values()]]));
}

/** yedeklenen tabloların birincil anahtar sütunları (veritabanının kendisinden) */
export async function birincilAnahtarlar(db: Sorgulayici): Promise<Record<string, string[]>> {
  const r = await db.sorgu<{ tablo: string; pk: string[] }>(
    `SELECT c.relname AS tablo, array_agg(a.attname::text ORDER BY array_position(i.indkey::int2[], a.attnum)) AS pk
     FROM pg_index i JOIN pg_class c ON c.oid = i.indrelid JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
       JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY (i.indkey)
     WHERE i.indisprimary AND c.relname = ANY ($1::text[]) GROUP BY c.relname`, [Object.keys(YEDEK_TABLOLARI)]);
  return Object.fromEntries(r.rows.map((x) => [x.tablo, x.pk]));
}

/** donem listesi: bas (YYYY-AA) … son (YYYY-AA) */
export function aylarArasi(bas: string, son: string): string[] {
  const l: string[] = [];
  let [y, a] = bas.split("-").map(Number) as [number, number];
  const [sy, sa] = son.split("-").map(Number) as [number, number];
  while (y < sy || (y === sy && a <= sa)) { l.push(`${y}-${String(a).padStart(2, "0")}`); a++; if (a > 12) { a = 1; y++; } }
  return l;
}

/* ── kaynaklar ── */
export interface DriveErisimi { hz: BulutHizmeti; erisim: string; yenile(): Promise<void> }

/** Drive'a erişim: bağlı bağlantı + yenilenen erişim anahtarı (yeni yenileme anahtarı saklanır); bağlı değilse null */
export async function driveErisimi(h: Havuz, firmaId: string, hizmetBul: (s: "gdrive" | "onedrive") => BulutHizmeti | null): Promise<DriveErisimi | null> {
  const al = await kiraciIcinde(h, firmaId, async (db) => {
    const b = await baglantiOku(db);
    return b && (b.durum === "bagli" || b.durum === "dolu") ? { b, yenileme: await yenilemeAnahtari(db) } : null;
  });
  if (!al?.yenileme) return null;
  const hz = hizmetBul(al.b.saglayici);
  if (!hz) return null;
  const e: DriveErisimi = { hz, erisim: "", async yenile() {
    const k = await hz.yenile(al.yenileme!);
    if (k.yenileme && k.yenileme !== al.yenileme) {
      al.yenileme = k.yenileme;
      await kiraciIcinde(h, firmaId, (db) => yenilemeYaz(db, k.yenileme));
    }
    e.erisim = k.erisim;
  } };
  await e.yenile();
  return e;
}

/** Drive'dan bir dosya (erişim anahtarı dolduysa bir kez yenilenir); yer kimlikleri kiracı işleminde */
export async function drivedenIndir(h: Havuz, firmaId: string, d: DriveErisimi, y: { yol: readonly string[]; ad: string }, enCok = HAL_BAYT): Promise<Uint8Array | null> {
  return kiraciIcinde(h, firmaId, async (db) => {
    try { return await d.hz.indir(d.erisim, y, yerDeposu(db), enCok); } catch (e) {
      if (!(e instanceof BulutYetki)) throw e;
      await d.yenile();
      return d.hz.indir(d.erisim, y, yerDeposu(db), enCok);
    }
  });
}

/** firmanın Drive'ındaki yedekten hâl */
export async function drivedenHal(h: Havuz, firmaId: string, d: DriveErisimi, simdi: Date): Promise<YedekHali> {
  const { kok, pk, ay } = await kiraciIcinde(h, firmaId, async (db) => ({
    kok: (await ayarOku(db, "bulut")).deger.kok, pk: await birincilAnahtarlar(db),
    ay: (await baglantiOku(db))?.ay_gonderim ?? null,
  }));
  const yil = donemi(simdi).yil, dosyalar: string[] = [];
  let tamB: Uint8Array | null = null;
  for (const y of [yil, yil - 1]) {
    tamB = await drivedenIndir(h, firmaId, d, { yol: veriKlasoru(kok), ad: tamKopyaAdi(y) });
    if (tamB) { dosyalar.push(tamKopyaAdi(y)); break; }
  }
  if (!tamB) throw new HalHatasi("Drive'da tam kopya yok");
  const tam = await tamOku(tamB);
  const aylar: AyDosya[] = [];
  for (const donem of aylarArasi(donemi(tam.olusturuldu).ay, donemi(simdi).ay)) {
    const b = await drivedenIndir(h, firmaId, d, { yol: ayKlasoru(kok), ad: ayDosyasiAdi(donem) });
    if (!b) continue;
    aylar.push(await ayOku(b));
    dosyalar.push(ayDosyasiAdi(donem));
  }
  return { kaynak: "drive", an: ay ?? tam.olusturuldu, tam: tam.olusturuldu, tablolar: haliKur(tam, aylar, pk, null), dosyalar };
}

/** probata arşivinden hâl: tam + kapanmış aylar + bu ayın değişiklik kaydı (bugünden önceki kısmı) */
export async function arsivdenHal(h: Havuz, firmaId: string, depo: Depo, simdi: Date): Promise<YedekHali> {
  const d = donemi(simdi);
  /* bugünün başı, İstanbul (UTC+3, yaz saati yok) */
  const bugun = new Date(`${new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(simdi)}T00:00:00+03:00`);
  return kiraciIcinde(h, firmaId, async (db) => {
    const pk = await birincilAnahtarlar(db), dosyalar: string[] = [];
    let tamB: { bayt: Uint8Array } | null = null;
    for (const y of [d.yil, d.yil - 1]) {
      tamB = await arsivOku(db, depo, "tam", String(y));
      if (tamB) { dosyalar.push(`tam ${y}`); break; }
    }
    if (!tamB) throw new HalHatasi("probata arşivinde tam kopya yok");
    const tam = await tamOku(tamB.bayt);
    const aylar: AyDosya[] = [];
    for (const donem of aylarArasi(donemi(tam.olusturuldu).ay, d.ay)) {
      const a = donem === d.ay ? await ayDosyasi(db, donem, simdi) : await arsivOku(db, depo, "ay", donem);
      if (!a) continue;
      aylar.push(await ayOku(a.bayt));
      dosyalar.push(`ay ${donem}`);
    }
    return { kaynak: "arsiv" as const, an: bugun, tam: tam.olusturuldu, tablolar: haliKur(tam, aylar, pk, bugun), dosyalar };
  });
}

/** geri yüklemeden önce alınan kopyadan hâl */
export async function oncedenHal(h: Havuz, firmaId: string, depo: Depo, donem: string): Promise<YedekHali> {
  return kiraciIcinde(h, firmaId, async (db) => {
    const a = await arsivOku(db, depo, "once", donem);
    if (!a) throw new HalHatasi("önceki hâlin kopyası yok");
    const tam = await tamOku(a.bayt);
    const pk = await birincilAnahtarlar(db);
    return { kaynak: "once" as const, an: tam.olusturuldu, tam: tam.olusturuldu, tablolar: haliKur(tam, [], pk, null), dosyalar: [`önceki hâl ${donem}`] };
  });
}

