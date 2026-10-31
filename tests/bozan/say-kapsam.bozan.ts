/* OLUMSUZ KANIT — tests/say-kapsam.test.ts neyi koruyor (2026-10-31, kalem 11 — M5). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): geçici klasörde uydurma bir
   modül kurulur. 1. Ekrana yeni eylem eklenip tabloya yazılmazsa S.A.Y o işi yapamaz ve kimse fark etmez — kilit bunu yakalar. */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { KAPSAM } from "../../src/modules/say/kapsam.ts";
import { eylemDosyalari } from "../say-kapsam.test.ts";

const kok = mkdtempSync(join(tmpdir(), "bozan-say-kapsam-"));
after(() => rmSync(kok, { recursive: true, force: true }));

test("1. tabloya yazılmamış yeni ekran eylemi yakalanır", () => {
  mkdirSync(join(kok, "personel", "ui"), { recursive: true });
  writeFileSync(join(kok, "personel", "ui", "eylemler.ts"), '"use server";\nexport async function personelKaydetEylemi() {}\nexport async function yeniBirIsEylemi() {}\n');
  const e = eylemDosyalari(kok)["personel/ui/eylemler.ts"]!;
  assert.deepEqual(e.filter((a) => !KAPSAM["personel/ui/eylemler.ts"]?.[a]), ["yeniBirIsEylemi"], "kilit yeni eylemi tabloda bulamaz");
});
