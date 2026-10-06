/* NEREDEN GELDİ: 352 — reisim 2026-10-06: "Vercel Functions Storage 9/10 GB"; canlı yayının Resources görünümünde bütün sayfalar tek 74.1 MB işlevde (PDF
   için başsız Chromium her sayfaya paketlenmiş). Chromium eklenen her uç (next.config.ts outputFileTracingIncludes) maxDuration = 60 taşır → Vercel
   bunları ayrı işlevde toplar, öteki sayfalar küçük kalır. Olumsuz kanıt: tests/bozan/kilitler.bozan.ts "pdf paketi". */
import assert from "node:assert/strict";
import { test } from "node:test";
import { dosyalar, oku, pdfPaketEksikleri } from "./yardimci/denetimler.ts";

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
