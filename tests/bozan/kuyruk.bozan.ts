/* OLUMSUZ KANIT — tests/kuyruk.test.ts neyi koruyor (394). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): kuyruk.ts bellekte bozulup geçici klasörden
   içe aktarılır (göreli içe aktarma mutlak yola çevrilir). Tarayıcı yerine olay hedefi ve ağ taklidi (bellek kipi). O zaman:
   1) "aynı rapor için tek bekleyen iş" kalkınca aynı raporun iki işi kuyrukta kalır — ikincisi, birincinin artırdığı sürüm yüzünden kendi kendisiyle
      çakışır (kullanıcıya sahte "başka yerde değiştirildi");
   2) oturum kapandığında (401) durmazsa iş "yapılamadı"ya düşer — giriş yapınca gitmesi gereken iş takılı kalır. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";

const KOK = resolve("src/components/cevrimdisi");
const KAYNAK = readFileSync(join(KOK, "kuyruk.ts"), "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y) => `from "${pathToFileURL(resolve(KOK, y)).href}"`);
const gecici = mkdtempSync(join(tmpdir(), "kuyruk-bozan-"));
let sira = 0;
type Kuyruk = typeof import("../../src/components/cevrimdisi/kuyruk.ts");
async function bozuk(eski: string, yeni: string): Promise<Kuyruk> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski.slice(0, 60)}`);
  const yol = join(gecici, `k${++sira}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href);
}
let cevap: (g: { kayit: string; surum: number }) => Response = () => { throw new TypeError("Failed to fetch"); };
const json = (o: object, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });
const sakin = async (K: Kuyruk) => { for (let i = 0; i < 50 && K.kuyrukAnlik().gonderiliyor; i++) await new Promise((c) => setTimeout(c, 5)); };

before(() => {
  Object.assign(globalThis, { window: new EventTarget() });
  globalThis.fetch = (async (_u: string, init: RequestInit) => cevap(JSON.parse(String(init.body)))) as typeof fetch;
});
after(() => rmSync(gecici, { recursive: true, force: true }));

test("1) tek bekleyen iş kuralı kalkınca aynı raporun ikinci işi kendi kendisiyle çakışır", async () => {
  const K = await bozuk("  const eski = bellek.filter((x) => x.kayit === g.kayit && x.durum !== \"baska_hesap\");\n", "  const eski: Bellek[] = [];\n");
  K.kuyrukYazani("etiketDeneme00000000000");
  for (const tur of ["rapor.kaydet", "rapor.kaydet"] as const) { await K.kuyrugaEkle({ tur, kayit: "R1", surum: 3, girdi: {}, ad: "R1" }); await sakin(K); }
  assert.equal(K.kuyrukAnlik().isler.length, 2, "bozuk: aynı raporun iki işi");
  /* sunucu: sürüm 3 bir kez geçer, sonra 4 */
  let surum = 3;
  cevap = (g) => (g.surum === surum ? (surum++, json({ sonuc: { durum: "tamam", id: "R1", bildirim: "x" } })) : json({ sonuc: { durum: "cakisma" }, guncel: surum }));
  await K.kuyrukGonder();
  assert.deepEqual(K.kuyrukAnlik().isler.map((x) => x.durum), ["cakisma"], "bozuk: kendi kaydıyla sahte çakışma");
});

test("2) oturum kapandığında durmazsa iş 'yapılamadı'ya düşer (giriş yapınca gitmez)", async () => {
  const K = await bozuk("  if (y.status === 401) { yayinla({ oturum: true }); break; }\n", "  if (y.status === 401) { yayinla({ oturum: true }); }\n");
  K.kuyrukYazani("etiketDeneme00000000000");
  cevap = () => { throw new TypeError("Failed to fetch"); };
  await K.kuyrugaEkle({ tur: "rapor.kaydet", kayit: "R9", surum: 1, girdi: {}, ad: "R9" });
  await sakin(K);
  cevap = () => json({ hata: "oturum" }, 401);
  await K.kuyrukGonder();
  assert.deepEqual(K.kuyrukAnlik().isler.map((x) => x.durum), ["hata"], "bozuk: bekleyen iş yapılamadı sayıldı");
});
