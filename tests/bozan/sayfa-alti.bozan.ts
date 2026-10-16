/* OLUMSUZ KANIT — tests/sayfa-alti.test.ts neyi koruyor (sunum 595 madde 14). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): dosya bellekte bozulup
   geçici klasörden içe aktarılır.
   1. Boş bilgi ayracıyla düşmeseydi telefonu yazılmamış firmanın sayfa altında boş ayraçlar ("·  ·") kalırdı.
   2. Yer tutucular tek geçişte çevrilmeseydi adresteki "{kod}" yazısı doküman koduna dönerdi.
   3. Şerit formatın yazısını almasaydı sayfa altı yazısı (gizlilik notu, telefon) PDF'in her sayfasında görünmezdi.
   4. Telefon denetlenmeseydi Firma ayarlarına harfli "telefon" yazılır, raporun sayfa altına çıkardı. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { ornekBelge } from "../../src/belge/ornek.ts";
import { SABLONLAR } from "../../src/format/sablonlar.ts";
import { FormatTanimi } from "../../src/format/tanim.ts";
import { gorunumBasligiYaz } from "../../src/modules/rapor-format/kurucu.ts";

const klasor = mkdtempSync(join(tmpdir(), "sayfa-alti-bozan-"));
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
const yazili = (y: string) => gorunumBasligiYaz(FormatTanimi.parse(SABLONLAR.KOMPRESOR.tanim), "alt_yazi", y);

test("1: boş bilgi ayracıyla düşmeyince sayfa altında boş ayraçlar kalır", async () => {
  const m = await bozuk<typeof import("../../src/format/duzen.ts")>("src/format/duzen.ts",
    "  return m.split(/(?<=^|\\s)·(?=\\s|$)/).map((p) => p.trim()).filter(Boolean).join(\" · \");", "  return m;");
  assert.notEqual(m.altYazisi(yazili("{firma} · {tel} · Gizlidir"), { ad: "Deneme" }, "K"), "Deneme · Gizlidir", "bozuk: ayraç düştü");
});

test("2: yer tutucular sırayla çevrilince adresteki {kod} doküman koduna döner", async () => {
  const m = await bozuk<typeof import("../../src/format/duzen.ts")>("src/format/duzen.ts",
    "  const m = y.replace(/\\{(?:firma|kod|adres|tel|eposta)\\}/g, (x) => d[x as keyof typeof d]);",
    "  let m = y; for (const k of [\"{firma}\", \"{adres}\", \"{tel}\", \"{eposta}\", \"{kod}\"] as const) m = m.replaceAll(k, d[k]);");
  assert.equal(m.altYazisi(yazili("{adres} · {kod}"), { ad: "D", adres: "{kod} Sokak" }, "K1"), "K1 Sokak · K1", "bozuk: yeniden çevrilmedi");
});

test("3: şerit formatın yazısını almayınca sayfa altı yazısı PDF sayfalarında görünmez", async () => {
  const m = await bozuk<typeof import("../../src/belge/belge.ts")>("src/belge/belge.ts", "  return { metin, no, format };", "  return { metin, no, format: \"\" };");
  const v = { ...ornekBelge("KOMPRESOR"), tanim: yazili("{firma} · Gizlidir") };
  assert.equal(m.belgeAltYazisi(v).format, "", "bozuk: şeride geldi");
});

test("4: telefon denetlenmeyince harfli telefon kaydedilir", async () => {
  const m = await bozuk<typeof import("../../src/modules/firma-ayarlari/sema.ts")>("src/modules/firma-ayarlari/sema.ts",
    ".refine((t) => /^[0-9+()\\s-]*$/.test(t), \"Telefon yalnız rakam, boşluk, + ( ) - içerir.\")", "");
  assert.equal(m.FirmaBilgiGirdisi.safeParse({ ad: "", adres: "", eposta: "", akr: "", nusha: "2", tel: "ara beni" }).success, true, "bozuk: reddetti");
});
