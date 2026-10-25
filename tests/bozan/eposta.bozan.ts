/* OLUMSUZ KANIT — tests/eposta-saf.test.ts neyi koruyor (432; kaynak diskte değiştirilmez — bellekte bozulup geçici klasörden içe aktarılır):
   1. Adres süzgecindeki biçim denetimi kalkınca bozuk adres kuyruğa girer (sağlayıcı her denemede reddeder, plan sayfası "Gönderilemedi" dolar).
   2. Sağlayıcının 4xx'i kalıcı saymaması: reddedilen e-posta (yanlış adres / gönderen) beş kez boşuna yeniden denenir.
   3. Plan e-postasında ekip / bilgilendirme ayrımı kalkınca bilgilendirilen kişiye (müşteri) "kabul ya da reddet" çağrısı gider.
   4. (536) Kimden'de alan adı denetimi kalkınca kişisel adresli kişi (alan adında değil) kendi adresinden gönderilir — Resend reddeder, e-posta gitmez.
   5. (FV11, 2026-10-16 — eski 5'in yerine: Rapor e-postası kuralı kalktı) doğrulama denetimi kalkınca doğrulanmamış alan adıyla gönderilir — Resend reddeder;
      e-posta beklemek yerine kalıcı hataya düşer.
   6. (FV11) Idempotency-Key kalkınca yanıtı kaybolan istek yeniden denenince e-posta iki kez gider.
   7. (2026-10-25, belge doldurma) Sağlayıcının gövdesinden ek düşünce e-posta "gönderildi" olur ama müşteriye PDF'siz gider.
   8. (2026-10-25) Ek okunamadığında durma kalkınca e-posta sağlayıcıya EKSİZ gider (sessiz eksik ek). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { ozet, sahteDepo, sahteGonderim, sahteKuyruk, satir } from "../yardimci/sahte-eposta-vt.ts";

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
    const p = m.epostaSaglayicisi("k", { PROBATA_EPOSTA_UC: `http://127.0.0.1:${(s.address() as { port: number }).port}/` })!;
    const r = await p.gonder({ kimden: "g <g@b.example>", kime: "a@b.example", cevap: null, gizli: null, konu: "k", metin: "m" });
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

const FIRMA = { alan: "deneme.example", genel: "bilgi@deneme.example", dogrulandi: true, firmaAd: "Deneme Muayene", kopya: false, rapor: null };

test("Kimden'de alan adı denetimi kalkınca kişisel adres kendi adresinden gönderilir", async () => {
  const m = await bozuk<typeof import("../../src/server/eposta/kimden.ts")>("src/server/eposta/kimden.ts",
    '!eposta ? "yok" : alan && alanAdi(eposta) === alan ? "kendi" : "genel"', '!eposta ? "yok" : "kendi"');
  const k = m.kimdenKur(FIRMA, { ad: "Deneme İki", eposta: "iki@kisisel.example" });
  assert.ok(k.tamam && k.kimden.endsWith("<iki@kisisel.example>"), "bozuk: alan dışı adres Kimden'de");
});

test("doğrulama denetimi kalkınca doğrulanmamış alan adıyla gönderilir", async () => {
  const m = await bozuk<typeof import("../../src/server/eposta/kimden.ts")>("src/server/eposta/kimden.ts",
    "if (!f.dogrulandi || !f.alan || !ALAN_BICIMI.test(f.alan) || alanAdi(genel) !== f.alan) return", "if (!f.alan) return");
  const k = m.kimdenKur({ ...FIRMA, dogrulandi: false }, null);
  assert.ok(k.tamam && k.kimden.endsWith("<bilgi@deneme.example>"), "bozuk: doğrulanmamış alan adıyla Kimden");
});

test("Idempotency-Key kalkınca yeniden denenen istek sağlayıcıya kimliksiz gider (iki kez gönderilir)", async () => {
  const m = await bozuk<typeof import("../../src/server/eposta/saglayici.ts")>("src/server/eposta/saglayici.ts",
    '...(e.kimlik && /^[0-9a-f-]{36}$/.test(e.kimlik) ? { "Idempotency-Key": `eposta/${e.kimlik}` } : {})', "");
  const basliklar: (string | undefined)[] = [];
  const s = createServer((i, y) => { basliklar.push(i.headers["idempotency-key"] as string | undefined); y.writeHead(200).end("{}"); });
  await new Promise<void>((c) => s.listen(0, "127.0.0.1", c));
  try {
    const p = m.epostaSaglayicisi("k", { PROBATA_EPOSTA_UC: `http://127.0.0.1:${(s.address() as { port: number }).port}/` })!;
    await p.gonder({ kimden: "g <g@b.example>", kime: "a@b.example", cevap: null, gizli: null, konu: "k", metin: "m", kimlik: "6f9619ff-8b86-4011-b42d-00c04fc964ff" });
    assert.deepEqual(basliklar, [undefined], "bozuk: kimlik başlığı yok — sağlayıcı yinelemeyi tanıyamaz");
  } finally { await new Promise<void>((c) => s.close(() => c())); }
});

test("sağlayıcının gövdesinden ek düşünce PDF'siz gider", async () => {
  const m = await bozuk<typeof import("../../src/server/eposta/saglayici.ts")>("src/server/eposta/saglayici.ts",
    '    ...(e.ek ? { attachments: [{ filename: e.ek.ad, content: Buffer.from(e.ek.icerik).toString("base64") }] } : {}),\n', "");
  const g = m.istekGovdesi({ kimden: "g <g@b.example>", kime: "a@b.example", cevap: null, gizli: null, konu: "k", metin: "m", ek: { ad: "form.pdf", icerik: new Uint8Array([37, 80]) } });
  assert.equal(g.attachments, undefined, "bozuk: ek gövdede yok");
});

test("ek okunamadığında durma kalkınca e-posta sağlayıcıya eksiz gider", async () => {
  const m = await bozuk<typeof import("../../src/server/eposta/gonder.ts")>("src/server/eposta/gonder.ts", "      if (!r.tamam) {\n", "      if (!r.tamam && false) {\n");
  const D = "00000000-0000-4000-8000-000000000003";
  const k = sahteKuyruk([satir(D, { dosya: D, ad: "form.pdf" })], { [D]: { anahtar: "a3", sha256: ozet(new Uint8Array([1])) } });
  const g = sahteGonderim();
  await m.bekleyenleriGonder(k.db, g.ayar, { depo: sahteDepo({}) });
  assert.equal(g.giden.length, 1, "bozuk: depo okunamadı ama e-posta gitti");
  assert.ok(!g.giden[0].ek, "bozuk: müşteriye eksiz");
});
