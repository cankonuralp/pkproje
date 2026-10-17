/* NEREDEN GELDİ: 2026-10-17 — reisim: "bu ayrı bir çalışma gibi düşün evet sign.probatadan yayınlayacağız ama probatanın kaynak kodlarına bunları
   bulaştırma ileride probata ile bağ kurmamız gerekirse kurarız". İmza platformu ayrı proje (probata-sign; IMZA-SERVISI.md yönlendirir). probata'da
   kalan: yüklenen imzalı PDF'in OKUNMASI / DENETİMİ (src/server/imza/ çözümleyici + yukleme.ts). İmza ÜRETEN yazıcılar (CMS kurulumu, yer tutucu,
   artımlı ek, DSS + belge damgası) yalnız testlerin veri üreticisi olarak tests/yardimci/imza-uret/'te; zaman damgası istemcisi ve iptal kanıtının
   ağdan alınması probata'dan tümüyle çıktı. Neyi koruyor (tests/yardimci/denetimler.ts imzaAyrimiEksikleri):
   · ürün kodu (src/**) test klasörünü içe aktarmaz — test verisi üreticisi ürüne giremez;
   · src/server/imza/** içinde imza üreten işlev adları geçmez — motor geri sızmaz;
   · test verisi üreticisinin her dosyası başında bu kuralı söyler.
   Olumsuz kanıt: tests/bozan/imza-ayrim.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { dosyalar, IMZA_URETEN_ADLAR, imzaAyrimiEksikleri, oku } from "./yardimci/denetimler.ts";

const UZANTI = [".ts", ".tsx", ".mts", ".cts", ".js", ".mjs", ".cjs"];
const kaynaklar = () => [...dosyalar("src", UZANTI), ...dosyalar("tests/yardimci/imza-uret", UZANTI)].map((ad) => ({ ad, metin: oku(ad) }));

test("ürün kodu test klasörünü içe aktarmaz; src/server/imza/ imza üretmez (yalnız okuma / denetim); test verisi üreticisi kuralı başında söyler", () => {
  const k = kaynaklar();
  assert.ok(k.filter((d) => d.ad.startsWith("src/")).length > 100, "ürün kodu okundu");
  assert.ok(k.filter((d) => d.ad.startsWith("src/server/imza/")).length >= 6, "imza okuyucusu yerinde");
  assert.ok(k.filter((d) => d.ad.startsWith("tests/yardimci/imza-uret/")).length >= 4, "test verisi üreticisi yerinde");
  assert.deepEqual(imzaAyrimiEksikleri(k), []);
});

test("yasak adlar gerçek: üretici (tests/yardimci/imza-uret/) bu işlevleri dışa açıyor — ad listesi bayat değil", () => {
  const uretici = dosyalar("tests/yardimci/imza-uret", [".ts"]).map(oku).join("\n");
  /* zaman damgası istemcisi (damgaAl) ve iptal kanıtının ağdan alınması (iptalKaniti) test verisine gerekmez — probata'dan tümüyle çıktı */
  for (const ad of IMZA_URETEN_ADLAR.filter((a) => a !== "damgaAl" && a !== "iptalKaniti")) {
    assert.match(uretici, new RegExp(`export (?:async )?function ${ad}\\b`), ad);
  }
});
