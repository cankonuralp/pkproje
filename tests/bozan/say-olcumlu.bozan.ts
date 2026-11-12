/* OLUMSUZ KANIT — tests/say-olcumlu.test.ts neyi koruyor (2026-11-12; pkproje.md §11 K8). Kaynak diskte DEĞİŞTİRİLMEZ: say-doldur.ts bellekte bozulup
   geçici klasörden içe aktarılır. O zaman:
   1) ölçümlü rapor denetimi kalkınca S.A.Y ölçülen başlangıcın üstüne istediği saati yazar (saat yine "dağıtılabilir" olurdu). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { Cevaplar, FormatTanimi } from "../../src/format/tanim.ts";

const KAYNAK = "src/modules/raporlar/say-doldur.ts";
const klasor = mkdtempSync(join(tmpdir(), "bozan-say-olcumlu-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<typeof import("../../src/modules/raporlar/say-doldur.ts")> {
  const metin = readFileSync(KAYNAK, "utf8");
  assert.ok(metin.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const cevrilmis = metin.replace(eski, () => yeni).replace(/from "(\.{1,2}\/[^"]+)"/g, (_t, yol: string) => `from "${pathToFileURL(resolve(dirname(KAYNAK), yol)).href}"`);
  const hedef = join(klasor, `kopya-${sira++}.ts`);
  writeFileSync(hedef, cevrilmis);
  return import(pathToFileURL(hedef).href);
}
const T = FormatTanimi.parse({ sema: 1, bolumler: [
  { id: "genel", ad: "Genel", blok: "bilgi", alanlar: [{ id: "kapsam", ad: "Kapsam", tur: "coklu", secenekler: ["Aydınlatma", "Priz"] }] },
] });

test("1) ölçümlü rapor denetimi kalkınca S.A.Y ölçülen başlangıcın üstüne saat yazar", async () => {
  const m = await bozuk("        if (saatli && ek.olcumlu) return { neden: OLCUMLU_SAAT };\n", "");
  const u = m.komutlariUygula({ ekipman: {}, cevaplar: Cevaplar.parse({}), tarih: { bas: "2026-11-12T13:30", bit: "", sonraki: "", takip: "", rapor: "" } }, T,
    [{ yer: "tarih:bas", deger: "12.11.2026 10:00" }], { olcumlu: true });
  assert.equal(u.durum.tarih?.bas, "2026-11-12T10:00", "bozuk: ölçülen 13:30 yerine S.A.Y'ın yazdığı 10:00");
});
