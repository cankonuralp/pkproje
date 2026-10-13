/* OLUMSUZ KANIT — tests/say-chat-foto.test.ts (527, S.A.Y Chat fotoğrafı galeriden / bilgisayardan) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa
   13.11): kaynak metni bellekte bozulur (foto-secim.ts geçici klasörden içe aktarılır, göreli içe aktarmalar kök adrese çevrilir). O zaman:
   1) galeri girdisine de capture konunca telefonda yine yalnız kamera açılır — denetim yakalar;
   2) bir fotoğraf tuşu eski tek girdili (capture'lı) etikete dönünce o tuşta galeri yok — denetim yakalar;
   3) boy denetimi kalkınca 2 MB üstü fotoğraf kuyruğa girer, sunucu reddeder, kayıt "Cihazda" takılı kalır;
   4) yer denetimi kalkınca kayıttaki sınırı aşan fotoğraflar kuyruğa girer (sunucu reddeder). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { oku, sayChatFotoTuslari } from "../yardimci/denetimler.ts";

const SAYCHAT = oku("src/modules/say-chat/ui/SayChat.tsx"), FOTOTUSU = oku("src/modules/say-chat/ui/FotoTusu.tsx");
const gecici = mkdtempSync(join(tmpdir(), "say-chat-foto-bozan-"));
after(() => rmSync(gecici, { recursive: true, force: true }));
const kok = resolve("src/modules/say-chat");
const KAYNAK = readFileSync(join(kok, "foto-secim.ts"), "utf8").replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(kok, y)).href}"`);
let sira = 0;
type Secim = typeof import("../../src/modules/say-chat/foto-secim.ts");
async function bozuk(eski: string, yeni: string): Promise<Secim> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(gecici, `foto-secim-${sira++}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href) as Promise<Secim>;
}
const bozukMetin = (metin: string, eski: string, yeni: string) => { assert.ok(metin.includes(eski), `bozulacak satır kaynakta yok: ${eski}`); return metin.replace(eski, yeni); };
const f = (name: string, size = 1000) => ({ name, type: "image/jpeg", size });
const ayni = async <T,>(x: T) => x;

test("1. galeri girdisine capture konunca denetim yakalar (kilidin koruduğu açık)", () => {
  const b = bozukMetin(FOTOTUSU, 'accept="image/*" multiple={coklu}', 'accept="image/*" capture="environment" multiple={coklu}');
  assert.ok(sayChatFotoTuslari(SAYCHAT, b).some((x) => /galeri/.test(x)), "bozuk: galeri yok, denetim yakaladı");
});

test("2. bir tuş eski capture'lı tek girdiye dönünce denetim yakalar (kilidin koruduğu açık)", () => {
  const b = bozukMetin(SAYCHAT, '<FotoTusu ad="+ ek" etiket="Ekipman fotoğrafı ekle" ikon="camera" sinif={stil.ekle} coklu sec={(l) => void fotoEkle(l, "ekipman", null)} />',
    '<label className={stil.ekle}><input className={stil.gizli} type="file" accept="image/*" capture="environment" />+ ek</label>');
  assert.ok(sayChatFotoTuslari(b, FOTOTUSU).length > 0, "bozuk: doğrudan girdi, denetim yakaladı");
});

test("3. boy denetimi kalkınca 2 MB üstü fotoğraf alınır (kilidin koruduğu açık)", async () => {
  const m = await bozuk(" && f.size <= CHAT_FOTO_BAYT;", ";");
  assert.equal(m.fotoUygun(f("buyuk.jpg", 3 << 20)), true, "bozuk: 2 MB üstü geçti");
});

test("4. yer denetimi kalkınca kayıttaki sınırı aşan fotoğraflar alınır (kilidin koruduğu açık)", async () => {
  const m = await bozuk("    if (alinan.length >= yer) { fazla++; continue; }\n", "");
  const s = await m.fotolariSec([f("a.jpg"), f("b.jpg"), f("c.jpg")], 1, ayni);
  assert.equal(s.alinan.length, 3, "bozuk: yer aşıldı");
});
