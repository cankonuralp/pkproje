/* OLUMSUZ KANIT — tests/foto-tusu.test.ts (527 / 531, fotoğraf galeriden / bilgisayardan) neyi koruyor. Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11):
   kaynak metni bellekte bozulur (secim.ts geçici klasörden içe aktarılır). O zaman:
   1) ortak tuşun galeri girdisine de capture konunca telefonda yine yalnız kamera açılır — denetim yakalar;
   2) bir modül (zimmet teslimi) eski tek girdili capture'lı alana dönünce o yerde galeri yok — denetim yakalar;
   3) S.A.Y Chat'te bir tuş doğrudan capture'lı etikete dönünce — denetim yakalar;
   4) boy denetimi kalkınca sınırı aşan fotoğraf alınır (kuyrukta / gövde sınırında reddedilir, sessizce takılır);
   5) yer denetimi kalkınca sınırı aşan fotoğraflar alınır (sunucu reddeder). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { dosyalar, FOTO_TUSU_KULLANANLAR, fotoTuslari, oku } from "../yardimci/denetimler.ts";

const KAYNAKLAR = dosyalar("src", [".tsx"]).map((ad) => ({ ad, metin: oku(ad) })), FOTOTUSU = oku("src/components/foto/FotoTusu.tsx");
const gecici = mkdtempSync(join(tmpdir(), "foto-tusu-bozan-"));
after(() => rmSync(gecici, { recursive: true, force: true }));
const KAYNAK = readFileSync(resolve("src/components/foto/secim.ts"), "utf8");
let sira = 0;
type Secim = typeof import("../../src/components/foto/secim.ts");
async function bozuk(eski: string, yeni: string): Promise<Secim> {
  assert.ok(KAYNAK.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const yol = join(gecici, `secim-${sira++}.ts`);
  writeFileSync(yol, KAYNAK.replace(eski, () => yeni));
  return import(pathToFileURL(yol).href) as Promise<Secim>;
}
/** bir dosyanın metni bellekte bozulmuş kaynak listesi */
function bozukKaynaklar(ad: string, eski: string, yeni: string) {
  return KAYNAKLAR.map((d) => {
    if (d.ad !== ad) return d;
    assert.ok(d.metin.includes(eski), `bozulacak satır kaynakta yok: ${eski.slice(0, 80)}`);
    return { ad, metin: d.metin.replace(eski, yeni) };
  });
}
const f = (name: string, size = 1000) => ({ name, type: "image/jpeg", size });
const ayni = async <T,>(x: T) => x;

test("1. ortak tuşun galeri girdisine capture konunca denetim yakalar (kilidin koruduğu açık)", () => {
  assert.ok(KAYNAKLAR.length > 50);
  const b = FOTOTUSU.replace('accept="image/*" multiple={coklu}', 'accept="image/*" capture="environment" multiple={coklu}');
  assert.notEqual(b, FOTOTUSU, "bozulacak satır kaynakta yok");
  assert.ok(fotoTuslari(KAYNAKLAR, b, FOTO_TUSU_KULLANANLAR).some((x) => /galeri/.test(x)), "bozuk: galeri yok, denetim yakaladı");
});

test("2. zimmet teslimi eski capture'lı tek girdiye dönünce denetim yakalar (kilidin koruduğu açık)", () => {
  const ad = "src/modules/zimmetler/ui/Pencereler.tsx";
  const k = bozukKaynaklar(ad, '<FotoTusu ad="Fotoğraf ekle" ikon="camera" sinif={tusSinifi("ikincil")} id={TID.foto} tanim={ipucuId(TID.foto)} coklu sec={(l) => void fotoEkle(l)} />',
    '<input id={TID.foto} name="foto" type="file" accept="image/jpeg,image/png" multiple capture="environment" />');
  const h = fotoTuslari(k, FOTOTUSU, FOTO_TUSU_KULLANANLAR);
  assert.ok(h.some((x) => x.startsWith(`${ad}:`)), `bozuk: denetim yakaladı — ${h.join(" | ")}`);
});

test("3. S.A.Y Chat'te bir tuş capture'lı etikete dönünce denetim yakalar (kilidin koruduğu açık)", () => {
  const ad = "src/modules/say-chat/ui/SayChat.tsx";
  const k = bozukKaynaklar(ad, '<FotoTusu ad="+ ek" etiket="Ekipman fotoğrafı ekle" ikon="camera" sinif={stil.ekle} coklu sec={(l) => void fotoEkle(l, "ekipman", null)} />',
    '<label className={stil.ekle}><input className={stil.gizli} type="file" accept="image/*" capture="environment" />+ ek</label>');
  assert.ok(fotoTuslari(k, FOTOTUSU, FOTO_TUSU_KULLANANLAR).length > 0, "bozuk: doğrudan girdi, denetim yakaladı");
});

test("4. boy denetimi kalkınca sınırı aşan fotoğraf alınır (kilidin koruduğu açık)", async () => {
  const m = await bozuk(" && f.size <= enCokBayt;", ";");
  assert.equal(m.fotoUygun(f("buyuk.jpg", 3 << 20), 2 << 20), true, "bozuk: 2 MB üstü geçti");
});

test("5. yer denetimi kalkınca sınırı aşan fotoğraflar alınır (kilidin koruduğu açık)", async () => {
  const m = await bozuk("    if (alinan.length >= yer) { fazla++; continue; }\n", "");
  const s = await m.fotolariSec([f("a.jpg"), f("b.jpg"), f("c.jpg")], 1, ayni, 8 << 20);
  assert.equal(s.alinan.length, 3, "bozuk: yer aşıldı");
});
