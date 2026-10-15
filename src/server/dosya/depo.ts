/* DEPO BAĞDAŞTIRICISI — tek arayüz (CLAUDE.md §2): yerelde klasör (data/depo); deneme yayınında VERİTABANI (347: PROBATA_DEPO=vt — Vercel'in
   klasörü geçici, içerik işlev örnekleri arasında kayboluyordu); 568: SUPABASE STORAGE (PROBATA_DEPO=supabase — supabase.ts; veritabanı deposu
   geçişte yedek: eski nesneler oradan okunur, gece işi taşır). Firmanın kendi Supabase'i K7 (513).
   Yalnız anahtar üreticisinin biçimindeki anahtar kabul edilir (yol aşma olamaz); listeleme arayüzde YOK (A1). Silme YALNIZ gece çöp işinin
   copSil'i (378, A5: dosya satırı çöpte 30 günü doldurup silindikten sonra; veritabanı deposu satır yoksa siler — 0069 depo_nesne_sil). Aynı
   anahtara ikinci kez yazılmaz (dosya değişmez — yeni dosya yeni anahtar).
   db: çağıranın açık işlemi (verilirse veritabanı deposu aynı işlemde yazar / okur — kayıtla birlikte geri alınır, havuzdan ikinci bağlantı
   alınmaz); klasör deposu kullanmaz. */
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { havuz } from "../db/havuz.ts";
import { kiraciIcinde, type Havuz, type Sorgulayici } from "../db/kiraci.ts";
import { anahtarGecerli } from "./anahtar.ts";
import { supabaseDepo, supabaseOrtami } from "./supabase.ts";

/** gece taşımasının sonucu (568) */
export interface TasimaSonucu { tasinan: number; bayt: number; hatali: number; kalan: boolean }

export interface Depo {
  /** tur: içerik türü (Storage onu sunar; klasör ve veritabanı deposu saklamaz — tür dosya satırında) */
  yaz(anahtar: string, bayt: Uint8Array, db?: Sorgulayici, tur?: string): Promise<void>;
  oku(anahtar: string, db?: Sorgulayici): Promise<Uint8Array>;
  /** YALNIZ gece çöp işi (src/server/dosya/cop.ts): dosya satırı silindikten sonra nesneyi siler; nesne yoksa sessiz */
  copSil(anahtar: string, db?: Sorgulayici): Promise<void>;
  /** depoda kaydı olmayan nesne sayısı, oturumdaki firmada (A5: raporlanır, SİLİNMEZ); listelenemeyen depoda null */
  oksuzSay(db: Sorgulayici): Promise<number | null>;
  /** 568: kısa ömürlü imzalı adres (yalnız Storage); nesne Storage'da değilse null — çağıran içeriği kendisi akıtır */
  imzaliAdres?(anahtar: string, saniye: number, indir: string | null): Promise<string | null>;
  /** 568: veritabanı deposundan Storage'a gece taşıması (oturumdaki firmanın işleminde) */
  tasi?(db: Sorgulayici, sinir: { adet: number; bayt: number }): Promise<TasimaSonucu>;
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
    async copSil(anahtar) {
      await rm(yol(anahtar), { force: true });   // force: nesne yoksa (önceki koşu sildi) hata değil
    },
    async oksuzSay() {
      return null;   // klasör listelenmez (A1)
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
    async copSil(anahtar, db) {
      firma(anahtar);
      await isle(anahtar, db, (d) => d.sorgu("SELECT depo_nesne_sil($1)", [anahtar]));
    },
    async oksuzSay(db) {
      return (await db.sorgu<{ n: number }>(
        "SELECT count(*)::int AS n FROM depo_nesne n WHERE NOT EXISTS (SELECT 1 FROM dosya d WHERE d.anahtar = n.anahtar)")).rows[0].n;
    },
  };
}

const g = globalThis as { __probataDepo?: Depo };
/** uygulamanın deposu: PROBATA_DEPO=supabase → Supabase Storage (yedek veritabanı deposu — geçiş, 568); vt → veritabanı (deneme yayını, 347);
    yoksa klasör (PROBATA_DEPO_KLASOR, yoksa data/depo). Bilinmeyen değer hata (sessiz düşüş yok). */
export function depo(): Depo {
  g.__probataDepo ??= depoSec(process.env);
  return g.__probataDepo;
}
export function depoSec(e: Record<string, string | undefined>): Depo {
  const t = e.PROBATA_DEPO ?? "";
  if (t === "supabase") return supabaseDepo(supabaseOrtami(e), vtDepo(havuz));
  if (t === "vt") return vtDepo(havuz);
  if (t === "") return klasorDepo(e.PROBATA_DEPO_KLASOR ?? join(process.cwd(), "data", "depo"));
  throw new Error("PROBATA_DEPO yalnız 'supabase', 'vt' ya da boş olabilir.");
}
