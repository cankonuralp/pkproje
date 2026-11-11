/* OLUMSUZ KANIT — tests/kuyruk-kayipsiz.test.ts neyi koruyor (2026-11-12; reisim: "sahada veri fotoğraf yazı vs kaybolmamalı kesinlikle"). Kaynak diskte
   DEĞİŞTİRİLMEZ: kuyruk.ts bellekte bozulup geçici klasörden içe aktarılır. Cihaz deposu ve ağ taklit. O zaman:
   1) "cihaza yazılamayan iş bellekte kalır" kalkınca yer dolu cihazda Gönder hata fırlatır ve iş kuyruğa hiç girmez (mesaj kaybolur);
   2) "anlaşılmayan 'oldu' yanıtı sonra denenir" kalkınca ağ geçidinin sayfası işi "yapılamadı"ya düşürür — bir daha kendiliğinden gitmez;
   3) "eski form işi ancak yenisi yazıldıysa silinir" kalkınca yer dolu cihazda önceki kayıt da depodan gider (sayfa kapanırsa ikisi de yok). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, before, test } from "node:test";

const KOK = resolve("src/components/cevrimdisi");
const KAYNAK = readFileSync(join(KOK, "kuyruk.ts"), "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y) => `from "${pathToFileURL(resolve(KOK, y)).href}"`);
const gecici = mkdtempSync(join(tmpdir(), "kuyruk-kayipsiz-bozan-"));
let sira = 0;
type Kuyruk = typeof import("../../src/components/cevrimdisi/kuyruk.ts");

let cevap: () => Response = () => { throw new TypeError("Failed to fetch"); };
const depo = new Map<string, unknown>();
let dolu = false;
const kod = new TextEncoder(), coz = new TextDecoder();
const taklit = {
  ac: async () => ({}) as IDBDatabase,
  oku: async () => [] as never,
  yaz: async (_db: IDBDatabase, i: { id: string }) => { if (dolu) throw new DOMException("yer yok", "QuotaExceededError"); depo.set(i.id, i); },
  sil: async (_db: IDBDatabase, id: string) => { depo.delete(id); },
  sifrele: async (_db: IDBDatabase, v: unknown) => ({ iv: new Uint8Array(12), sifreli: kod.encode(JSON.stringify(v)).buffer as ArrayBuffer }),
  coz: async (_db: IDBDatabase, i: { sifreli: ArrayBuffer }) => JSON.parse(coz.decode(i.sifreli)) as unknown,
};
async function bozuk(eski: string, yeni: string): Promise<Kuyruk> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski.slice(0, 70)}`);
  const yol = join(gecici, `k${++sira}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, () => yeni));
  const K = await import(pathToFileURL(yol).href) as Kuyruk;
  K.kuyrukDeposu(taklit);
  K.kuyrukYazani("etiketDeneme00000000000");
  depo.clear(); dolu = false; cevap = () => { throw new TypeError("Failed to fetch"); };
  return K;
}
const sakin = async (K: Kuyruk) => { for (let i = 0; i < 50 && K.kuyrukAnlik().gonderiliyor; i++) await new Promise((c) => setTimeout(c, 5)); await new Promise((c) => setTimeout(c, 5)); };

before(() => {
  Object.assign(globalThis, { window: new EventTarget() });
  globalThis.fetch = (async () => cevap()) as typeof fetch;
});
after(() => rmSync(gecici, { recursive: true, force: true }));

test("1) bellekte tutma kalkınca yer dolu cihazda iş kuyruğa girmez (mesaj kaybolur)", async () => {
  const K = await bozuk("  } catch {\n    i.girdi = girdi; i.bellekte = true;\n    return false;\n  }", "  } catch (h) { throw h; }");
  dolu = true;
  await assert.rejects(K.kuyrugaEkle({ tur: "chat.mesaj", kayit: "M1", surum: 0, girdi: { metin: "x" }, ad: "mesaj" }), /yer yok/);
  assert.equal(K.kuyrukAnlik().isler.length, 0, "bozuk: iş yok");
});

test("2) anlaşılmayan 'oldu' yanıtı kuralı kalkınca iş 'yapılamadı'ya düşer", async () => {
  const K = await bozuk("        if (y.ok && !j?.sonuc) break dis;\n", "");
  await K.kuyrugaEkle({ tur: "chat.mesaj", kayit: "M2", surum: 0, girdi: { metin: "x" }, ad: "mesaj" });
  await sakin(K);
  cevap = () => new Response("<html>ağ geçidi</html>", { status: 200, headers: { "content-type": "text/html" } });
  await K.kuyrukGonder();
  assert.deepEqual(K.kuyrukAnlik().isler.map((x) => x.durum), ["hata"], "bozuk: iş düştü");
});

test("3) 'eski form işi ancak yenisi yazıldıysa silinir' kalkınca yer dolu cihazda önceki kayıt da gider", async () => {
  const K = await bozuk("  if (db && yazildi) for (const x of eski)", "  if (db) for (const x of eski)");
  await K.kuyrugaEkle({ tur: "rapor.kaydet", kayit: "R1", surum: 3, girdi: { v: 1 }, ad: "Rapor kaydı" });
  await sakin(K);
  assert.equal(depo.size, 1);
  dolu = true;
  await K.kuyrugaEkle({ tur: "rapor.kaydet", kayit: "R1", surum: 3, girdi: { v: 2 }, ad: "Rapor kaydı" });
  await sakin(K);
  assert.equal(depo.size, 0, "bozuk: cihazda hiçbir kayıt kalmadı");
});
