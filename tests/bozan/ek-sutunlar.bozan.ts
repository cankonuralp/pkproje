/* OLUMSUZ KANIT — tests/ek-sutunlar.test.ts neyi koruyor (sunum 595 madde 6, 7). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): dosya bellekte
   bozulup geçici klasörden içe aktarılır.
   1. Belge kontrol listesinde ek sütunlara bakmasaydı sahada yazılan açıklama / not PDF'e basılmazdı.
   2. Son ek sütun çıkınca boş liste kalsaydı format "değişmiş" sayılırdı (Bakanlık formatında boşuna uyarı).
   3. Kontrol listesinde aynı bilgi (açıklama) iki kez eklenebilseydi aynı değer iki sütunda basılırdı.
   4. S.A.Y ek sütunun yerini yazmasaydı "x:<madde>:<sütun>" komutu raporda hiçbir şey değiştirmezdi. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ornekBelge } from "../../src/belge/ornek.ts";
import { SABLONLAR } from "../../src/format/sablonlar.ts";
import { Cevaplar, ekAnahtari, FormatTanimi, type BolumOf } from "../../src/format/tanim.ts";
import { ekSutunEkle } from "../../src/modules/rapor-format/kurucu.ts";
import { ilkCevaplar } from "../../src/modules/raporlar/ornek.ts";

const klasor = mkdtempSync(join(tmpdir(), "ek-sutunlar-bozan-"));
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

test("1: belge kontrol listesinde ek sütunlara bakmayınca sahada yazılan basılmaz", async () => {
  const m = await bozuk<typeof import("../../src/belge/belge.ts")>("src/belge/belge.ts", "        const ek = b.ekSutunlar ?? [];", "        const ek: NonNullable<typeof b.ekSutunlar> = [];");
  const t = Z2(), l = yer(t, "liste"), e = ekSutunEkle(t, l, "yazi", "Gözlem");
  const md = (e.t.bolumler[l] as BolumOf<"liste">).gruplar[0].maddeler[0];
  const c = Cevaplar.parse({ ...ilkCevaplar(e.t), ek: { [ekAnahtari(md.id, e.id!)]: "Deneme gözlemi" } });
  const h = renderToStaticMarkup(m.raporBelgesi({ ...ornekBelge("ZPKR02"), tanim: e.t, cevaplar: c }) as never);
  assert.equal(h.includes("Deneme gözlemi"), false, "bozuk: basıldı");
});

test("2: son ek sütun çıkınca boş liste kalırsa tanım eskisine dönmez", async () => {
  const m = await bozuk<Kurucu>("src/modules/rapor-format/kurucu.ts", "  if (sutunlar.length) y.ekSutunlar = sutunlar; else delete y.ekSutunlar;", "  y.ekSutunlar = sutunlar;");
  const t = Z2(), l = yer(t, "liste"), e = m.ekSutunEkle(t, l, "std");
  assert.notEqual(JSON.stringify(m.ekSutunSil(e.t, l, e.id!)), JSON.stringify(t), "bozuk: tanım aynı kaldı");
});

test("3: kontrol listesinde aynı bilgi iki kez eklenebilir", async () => {
  const m = await bozuk<Kurucu>("src/modules/rapor-format/kurucu.ts",
    "  if (b.blok === \"liste\") return LISTE_SUTUN_ALANLARI.filter((a) => a === \"yazi\" || !l.some((s) => s.alan === a));",
    "  if (b.blok === \"liste\") return [...LISTE_SUTUN_ALANLARI];");
  const t = Z2(), l = yer(t, "liste");
  assert.ok(m.ekSutunEkle(m.ekSutunEkle(t, l, "aciklama").t, l, "aciklama").id, "bozuk: ikinci açıklama eklenmedi");
});

test("4: S.A.Y ek sütunun yerini yazmayınca komut raporu değiştirmez", async () => {
  const m = await bozuk<typeof import("../../src/modules/raporlar/say-doldur.ts")>("src/modules/raporlar/say-doldur.ts",
    "  if (y.tur === \"ek\") { const e = { ...d.cevaplar.ek }; if (x) e[y.id] = x; else delete e[y.id]; return { ...d, cevaplar: { ...d.cevaplar, ek: e } }; }", "");
  const t = Z2(), l = yer(t, "liste"), e = ekSutunEkle(t, l, "yazi");
  const md = (e.t.bolumler[l] as BolumOf<"liste">).gruplar[0].maddeler[0];
  const u = m.komutlariUygula({ ekipman: {}, cevaplar: ilkCevaplar(e.t) }, e.t, [{ yer: `x:${md.id}:${e.id}`, deger: "Deneme" }]);
  assert.equal(u.durum.cevaplar.ek[ekAnahtari(md.id, e.id!)], undefined, "bozuk: yazıldı");
});
