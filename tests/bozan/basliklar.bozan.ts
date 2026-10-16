/* OLUMSUZ KANIT — tests/basliklar.test.ts neyi koruyor (sunum 595 madde 4, 8, 12–14). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): dosya bellekte
   bozulup geçici klasörden içe aktarılır.
   1. Bugünkü yazıyla aynı yazılan başlık kalkmasaydı her dokunuşta format "değişmiş" sayılır — Bakanlık formatında boşuna yayın uyarısı çıkardı.
   2. Belge Sonuç sütununun yerine bakmasaydı "belgede gizli" seçilen tabloda Sonuç sütunu yine basılırdı.
   3. Madde grubun ucundan komşu gruba geçmeseydi madde başka gruba hiç taşınamazdı (yalnız grubun içinde). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ornekBelge } from "../../src/belge/ornek.ts";
import { kilitDenetimi } from "../../src/format/motor.ts";
import { SABLONLAR } from "../../src/format/sablonlar.ts";
import { FormatTanimi, type BolumOf } from "../../src/format/tanim.ts";
import { sonucYeriYaz } from "../../src/modules/rapor-format/kurucu.ts";

const klasor = mkdtempSync(join(tmpdir(), "basliklar-bozan-"));
let sira = 0;
async function bozuk<M>(kaynak: string, eski: string, yeni: string): Promise<M> {
  const k = resolve(kaynak), metin = readFileSync(k, "utf8");
  assert.ok(metin.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `b-${sira++}.ts`);
  writeFileSync(yol, metin.replace(eski, () => yeni).replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(dirname(k), y)).href}"`)
    .replace(/from "((?!node:|file:)[a-z@][^"]*)"/g, (_, y: string) => `from "${import.meta.resolve(y)}"`));
  return import(pathToFileURL(yol).href) as Promise<M>;
}
after(() => rmSync(klasor, { recursive: true, force: true }));
const Z2 = () => FormatTanimi.parse(SABLONLAR.ZPKR02.tanim);
const yer = (t: FormatTanimi, blok: string) => t.bolumler.findIndex((b) => b.blok === blok);
type Kurucu = typeof import("../../src/modules/rapor-format/kurucu.ts");

test("1: bugünkü yazıyla aynı başlık kalkmayınca Bakanlık formatında boşuna yayın uyarısı çıkar", async () => {
  const m = await bozuk<Kurucu>("src/modules/rapor-format/kurucu.ts", "    if (!v || v === varsayilan) delete y[k]; else y[k] = v;", "    if (!v) delete y[k]; else y[k] = v;");
  const z = Z2(), o = yer(z, "olcum");
  assert.ok(kilitDenetimi(m.bolumBasligiYaz(z, o, "sonuc", "Sonuç"), z).length > 0, "bozuk: aynı yazı uyarı verdi");
});

test("2: belge Sonuç sütununun yerine bakmayınca 'belgede gizli' tabloda Sonuç basılır", async () => {
  const m = await bozuk<typeof import("../../src/belge/belge.ts")>("src/belge/belge.ts", "const ob = olcumBasliklari(b), yer = b.sonucYeri ?? \"son\";", "const ob = olcumBasliklari(b), yer = \"son\";");
  const z = Z2(), o = yer(z, "olcum"), b = z.bolumler[o] as BolumOf<"olcum">;
  const t = sonucYeriYaz(z, o, "gizli");
  const h = renderToStaticMarkup(m.raporBelgesi({ ...ornekBelge("ZPKR02"), tanim: t }) as never);
  const tablo = h.split("<table>").find((x) => b.sutunlar.every((s) => x.includes(s.ad)))!;
  assert.ok(/<th class="rb-ab">Sonuç<\/th>/.test(tablo), "bozuk: gizli Sonuç basıldı");
});

test("3: madde grubun ucundan komşu gruba geçmeyince başka gruba taşınamaz", async () => {
  const m = await bozuk<Kurucu>("src/modules/rapor-format/kurucu.ts", "      if (hedef < 0 || hedef >= gruplar.length) return t;", "      return t;");
  const z = Z2(), l = yer(z, "liste"), b = z.bolumler[l] as BolumOf<"liste">;
  assert.equal(m.ogeTasi(z, l, b.gruplar[0].maddeler.at(-1)!.id, 1), z, "bozuk: madde gruptan çıkamadı");
});
