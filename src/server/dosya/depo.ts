/* DEPO BAĞDAŞTIRICISI — tek arayüz (CLAUDE.md §2): yerelde klasör (data/depo); deneme yayınında VERİTABANI (347: PROBATA_DEPO=vt — Vercel'in
   klasörü geçici, içerik işlev örnekleri arasında kayboluyordu); firmanın kendi S3 deposu K7 (KOD-GECIS Y2b).
   Yalnız anahtar üreticisinin biçimindeki anahtar kabul edilir (yol aşma olamaz); listeleme ve silme arayüzde YOK (A1, A5: silme çöp süresi
   dolunca ayrı işte). Aynı anahtara ikinci kez yazılmaz (dosya değişmez — yeni dosya yeni anahtar).
   db: çağıranın açık işlemi (verilirse veritabanı deposu aynı işlemde yazar / okur — kayıtla birlikte geri alınır, havuzdan ikinci bağlantı
   alınmaz); klasör deposu kullanmaz. */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { havuz } from "../db/havuz.ts";
import { kiraciIcinde, type Havuz, type Sorgulayici } from "../db/kiraci.ts";
import { anahtarGecerli } from "./anahtar.ts";

export interface Depo {
  yaz(anahtar: string, bayt: Uint8Array, db?: Sorgulayici): Promise<void>;
  oku(anahtar: string, db?: Sorgulayici): Promise<Uint8Array>;
}

export function klasorDepo(kok: string): Depo {
  const tam = resolve(kok);
  const yol = (anahtar: string) => {
    if (!anahtarGecerli(anahtar)) throw new Error("Geçersiz depo anahtarı");
    const y = resolve(join(tam, anahtar));
    if (!y.startsWith(tam + sep)) throw new Error("Geçersiz depo anahtarı");
    return y;
  };
  return {
    async yaz(anahtar, bayt) {
      const y = yol(anahtar);
      await mkdir(dirname(y), { recursive: true });
      await writeFile(y, bayt, { flag: "wx", mode: 0o600 });   // wx: varsa yazmaz
    },
    async oku(anahtar) {
      return new Uint8Array(await readFile(yol(anahtar)));
    },
  };
}

/** veritabanı deposu (0049 depo_nesne): anahtardaki firmanın kiracı işleminde; db verilirse onun işleminde (RLS anahtarın firmasını denetler) */
export function vtDepo(h: () => Havuz): Depo {
  const firma = (anahtar: string) => {
    if (!anahtarGecerli(anahtar)) throw new Error("Geçersiz depo anahtarı");
    return anahtar.split("/")[1];
  };
  const isle = <T,>(anahtar: string, db: Sorgulayici | undefined, is: (d: Sorgulayici) => Promise<T>) =>
    db ? is(db) : kiraciIcinde(h(), firma(anahtar), is);
  return {
    async yaz(anahtar, bayt, db) {
      firma(anahtar);
      await isle(anahtar, db, (d) => d.sorgu("INSERT INTO depo_nesne (anahtar, bayt) VALUES ($1, $2)", [anahtar, Buffer.from(bayt)]));
    },
    async oku(anahtar, db) {
      firma(anahtar);
      const r = await isle(anahtar, db, (d) => d.sorgu<{ bayt: Buffer }>("SELECT bayt FROM depo_nesne WHERE anahtar = $1", [anahtar]));
      if (!r.rows[0]) throw new Error("Depoda böyle bir nesne yok");
      return new Uint8Array(r.rows[0].bayt);
    },
  };
}

const g = globalThis as { __probataDepo?: Depo };
/** uygulamanın deposu: PROBATA_DEPO=vt → veritabanı (deneme yayını); yoksa klasör (PROBATA_DEPO_KLASOR, yoksa data/depo) */
export function depo(): Depo {
  g.__probataDepo ??= process.env.PROBATA_DEPO === "vt" ? vtDepo(havuz)
    : klasorDepo(process.env.PROBATA_DEPO_KLASOR ?? join(process.cwd(), "data", "depo"));
  return g.__probataDepo;
}
