/* OLUMSUZ KANIT — tests/saha-listesi.test.ts (2026-11-08 Saha listesi) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ: kaynak metni bellekte bozulur, geçici klasörden içe aktarılır. O zaman:
   1) Uygun satırda önceki rapordan gelen olumsuz madde kalırsa "uygun" rapor uygunsuzlukla çıkar;
   2) olumsuz cevap 2. öğe değilse motor kusuru görmez (rapor uygun görünür);
   3) madde bulunamayınca not yoruma gitmezse uzmanın yazdığı kaybolur;
   4) "Kalanları uygun işaretle" işaretliyi ezerse "Değil" denen ekipman uygun çıkar;
   5) saat önceki raporun bitişinden sürmezse aynı kişinin raporları çakışır;
   6) bant bugünü kapsayan planı atlarsa rapor yanlış plana açılır. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { Cevaplar, type FormatTanimi } from "../../src/format/tanim.ts";

const gecici = mkdtempSync(join(tmpdir(), "saha-listesi-bozan-"));
after(() => rmSync(gecici, { recursive: true, force: true }));
let sira = 0;
type L = typeof import("../../src/modules/raporlar/saha-listesi.ts");
type B = typeof import("../../src/modules/say-chat/saha.ts");
async function bozuk<T>(dosya: string, eski: string, yeni: string): Promise<T> {
  const kaynak = readFileSync(resolve(dosya), "utf8");
  assert.ok(kaynak.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(gecici, `${sira++}.ts`);
  writeFileSync(yol, kaynak.replace(eski, () => yeni)
    .replace(/from "\.\.\/\.\.\/sema\/ortak\.ts"/, () => `from "${pathToFileURL(resolve("src/sema/ortak.ts")).href}"`)
    .replace(/from "\.\.\/\.\.\/format\/tanim\.ts"/, () => `from "${pathToFileURL(resolve("src/format/tanim.ts")).href}"`));
  return import(pathToFileURL(yol).href) as Promise<T>;
}
const LISTE = "src/modules/raporlar/saha-listesi.ts", BANT = "src/modules/say-chat/saha.ts";
const T = { bolumler: [{ blok: "liste", id: "l1", ad: "K", cevaplar: ["Uygun", "Uygun Değil"], gruplar: [{ id: "g", ad: "G", maddeler: [{ id: "m1", metin: "A", kilit: false }, { id: "m2", metin: "B", kilit: false }] }] }] } as unknown as Pick<FormatTanimi, "bolumler">;

test("1) Uygun satırda önceki olumsuz seçim kalırsa rapor uygunsuzlukla çıkar", async () => {
  const m = await bozuk<L>(LISTE, "} else madde[m.id] = { c: b.cevaplar[0]! };", "} else madde[m.id] ??= { c: b.cevaplar[0]! };");
  const r = m.sahaCevaplari(T, Cevaplar.parse({ madde: { m1: { c: "Uygun Değil" } } }), { sonuc: "uygun", maddeler: [], not: null });
  assert.equal(r.cevaplar.madde.m1!.c, "Uygun Değil", "bozuk: eski olumsuz kaldı");
});
test("2) olumsuz cevap 2. öğe değilse motor kusuru görmez", async () => {
  const m = await bozuk<L>(LISTE, "madde[m.id] = { c: b.cevaplar[1]!,", "madde[m.id] = { c: b.cevaplar[0]!,");
  assert.equal(m.sahaCevaplari(T, Cevaplar.parse({}), { sonuc: "degil", maddeler: ["m1"], not: null }).cevaplar.madde.m1!.c, "Uygun", "bozuk: seçilen madde uygun yazıldı");
});
test("3) madde bulunamayınca not yoruma gitmezse uzmanın yazdığı kaybolur", async () => {
  const m = await bozuk<L>(LISTE, 'g.sonuc === "degil" && g.not && !bulunan.size ? g.not.slice(0, SAHA_NOT_EN_COK) : c.yorum', "c.yorum");
  assert.equal(m.sahaCevaplari(T, Cevaplar.parse({}), { sonuc: "degil", maddeler: ["yok"], not: "n" }).cevaplar.yorum, "", "bozuk: not kayboldu");
});
test("4) Kalanları uygun işaretle işaretliyi ezerse Değil denen ekipman uygun çıkar", async () => {
  const m = await bozuk<L>(LISTE, "if (!y[id]) y[id] =", "y[id] =");
  const r = m.kalanlariUygun({ a: { sonuc: "degil", maddeler: ["m1"], not: null, sohbet: [] } }, ["a"]);
  assert.equal(r.a!.sonuc, "uygun", "bozuk: Değil ezildi");
});
test("5) saat önceki raporun bitişinden sürmezse raporlar çakışır", async () => {
  const m = await bozuk<L>(LISTE, "return sonBitis && dakika(sonBitis) > dakika(mesai) ? sonBitis : mesai;", "return mesai;");
  assert.equal(m.sahaBaslangici("08:30", "09:15"), "08:30", "bozuk: aynı saatten başladı");
});
test("6) bant bugünü kapsayan planı atlarsa rapor yanlış plana açılır", async () => {
  const m = await bozuk<B>(BANT, "p.baslangic <= bugun && bugun <= p.bitis ? 0 : ", "");
  const p = (id: string, baslangic: string, bitis: string) => ({ id, no: id, tesis: "t", baslangic, bitis, kalan: 1 });
  /* bugünü kapsayan plan başlangıç > bugün değilse b - bitis negatif; bozukta kapsayan plan da "uzak" sayılır */
  assert.notEqual(m.bantPlani([p("yakin", "2026-11-09", "2026-11-09"), p("bugun", "2026-11-01", "2026-11-30")], "2026-11-08", null)?.id, undefined);
  const secilen = m.bantPlani([p("gelecek", "2026-11-08", "2026-11-08"), p("kapsayan", "2026-11-07", "2026-11-09")], "2026-11-08", null)?.id;
  assert.ok(secilen === "gelecek" || secilen === "kapsayan");
  const b = await bozuk<B>(BANT, "if (a < c || (a === c && p.baslangic > en.baslangic && p.baslangic <= bugun)) en = p;", "");
  assert.equal(b.bantPlani([p("uzak", "2026-01-01", "2026-01-01"), p("bugun", "2026-11-08", "2026-11-08")], "2026-11-08", null)?.id, "uzak", "bozuk: ilk plan kaldı");
});
