/* DEPO BAĞDAŞTIRICISI — tek arayüz, iki ayar (CLAUDE.md §2): yerelde klasör (data/depo), yayında S3 uyumlu depo (K7, Supabase).
   Yalnız anahtar üreticisinin biçimindeki anahtar kabul edilir (yol aşma olamaz); listeleme ve silme arayüzde YOK (A1, A5: silme çöp süresi
   dolunca ayrı işte). Aynı anahtara ikinci kez yazılmaz (dosya değişmez — yeni dosya yeni anahtar). */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { anahtarGecerli } from "./anahtar.ts";

export interface Depo {
  yaz(anahtar: string, bayt: Uint8Array): Promise<void>;
  oku(anahtar: string): Promise<Uint8Array>;
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

const g = globalThis as { __probataDepo?: Depo };
/** uygulamanın deposu (ortam: PROBATA_DEPO_KLASOR, yoksa data/depo) */
export function depo(): Depo {
  g.__probataDepo ??= klasorDepo(process.env.PROBATA_DEPO_KLASOR ?? join(process.cwd(), "data", "depo"));
  return g.__probataDepo;
}
