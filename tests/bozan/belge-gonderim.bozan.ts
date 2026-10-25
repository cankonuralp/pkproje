/* OLUMSUZ KANIT — tests/pdf-paket.test.ts "belge gönderimi" neyi koruyor (2026-10-25, belge doldurma; kaynak diskte DEĞİŞTİRİLMEZ — gerçek dosyalar
   bellekte okunur, bozulur, denetim işlevine verilir):
   1. Plan aç listeden düşünce (plan açılınca ön bilgilendirme formu yanıttan sonra basılır) yakalanır — yayında Chromium bulunamaz, e-posta gitmez.
   2. Plan içi listeden düşünce iki kural birden yakalar: bilinen sayfa ve Planlar eyleminin dolaylı PDF'i (server/onbilgi.ts).
   3. Yeni bir modül eylemi PDF basan sunucu dosyasını içe aktarır da sayfası listede olmazsa yakalanır. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { dosyalar, oku } from "../yardimci/denetimler.ts";
import { pdfGonderimEksikleri } from "../yardimci/belge-gonderim.ts";

const cfg = oku("next.config.ts");
const moduller = dosyalar("src/modules", [".ts"]).map((ad) => ({ ad, metin: oku(ad) }));

test("belge gönderimi: Plan aç Chromium listesinden düşünce yakalanır", () => {
  assert.deepEqual(pdfGonderimEksikleri(cfg, moduller), []);
  const bozuk = cfg.replace('"/planlar/ac", ', "");
  assert.notEqual(bozuk, cfg, "bozulacak yer kaynakta yok");
  assert.deepEqual(pdfGonderimEksikleri(bozuk, moduller), ["/planlar/ac: PDF listesinde değil"]);
});

test("belge gönderimi: plan içi düşünce bilinen sayfa ve Planlar'ın dolaylı PDF eylemi yakalanır", () => {
  const bozuk = cfg.replace("String.raw`/planlar/\\[id\\]`,\n", "\n");
  assert.notEqual(bozuk, cfg, "bozulacak yer kaynakta yok");
  assert.deepEqual(pdfGonderimEksikleri(bozuk, moduller), [
    "/planlar/[id]: PDF listesinde değil",
    "src/modules/planlar/ui/eylemler.ts → src/modules/planlar/server/onbilgi.ts: /planlar sayfası PDF listesinde değil",
  ]);
});

test("belge gönderimi: yeni modülün eylemi PDF basan sunucu dosyasını içe aktarır, sayfası listede değilse yakalanır", () => {
  const ek = [
    { ad: "src/modules/deneme/server/belge.ts", metin: 'import { onBilgiPdf } from "../../../belge/pdf.ts";\n' },
    { ad: "src/modules/deneme/ui/eylemler.ts", metin: '"use server";\nimport { belgeGonder } from "../server/belge";\n' },
  ];
  assert.deepEqual(pdfGonderimEksikleri(cfg, [...moduller, ...ek]),
    ["src/modules/deneme/ui/eylemler.ts → src/modules/deneme/server/belge.ts: /deneme sayfası PDF listesinde değil"]);
});
