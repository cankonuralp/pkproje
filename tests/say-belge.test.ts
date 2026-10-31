/* NEREDEN GELDİ: 2026-10-31, kalem 9 — M1 + M2 (sunum "S.A.Y'a tam yetenek", reisim: "Önerdiğin gibi onay"; beceri B11). Her modülün işlem dosyasında "dosya ister —
   ekrandan (S.A.Y'da yok)" yazıyordu: kaydı yazıyor, belgeyi koyamıyordu. Bu kilit tutar: (1) konuşmadaki ek (M / F numarası) firmanın deposundaki kopyasından
   okunur, yuvanın türüne uymayan ve kopyası olmayan söylenir; (2) belge yuvaları katalogda, ek alanıyla, ekranın yükleme işlevini çağırarak (özlük, bordro,
   zimmet, atama, eğitim sertifikası, kalibrasyon sertifikası, gider belgesi, standart, döküman, imzalı sözleşme, saha formu taraması). Olumsuz kanıt: bozan say-belge. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { ekBelgesi, type IslemBaglami } from "../src/server/yz/islem.ts";
import { ISLEM_KATALOGU } from "../src/modules/say/islem-katalogu.ts";

export const belgeBaglami = (satir: { ad: string; tur: string; anahtar: string | null } | null, bayt = new Uint8Array([1, 2, 3])) => {
  const sorgular: unknown[][] = [];
  return { sorgular, b: { db: { sorgu: async (_s: string, p: unknown[]) => { sorgular.push(p); return { rows: satir ? [satir] : [], rowCount: satir ? 1 : 0 }; } },
    depo: () => ({ oku: async () => bayt }) } as unknown as IslemBaglami };
};

test("ek: numarasıyla depodaki kopyadan; türe uymayan ve kopyası olmayan söylenir", async () => {
  const a = belgeBaglami({ ad: "sertifika.pdf", tur: "pdf", anahtar: "k1" });
  assert.deepEqual(await ekBelgesi(a.b, "M03", ["pdf"]), { ad: "sertifika.pdf", bayt: new Uint8Array([1, 2, 3]) });
  assert.equal(a.sorgular[0]![1], 3, "M03 → üçüncü ek");
  assert.match(String(await ekBelgesi(belgeBaglami({ ad: "fis.jpg", tur: "foto", anahtar: "k2" }).b, "F01", ["pdf"])), /bu yuvaya uymaz: PDF gerekir/);
  assert.match(String(await ekBelgesi(belgeBaglami({ ad: "not.txt", tur: "metin", anahtar: null }).b, "M01", ["pdf", "foto"])), /kopyası yok/);
  assert.match(String(await ekBelgesi(belgeBaglami(null).b, "M9", ["pdf"])), /böyle bir ek yok/);
});

test("yuvalar katalogda, ek alanıyla; ekranın yükleme işleviyle", () => {
  const yuvalar = ["personel_belge_ekle", "egitim_sertifika_ekle", "standart_yukle", "dokuman_yukle", "sozlesme_imzali_yukle", "saha_tarama_yukle"];
  for (const a of [...yuvalar, "kalibrasyon_ekle", "gider_kaydet"]) {
    const t = ISLEM_KATALOGU.find((x) => x.ad === a);
    assert.ok(t && t.tur === "yaz", a);
    assert.ok("ek" in (t.girdi as unknown as { shape: Record<string, unknown> }).shape, `${a}: ek alanı`);
  }
  const k = readFileSync("src/modules/personel/say-islemleri.ts", "utf8");
  for (const f of ["ozlukEkle(b.db, b.depo(), b.kim, b.firmaId, v.personel, v.alanlar, belge)", "bordroYukle(", "zimmetFormuYukle(", "atamaEkle("]) assert.ok(k.includes(f), f);
  assert.ok(readFileSync("src/modules/olcum-cihazlari/say-islemleri.ts", "utf8").includes("kalibrasyonEkle(b.db, b.depo(), b.kim, b.firmaId, v.cihaz, ham.kalibrasyon, belge)"));
  assert.ok(readFileSync("src/modules/muhasebe/say-islemleri.ts", "utf8").includes("giderKaydet(b.db, b.depo(), b.kim, b.firmaId, v.gider, v.surum, ham.kayit, belge)"));
});
