/* NEREDEN GELDİ: 2026-10-17 — reisim: "bu ayrı bir çalışma gibi düşün evet sign.probatadan yayınlayacağız ama probatanın kaynak kodlarına bunları
   bulaştırma ileride probata ile bağ kurmamız gerekirse kurarız". İmza platformu ayrı proje (probata-sign; IMZA-SERVISI.md yönlendirir). probata'da
   kalan: yüklenen imzalı PDF'in OKUNMASI / DENETİMİ (src/server/imza/ çözümleyici + yukleme.ts). İmza ÜRETEN yazıcılar (CMS kurulumu, yer tutucu,
   artımlı ek, DSS + belge damgası) yalnız testlerin veri üreticisi olarak tests/yardimci/imza-uret/'te; zaman damgası istemcisi ve iptal kanıtının
   ağdan alınması probata'dan tümüyle çıktı. Neyi koruyor (tests/yardimci/denetimler.ts imzaAyrimiEksikleri):
   · ürün kodu (src/**) test klasörünü içe aktarmaz — test verisi üreticisi ürüne giremez;
   · src/server/imza/** içinde imza üreten işlev adları geçmez — motor geri sızmaz;
   · src/server/imza/** ağa çıkmaz: probata-sign'ın ağ istemcilerinin adları (ocspIstegi, iptalKaniti, damgaAl …) ve ağ izi (fetch, node:http /
     https / net / tls / dns içe aktarması, XMLHttpRequest / WebSocket) geçmez (2026-10-23 denetim bulgusu: iptal.ts'e `ocspIstegi` + fetch
     eklenince kilit fail 0 veriyordu);
   · test verisi üreticisinin her dosyası başında bu kuralı söyler.
   Olumsuz kanıt: tests/bozan/imza-ayrim.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { dosyalar, IMZA_AG_ADLARI, IMZA_URETEN_ADLAR, IMZA_YAZICI_IZLERI, imzaAyrimiEksikleri, oku } from "./yardimci/denetimler.ts";

const UZANTI = [".ts", ".tsx", ".mts", ".cts", ".js", ".mjs", ".cjs"];
const kaynaklar = () => [...dosyalar("src", UZANTI), ...dosyalar("tests/yardimci/imza-uret", UZANTI)].map((ad) => ({ ad, metin: oku(ad) }));

test("ürün kodu test klasörünü içe aktarmaz; src/server/imza/ imza üretmez, ağa çıkmaz (yalnız okuma / denetim); test verisi üreticisi kuralı başında söyler", () => {
  const k = kaynaklar();
  assert.ok(k.filter((d) => d.ad.startsWith("src/")).length > 100, "ürün kodu okundu");
  assert.ok(k.filter((d) => d.ad.startsWith("src/server/imza/")).length >= 6, "imza okuyucusu yerinde");
  assert.ok(k.filter((d) => d.ad.startsWith("tests/yardimci/imza-uret/")).length >= 4, "test verisi üreticisi yerinde");
  assert.deepEqual(imzaAyrimiEksikleri(k), []);
});

test("yasak adlar gerçek: üretici (tests/yardimci/imza-uret/) bu işlevleri dışa açıyor — ad listesi bayat değil", () => {
  const uretici = dosyalar("tests/yardimci/imza-uret", [".ts"]).map(oku).join("\n");
  /* zaman damgası istemcisi (damgaAl) ve iptal kanıtının ağdan alınması (iptalKaniti) test verisine gerekmez — probata'dan tümüyle çıktı; 2026-10-23
     IMZA_AG_ADLARI'na taşındı (ağ istemcilerinin hiçbiri üreticide yok: test verisi ağa çıkmaz) */
  for (const ad of IMZA_URETEN_ADLAR) assert.match(uretici, new RegExp(`export (?:(?:async )?function ${ad}\\b|const ${ad} =)`), ad);
  for (const ad of IMZA_AG_ADLARI) assert.doesNotMatch(uretici, new RegExp(`\\b${ad}\\b`), `${ad}: test verisi üreticisi ağ istemcisi taşımaz`);
});

test("yazıcı izleri gerçek: artımlı ek yazıcısında (pdf-ek-yaz.ts) var, okuyucuda (src/server/imza/) yok — iz listesi bayat değil", () => {
  const yazici = oku("tests/yardimci/imza-uret/pdf-ek-yaz.ts");
  for (const [ne, iz] of IMZA_YAZICI_IZLERI) assert.match(yazici, iz, ne);
});
