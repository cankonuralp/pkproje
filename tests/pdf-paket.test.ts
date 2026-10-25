/* NEREDEN GELDİ: 352 — reisim 2026-10-06: "Vercel Functions Storage 9/10 GB"; canlı yayının Resources görünümünde bütün sayfalar tek 74.1 MB işlevde (PDF
   için başsız Chromium her sayfaya paketlenmiş). Chromium eklenen her uç (next.config.ts outputFileTracingIncludes) maxDuration = 60 taşır → Vercel
   bunları ayrı işlevde toplar, öteki sayfalar küçük kalır. Olumsuz kanıt: tests/bozan/kilitler.bozan.ts "pdf paketi"; belge gönderimi (2026-10-25)
   tests/bozan/belge-gonderim.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { dosyalar, oku, pdfPaketEksikleri } from "./yardimci/denetimler.ts";
import { pdfGonderimEksikleri } from "./yardimci/belge-gonderim.ts";

test("Chromium eklenen her uç maxDuration = 60 taşır (PDF işlevi ayrı, sayfalar küçük)", () => {
  const sayfalar = dosyalar("src/app", [".ts", ".tsx"]).filter((d) => /\/(page|route)\.tsx?$/.test(d)).map((ad) => ({ ad, metin: oku(ad) }));
  const cfg = oku("next.config.ts");
  assert.ok((cfg.match(/maxDuration|outputFileTracingIncludes/g) ?? []).length >= 1);
  assert.deepEqual(pdfPaketEksikleri(cfg, sayfalar), []);
  /* PDF basan modül eylemleri listedeki sayfalarda: belge/pdf'i içe aktaran her "use server" dosyasının modülü listede bir sayfaya sahip */
  const eylemler = dosyalar("src/modules", [".ts"]).filter((d) => d.endsWith("/ui/eylemler.ts") && /from "\.\.\/\.\.\/\.\.\/belge\/pdf"/.test(oku(d)));
  assert.ok(eylemler.length >= 4, eylemler.join(", "));
  for (const e of eylemler) {
    const modul = e.split("/")[2];
    const yol = modul === "egitimler" ? "/dokumanlar/egitimler" : `/${modul}`;
    assert.ok(cfg.includes(`"${yol}"`) || cfg.includes(`\`${yol}/\\[id\\]\``) || cfg.includes(`\`${yol}/\\[id\\]`), `${e}: ${yol} PDF listesinde değil`);
  }
});

/* 454 (canlıda araç teslim tutanağı PDF'i "spawn ETXTBSY" ile düştü): sunucusuz Chromium ikili dosyası örnek başına BİR kez açılır (paylaşılan
   söz), aynı anda iki PDF ikiliyi yazılırken çalıştırmaya kalkmaz; meşgulse bir kez yeniden denenir */
test("454 sunucusuz Chromium: ikili dosya bir kez açılır, meşgulse bir kez yeniden denenir", () => {
  const pdf = oku("src/belge/pdf.ts");
  assert.match(pdf, /sunucusuzYol \?\?= import\("@sparticuz\/chromium"\)/, "açma paylaşılan söz");
  assert.equal((pdf.match(/\.executablePath\(\)/g) ?? []).length, 1, "executablePath tek yerden");
  assert.match(pdf, /ETXTBSY/, "meşgul ikiliye bir kez daha");
});

/* 2026-10-25 (belge doldurma; reisim: "bir müşteri için sözleşme açtığımda el ile girilmesi gereken yerleri girip öyle gönderebilmeliyim"): belgeyi
   e-postayla gönderen eylemler PDF'i SAYFANIN işlevinde basar — Plan aç (plan açılınca ön bilgilendirme formu, yanıttan sonra), plan içi ("Ön
   bilgilendirme formunu gönder"), sözleşme sayfası (gönderim) ve sözleşme PDF'i. Bu sayfalar listeden düşerse yayında Chromium bulunamaz, e-posta
   gitmez; sayfa / uç dosyasında maxDuration = 60 (yukarıdaki genel denetim). Modülün eylemi PDF basan sunucu dosyasını (belge/pdf'i içe aktaran)
   içe aktarıyorsa da o modülün sayfası listede olmalı. */
test("belge gönderimi: PDF basan eylemlerin sayfaları Chromium listesinde", () => {
  const moduller = dosyalar("src/modules", [".ts"]).map((ad) => ({ ad, metin: oku(ad) }));
  assert.deepEqual(pdfGonderimEksikleri(oku("next.config.ts"), moduller), []);
  assert.ok(oku("src/modules/planlar/ui/eylemler.ts").includes('from "../server/onbilgi"') && /from "\.\.\/\.\.\/\.\.\/belge\/pdf\.ts"/.test(oku("src/modules/planlar/server/onbilgi.ts")),
    "Planlar'ın ön bilgilendirme gönderimi dolaylı PDF eylemi olarak denetlenir");
});
