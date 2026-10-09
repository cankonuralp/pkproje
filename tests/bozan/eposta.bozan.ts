/* OLUMSUZ KANIT — tests/eposta-saf.test.ts neyi koruyor (432; kaynak diskte değiştirilmez — bellekte bozulup geçici klasörden içe aktarılır):
   1. Adres süzgecindeki biçim denetimi kalkınca bozuk adres kuyruğa girer (sağlayıcı her denemede reddeder, plan sayfası "Gönderilemedi" dolar).
   2. Sağlayıcının 4xx'i kalıcı saymaması: reddedilen e-posta (yanlış adres / gönderen) beş kez boşuna yeniden denenir.
   3. Plan e-postasında ekip / bilgilendirme ayrımı kalkınca bilgilendirilen kişiye (müşteri) "kabul ya da reddet" çağrısı gider. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const klasor = mkdtempSync(join(tmpdir(), "eposta-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
let sira = 0;
async function bozuk<M>(kaynak: string, eski: string, yeni: string): Promise<M> {
  const metin = readFileSync(kaynak, "utf8");
  assert.ok(metin.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const cevrilmis = metin.replace(eski, () => yeni).replace(/from "(\.{1,2}\/[^"]+)"/g, (_t, yol: string) => `from "${pathToFileURL(resolve(dirname(kaynak), yol)).href}"`);
  const hedef = join(klasor, `kopya-${sira++}.ts`);
  writeFileSync(hedef, cevrilmis);
  return import(pathToFileURL(hedef).href) as Promise<M>;
}

test("adres süzgecinde biçim denetimi kalkınca bozuk adres kuyruğa girer", async () => {
  const m = await bozuk<typeof import("../../src/server/eposta/eposta.ts")>("src/server/eposta/eposta.ts", "if (a.length <= 254 && EPOSTA_BICIMI.test(a)) g.add(a);", "if (a) g.add(a);");
  assert.deepEqual(m.adresler(["yanlis", "ali@deneme.example"]), ["yanlis", "ali@deneme.example"], "bozuk: geçersiz adres listede");
});

test("4xx kalıcı sayılmazsa reddedilen e-posta yeniden denenir", async () => {
  const m = await bozuk<typeof import("../../src/server/eposta/saglayici.ts")>("src/server/eposta/saglayici.ts",
    "kalici: y.status >= 400 && y.status < 500 && y.status !== 429", "kalici: false");
  const s = createServer((_i, y) => { y.writeHead(422).end("{}"); });
  await new Promise<void>((c) => s.listen(0, "127.0.0.1", c));
  try {
    const p = m.epostaSaglayicisi({ PROBATA_EPOSTA_ANAHTAR: "k", PROBATA_EPOSTA_KIMDEN: "g", PROBATA_EPOSTA_UC: `http://127.0.0.1:${(s.address() as { port: number }).port}/` })!;
    const r = await p.gonder({ kime: "a@b.example", konu: "k", metin: "m" });
    assert.ok(!r.tamam && r.kalici === false, "bozuk: kalıcı ret yeniden denenecek");
  } finally { await new Promise<void>((c) => s.close(() => c())); }
});

test("ekip / bilgilendirme ayrımı kalkınca bilgilendirilene kabul / red çağrısı gider", async () => {
  const m = await bozuk<typeof import("../../src/modules/planlar/sema.ts")>("src/modules/planlar/sema.ts",
    "...(p.baglanti ? [p.ekipten ? ", "...(p.baglanti ? [true ? ");
  const e = m.planEpostasi({ firma: "F", no: "P-1", musteri: "M", tesis: "T", adres: null, baslangic: "2026-10-12", bitis: "2026-10-12", ekip: [], aciklama: null,
    baglanti: "https://x.example/planlar/1", ekipten: false });
  assert.ok(e.govde.includes("kabul ya da reddetmek"), "bozuk: müşteriye kabul / red çağrısı");
});
