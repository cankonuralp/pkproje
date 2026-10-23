/* OLUMSUZ KANIT — tests/say-ek.test.ts (522; 2026-10-23 S.A.Y baştan: ek konuşmada kalır, sınır yok) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ
   (anayasa 13.11): ek.ts bellekte bozulup geçici klasörden içe aktarılır (göreli içe aktarmalar kök adrese çevrilir). O zaman:
   1) fotoğraf temizlenmeseydi konum bilgisi (EXIF) yapay zekâya giderdi;
   2) Word'ün metni yeniden kısaltılırsa (eski 20 000 / 40 000 karakter) uzun belgenin sonu S.A.Y'a hiç gitmez — reisim'in "verdiğim dosyaya göre"
      şikâyetinin bir nedeni;
   3) ekin adı yapay zekâya giderse (başlıkta) dosya adındaki müşteri / kişi adı da gider. */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { zipBayt } from "../../src/components/disa/zip.ts";

const gecici = mkdtempSync(join(tmpdir(), "say-ek-bozan-"));
after(() => rmSync(gecici, { recursive: true, force: true }));
const kok = resolve("src/modules/say/server");
const KAYNAK = readFileSync(join(kok, "ek.ts"), "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(kok, y)).href}"`);
let sira = 0;
type Ek = typeof import("../../src/modules/say/server/ek.ts");
async function bozuk(eski: string, yeni: string): Promise<Ek> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(gecici, `ek-${sira++}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href) as Promise<Ek>;
}
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x08, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x03, 0x01, 0xff, 0xda, 0x00, 0x02, 0x01, 0x02, 0x03, 0xff, 0xd9]);

test("1. fotoğraf temizlenmeyince EXIF yapay zekâya gider (kilidin koruduğu açık)", async () => {
  const m = await bozuk("bayt: tur === \"jpeg\" ? jpegTemizle(b) : pngTemizle(b)", "bayt: b");
  const e = m.sayEkiHazirla(JPEG, "etiket.jpg");
  assert.ok(!("durum" in e) && Buffer.from(e.bayt).includes(Buffer.from("Exif")), "bozuk: EXIF duruyor");
});

test("2. Word'ün metni yeniden kısaltılırsa uzun belgenin sonu gitmez (kilidin koruduğu açık)", async () => {
  const m = await bozuk("wordMetni(b, Number.POSITIVE_INFINITY)", "wordMetni(b)");
  const uzun = "Topraklama 0,4 Ω ".repeat(10_000);
  const e = m.sayEkiHazirla(zipBayt([["word/document.xml", `<w:document><w:body><w:p><w:r><w:t>${uzun}</w:t></w:r></w:p></w:body></w:document>`]]), "u.docx");
  assert.ok(!("durum" in e) && new TextDecoder().decode(e.bayt).length < uzun.trim().length, "bozuk: metin kısaltıldı");
});

test("3. ekin adı yapay zekâya giderse dosya adındaki bilgi de gider (kilidin koruduğu açık)", async () => {
  const m = await bozuk("title: `Ek ${i + 1}` });", "title: (e as { ad?: string }).ad ?? \"\" });");
  const l = m.ekBloklari([{ dosya: "file_1", tur: "pdf", ad: "Gizli Sanayi sözleşmesi.pdf" } as never], "s");
  assert.match(JSON.stringify(l), /Gizli Sanayi/, "bozuk: ad gitti");
});
