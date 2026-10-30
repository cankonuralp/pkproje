/* NEREDEN GELDİ: 2026-10-31, kalem 2 (sunum "S.A.Y'a tam yetenek", reisim: "Önerdiğin gibi onay"; karar 1 "dosya adı ve çekim saati modele gider").
   26 Ekim'de dört fotoğraf ("komp.jpeg", "hidrofor.jpeg" …) adsız gitti, S.A.Y hepsini genleşme tankı saydı; saha sohbetlerinde not ile fotoğrafın bağı
   saatten ve dosya adından kurulur. Bu kilit tutar: (1) EXIF çekim saati konum silinmeden önce okunur, bozuk EXIF yüklemeyi durdurmaz, temizlenen
   fotoğrafta EXIF kalmaz; (2) sohbet dışa aktarımı (köşeli / tireli, 12 / 24 saat, çok satır, medya, eksik medya, sistem iletisi) tek düzene çevrilir,
   gönderen adı gitmez; (3) ekin başlığı numara + tür + ad + çekim saati, fotoğraflar çekim saatine göre dizilir; (4) ekin kopyası firmanın deposunda,
   yalnız ekleyen açar, temizlenince çöpe (kaynak kilidi); göç idempotent. Olumsuz kanıt: tests/bozan/say-malzeme.bozan.ts. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { exifCekimZamani } from "../src/server/dosya/exif.ts";
import { ekBasligi, malzemeSirasi, sohbetDuzeni, sohbetIletileri } from "../src/modules/say/malzeme.ts";
import { sayEkiHazirla } from "../src/modules/say/server/ek.ts";


/** uydurma JPEG: APP1 Exif (IFD0 → Exif IFD → DateTimeOriginal), sonra tarama */
export function exifliJpeg(tarih = "2026:10:27 09:56:12", buyukSon = false): Uint8Array {
  const t = new Uint8Array(64), v = new DataView(t.buffer), k = !buyukSon;
  t.set(buyukSon ? [0x4d, 0x4d] : [0x49, 0x49], 0); v.setUint16(2, 42, k); v.setUint32(4, 8, k);
  v.setUint16(8, 1, k); v.setUint16(10, 0x8769, k); v.setUint16(12, 4, k); v.setUint32(14, 1, k); v.setUint32(18, 26, k); v.setUint32(22, 0, k);
  v.setUint16(26, 1, k); v.setUint16(28, 0x9003, k); v.setUint16(30, 2, k); v.setUint32(32, 20, k); v.setUint32(36, 44, k); v.setUint32(40, 0, k);
  t.set([...tarih].map((c) => c.charCodeAt(0)), 44);
  const yuk = [0x45, 0x78, 0x69, 0x66, 0, 0, ...t];
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe1, (yuk.length + 2) >> 8, (yuk.length + 2) & 0xff, ...yuk, 0xff, 0xda, 0x00, 0x02, 0x11, 0x22, 0xff, 0xd9]);
}

test("EXIF çekim saati: iki bayt sırası; bozuk / eksik EXIF null; temizlenen fotoğrafta EXIF kalmaz ama saat okunmuş olur", () => {
  assert.equal(exifCekimZamani(exifliJpeg()), "2026-10-27 09:56");
  assert.equal(exifCekimZamani(exifliJpeg("2026:10:27 18:05:00", true)), "2026-10-27 18:05");
  assert.equal(exifCekimZamani(exifliJpeg("0000:00:00 00:00:00")), null, "boş tarih");
  const kesik = exifliJpeg().slice(0, 40);
  assert.equal(exifCekimZamani(kesik), null);
  assert.equal(exifCekimZamani(new Uint8Array([0xff, 0xd8, 0xff, 0xda, 0, 2])), null, "EXIF'siz");
  const e = sayEkiHazirla(exifliJpeg(), "T4 etiket.jpg");
  assert.ok(!("durum" in e));
  assert.equal(e.cekim, "2026-10-27 09:56");
  assert.ok(!Buffer.from(e.bayt).includes(Buffer.from("Exif")), "EXIF silindi");
});

const IOS = `[27.10.2026 09:56:12] Uzman A: Sevkiyat alanı ekp 1 marka model yok, 2500 3200
‎[27.10.2026 09:56:40] Uzman A: ‎<ekli: 00000012-PHOTO-2026-10-27-09-56-40.jpg>
[27.10.2026 09:58:03] Uzman A: 9 giriş kkt
10 rampa kkt
[27.10.2026 10:01:00] Uzman B: ‎görüntü dahil edilmedi
[27.10.2026 10:02:00] Uzman A mesajları ve aramaları uçtan uca şifrelidir.`;
const ANDROID = `27.10.2026 09:56 - Uzman A: T4
27.10.2026 09:57 - Uzman A: IMG-20261027-WA0012.jpg (dosya ekli)
10/27/26, 1:05 PM - Uzman A: kapasite yok
27.10.2026 13:06 - Uzman A: <Medya dahil edilmedi>`;

