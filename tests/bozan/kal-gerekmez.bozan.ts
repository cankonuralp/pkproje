/* OLUMSUZ KANIT — tests/olcum-cihazlari.test.ts "kalibrasyon durumu" (2026-11-16, göç 0133: kalibrasyon gerekmez). Kaynak diskte DEĞİŞTİRİLMEZ: dosyalar
   bellekte bozulup geçici klasörden içe aktarılır. O zaman:
   1) rapor tarafında "gerekmez" hesaba katılmazsa kalibrasyon gerekmeyen (kaydı olmayan) cihaz "kalibrasyonu geçmiş" sayılır — rapora eklenmez;
   2) cihaz durumunda "gerekmez" önce bakılmazsa listede "Kalibrasyonu geçti" görünür;
   3) eylem işareti taşımazsa (ilk yayındaki hata) kaynak kilidi yakalar. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const klasor = mkdtempSync(join(tmpdir(), "bozan-kal-gerekmez-"));
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

test("1) rapor tarafında 'gerekmez' hesaba katılmazsa kalibrasyon gerekmeyen cihaz geçmiş sayılır", async () => {
  const m = await bozuk<typeof import("../../src/modules/raporlar/sema.ts")>("src/modules/raporlar/sema.ts", "!gerekmez && (!bitis || bitis < bugun)", "(!bitis || bitis < bugun)");
  assert.equal(m.kalibrasyonGecti(null, "2026-11-16", true), true, "bozuk: rapora eklenmez");
});

test("2) cihaz durumunda 'gerekmez' bakılmazsa listede kalibrasyonu geçti görünür", async () => {
  const m = await bozuk<typeof import("../../src/modules/olcum-cihazlari/sema.ts")>("src/modules/olcum-cihazlari/sema.ts", 'if (gerekmez) return "gerekmez";', "");
  assert.equal(m.kalDurum(null, "depo", "2026-11-16", 30, true), "gecti", "bozuk: gerekmez cihaz geçmiş görünür");
});

test("3) eylem işareti taşımazsa kaynak kilidi yakalar", () => {
  const KILIT = "{ ...metinler(girdi, CIHAZ_ALAN), kalGerekmez: (girdi as { kalGerekmez?: unknown } | null)?.kalGerekmez === true }";
  const eylem = readFileSync("src/modules/olcum-cihazlari/ui/eylemler.ts", "utf8");
  assert.ok(eylem.includes(KILIT), "sağlam");
  const bozukEylem = eylem.replace(KILIT, () => "metinler(girdi, CIHAZ_ALAN)");
  assert.notEqual(bozukEylem, eylem, "bozulacak satır kaynakta");
  assert.ok(!bozukEylem.includes("kalGerekmez"), "bozuk: işaret sunucuya gitmez");
});
