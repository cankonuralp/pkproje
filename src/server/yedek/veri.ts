/* VERİ YEDEĞİ DOSYALARI (2026-11-03; sunum K2 — reisim: "her gece tüm siteyi işlemeyelim yeni eklenenler eklensin yedeğe yeter her günün ayrı ayrı
   yedeği olmasın"). İki tür ZIP, ikisi de çağıranın kiracı işleminde (RLS: yalnız firmanın satırları):
   · TAM KOPYA — yedeklenen bütün tabloların o anki hâli (bağlanınca bir kez, sonra her yılbaşı): tablolar/<tablo>.jsonl (satır başına bir JSON;
     gizli sütunsuz) + Excel/<tablo>.xlsx (açılıp okunan listeler — yalnız düz sütunlar) + bilgi.json (ne zaman, hangi göç, kaç satır).
   · AYLIK DOSYA — o ay eklenen / değişen / silinen satırların SON hâli (değişiklik kaydından): degisiklikler/<tablo>.jsonl ({silindi, zaman, satir})
     + bilgi.json. Ay boyunca aynı dosya her gece yeniden yazılır; günlük dosya yok.
   Geri yükleme: son tam kopya + sonraki aylık dosyalar sırayla (bilgi.json'daki göç adı şemanın sürümüdür). Satırlar imleçle 1 000'er okunur; bellekte
   yalnız sıkıştırılmış ZIP durur. */
import type { Sorgulayici } from "../db/kiraci.ts";
import { SON_GOC } from "../db/son-goc.ts";
import { xlsxBayt, type XlsxHucre } from "../../components/disa/xlsx.ts";
import { EXCEL_TABLOLARI, YEDEK_TABLOLARI } from "./tablolar.ts";
import { ayAraligi } from "./yol.ts";
import { SikistirilmisZip } from "./zip.ts";

const AD = /^[a-z_]{1,40}$/;
/** Excel'e en çok bu kadar satır (fazlası yalnız JSON'da — bilgi.json söyler) */
export const EXCEL_EN_COK = 50_000;
const PARTI = 1000;

/** tablonun satırları gizli sütunsuz, imleçle — her parti için cb */
async function satirlar(db: Sorgulayici, tablo: string, cb: (l: Record<string, unknown>[]) => Promise<void>): Promise<void> {
  if (!AD.test(tablo) || !Object.hasOwn(YEDEK_TABLOLARI, tablo)) throw new Error("yedek: bilinmeyen tablo");
  const imlec = `yedek_${tablo}`;
  const gizli = YEDEK_TABLOLARI[tablo]!.filter((s) => AD.test(s)).map((s) => `'${s}'`).join(", ");
  await db.sorgu(`DECLARE ${imlec} NO SCROLL CURSOR FOR SELECT to_jsonb(t) - ARRAY[${gizli}]::text[] AS r FROM ${tablo} t`);
  try {
    for (;;) {
      const p = (await db.sorgu<{ r: Record<string, unknown> }>(`FETCH ${PARTI} FROM ${imlec}`)).rows;
      if (!p.length) break;
      await cb(p.map((x) => x.r));
      if (p.length < PARTI) break;
    }
  } finally {
    await db.sorgu(`CLOSE ${imlec}`);
  }
}

const hucre = (v: unknown): XlsxHucre => v === null || v === undefined ? null : typeof v === "number" ? v : typeof v === "boolean" ? (v ? "evet" : "hayır")
  : typeof v === "string" ? v.slice(0, 32_000) : JSON.stringify(v).slice(0, 1000);

export interface VeriDosyasi { bayt: Uint8Array; satir: number }

