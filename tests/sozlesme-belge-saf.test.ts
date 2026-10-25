/* NEREDEN GELDİ: 2026-10-25 (belge doldurma; reisim: "sözleşme vb işleri de yüklediğimde, el ile değiştirilebilir ve doldurulabilir olmalı, bir müşteri
   için sözleşme açtığımda el ile girilmesi gereken yerleri girip öyle gönderebilmeliyim") — Sözleşmeler'in veritabanısız parçaları: "Müşteriye gönder"in
   alıcı şeması (en az 1, en çok 5, biçim, tekrar), e-postanın konusu ve gövdesi (düz metin; imza bekleyen sözleşmede imzalı nüsha istenir; gönderen
   tuşa basan), sözleşme PDF'inin yeri (uç ve sözleşme sayfası maxDuration 60 — başsız Chromium; PDF basan eylem yalnız sözleşme sayfasında, öteki
   Sözleşmeler sayfaları Chromium'suz kalır; format yoksa şablonun kendisi). Veritabanı kısmı: tests/sozlesmeler.test.ts "SÖZLEŞME BELGESİ". */
import assert from "node:assert/strict";
import { test } from "node:test";
import { GONDER_EN_COK, GonderGirdisi, sozlesmeEpostasi } from "../src/modules/sozlesmeler/sema.ts";
import { dogrula } from "../src/sema/ortak.ts";
import { dosyalar, oku } from "./yardimci/denetimler.ts";

test("alıcılar: en az 1, en çok 5; biçim; büyük / küçük harf aynı adres iki kez olmaz", () => {
  assert.equal(GONDER_EN_COK, 5);
  const ok = dogrula(GonderGirdisi, { kime: [" Musteri@Deneme.example ", "ikinci@deneme.example"] });
  assert.deepEqual(ok.tamam && ok.veri.kime, ["musteri@deneme.example", "ikinci@deneme.example"]);
  const hata = (kime: unknown) => { const r = dogrula(GonderGirdisi, { kime }); return r.tamam ? null : r.hatalar; };
  assert.deepEqual(hata([]), { kime: "En az bir e-posta yazılmalı." });
  assert.deepEqual(hata(undefined), { kime: "En az bir e-posta yazılmalı." });
  assert.deepEqual(hata(Array.from({ length: 6 }, (_, i) => `k${i}@deneme.example`)), { kime: "En çok 5 e-posta." });
  assert.deepEqual(hata(["a@deneme.example", "A@DENEME.example"]), { kime: "Aynı e-posta iki kez yazılmış." });
  assert.deepEqual(hata(["a@deneme.example", "yanlis"]), { "kime.1": "Geçerli bir e-posta adresi yazılmalı." });
});

test("e-posta: konu sabit kısa; gövde düz metin — taraflar, süre, kapsam; imza bekliyorsa imzalı nüsha istenir; imza satırı tuşa basan", () => {
  const b = { firma: "Deneme Muayene", no: "IS-1026-001", unvan: "Deneme Makina San. A.Ş.", baslangic: "2026-10-01", bitis: "2027-09-30",
    tesisler: ["Merkez Fabrika", "İkinci Tesis"], imzaBekliyor: true, gonderen: "Deneme Planlama" };
  const e = sozlesmeEpostasi(b);
  assert.equal(e.konu, "Deneme Muayene · IS-1026-001 hizmet sözleşmesi");
  const satirlar = e.govde.split("\n");
  assert.equal(satirlar[0], "Sayın Deneme Makina San. A.Ş.,");
  assert.ok(satirlar.includes("Deneme Muayene ile aranızdaki IS-1026-001 numaralı periyodik kontrol hizmet sözleşmesi ektedir."));
  assert.ok(satirlar.includes("Süre: 01.10.2026 – 30.09.2027") && satirlar.includes("Kapsam: Merkez Fabrika, İkinci Tesis"));
  assert.ok(satirlar.includes("İmzalı nüshayı tarafımıza iletmenizi rica ederiz."));
  assert.deepEqual(satirlar.slice(-3), ["Saygılarımızla,", "Deneme Planlama", "Deneme Muayene"]);
  assert.ok(!e.govde.includes("<"), "düz metin");
  const i = sozlesmeEpostasi({ ...b, imzaBekliyor: false, tesisler: [] });
  assert.ok(!i.govde.includes("İmzalı nüshayı") && i.govde.includes("Kapsam: -"));
  assert.ok(sozlesmeEpostasi({ ...b, firma: "F".repeat(400) }).konu.length <= 300, "konu kuyruğun sınırında");
});

test("PDF yeri: uç ve sözleşme sayfası maxDuration 60; PDF basan eylem yalnız sözleşme sayfasında; format yoksa şablonun kendisi", () => {
  const uc = oku("src/app/(uygulama)/sozlesmeler/[id]/pdf/route.ts");
  assert.match(uc, /^export const maxDuration = 60;$/m);
  assert.match(uc, /^export const runtime = "nodejs";$/m);
  assert.match(uc, /r\.sablon \?\? await sozlesmePdf\(r\.v\)/, "şablon varsa onun kendisi, yoksa format / temel");
  assert.match(oku("src/app/(uygulama)/sozlesmeler/[id]/page.tsx"), /^export const maxDuration = 60;$/m);
  /* belge/pdf (playwright) yalnız belge eylemlerinde; ortak eylem dosyası listeyi ve Yeni sözleşme'yi Chromium'suz bırakır */
  assert.doesNotMatch(oku("src/modules/sozlesmeler/ui/eylemler.ts"), /belge\/pdf/);
  assert.match(oku("src/modules/sozlesmeler/ui/belge-eylemler.ts"), /from "\.\.\/\.\.\/\.\.\/belge\/pdf"/);
  const kullanan = (ad: string) => [...dosyalar("src/app", [".ts", ".tsx"]), ...dosyalar("src/modules", [".ts", ".tsx"])]
    .filter((d) => new RegExp(`from "[^"]*/${ad}"`).test(oku(d)));
  assert.deepEqual(kullanan("belge-eylemler").filter((d) => d.includes("sozlesmeler")), ["src/modules/sozlesmeler/ui/BelgeTuslari.tsx"]);
  assert.deepEqual(kullanan("BelgeTuslari").filter((d) => d.includes("sozlesmeler")), ["src/app/(uygulama)/sozlesmeler/[id]/page.tsx"]);
});
