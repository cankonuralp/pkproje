/* NEREDEN GELDİ: FIRMA-VT.md §2 A6 ("havuz-kapsami izin listesi eksik: depo.ts vtDepo(havuz) ile çağrısız başvuru yapıyor; kilit çağrıyı değil
   db/havuz İÇE AKTARMASINI denetlemeli") + §5.1, FV3 (2026-10-15). Kendi projeli firmanın verisi kendi veritabanında: kiracının işi KİRACININ havuzundan
   (src/server/db/firma-havuzu.ts kiraciHavuzu) gitmeli. Merkez havuzu (src/server/db/havuz.ts merkezHavuzu) yalnız merkezde duran işler için —
   bir modül ya da sayfa merkezi içe aktarıp kiracı işini oradan açarsa kendi projeli firmanın isteği yanlış veritabanına gider (son kapı
   vt_firma_dogrula reddeder ama ekran düşer). Kilitler (saf, kaynak metni):
   1. merkez havuzunu içe aktaran dosyalar TAM OLARAK izin listesi (tests/yardimci/denetimler.ts MERKEZ_HAVUZU_IZNI, gerekçeleriyle) — statik, dinamik,
      yan etkili, yeniden dışa açma; göreli yol ve "@/" çözülür; yorumdaki söz sayılmaz; listeden düşen dosya da yakalanır;
   2. kiracının işi merkez havuzuyla açılmaz (kiraciIcinde(merkezHavuzu() …) yok); kimlik kapıları ve e-posta kiracının havuzunu kullanır; Ana sayfa
      duyuru bölümünü MERKEZDEN okur, kiracının işleminde okumaz (kendi veritabanlı firmada duyuru kaydı yok — "tazele" hep doğru çıkar, her açılış
      Bakanlığa üç istek; 2026-10-15 FV3 incelemesinde okuma yalnız ortak firmada tetikleniyordu, 2026-10-16 FV6'da bölüm merkezden okunur);
   3. yönetim eylemleri (firma aç, dondur, etkinleştir, geçici parola) başarıda kiracı kaydı önbelleğini boşaltır (2026-10-15, FV3 incelemesi —
      önce yalnız uçtan uca, zamanlamaya bağlı yakalanıyordu).
   Olumsuz kanıt: tests/bozan/havuz-kapsami.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { dosyalar, merkezdeKiraciIsi, merkezHavuzuIceAktaranlar, MERKEZ_HAVUZU_IZNI, oku, yonetimOnbellekEksikleri } from "./yardimci/denetimler.ts";

const kaynaklar = () => [...dosyalar("src", [".ts", ".tsx", ".mts", ".js", ".mjs"]), ...dosyalar("scripts", [".ts", ".mts", ".js", ".mjs"])]
  .map((ad) => ({ ad, metin: oku(ad) }));

test("merkez havuzunu (src/server/db/havuz.ts) yalnız izin listesindeki dosyalar içe aktarır — liste tam (fazlası da eksiği de yakalanır)", () => {
  const k = kaynaklar();
  assert.ok(k.length > 100);
  assert.deepEqual(merkezHavuzuIceAktaranlar(k), Object.keys(MERKEZ_HAVUZU_IZNI).sort());
  for (const [ad, gerekce] of Object.entries(MERKEZ_HAVUZU_IZNI)) assert.ok(gerekce.length >= 20, `${ad}: gerekçe`);
});

test("kiracının işi merkez havuzuyla açılmaz; kimlik kapıları, giriş eylemleri ve e-posta kiracının havuzunu kullanır", () => {
  const k = kaynaklar();
  assert.deepEqual(merkezdeKiraciIsi(k), []);
  for (const ad of ["src/server/kimlik/istek.ts", "src/server/kimlik/eylemler.ts", "src/server/eposta/sonra.ts"]) {
    assert.match(oku(ad), /\bkiraciHavuzu\(/, ad);
  }
  /* oturumun işi, müşterinin işi ve oturum okuma kiracının havuzunda */
  const istek = oku("src/server/kimlik/istek.ts");
  assert.match(istek, /return kiraciIcinde\(kiraciHavuzu\(o\.kiraci\), o\.kiraci\.firmaId, is, \{ hesapId: o\.id \}\);/);
  assert.match(istek, /return kiraciIcinde\(kiraciHavuzu\(o\.kiraci\), o\.kiraci\.firmaId, is, \{ musteri: /);
  assert.match(istek, /await oturumOku\(kiraciHavuzu\(kiraci\), kiraci\.firmaId, belirtec\)/);
  assert.match(istek, /await musteriOturumOku\(kiraciHavuzu\(kiraci\), kiraci\.firmaId, belirtec\)/);
  /* duyurular merkezde (FV6, 2026-10-16 — kasıtlı: önce "if (v.duyuru.tazele && !o.kiraci.vt)" — okumayı yalnız ortak firmanın sayfası tetikliyordu):
     bölüm merkezden okunur, tazele ona göre; kiracının işleminde (anaSayfa) duyuru okunmaz */
  assert.match(oku("src/app/(uygulama)/page.tsx"), /const duyuru = await duyuruBolumuMerkezden\(\);\n  if \(duyuru\.tazele\) duyuruTazeleSonra\(\);/);
  assert.doesNotMatch(oku("src/modules/anasayfa/server/anasayfa.ts"), /\bduyuruBolumu\(/, "kiracının işleminde duyuru okunmaz");
  assert.match(oku("src/server/duyuru/sonra.ts"), /merkezOku\(merkezHavuzu\(\), \(db\) => duyuruBolumu\(db\)\)/);
});

test("yönetim eylemleri başarıda kiracı kaydı önbelleğini boşaltır (firma aç, dondur, etkinleştir, geçici parola)", () => {
  assert.deepEqual(yonetimOnbellekEksikleri(oku("src/modules/yonetim/ui/eylemler.ts")), []);
});
