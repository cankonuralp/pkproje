/* OLUMSUZ KANIT — tests/yanlis-yer.test.ts neyi koruyor (2026-10-26). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): tablo.ts / kunye.ts bellekte bozulur.
   1. Ekipman kaydı hücresi sahaya alınmazsa tankın markası yazılamaz, bilgi yandaki boş alana girer. 2. Ad grup başlığıyla ayrılmazsa iki "Marka"
   ayırt edilmez. 3. Serbest formatta varsayılan kilit dönerse firmanın künyesi yine değiştirilemez. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { TABLO } from "../yanlis-yer.test.ts";

const klasor = mkdtempSync(join(tmpdir(), "bozan-yanlis-yer-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
let sira = 0;
async function bozuk<T>(dosya: string, eski: string, yeni: string): Promise<T> {
  const kaynak = readFileSync(resolve(dosya), "utf8");
  assert.ok(kaynak.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `${sira++}-${dosya.split("/").pop()}`);
  /* kopya geçici klasörde; göreli içe aktarmalar özgün klasöre çevrilir */
  writeFileSync(yol, kaynak.replace(eski, () => yeni).replaceAll('from "./', `from "${pathToFileURL(dirname(resolve(dosya))).href}/`));
  return import(pathToFileURL(yol).href) as Promise<T>;
}
type Tablo = typeof import("../../src/format/tablo.ts");
type Kunye = typeof import("../../src/format/kunye.ts");
const alanlar = (m: Tablo) => { const s = m.sanalBolumler(TABLO).find((x) => x.blok === "bilgi"); return s && s.blok === "bilgi" ? s.alanlar : []; };

test("1. ekipman kaydı hücresi sahaya alınmayınca kilit düşer", async () => {
  const m = await bozuk<Tablo>("src/format/tablo.ts", "    const e = ekipmanCinsi(h);\n", "    const e = null as EkipmanAlani | null; void ekipmanCinsi;\n");
  assert.equal(alanlar(m).some((a) => a.ekipman === "marka"), false);
});
test("2. ad grup başlığıyla ayrılmayınca kilit düşer", async () => {
  const m = await bozuk<Tablo>("src/format/tablo.ts", "    if (grup && katla(grup) !== katla(a.ad)) a.ad = `${a.ad} · ${grup}`;", "    void grup;");
  assert.equal(alanlar(m).filter((a) => a.ad === "Marka").length, 2, "bozuk: iki aynı ad");
});
test("3. serbest formatta varsayılan kilit dönünce kilit düşer", async () => {
  const m = await bozuk<Kunye>("src/format/kunye.ts", "(t.gorunum.serbest ? [] : VARSAYILAN_KILITLI)", "VARSAYILAN_KILITLI");
  assert.equal(m.kilitliKunye({ gorunum: { serbest: true } } as never).size, 2);
});
