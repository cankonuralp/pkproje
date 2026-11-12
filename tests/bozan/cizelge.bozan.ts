/* OLUMSUZ KANIT — tests/cizelge.test.ts neyi koruyor (2026-11-12; pkproje.md §11 T7 — reisim: "log kayıtları düzgün olmalı"). Kaynak diskte
   DEĞİŞTİRİLMEZ: cizelge.ts bellekte bozulup geçici klasörden içe aktarılır. O zaman:
   1) saat düzeltmesi satırı kalkınca elle yazılan saat çizelgede görünmez — denetçi yalnız ölçülen satırları görür, düzeltme gizlenir;
   2) sıralama kalkınca olaylar zamana göre değil kaynağa göre dizilir (kontrol, fotoğraflardan sonra görünür). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const KAYNAK = "src/modules/raporlar/cizelge.ts";
const klasor = mkdtempSync(join(tmpdir(), "bozan-cizelge-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
let sira = 0;
async function bozuk(eski: string, yeni: string): Promise<typeof import("../../src/modules/raporlar/cizelge.ts")> {
  const metin = readFileSync(KAYNAK, "utf8");
  assert.ok(metin.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const cevrilmis = metin.replace(eski, () => yeni).replace(/from "(\.{1,2}\/[^"]+)"/g, (_t, yol: string) => `from "${pathToFileURL(resolve(dirname(KAYNAK), yol)).href}"`);
  const hedef = join(klasor, `kopya-${sira++}.ts`);
  writeFileSync(hedef, cevrilmis);
  return import(pathToFileURL(hedef).href);
}
const D = (s: string) => new Date(`2026-11-12T${s}:00+03:00`);
const G = { yazan: "Deneme Denetçi", hareketler: [{ zaman: D("13:28"), ne: "olustur", gerekce: null, kim: "Deneme Denetçi" }], sapmalar: [],
  fotolar: [{ ad: "on.jpg", eklendi: D("13:34").toISOString(), cekim: "2026-11-12 13:33", konum: null }],
  kontrol: { basladi: D("13:30"), bitti: D("13:36"), duzBas: D("13:30"), duzBit: D("14:10"), gerekce: "Tuşa erken basıldı", duzKim: "Deneme Denetçi", duzZaman: D("14:03") } };

test("1) saat düzeltmesi satırı kalkınca elle yazılan saat çizelgede görünmez", async () => {
  const m = await bozuk("  if (k?.duzBas && k.duzBit && k.duzZaman) {", "  if (false && k?.duzBas && k.duzBit && k.duzZaman) {");
  assert.equal(m.zamanCizelgesi(G).some((s) => s.kaynak === "Elle"), false, "bozuk: düzeltme satırı yok");
});

test("2) sıralama kalkınca olaylar zamana göre dizilmez", async () => {
  const m = await bozuk("return l.sort((a, b) => a.zaman.localeCompare(b.zaman));", "return l;");
  assert.deepEqual(m.zamanCizelgesi(G).map((s) => s.olay.split(" ·")[0]), ["Rapor açıldı", "Kontrol başladı", "Kontrol bitti", "Kontrol saati gerekçeyle düzeltildi: 12.11.2026 13:30 – 14:10 (40 dk)", "Fotoğraf eklendi"],
    "bozuk: 13:34'teki fotoğraf 14:03'teki düzeltmeden sonra");
});
