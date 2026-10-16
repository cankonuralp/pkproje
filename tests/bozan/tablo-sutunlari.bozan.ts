/* OLUMSUZ KANIT — tests/tablo-sutunlari.test.ts neyi koruyor (sunum 595 madde 2, 9, 10). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): dosya
   bellekte bozulup geçici klasörden içe aktarılır.
   1. Belge cihaz tablosunda formatın sütunlarına bakmasaydı eklenen "Marka" sütunu basılmazdı (kâğıtta var, PDF'te yok).
   2. Uygunsuzluk tablosu kapatılınca sütun listesi boş dizi olarak kalsaydı format "değişmiş" sayılırdı (Bakanlık formatında boşuna uyarı).
   3. Cihaz tablosunun son sütunu da çıkabilseydi belgede başlıksız, sütunsuz tablo kalırdı.
   4. Bakanlık özü sütunları saymasaydı Bakanlık formatının cihaz sütunları değişince yayında uyarı çıkmazdı. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ornekBelge } from "../../src/belge/ornek.ts";
import { cihazSutunlari } from "../../src/format/duzen.ts";
import { SABLONLAR } from "../../src/format/sablonlar.ts";
import { FormatTanimi, type BolumOf } from "../../src/format/tanim.ts";
import { tabloSutunuEkle } from "../../src/modules/rapor-format/kurucu.ts";

const klasor = mkdtempSync(join(tmpdir(), "tablo-sutunlari-bozan-"));
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

test("1: belge cihaz tablosunda formatın sütunlarına bakmayınca eklenen sütun basılmaz", async () => {
  const m = await bozuk<typeof import("../../src/belge/belge.ts")>("src/belge/belge.ts", "      case \"cihaz\": return cihazTablosu(b);", "      case \"cihaz\": return cihazTablosu();");
  const t = Z2(), y = tabloSutunuEkle(t, yer(t, "cihaz"), "marka", "Markası").t;
  const h = renderToStaticMarkup(m.raporBelgesi({ ...ornekBelge("ZPKR02"), tanim: y }) as never);
  assert.equal(h.includes(">Markası</th>"), false, "bozuk: sütun basıldı");
});

test("2: uygunsuzluk tablosu kapatılınca boş sütun listesi kalırsa tanım eskisine dönmez", async () => {
  const m = await bozuk<Kurucu>("src/modules/rapor-format/kurucu.ts", "  if (b.blok === \"kusur\" && !sutunlar.length) delete y.sutunlar; else y.sutunlar = sutunlar;", "  y.sutunlar = sutunlar;");
  const t = Z2(), k = yer(t, "kusur");
  assert.notEqual(JSON.stringify(m.kusurTablosuYaz(m.kusurTablosuYaz(t, k, true), k, false)), JSON.stringify(t), "bozuk: tanım aynı kaldı");
});

test("3: cihaz tablosunun son sütunu da çıkınca sütunsuz tablo kalır", async () => {
  const m = await bozuk<Kurucu>("src/modules/rapor-format/kurucu.ts", "  return b.blok === \"cihaz\" && !l.length ? t : tabloYaz(t, i, l);", "  return tabloYaz(t, i, l);");
  const t = Z2(), c = yer(t, "cihaz");
  let y = t;
  for (const s of cihazSutunlari(t.bolumler[c] as BolumOf<"cihaz">)) {
    y = m.tabloSutunuSil(y, c, (y.bolumler[c] as BolumOf<"cihaz">).sutunlar?.find((x) => x.alan === s.alan)?.id ?? s.id);
  }
  assert.equal(cihazSutunlari(y.bolumler[c] as BolumOf<"cihaz">).length, 0, "bozuk: bir sütun kaldı");
});

test("4: Bakanlık özü sütunları saymayınca cihaz sütunu eklenen Bakanlık formatı uyarmaz", async () => {
  const m = await bozuk<typeof import("../../src/format/motor.ts")>("src/format/motor.ts",
    "  ...(b.blok === \"cihaz\" ? { sutunlar: cihazSutunlari(b).map((s) => ({ ad: s.ad, alan: s.alan })) } : {}),", "");
  const t = Z2(), y = tabloSutunuEkle(t, yer(t, "cihaz"), "seri").t;
  assert.deepEqual(m.kilitDenetimi(y, t), [], "bozuk: uyarı çıktı");
});