export async function tamKopya(db: Sorgulayici, simdi: Date): Promise<VeriDosyasi> {
  const z = new SikistirilmisZip(), sayi: Record<string, number> = {}, excel: string[] = [], excelDisi: string[] = [];
  const tablolar = Object.keys(YEDEK_TABLOLARI).sort();
  for (const t of tablolar) {
    const exc = (EXCEL_TABLOLARI as readonly string[]).includes(t);
    const ex: { sutun: string[] | null } = { sutun: null };
    const satirlarX: XlsxHucre[][] = [];
    let n = 0;
    await z.dosya(`tablolar/${t}.jsonl`, async (yaz) => {
      await satirlar(db, t, async (l) => {
        let m = "";
        for (const r of l) {
          m += `${JSON.stringify(r)}\n`;
          if (exc && n < EXCEL_EN_COK) {
            ex.sutun ??= Object.keys(r).filter((k) => r[k] === null || typeof r[k] !== "object");
            satirlarX.push(ex.sutun.map((k) => hucre(r[k])));
          }
          n++;
        }
        await yaz(m);
      });
    });
    sayi[t] = n;
    const sutun = ex.sutun;
    if (exc && sutun) {
      await z.dosya(`Excel/${t}.xlsx`, async (yaz) => { await yaz(xlsxBayt(t, [sutun, ...satirlarX])); });
      excel.push(t);
      if (n > EXCEL_EN_COK) excelDisi.push(t);
    }
  }
  await z.dosya("bilgi.json", async (yaz) => {
    await yaz(JSON.stringify({ tur: "tam", olusturuldu: simdi.toISOString(), goc: SON_GOC, tablolar: sayi, excel, excel_eksik: excelDisi,
      gizli: Object.fromEntries(Object.entries(YEDEK_TABLOLARI).filter(([, g]) => g.length)) }, null, 2));
  });
  return { bayt: z.bayt(), satir: Object.values(sayi).reduce((a, b) => a + b, 0) };
}

/** ayın değişiklik dosyası; o ay hiç değişiklik yoksa null */
export async function ayDosyasi(db: Sorgulayici, donem: string, simdi: Date): Promise<VeriDosyasi | null> {
  const [bas, son] = ayAraligi(donem);
  const tablolar = (await db.sorgu<{ tablo: string }>(
    "SELECT DISTINCT tablo FROM yedek_degisiklik WHERE zaman >= $1 AND zaman < $2 ORDER BY tablo", [bas, son])).rows.map((x) => x.tablo);
  if (!tablolar.length) return null;
  const z = new SikistirilmisZip(), sayi: Record<string, number> = {};
  for (const t of tablolar) {
    if (!AD.test(t)) continue;
    let n = 0;
    await z.dosya(`degisiklikler/${t}.jsonl`, async (yaz) => {
      let son_: { anahtar: string } | null = null;
      for (;;) {
        const p: { anahtar: string; silindi: boolean; zaman: Date; satir: unknown }[] = (await db.sorgu<{ anahtar: string; silindi: boolean; zaman: Date; satir: unknown }>(
          `SELECT anahtar, silindi, zaman, satir FROM yedek_degisiklik WHERE tablo = $1 AND zaman >= $2 AND zaman < $3 AND anahtar > $4
           ORDER BY anahtar LIMIT ${PARTI}`, [t, bas, son, son_?.anahtar ?? ""])).rows;
        if (!p.length) break;
        await yaz(p.map((x) => `${JSON.stringify({ silindi: x.silindi, zaman: x.zaman.toISOString(), satir: x.satir })}\n`).join(""));
        n += p.length;
        son_ = p[p.length - 1]!;
        if (p.length < PARTI) break;
      }
    });
    sayi[t] = n;
  }
  await z.dosya("bilgi.json", async (yaz) => {
    await yaz(JSON.stringify({ tur: "ay", donem, olusturuldu: simdi.toISOString(), goc: SON_GOC, tablolar: sayi }, null, 2));
  });
  return { bayt: z.bayt(), satir: Object.values(sayi).reduce((a, b) => a + b, 0) };
}

/** ayda değişiklik var mı (son gönderimden sonra) */
export async function aydaDegisiklikVar(db: Sorgulayici, donem: string, sonra: Date | null): Promise<boolean> {
  const [bas, son] = ayAraligi(donem);
  return (await db.sorgu<{ v: boolean }>(
    "SELECT EXISTS (SELECT 1 FROM yedek_degisiklik WHERE zaman >= $1 AND zaman < $2 AND zaman > coalesce($3::timestamptz, '-infinity')) AS v",
    [bas, son, sonra])).rows[0]!.v;
}
