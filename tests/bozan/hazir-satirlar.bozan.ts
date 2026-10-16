/* OLUMSUZ KANIT — tests/hazir-satirlar.test.ts neyi koruyor (sunum 595 madde 5). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): dosya bellekte
   bozulup geçici klasörden içe aktarılır.
   1. Yeni raporun ilk cevapları hazır satırları kurmasaydı formattaki satırlar rapora hiç gelmezdi.
   2. Belge sıra sütununda hazır satırın adına bakmasaydı "L1-N" yerine 1, 2, 3 basılırdı.
   3. Satır kopyası adı silmeseydi kopyalanan satır da "L1-N" adını taşırdı (iki L1-N).
   4. Son hazır satır çıkınca boş liste kalsaydı format "değişmiş" sayılırdı (Bakanlık formatında boşuna uyarı). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ornekBelge } from "../../src/belge/ornek.ts";
import { SABLONLAR } from "../../src/format/sablonlar.ts";
import { Cevaplar, FormatTanimi, HAZIR_AD } from "../../src/format/tanim.ts";
import { hazirSatirEkle } from "../../src/modules/rapor-format/kurucu.ts";
import { ilkCevaplar } from "../../src/modules/raporlar/ornek.ts";

const klasor = mkdtempSync(join(tmpdir(), "hazir-satirlar-bozan-"));
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
const yer = (t: FormatTanimi) => t.bolumler.findIndex((b) => b.blok === "olcum");

test("1: ilk cevaplar hazır satırları kurmayınca formattaki satırlar rapora gelmez", async () => {
  const m = await bozuk<typeof import("../../src/modules/raporlar/ornek.ts")>("src/modules/raporlar/ornek.ts",
    "  return Cevaplar.parse({ madde, tablo });", "  return Cevaplar.parse({ madde });");
  const t = Z2(), o = yer(t), y = hazirSatirEkle(t, o, "L1-N");
  assert.equal(m.ilkCevaplar(y).tablo[t.bolumler[o].id], undefined, "bozuk: satır geldi");
});

test("2: belge sıra sütununda hazır satırın adına bakmayınca numara basılır", async () => {
  const m = await bozuk<typeof import("../../src/belge/belge.ts")>("src/belge/belge.ts", "s[HAZIR_AD] || String(i + 1)", "String(i + 1)");
  const t = Z2(), o = yer(t), y = hazirSatirEkle(t, o, "L1-N");
  const h = renderToStaticMarkup(m.raporBelgesi({ ...ornekBelge("ZPKR02"), tanim: y, cevaplar: Cevaplar.parse(ilkCevaplar(y)) }) as never);
  assert.equal(h.includes('<td class="rb-orta">L1-N</td>'), false, "bozuk: ad basıldı");
});

test("3: satır kopyası adı silmeyince kopya da aynı adı taşır", async () => {
  const m = await bozuk<typeof import("../../src/modules/raporlar/tablo.ts")>("src/modules/raporlar/tablo.ts", "  delete k._ad;", "");
  assert.equal(m.satirKopyasi({ [HAZIR_AD]: "L1-N" }, undefined)[HAZIR_AD], "L1-N", "bozuk: ad silindi");
});

test("4: son hazır satır çıkınca boş liste kalırsa tanım eskisine dönmez", async () => {
  const m = await bozuk<typeof import("../../src/modules/rapor-format/kurucu.ts")>("src/modules/rapor-format/kurucu.ts",
    "  if (v.length) y.hazir = v; else delete y.hazir;", "  y.hazir = v;");
  const t = Z2(), o = yer(t);
  assert.notEqual(JSON.stringify(m.hazirSatirSil(m.hazirSatirEkle(t, o, "L1-N"), o, 0)), JSON.stringify(t), "bozuk: tanım aynı kaldı");
});
