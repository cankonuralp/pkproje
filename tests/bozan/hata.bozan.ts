/* OLUMSUZ KANIT — tests/hata-maske.test.ts (567, hata kaydının maskesi) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): maske.ts
   bellekte bozulup geçici klasörden içe aktarılır. O zaman:
   1. e-posta maskesi kalkınca kullanıcının e-postası hata kaydına düşer (09 G2 — kişisel veri);
   2. adresin sorgu dizgisi atılmazsa arama metni (kişi adı, e-posta) kayda düşer;
   3. gürültü süzgeci kalkınca bağlantı kopması ("Failed to fetch") her seferinde yazılır, gerçek hatayı gömer. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";

const klasor = mkdtempSync(join(tmpdir(), "hata-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
let sira = 0;
type Maske = typeof import("../../src/server/hata/maske.ts");
async function bozuk(eski: string, yeni: string): Promise<Maske> {
  const k = readFileSync(resolve("src/server/hata/maske.ts"), "utf8");
  assert.ok(k.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const y = join(klasor, `m-${sira++}.ts`);
  writeFileSync(y, k.replace(eski, () => yeni));
  return import(pathToFileURL(y).href) as Promise<Maske>;
}

test("1. e-posta maskesi kalkınca e-posta kayda düşer (kilidin koruduğu açık)", async () => {
  const m = await bozuk('.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}/g, "[e-posta]")', "");
  assert.equal(m.maskele("kullanıcı ornek.kisi@firma.example bulunamadı"), "kullanıcı ornek.kisi@firma.example bulunamadı");
});

test("2. adresin sorgusu atılmazsa arama metni kayda düşer (kilidin koruduğu açık)", async () => {
  const m = await bozuk('const y = a.split(/[?#]/)[0].trim();', "const y = a.trim();");
  assert.equal(m.adresYolu("/raporlar?ara=Ayşe Örnek"), "/raporlar?ara=Ayşe Örnek");
});

test("3. gürültü süzgeci kalkınca bağlantı kopması yazılır (kilidin koruduğu açık)", async () => {
  const m = await bozuk("export const gurultuMu = (mesaj: string) => GURULTU.some((r) => r.test(mesaj));", "export const gurultuMu = (mesaj: string) => mesaj === \"\";");
  assert.notEqual(m.hataHazirla({ kaynak: "istemci", mesaj: "TypeError: Failed to fetch" }), null);
});
