/* OLUMSUZ KANIT — tests/say-hesap.test.ts neyi koruyor (2026-10-31, kalem 6). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): saat-plani.ts ve denetle.ts
   bellekte bozulup geçici klasörden içe aktarılır. 1. Ayın günü kırpılmazsa 31 Ocak + 1 ay geçersiz tarih olur. 2. Ara eklenmezse "10 dakika arayla"
   istenen saatler üst üste biner. 3. Künye boşluğu denetlenmezse SGK'sız rapor gönderime hazır görünür (46 raporluk SGK dersi). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const klasor = mkdtempSync(join(tmpdir(), "bozan-say-hesap-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
let sira = 0;
async function bozuk<T>(dosya: string, eski: string, yeni: string): Promise<T> {
  const kaynak = readFileSync(resolve(dosya), "utf8");
  assert.ok(kaynak.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `${sira++}.ts`);
  /* göreli içe aktarmalar özgün klasöre (2026-10-31: denetle.ts format/motor.ts'yi içe aktarır) */
  const kok = dirname(resolve(dosya));
  writeFileSync(yol, kaynak.replace(eski, () => yeni).replace(/from "(\.{1,2}\/[^"]+)"/g, (_, p: string) => `from "${pathToFileURL(resolve(kok, p)).href}"`));
  return import(pathToFileURL(yol).href) as Promise<T>;
}
type Saat = typeof import("../../src/modules/raporlar/saat-plani.ts");
type Denetle = typeof import("../../src/modules/raporlar/denetle.ts");

test("1. ayın günü kırpılmayınca kilit düşer", async () => {
  const m = await bozuk<Saat>("src/modules/raporlar/saat-plani.ts", "iki(Math.min(Number(m[3]), son))", "iki(Number(m[3]))");
  assert.equal(m.aySonra("2026-01-31", 1), "2026-02-31");
});
test("2. ara eklenmeyince kilit düşer", async () => {
  const m = await bozuk<Saat>("src/modules/raporlar/saat-plani.ts", "t = bit + Math.max(0, Math.round(g.ara));", "t = bit;");
  const p = m.saatPlani({ gun: "2026-10-27", baslangic: "14:20", ara: 5, raporlar: [{ id: "a", sure: 40, periyot: 12 }, { id: "b", sure: 10, periyot: 12 }] });
  assert.equal(p[1]!.bas.slice(11), "15:00");
});
test("3. künye boşluğu denetlenmeyince kilit düşer", async () => {
  const m = await bozuk<Denetle>("src/modules/raporlar/denetle.ts", 'if (!s.kunye.sgk?.trim()) l.push("künye boş: SGK / DETSİS");', "");
  assert.deepEqual(m.raporSorunlari({ durum: "taslak", tanim: { bolumler: [] } as never, cevaplar: { tablo: {} } as never, fotolar: [], kunye: { firmaAdi: "x", sgk: "" } }, []), []);
});
