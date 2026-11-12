/* OLUMSUZ KANIT — tests/kontrol-saf.test.ts neyi koruyor (2026-11-12, göç 0128; reisim: "yazılan süre ile ekipman başında geçirilen süre uymalı").
   Kaynak diskte DEĞİŞTİRİLMEZ: kontrol.ts bellekte bozulup geçici klasörden içe aktarılır. O zaman:
   1) "bitti" koşulu kalkınca süren (bitirilmemiş) kontrol bitmiş sayılır — rapor, kontrol bitmeden onaya gider;
   2) düzeltme yok sayılınca rapora ölçülen saat yazılır — gerekçeyle düzeltilen saat kaybolur. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const KAYNAK = "src/modules/raporlar/server/kontrol.ts";
const klasor = mkdtempSync(join(tmpdir(), "bozan-kontrol-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<typeof import("../../src/modules/raporlar/server/kontrol.ts")> {
  const metin = readFileSync(KAYNAK, "utf8");
  assert.ok(metin.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const cevrilmis = metin.replace(eski, () => yeni).replace(/from "(\.{1,2}\/[^"]+)"/g, (_t, yol: string) => `from "${pathToFileURL(resolve(dirname(KAYNAK), yol)).href}"`);
  const hedef = join(klasor, `kopya-${sira++}.ts`);
  writeFileSync(hedef, cevrilmis);
  return import(pathToFileURL(hedef).href);
}
const T = (s: string) => new Date(`2026-11-12T${s}:00+03:00`);
const SATIR = { id: "x", kaynak: "sunucu" as const, basladi: T("13:30"), bitti: null, duz_bas: null, duz_bit: null, duz_gerekce: null, duz_zaman: null, duz_kim: null, surum: 0, bit_kaynak: null, cihaz_kanit: null, saat_tutmadi: false };

test("1) 'bitti' koşulu kalkınca süren kontrol bitmiş sayılır (rapor kontrol bitmeden onaya giderdi)", async () => {
  const m = await bozuk('k.kaynak === "elle" || k.bitti ? "bitti" : "suruyor"', '"bitti"');
  assert.equal(m.kontrolDurumu(SATIR), "bitti", "bozuk: bitirilmemiş kontrol bitti görünür");
});

test("2) düzeltme yok sayılınca rapora ölçülen saat yazılır (gerekçeli düzeltme kaybolur)", async () => {
  const m = await bozuk("(k.duz_bas ? { bas: k.duz_bas, bit: k.duz_bit } : { bas: k.basladi!, bit: k.bitti })", "({ bas: k.basladi!, bit: k.bitti })");
  const duz = { ...SATIR, bitti: T("13:36"), duz_bas: T("13:30"), duz_bit: T("14:05"), duz_gerekce: "Tuşa erken basıldı", duz_kim: "Deneme" };
  assert.deepEqual(m.etkinSaat(duz), { bas: T("13:30"), bit: T("13:36") }, "bozuk: düzeltilen 14:05 yerine ölçülen 13:36");
});
