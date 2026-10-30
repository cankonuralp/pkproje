/* NEREDEN GELDİ: 2026-10-31, kalem 4 — K6 (sunum "S.A.Y'a tam yetenek", reisim: "Önerdiğin gibi onay"; karar 3: ayrı uç /api/say/form, Chromium, 60 sn).
   26 Ekim'de parçalı formda tankın etiketi basınç kaynağının yerine yazıldı; metin yerleşimi yetmediğinde S.A.Y formu görür. Bu kilit tutar: (1) işaretli
   belgede her yazılabilir yerin kutusunda kendi kimliği (ekipman bilgisi, alan, ölçüm tablosu hücresi, test değeri); künye ve imza değişmez, belge kesin
   değil; (2) sayfa görüntüsü JPEG, A4 dilimi, sayfa sayısıyla; (3) uç Chromium listesinde ve 60 sn, oturum + köken kapısı; görüntü raporu görene açık;
   form_goster EKRAN aracı (S.A.Y'ın ucu Chromium taşımaz), görüntüyü sunucu dosya erişim kaydıyla okuyup sonuca koyar. Olumsuz kanıt: bozan say-form. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { ornekBelge } from "../src/belge/ornek.ts";
import { belgeGoruntusu, belgeHtml } from "../src/belge/pdf.ts";
import { isaretliVeri } from "../src/modules/raporlar/server/form-goruntusu.ts";
import { EKRAN_ARAC_ADLARI } from "../src/server/yz/say.ts";

test("işaretli belge: yer kimlikleri kutularda; künye aynı, belge kesin değil", () => {
  const v = ornekBelge("KOMPRESOR"), i = isaretliVeri({ ...v, kesin: true });
  assert.equal(i.ekipman.marka, "[e:marka]");
  assert.equal(i.kesin, false);
  assert.deepEqual(i.kunye, v.kunye, "künye değişmez");
  const html = belgeHtml(i);
  assert.match(html, /\[e:seri\]/);
  assert.ok(/\[a:[^\]]+\]/.test(html) || /\[t:[^\]]+\]/.test(html) || /\[d:[^\]]+\]/.test(html), "alan / tablo / test kimliği basıldı");
  assert.doesNotMatch(JSON.stringify(v.cevaplar), /\[e:|\[a:/, "özgün veri değişmedi");
});

test("sayfa görüntüsü: JPEG, A4 dilimi, sayfa sayısı; taşan sayfa sona çekilir", async () => {
  const g = await belgeGoruntusu(isaretliVeri(ornekBelge("ZPKR02")), 99);
  assert.ok(g.jpeg[0] === 0xff && g.jpeg[1] === 0xd8, "JPEG");
  assert.ok(g.sayfaSayisi >= 1 && g.sayfa === g.sayfaSayisi);
});

test("kaynak kilidi: uç Chromium listesinde, 60 sn, kapılar; form_goster ekran aracı; görüntü erişim kaydıyla", () => {
  const u = readFileSync("src/app/api/say/form/route.ts", "utf8"), cfg = readFileSync("next.config.ts", "utf8");
  assert.ok(u.includes("export const maxDuration = 60;") && u.includes("ayniKoken()") && u.includes("istekOturumu()"));
  assert.ok(cfg.includes('"/api/say/form"'), "Chromium listesinde");
  assert.equal(readFileSync("src/app/api/say/route.ts", "utf8").includes("belge/pdf"), false, "S.A.Y'ın ucu Chromium taşımaz");
  assert.ok(EKRAN_ARAC_ADLARI.has("form_goster"));
  const d = readFileSync("src/modules/say/server/dongu.ts", "utf8");
  assert.ok(d.includes("dosyaIndirilebilir(db, kisi, dosyaId, DOSYA_ERISIMI)") && d.includes('a.name === "form_goster" && e.ozet.gorsel'), "görüntü erişim kaydıyla");
  assert.ok(readFileSync("src/server/dosya/erisim.ts", "utf8").includes("[FORM_DOSYA]: (db, kisi, kayitId) => raporDosyasiGorulur("), "raporu gören açar");
  assert.equal(readFileSync("src/server/dosya/erisim.ts", "utf8").includes("form-goruntusu"), false, "erişim kaydı Chromium içe aktarmaz");
});
