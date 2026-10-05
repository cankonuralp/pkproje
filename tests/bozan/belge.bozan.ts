/* OLUMSUZ KANIT — tests/belge.test.ts neyi koruyor (315). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): çizici bellekte bozulur, geçici klasörden
   içe aktarılır (göreli içe aktarmalar ve react paketi mutlak adrese çevrilir).
   1. Sonuç cümlesi seçilen sonuca bağlanmasaydı belgede "uygundur / uygun değildir" ikisi birden yazardı (§3.8-2).
   2. Kusur listesi motordan alınmasaydı "Uygun değil" madde kusur açıklamalarına düşmezdi.
   3. (316) PDF'in HTML yazıcısı metni kaçırmasaydı kullanıcının yazdığı etiket PDF sayfasında çalışırdı. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { BelgeVerisi } from "../../src/belge/veri.ts";
import { SABLONLAR } from "../../src/format/sablonlar.ts";
import { Cevaplar } from "../../src/format/tanim.ts";

const KAYNAK = "src/belge/belge.ts";
const klasor = mkdtempSync(join(tmpdir(), "belge-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
let sira = 0;
type Modul = typeof import("../../src/belge/belge.ts");
async function bozuk(eski: string, yeni: string, kaynak = KAYNAK): Promise<Modul> {
  const metin = readFileSync(kaynak, "utf8");
  assert.ok(metin.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  /* göreli içe aktarmalar ve paket (react) mutlak adrese: geçici klasörde de çözülsün */
  const cevrilmis = metin.replace(eski, yeni).replace(/from "(\.{1,2}\/[^"]+)"/g, (_t, yol: string) => `from "${pathToFileURL(resolve(dirname(kaynak), yol)).href}"`)
    .replace(/from "react"/g, `from "${import.meta.resolve("react")}"`);
  const hedef = join(klasor, `belge-${sira++}.ts`);
  writeFileSync(hedef, cevrilmis);
  return import(pathToFileURL(hedef).href);
}
const KOMP = SABLONLAR.KOMPRESOR.tanim;
const MADDELER = KOMP.bolumler.flatMap((b) => (b.blok === "liste" ? b.gruplar.flatMap((g) => g.maddeler) : []));
const VERI: BelgeVerisi = {
  firma: { ad: "Deneme Muayene A.Ş.", kod: "DA", nusha: 2 }, no: "DA-1026-001-abcde", revizyon: 0, formatSira: 1, durum: "onayda",
  tur: { ad: "Hava tankı", kod: "HT", kontrolStd: [] },
  kunye: { firmaAdi: "Deneme Sanayi A.Ş.", adres: null, sgk: null, isgNo: null },
  tarih: { bas: "2026-10-05T09:00", bit: null, sonraki: null, takip: null, rapor: null },
  ekipman: { kod: "HT-1", marka: null, model: null, seri: null, imal: null, konum: null, amac: null, bolum: null },
  tanim: KOMP, cevaplar: Cevaplar.parse({ madde: { [MADDELER[0].id]: { c: "Uygun değil", not: "Korozyon var" } }, sonuc: "uygun_degil" }),
  cihazlar: [], fotolar: [], sonuc: "uygun_degil", yazan: { ad: "Deneme Bir", meslek: "mak-muh", ekipnet: null, diploma: null, oda: null }, onay: null, imza: null,
};
const metin = (m: Modul) => renderToStaticMarkup(m.raporBelgesi(VERI) as never).replace(/<[^>]+>/g, " ");

test("sonuç cümlesi seçilen sonuca bağlanmayınca belgede iki seçenek birden yazılır", async () => {
  const m = await bozuk(`v.sonuc === "uygun" ? "uygundur" : v.sonuc === "uygun_degil" ? "uygun değildir" : "-"`, `"uygundur / uygun değildir"`);
  assert.ok(metin(m).includes("uygundur / uygun değildir"));
});

test("kusur listesi motordan alınmayınca Uygun değil madde kusur açıklamalarına düşmez", async () => {
  const m = await bozuk("case \"kusur\": return d.kusurlar.length", "case \"kusur\": return [].length");
  assert.ok(!metin(m).includes("Korozyon var"));
});

test("HTML yazıcı metni kaçırmayınca kullanıcının yazdığı etiket PDF sayfasına ham girer", async () => {
  const m = (await bozuk(`return kac(String(n));`, `return String(n);`, "src/belge/html.ts")) as unknown as typeof import("../../src/belge/html.ts");
  const { createElement } = await import("react");
  assert.equal(m.htmlYaz(createElement("td", null, "<img src=x onerror=alert(1)>")), "<td><img src=x onerror=alert(1)></td>");
});
