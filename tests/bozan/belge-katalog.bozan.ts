/* OLUMSUZ KANIT — tests/belge-katalog.test.ts neyi koruyor (kaynak diskte değiştirilmez; bellekte bozulur, göreli içe aktarmalar mutlak yola çevrilir):
   1. Çoğalan satır belgenin listesinden kopyalanmazsa firmanın formunda yalnız ilk varlık basılır (3 öğe → 1 satır).
   2. Kayıt hücresinin veri'si okunmazsa belgenin bilgisi (teslim alan) boş basılır.
   3. Eşleme işlevi bir alanı vermezse katalogdaki alan değerlerde yok (kurucuda seçilen hücre sessizce boş kalırdı).
   4. Şema veri'li kayıt hücresini kaynak istediği için reddederse firmanın belge formatı kaydedilemez.
   5. (2026-10-25, belge doldurma) Sözleşmenin eşlemesi bir alanı vermezse sözleşme formatında seçilen hücre boş kalır. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { BELGE_KATALOGU, zimmetDegerleri } from "../../src/belge/katalog.ts";
import { ornekZimmetFormu } from "../../src/belge/ornek.ts";
import { FormatTanimi } from "../../src/format/tanim.ts";

const klasor = mkdtempSync(join(tmpdir(), "belge-katalog-bozan-"));
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
type Belge = typeof import("../../src/belge/belge.ts");
const TANIM = FormatTanimi.parse({
  sema: 1, gorunum: { serbest: true }, bolumler: [{
    id: "b1", ad: "Form", blok: "tablo", sutun: [20, 40, 40], satirlar: [{}, { tekrar: true, id: "v1" }],
    hucreler: [{ r: 0, c: 0, tur: "yazi", m: "Teslim alan" }, { r: 0, c: 1, cs: 2, tur: "kayit", veri: "alan_ad" },
      { r: 1, c: 0, tur: "sira" }, { r: 1, c: 1, tur: "kayit", veri: "varlik.kod" }, { r: 1, c: 2, tur: "kayit", veri: "varlik.ad" }],
  }],
});
const V = { ...ornekZimmetFormu(), varliklar: ["OC-201", "DM-2", "DM-3"].map((kod) => ({ kod, ad: `Varlık ${kod}`, tur: "Demirbaş", teslim: null, not: null })) };
const ciz = (m: Belge) => renderToStaticMarkup(m.belgeFormu(TANIM, V.firma, zimmetDegerleri(V), "Zimmet teslim formu") as never);

test("çoğalan satır listeden kopyalanmazsa yalnız ilk varlık basılır", async () => {
  const m = await bozuk<Belge>("src/belge/belge.ts", "liste.forEach((l, r) => { if (l) kez[r] = Math.max(1, v.belge?.listeler[l]?.length ?? 0); });", "");
  const html = ciz(m);
  assert.equal((html.match(/<tr/g) ?? []).length, 2, "bozuk: 1 + 1 satır (4 olmalıydı)");
  assert.ok(html.includes(">OC-201<") && !html.includes(">DM-3<"));
});

test("kayıt hücresinin veri'si okunmazsa teslim alan boş basılır", async () => {
  const m = await bozuk<Belge>("src/belge/belge.ts", `case "kayit": return x.veri ? belgeDegeri(x.veri, oge) : x.kaynak ? kaynakDegeri(x.kaynak) : "";`,
    `case "kayit": return x.kaynak ? kaynakDegeri(x.kaynak) : "";`);
  const html = ciz(m);
  assert.ok(!html.includes(">Deneme Denetçi<") && !html.includes(">OC-201<"), "bozuk: veri hücreleri boş");
});

test("eşleme işlevi bir alanı vermezse katalogla değerler ayrışır", async () => {
  const m = await bozuk<typeof import("../../src/belge/katalog.ts")>("src/belge/katalog.ts", "alan_ad: v.alan.ad, alan_meslek: v.alan.meslek,", "alan_ad: v.alan.ad,");
  const d = m.zimmetDegerleri(ornekZimmetFormu());
  const eksik = BELGE_KATALOGU.zimmet.alanlar.map((x) => x.anahtar).filter((k) => !(k in d.alanlar));
  assert.deepEqual(eksik, ["alan_meslek"], "bozuk: katalogdaki alan değerlerde yok");
});

/* 2026-10-25 (belge doldurma): sözleşme belgesi de katalogda — eşlemesi bir alanı vermezse kurucuda seçilen hücre sessizce boş kalırdı */
test("sözleşmenin eşlemesi bir alanı vermezse katalogla değerler ayrışır", async () => {
  const m = await bozuk<typeof import("../../src/belge/katalog.ts")>("src/belge/katalog.ts", `musteri_vd: m.vd ?? "", `, "");
  const d = m.ornekDegerler("sozlesme");
  const eksik = BELGE_KATALOGU.sozlesme.alanlar.map((x) => x.anahtar).filter((k) => !(k in d.alanlar));
  assert.deepEqual(eksik, ["musteri_vd"], "bozuk: katalogdaki alan değerlerde yok");
});

test("şema veri'li kayıt hücresinde kaynak isterse belge formatı reddedilir", async () => {
  const m = await bozuk<typeof import("../../src/format/tanim.ts")>("src/format/tanim.ts",
    `if (h.tur === "kayit" && !h.kaynak && !h.veri)`, `if (h.tur === "kayit" && !h.kaynak)`);
  assert.equal(m.FormatTanimi.safeParse(TANIM).success, false, "bozuk: veri'li tanım geçmedi");
});
