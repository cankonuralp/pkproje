/* NEREDEN GELDİ: 522 — S.A.Y'a fotoğraf ve belge eki (pkproje §3.10 m.17; maket say.js ekran 11). 2026-10-23 BAŞTAN (reisim: "hiç bir kısıtı
   olmasın"; onay "tamam onaylıyorum"): ek KONUŞMADA KALIR (Anthropic Dosya API'si — yz_ek; "Sohbeti temizle" ile silinir), adet ve boy sınırı YOK
   (büyük dosya parça parça gelir — sabitler.ts EK_PARCA_BAYT), Word'ün metni kısaltılmaz, Excel ve düz metin dosyaları da eklenir — eski
   beklentiler (4 ek, 4 MB, "dosya saklanmaz", Word metni 20 000 karakter) KASITLI olarak kalktı. Saf:
   · tür İÇERİKTEN (uzantı / bildirilen tür değil): PDF ve fotoğraf (JPEG / PNG — konum bilgisi silinir) baytlarıyla, Word'ün metni (kısaltmasız),
     düz metin olduğu gibi (tarayıcının Excel'den çevirdiği "tablo"); ikili başka dosya ve boş dosya reddedilir; ad temizlenir (kısaltılmaz);
   · konuşmaya giden bloklar: her ek "Ek n (tür)" + Dosya API kimliğiyle blok (fotoğraf görüntü, öteki belge), adları gitmez, sonra kullanıcının yazısı.
   Olumsuz kanıt: tests/bozan/say-ek.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { zipBayt } from "../src/components/disa/zip.ts";
import { EK_PARCA_BAYT } from "../src/modules/say/sabitler.ts";
import { ekAdi, ekBloklari, sayEkiHazirla, type HazirEk } from "../src/modules/say/server/ek.ts";

const PDF = new Uint8Array(Buffer.from("%PDF-1.4\n%%EOF"));
/* EXIF (APP1) bölümlü en küçük JPEG: temizlenince APP1 kalkar; 2×2 geçerli PNG */
const EXIF = [0xff, 0xe1, 0x00, 0x08, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00];
const JPEG = new Uint8Array([0xff, 0xd8, ...EXIF, 0xff, 0xdb, 0x00, 0x03, 0x01, 0xff, 0xda, 0x00, 0x02, 0x01, 0x02, 0x03, 0xff, 0xd9]);
const PNG = new Uint8Array(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFElEQVR4nGP4z8DAwAAi/v///x8AHu8F+5BApdwAAAAASUVORK5CYII=", "base64"));
const word = (metin: string) => zipBayt([["[Content_Types].xml", "<Types/>"], ["word/document.xml", `<w:document><w:body><w:p><w:r><w:t>${metin}</w:t></w:r></w:p></w:body></w:document>`]]);
const neden = (x: unknown) => (x as { neden: string }).neden;
const hazir = (x: ReturnType<typeof sayEkiHazirla>): HazirEk => { assert.ok(!("durum" in x), neden(x)); return x as HazirEk; };

test("tür içerikten: PDF ve fotoğraf baytlarıyla (konum bilgisi silinir), Word'ün metni kısaltmasız, düz metin; ikili ve boş dosya red", () => {
  const p = hazir(sayEkiHazirla(PDF, "kılavuz.pdf"));
  assert.deepEqual([p.tur, p.mime, p.ad, p.dosyaAdi], ["pdf", "application/pdf", "kılavuz.pdf", "ek.pdf"]);
  assert.equal(p.bayt, PDF);
  const j = hazir(sayEkiHazirla(JPEG, "etiket.jpg"));
  assert.deepEqual([j.tur, j.mime], ["foto", "image/jpeg"]);
  assert.ok(!Buffer.from(j.bayt).includes(Buffer.from("Exif")), "EXIF silindi");
  assert.equal(hazir(sayEkiHazirla(PNG, "pano.png")).mime, "image/png");
  /* uzantı yanıltmaz */
  assert.equal(hazir(sayEkiHazirla(PDF, "foto.jpg")).tur, "pdf");
  const uzun = "Topraklama 0,4 Ω ".repeat(10_000);
  const w = hazir(sayEkiHazirla(word(uzun), "rapor<>.pdf"));
  assert.deepEqual([w.tur, w.mime, w.ad, w.dosyaAdi], ["word", "text/plain", "rapor.pdf", "ek.txt"]);
  assert.equal(new TextDecoder().decode(w.bayt), uzun.trim(), "Word'ün metni kısaltılmaz (170 000 karakter)");
  const csv = new Uint8Array(Buffer.from("## Sayfa: Ölçümler\nNo;Direnç\n1;0,4\n"));
  assert.deepEqual([hazir(sayEkiHazirla(csv, "olcum.xlsx", true)).tur, hazir(sayEkiHazirla(csv, "notlar.txt")).tur], ["tablo", "metin"]);
  assert.match(neden(sayEkiHazirla(new Uint8Array([0x4d, 0x5a, 0x00, 0x01]), "kotu.exe")), /okunamadı/);
  assert.match(neden(sayEkiHazirla(zipBayt([["word/document.xml", "<w:document><w:body></w:body></w:document>"]]), "b.docx")), /metin bulunamadı/);
  assert.match(neden(sayEkiHazirla(new Uint8Array(), "b.pdf")), /boş/);
  assert.equal(ekAdi("../../etc/pas\u0000swd", "x"), "....etcpasswd");
  assert.equal(ekAdi("   ", "yedek.pdf"), "yedek.pdf");
  assert.equal(ekAdi("a".repeat(300), "x").length, 300, "ad kısaltılmaz");
});

test("boy sınırı yok: büyük dosya parça parça (parça barındırmanın istek sınırının altında); büyük PDF de hazırlanır", () => {
  assert.ok(EK_PARCA_BAYT < 4.5 * 1024 * 1024 && EK_PARCA_BAYT >= 1 << 20);
  const b = new Uint8Array(40 << 20); b.set(PDF);
  assert.equal(hazir(sayEkiHazirla(b, "büyük.pdf")).bayt.length, 40 << 20);
});

test("konuşmaya giden bloklar: her ek 'Ek n (tür)' + Dosya API kimliği, adları gitmez; sonra kullanıcının yazısı", () => {
  const l = ekBloklari([{ dosya: "file_1", tur: "foto" }, { dosya: "file_2", tur: "pdf" }, { dosya: "file_3", tur: "tablo" }], "Bunlara göre formatı kur");
  assert.deepEqual(l, [
    { type: "text", text: "Ek 1 (fotoğraf):" }, { type: "image", source: { type: "file", file_id: "file_1" } },
    { type: "text", text: "Ek 2 (PDF):" }, { type: "document", source: { type: "file", file_id: "file_2" }, title: "Ek 2" },
    { type: "text", text: "Ek 3 (Excel tablosu (metin)):" }, { type: "document", source: { type: "file", file_id: "file_3" }, title: "Ek 3" },
    { type: "text", text: "Bunlara göre formatı kur" },
  ]);
  assert.deepEqual(ekBloklari([], "soru"), [{ type: "text", text: "soru" }]);
});
