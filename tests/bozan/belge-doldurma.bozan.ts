/* OLUMSUZ KANIT — tests/belge-doldurma.test.ts neyi koruyor (2026-10-25, belge doldurma; reisim: "bir müşteri için sözleşme açtığımda el ile girilmesi
   gereken yerleri girip öyle gönderebilmeliyim"). Kaynak diskte değiştirilmez; bellekte bozulur, göreli içe aktarmalar mutlak yola çevrilir:
   1. belgeFormu elle değerleri cevaplara koymasaydı doldurulan yerler belgede (PDF) boş basılırdı — kişi doldurur, müşteriye boş sözleşme giderdi.
   2. Denetim formatta olmayan anahtarı atlasaydı (hata vermeseydi) istemci istediği kimlikle veri yazdırabilirdi.
   3. Çoğalan satırdaki alan elle yerlere girseydi tek değer listenin bütün satırlarına ait sayılırdı (belgede basılmayan yer doldurulurdu).
   4. Hatalar düz nesneye atansaydı "__proto__" anahtarının hatası kaybolurdu (geçersiz girdi hatasız görünürdü).
   5. Toplam sınır olmasaydı veritabanının 200 000 bayt sınırını aşan değerler kayıtta "kaydedilemedi" diye düşerdi (kullanıcıya nedeni söylenmezdi).
   6. Evet / hayır belgede çevrilmeseydi sözleşmede "evet" / "hayir" basılırdı. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { FormatTanimi } from "../../src/format/tanim.ts";

const klasor = mkdtempSync(join(tmpdir(), "belge-doldurma-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
let sira = 0;
async function bozuk<T>(dosya: string, eski: string, yeni: string): Promise<T> {
  const kok = resolve(dosya, "..");
  const kaynak = readFileSync(dosya, "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(kok, y)).href}"`)
    .replace(/from "react"/g, `from "${import.meta.resolve("react")}"`).replace(/from "zod"/g, `from "${import.meta.resolve("zod")}"`);
  assert.ok(kaynak.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `b-${sira++}.ts`);
  writeFileSync(yol, kaynak.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href) as Promise<T>;
}
type Doldurma = typeof import("../../src/belge/doldurma.ts");
type Belge = typeof import("../../src/belge/belge.ts");
const DOLDURMA = "src/belge/doldurma.ts";
const TANIM = FormatTanimi.parse({
  sema: 1, gorunum: { serbest: true }, bolumler: [{
    id: "b1", ad: "Form", blok: "tablo", sutun: [40, 60], satirlar: [{}, {}, { tekrar: true, id: "v1" }],
    hucreler: [
      { r: 0, c: 0, tur: "yazi", m: "Müşteri yetkilisi" }, { r: 0, c: 1, tur: "alan", id: "c_yetkili", alan: "metin" },
      { r: 1, c: 0, tur: "yazi", m: "Fatura e-posta ile" }, { r: 1, c: 1, tur: "alan", id: "c_eposta", alan: "evet" },
      { r: 2, c: 0, tur: "sira" }, { r: 2, c: 1, tur: "alan", id: "c_satir", alan: "metin" },
    ],
  }],
});
const DEGER = { alanlar: { belge_no: "S-1026-001", form_kod: "DA-FR-SZL-01" }, listeler: {} };
const ciz = (m: Belge, elle: Record<string, string>) => renderToStaticMarkup(m.belgeFormu(TANIM, { ad: "Deneme", kod: "DA" }, DEGER, "Sözleşme", elle) as never);

test("belgeFormu elle değerleri cevaplara koymazsa doldurulan yer boş basılır", async () => {
  const m = await bozuk<Belge>("src/belge/belge.ts", "alan: elleCevaplari(t, elle) }", "alan: {} }");
  const html = ciz(m, { c_yetkili: "Deneme Yetkili" });
  assert.ok(!html.includes("Deneme Yetkili"), "bozuk: elle değer basılmadı");
});

test("denetim formatta olmayan anahtarı atlarsa istemcinin kimliği hatasız geçer", async () => {
  const m = await bozuk<Doldurma>(DOLDURMA, `if (!a) { hatalar.set(k, "Formda böyle bir yer yok."); continue; }`, "if (!a) continue;");
  assert.equal(m.elleDegerleriDenetle(TANIM, { b1: "x", c_yetkili: "Deneme" }).tamam, true, "bozuk: geçersiz anahtar kabul edildi");
});

test("çoğalan satırdaki alan elle yerlere girerse listenin satırı tek değerle doldurulur", async () => {
  const m = await bozuk<Doldurma>(DOLDURMA, "tekrar.has(h.r) || ", "");
  assert.ok(m.elleAlanlari(TANIM).some((a) => a.id === "c_satir"), "bozuk: çoğalan satırın alanı elle yer oldu");
});

test("hatalar düz nesneye atanırsa __proto__ anahtarının hatası kaybolur", async () => {
  const m = await bozuk<Doldurma>(DOLDURMA, "if (hatalar.size) return { tamam: false, hatalar: Object.fromEntries(hatalar) };",
    "if (hatalar.size) { const h: Record<string, string> = {}; for (const [k, v] of hatalar) h[k] = v; return { tamam: false, hatalar: h }; }");
  const r = m.elleDegerleriDenetle(TANIM, JSON.parse("{\"__proto__\": \"x\"}"));
  assert.ok(!r.tamam);
  assert.deepEqual(Object.keys(r.hatalar), [], "bozuk: hata görünmüyor (testteki beklenti ['__proto__'])");
});

test("toplam sınır olmazsa 200 000 baytı aşan değerler kabul edilir", async () => {
  const m = await bozuk<Doldurma>(DOLDURMA, "if (bayt(JSON.stringify(sonuc)) + 2 * degerler.size > ELLE_TOPLAM_EN_COK)", "if (false)");
  const cok = FormatTanimi.parse({ sema: 1, gorunum: { serbest: true }, bolumler: [{ id: "b1", ad: "Form", blok: "tablo", sutun: [100],
    satirlar: Array.from({ length: 120 }, () => ({})), hucreler: Array.from({ length: 120 }, (_, r) => ({ r, c: 0, tur: "alan", id: `c${r}`, alan: "metin" })) }] });
  const buyuk = Object.fromEntries(Array.from({ length: 120 }, (_, r) => [`c${r}`, "ş".repeat(2000)]));
  assert.equal(m.elleDegerleriDenetle(cok, buyuk).tamam, true, "bozuk: sınırı aşan değerler geçti");
});

test("evet / hayır belgede çevrilmezse sözleşmede 'evet' basılır", async () => {
  const m = await bozuk<Belge>("src/belge/belge.ts", `if (v.belge && x.alan === "evet") return d === "evet" ? "Evet" : d === "hayir" ? "Hayır" : d;`, "");
  const html = ciz(m, { c_eposta: "evet" });
  assert.ok(html.includes(">evet<") && !html.includes(">Evet<"), "bozuk: saklanan sözcük basıldı");
});
