/* OLUMSUZ KANIT — tests/sonuc-kurali.test.ts (2026-10-16, sonuç kuralı formülle) gerçekten yakalıyor mu. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11):
   dosya bellekte bozulup geçici klasörden içe aktarılır (göreli içe aktarmalar asıl dosyalara çevrilir). Her bozmada eşdeğerlik kilidinin denetlediği
   satır eski Bakanlık hesabından AYRILMALI:
   1. sağlanmayan kural satırı "Uygun değil" yapmıyor (sonuc.ts kuralUygula) — 49 kΩ zemin izolasyonu sonuçsuz kalır;
   2. linye'nin PE kuralı düşmüş (varsayilanKurallar) — 50 mm² fazda 16 mm² PE "yetersiz" denmez;
   3. sayı sütunundaki yazı boş sayılmıyor (formul.ts kati) — Zx "abc" yazıyla karşılaştırılıp sonuç üretir;
   4. ZS yuvarlamıyor (formul.ts) — Zx 0,36505 Ω C63'te Uygun'a döner;
   5. motor sonuç kuralını yok sayıyor (motor.ts satirDegerlendir) — kural sonucu hiç çıkmaz. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { satirHesabi } from "../../src/format/formul.ts";
import { linyeHesap, noktaHesap, ziHesap } from "../../src/format/hesap.ts";
import { SABLONLAR } from "../../src/format/sablonlar.ts";
import { kuralUygula, varsayilanKurallar } from "../../src/format/sonuc.ts";
import { Cevaplar, FormatTanimi, type BolumOf } from "../../src/format/tanim.ts";

const gecici = mkdtempSync(join(tmpdir(), "sonuc-kurali-bozan-"));
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
type Sonuc = typeof import("../../src/format/sonuc.ts");
type Formul = typeof import("../../src/format/formul.ts");
type Motor = typeof import("../../src/format/motor.ts");

const Z1 = FormatTanimi.parse(SABLONLAR.ZPKR01.tanim), Z2 = FormatTanimi.parse(SABLONLAR.ZPKR02.tanim);
const olcum = (t: FormatTanimi, id: string) => t.bolumler.find((b) => b.id === id) as BolumOf<"olcum">;
/** tek satırın kural sonucu (s: sonuc modülü, f: formül modülü — biri bozuk olabilir) */
function sonuc(t: FormatTanimi, id: string, satir: Record<string, string>, s: Pick<Sonuc, "kuralUygula" | "varsayilanKurallar"> = { kuralUygula, varsayilanKurallar },
  f: Pick<Formul, "satirHesabi"> = { satirHesabi }, ik3 = "") {
  const b = olcum(t, id), c = Cevaplar.parse({ tablo: { [id]: [satir] }, deger: ik3 ? { ik3 } : {} });
  const h = f.satirHesabi(t, c);
  return s.kuralUygula(s.varsayilanKurallar(t, b), (x) => h(b, 0, x));
}

test("kilit: bozulmamış kural eski hesapla aynı (bozanların karşılaştırdığı satırlar)", () => {
  assert.equal(sonuc(Z2, "zi", { direnc: "49" }).uygun, ziHesap({ direnc: "49" })!.uygun);
  assert.equal(sonuc(Z1, "nokta", { egri: "C", inom: "63", zx: "0,36505" }).uygun, false);
  assert.equal(noktaHesap({ egri: "C", In: "63", zx: "abc" }).zx, null);
  assert.equal(sonuc(Z1, "nokta", { egri: "C", inom: "63", zx: "abc" }).uygun, null);
  assert.deepEqual(sonuc(Z2, "linye", { akim: "32", faz: "50", pe: "16" }).neden, linyeHesap({ akim: "32", faz: "50", pe: "16" }, "")!.neden);
});

test("1. sağlanmayan kural 'Uygun değil' yapmayınca 49 kΩ zemin izolasyonu eski hesaptan ayrılır (kilidin koruduğu açık)", async () => {
  const m = await bozuk<Sonuc>("src/format/sonuc.ts", "    uygun = false;\n    agir ||= !!k.agir;", "    agir ||= !!k.agir;");
  assert.notEqual(sonuc(Z2, "zi", { direnc: "49" }, m).uygun, ziHesap({ direnc: "49" })!.uygun, "bozuk: yakalanmadı");
});

test("2. linye'nin PE kuralı düşünce 'PE kesiti yetersiz' denmez (kilidin koruduğu açık)", async () => {
  const m = await bozuk<Sonuc>("src/format/sonuc.ts", "      if (faz && pe) l.push(", "      if (false && faz && pe) l.push(");
  assert.notDeepEqual(sonuc(Z2, "linye", { akim: "32", faz: "50", pe: "16" }, m).neden, linyeHesap({ akim: "32", faz: "50", pe: "16" }, "")!.neden, "bozuk: yakalanmadı");
});

test("3. sayı sütunundaki yazı boş sayılmayınca Zx 'abc' sonuç üretir (kilidin koruduğu açık)", async () => {
  const m = await bozuk<Formul>("src/format/formul.ts", "return sayiMi(ham) ?? (kati ? null : ham);", "return sayiMi(ham) ?? ham;");
  assert.notEqual(sonuc(Z1, "nokta", { egri: "C", inom: "63", zx: "abc" }, undefined, m).uygun, null, "bozuk: yakalanmadı");
});

test("4. ZS yuvarlamayınca C63'te Zx 0,36505 Ω Uygun'a döner (kilidin koruduğu açık)", async () => {
  const m = await bozuk<Formul>("src/format/formul.ts", "return ia > 0 ? Math.round((UO / ia) * 1000) / 1000 : 0;", "return ia > 0 ? UO / ia : 0;");
  assert.equal(sonuc(Z1, "nokta", { egri: "C", inom: "63", zx: "0,36505" }, undefined, m).uygun, true, "bozuk: yakalanmadı");
});

test("5. motor sonuç kuralını yok sayınca kuralın sonucu çıkmaz (kilidin koruduğu açık)", async () => {
  const m = await bozuk<Motor>("src/format/motor.ts", "  const k = kuralUygula(kurallar, hesapla);", "  const k = { uygun: null, neden: [] as string[], agir: false }; void kuralUygula; void hesapla;");
  const d = m.degerlendir(Z2, Cevaplar.parse({ tablo: { zi: [{ yer: "Y", direnc: "49" }] } }));
  assert.equal(d.satirlar.zi[0].uygun, null, "bozuk: kural sonucu çıkmadı");
  assert.notEqual(d.satirlar.zi[0].uygun, ziHesap({ direnc: "49" })!.uygun);
});
