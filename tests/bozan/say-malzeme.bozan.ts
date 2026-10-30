/* OLUMSUZ KANIT — tests/say-malzeme.test.ts neyi koruyor (2026-10-31, kalem 2). Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): exif.ts ve malzeme.ts
   bellekte bozulup geçici klasörden içe aktarılır. 1. DateTimeOriginal okunmazsa fotoğrafın çekim saati kaybolur (not ile fotoğraf saatle eşlenemez).
   2. Gönderen adı çıkarılmazsa sohbetteki kişi adları yapay zekâya gider. 3. Çekim saatine göre sıralama kalkarsa sırasız yüklenen fotoğraflar
   notlarla yanlış eşlenir. 4. Sistem iletisi atlanmazsa ("… uçtan uca şifrelidir") önceki iletiye eklenir. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { exifliJpeg } from "../say-malzeme.test.ts";

const klasor = mkdtempSync(join(tmpdir(), "bozan-say-malzeme-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
let sira = 0;
async function bozuk<T>(dosya: string, eski: string, yeni: string): Promise<T> {
  const kaynak = readFileSync(resolve(dosya), "utf8");
  assert.ok(kaynak.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(klasor, `${sira++}.ts`);
  writeFileSync(yol, kaynak.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href) as Promise<T>;
}
type Exif = typeof import("../../src/server/dosya/exif.ts");
type Malzeme = typeof import("../../src/modules/say/malzeme.ts");

test("1. DateTimeOriginal okunmayınca kilit düşer", async () => {
  const m = await bozuk<Exif>("src/server/dosya/exif.ts", "etiket(altYer, 0x9003)", "etiket(altYer, 0x9004)");
  assert.equal(m.exifCekimZamani(exifliJpeg()), null);
});
test("2. gönderen adı çıkarılmayınca kilit düşer", async () => {
  const m = await bozuk<Malzeme>("src/modules/say/malzeme.ts", "l.push(ileti(`${gun.padStart(2, \"0\")}.${ay.padStart(2, \"0\")}.${yil}`, `${String(saat).padStart(2, \"0\")}:${d}`, govde!));",
    "l.push(ileti(`${gun.padStart(2, \"0\")}.${ay.padStart(2, \"0\")}.${yil}`, `${String(saat).padStart(2, \"0\")}:${d}`, `${m[7]}: ${govde}`));");
  assert.match(m.sohbetDuzeni(m.sohbetIletileri("27.10.2026 09:56 - Uzman A: T4\n27.10.2026 09:57 - Uzman A: T5")!), /Uzman A/);
});
test("3. çekim saatine göre sıralama kalkınca kilit düşer", async () => {
  const m = await bozuk<Malzeme>("src/modules/say/malzeme.ts", "return ekler.map((e) => (e.tur === \"foto\" ? sirali[k++]! : e));", "void k; return [...ekler];");
  const l = [{ id: 1, tur: "foto", cekim: "2026-10-27 10:00" }, { id: 3, tur: "foto", cekim: "2026-10-27 09:00" }];
  assert.deepEqual(m.malzemeSirasi(l).map((x) => x.id), [1, 3]);
});
test("4. sistem iletisi atlanmayınca kilit düşer", async () => {
  const m = await bozuk<Malzeme>("src/modules/say/malzeme.ts", "} else if (BASLIK.test(satir)) {", "} else if (BASLIK.test(\"\")) {");
  const i = m.sohbetIletileri("27.10.2026 09:56 - Uzman A: T4\n27.10.2026 09:57 - Uzman A: T5\n[27.10.2026 10:02:00] Mesajlar şifrelidir.")!;
  assert.match(i[1]!.metin, /şifrelidir/);
});