test("sohbet dışa aktarımı: iletiler, medya adı, eksik medya, çok satır; gönderen adı gitmez; sohbet olmayan metin null", () => {
  const i = sohbetIletileri(IOS)!;
  assert.equal(i.length, 4, "sistem iletisi (iki noktasız) atlanır");
  assert.deepEqual(i[1], { tarih: "27.10.2026", saat: "09:56", metin: "", medya: ["00000012-PHOTO-2026-10-27-09-56-40.jpg"], eksikMedya: false });
  assert.equal(i[2].metin, "9 giriş kkt ⏎ 10 rampa kkt");
  assert.equal(i[3].eksikMedya, true);
  const a = sohbetIletileri(ANDROID)!;
  assert.deepEqual(a.map((x) => [x.tarih, x.saat, x.medya, x.eksikMedya]), [["27.10.2026", "09:56", [], false], ["27.10.2026", "09:57", ["IMG-20261027-WA0012.jpg"], false],
    ["27.10.2026", "13:05", [], false], ["27.10.2026", "13:06", [], true]]);
  const d = sohbetDuzeni(i);
  assert.doesNotMatch(d, /Uzman [AB]/, "gönderen adı yok");
  assert.match(d, /^#02 27\.10\.2026 09:56 \[00000012-PHOTO-2026-10-27-09-56-40\.jpg\]$/m);
  assert.equal(sohbetIletileri("Kapı 1: seksiyonel\nKapı 2: aynı"), null, "düz not sohbet sayılmaz");
  const e = sayEkiHazirla(new TextEncoder().encode(IOS), "_chat.txt");
  assert.ok(!("durum" in e) && e.tur === "metin" && new TextDecoder().decode(e.bayt).startsWith("Sohbet dökümü: 4 ileti"));
});

test("ekin başlığı ve sırası: fotoğrafların hepsinin saati varsa kendi yerlerinde çekim saatine göre; yoksa eklenme sırası", () => {
  assert.equal(ekBasligi({ dosya: "f", tur: "foto", ad: "komp.jpeg", cekim: "2026-10-27 09:56", no: 3, fno: 2 }), "M03 · F02 — fotoğraf · komp.jpeg · çekim 27.10.2026 09:56");
  assert.equal(ekBasligi({ dosya: "f", tur: "pdf", ad: "x".repeat(120), cekim: null, no: 12, fno: null }).length, "M12 — PDF · ".length + 80);
  const l = [{ id: 1, tur: "foto", cekim: "2026-10-27 10:00" }, { id: 2, tur: "pdf", cekim: null }, { id: 3, tur: "foto", cekim: "2026-10-27 09:00" }];
  assert.deepEqual(malzemeSirasi(l).map((x) => x.id), [3, 2, 1]);
  assert.deepEqual(malzemeSirasi([l[0], { id: 4, tur: "foto", cekim: null }, l[2]]).map((x) => x.id), [1, 4, 3], "saati eksik fotoğraf varsa eklenme sırası");
});

test("kaynak kilidi: ek kopyası depoda, yalnız ekleyen açar, temizlenince çöpe; numara kalıcı sıradan; göç idempotent", () => {
  const y = readFileSync("src/modules/say/server/ek-yukle.ts", "utf8"), er = readFileSync("src/server/dosya/erisim.ts", "utf8");
  const s = readFileSync("src/modules/say/server/say.ts", "utf8"), k = readFileSync("src/server/yz/konusma.ts", "utf8");
  assert.ok(/dosyaYukle\(db, depo\(\), \{ firmaId: o\.kiraci\.firmaId, modul: DOSYA_SAY_EK, kayitId: ek,/.test(y), "kopya depoya, firma oturumdan");
  assert.ok(y.includes("cekim: e.cekim"), "çekim saati kayda");
  assert.ok(er.includes("[DOSYA_SAY_EK]: (db, _kisi, kayitId) => sayEkGorulur(db, kayitId)"), "erişim kaydında");
  assert.ok(/for \(const d of await ekKopyalari\(db\)\) await dosyaCope\(/.test(s), "temizlenince çöpe");
  assert.ok(k.includes("row_number() OVER (ORDER BY sira)"), "numara kalıcı sıradan");
  const g = readFileSync("src/server/db/gocler/0109_say_malzeme.sql", "utf8");
  assert.ok(g.includes("ADD COLUMN IF NOT EXISTS cekim") && g.includes("IF NOT EXISTS (SELECT 1 FROM information_schema.columns") && g.includes("CREATE INDEX IF NOT EXISTS"), "göç idempotent");
});
