/* OLUMSUZ KANIT — tests/say-onay.test.ts neyi koruyor (2026-10-31, kalem 6b). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): islem.ts bellekte bozulup geçici
   klasörden içe aktarılır (göreli içe aktarmalar özgün klasöre, zod projenin node_modules'una). 1. Kapı kalkarsa S.A.Y silmeyi / göndermeyi onaysız yapar.
   2. Onay kullanıldı diye işaretlenmezse bir onayla aynı iş tekrar tekrar yapılır. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { sahteOrtam, silIslemi } from "../say-onay.test.ts";

const klasor = mkdtempSync(join(tmpdir(), "bozan-say-onay-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
type IslemM = typeof import("../../src/server/yz/islem.ts");
const KAYNAK = "src/server/yz/islem.ts";
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<IslemM> {
  const kaynak = readFileSync(resolve(KAYNAK), "utf8");
  assert.ok(kaynak.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `${sira++}-islem.ts`), kok = dirname(resolve(KAYNAK));
  writeFileSync(yol, kaynak.replace(eski, () => yeni).replace(/from "(\.{1,2}\/[^"]+)"/g, (_, p: string) => `from "${pathToFileURL(resolve(kok, p)).href}"`)
    .replace(/from "zod"/g, `from "${import.meta.resolve("zod")}"`));
  return import(pathToFileURL(yol).href) as Promise<IslemM>;
}

test("1. kapı kalkınca kilit düşer", async () => {
  const m = await bozuk("const kapi = t.ikinciOnay && o.onayKapisi ?", "const kapi = false ?");
  const s = { n: 0 };
  assert.ok((await m.islemYurut([silIslemi(s)], sahteOrtam({ onay: new Set(), kullanilan: new Set() }), "deneme_sil", { kayit: "a" })).cevap.tamam);
  assert.equal(s.n, 1, "bozuk: onaysız silindi");
});
test("2. onay kullanıldı diye işaretlenmeyince kilit düşer", async () => {
  const m = await bozuk("      if (kapi) await onayKullan(db, kapi.ozet);\n", "");
  const k = { onay: new Set<string>(), kullanilan: new Set<string>() }, s = { n: 0 }, o = sahteOrtam(k);
  const ozet = m.onayOzeti("kisi-1", "deneme_sil", { kayit: "a" });
  k.onay.add(ozet);
  for (let i = 0; i < 2; i++) await m.islemYurut([silIslemi(s)], o, "deneme_sil", { kayit: "a", onay: ozet });
  assert.equal(s.n, 2, "bozuk: bir onayla iki kez");
});
