/* OLUMSUZ KANIT — tests/formul.test.ts (495) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): dosya bellekte bozulup geçici klasörden içe
   aktarılır (göreli içe aktarmalar asıl dosyalara çevrilir).
   · Motor formülü uygulamasaydı formüllü değerin sınırı hiç değerlendirilmez — 1,5 × çalışma basıncı tutmayan kap "Uygun" kalırdı.
   · Formüllü değer eksik sayılsaydı denetçinin yazamadığı alan için rapor onaya gidemezdi.
   · Yüzde işareti yok sayılsaydı "50%" 50 olurdu (sonuç 100 kat yanlış).
   · 495 düzeltmesi: formüle ekleme boşluksuz birleşseydi işaretten sonra eklenen ad bitişik kalırdı ("[Iz] −[Ib]" — deneme makinesi b51af0f).
   · 552: baştaki "Ad =" atılmasaydı reisim'in yazdığı "RCa = 480/RCd" hesaplanmazdı. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { SABLONLAR } from "../../src/format/sablonlar.ts";
import { Cevaplar, FormatTanimi, type BolumOf } from "../../src/format/tanim.ts";

const gecici = mkdtempSync(join(tmpdir(), "formul-bozan-"));
after(() => rmSync(gecici, { recursive: true, force: true }));
let sira = 0;
async function bozuk<M>(kaynak: string, eski: string, yeni: string): Promise<M> {
  const s = readFileSync(resolve(kaynak), "utf8");
  assert.ok(s.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const c = s.replace(eski, () => yeni).replace(/from "(\.{1,2}\/[^"]+)"/g, (_t, y: string) => `from "${pathToFileURL(resolve(dirname(resolve(kaynak)), y)).href}"`);
  const yol = join(gecici, `kopya-${sira++}.ts`);
  writeFileSync(yol, c);
  return import(pathToFileURL(yol).href) as Promise<M>;
}
type Motor = typeof import("../../src/format/motor.ts");
type Formul = typeof import("../../src/format/formul.ts");
type Kurucu = typeof import("../../src/modules/rapor-format/kurucu.ts");

function formullu(): FormatTanimi {
  const t = structuredClone(FormatTanimi.parse(SABLONLAR.KOMPRESOR.tanim));
  const hidro = (t.bolumler.find((b) => b.blok === "test") as BolumOf<"test">).degerler.find((d) => d.id === "hidro")!;
  hidro.formul = "1,5 × [Çalışma basıncı]"; hidro.op = ">="; hidro.sinir = 20;
  return FormatTanimi.parse(t);
}

test("1. motor formülü uygulamayınca formüllü değerin sınırı değerlendirilmez (kilidin koruduğu açık)", async () => {
  const m = await bozuk<Motor>("src/format/motor.ts", "  const c = formulUygula(t, c0);", "  const c = c0;");
  const d = m.degerlendir(formullu(), Cevaplar.parse({ alan: { calisma: "10" } }));
  assert.equal(d.degerler.hidro, null, "bozuk: 15 < 20 kusur sayılmadı");
});

test("2. formüllü değer eksik sayılınca denetçinin yazamadığı alan onayı durdurur (kilidin koruduğu açık)", async () => {
  const m = await bozuk<Motor>("src/format/motor.ts", "if (d.zorunlu && !dolu && !formulluDeger(d)) eksikler", "if (d.zorunlu && !dolu) eksikler");
  const d = m.degerlendir(formullu(), Cevaplar.parse({}));
  assert.ok(d.eksikler.some((e) => e.alan === "hidro"), "bozuk: formüllü değer eksik");
});

test("3. yüzde işareti yok sayılınca 50% 50 olur (kilidin koruduğu açık)", async () => {
  const m = await bozuk<Formul>("src/format/formul.ts", "return (f) => a(f) / 100; }", "return a; }");
  assert.equal(m.formulHesapla("50%", () => undefined), 50, "bozuk: yüzde yok");
});

test("4. formüle ekleme boşluksuz birleşince işaretten sonraki ad bitişik kalır (kilidin koruduğu açık)", async () => {
  const m = await bozuk<Kurucu>("src/modules/rapor-format/kurucu.ts", 'const ara = (x: string, y: string) => (!x || !y || x.endsWith("(") || y.startsWith(")") ? "" : " ");',
    "const ara = (_x: string, _y: string) => \"\";");
  let f = "", i = 0;
  for (const x of ["[Iz]", "−", "[Ib]"]) { const r = m.formuleEkle(f, i, i, x); f = r.formul.trim(); i = Math.min(r.imlec, f.length); }
  assert.notEqual(f, "[Iz] − [Ib]", "bozuk: boşluk kayboldu");
});

/* 552: "RCa = 480/RCd" yazıldığı gibi */
test("5. baştaki \"Ad =\" atılmayınca \"RCa = 480/RCd\" hesaplanmaz (kilidin koruduğu açık)", async () => {
  const m = await bozuk<Formul>("src/format/formul.ts", 'const k = ifade.indexOf("="); return k >= 0 ? ifade.slice(k + 1) : ifade;', "return ifade;");
  assert.equal(m.formulHesapla("RCa = 480/RCd", (a) => (a === "RCd" ? 4 : undefined)), null, "bozuk: yazıldığı gibi hesaplanmadı");
});
