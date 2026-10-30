/* NEREDEN GELDİ: 2026-10-31, kalem 5 — E5 (sunum "S.A.Y'a tam yetenek", reisim: "Önerdiğin gibi onay"). Talimat her hataya yeni örnekle yamalanıyordu; iş bilgisi
   becerilere (B01–B11, kaynak klasöründen AYNEN) taşınır, talimata yalnız dizin girer. Bu kilit tutar: (1) ön bilgi geçerli, ad ve kod tekil, 11 beceri;
   (2) dizin talimatta, metin talimatta DEĞİL (önbellek ve bağlam şişmez); (3) beceri_oku tam metni verir, bilinmeyende dizin; (4) becerilerde gerçek veri
   yok (uzun numara, e-posta, telefon); (5) yayında dosyalar S.A.Y'ın ucunun izinde. Olumsuz kanıt: tests/bozan/say-beceri.bozan.ts. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { beceriCoz, beceriDizini, beceriMetni, becerileriOku } from "../src/modules/say/beceriler.ts";
import { saySistemi } from "../src/server/yz/say.ts";

const L = becerileriOku();

test("11 beceri, ön bilgi geçerli, ad ve kod tekil, sıra dosya adıyla", () => {
  assert.deepEqual(L.map((b) => b.kod), ["B01", "B02", "B03", "B04", "B05", "B06", "B07", "B08", "B09", "B10", "B11"]);
  assert.equal(L[0]!.ad, "saha-notlarindan-plan-raporlari");
  assert.equal(L[10]!.ad, "belgeden-kayit");
  assert.throws(() => beceriCoz("B99-x.md", "ön bilgi yok"));
  assert.throws(() => beceriCoz("B99-x.md", "---\nad: x\n---\nmetin"), /eksik/);
});

test("talimatta dizin var, metin yok; dizin her çağrıda aynı", () => {
  const d = beceriDizini(L), t = saySistemi([], "", d);
  assert.ok(t.includes("beceri_oku ile oku") && t.includes("- B05 rapor-doldurma-kurallari:"));
  assert.ok(!t.includes(L[4]!.metin.slice(0, 200)), "beceri metni talimata gömülmez");
  assert.equal(beceriDizini(becerileriOku()), d);
  assert.equal(saySistemi([], ""), saySistemi([], "", ""), "dizinsiz talimat eskisi gibi");
});

test("beceri_oku: ad ya da kodla tam metin; bilinmeyende dizin", () => {
  assert.equal(beceriMetni(L, "B03"), L[2]!.metin);
  assert.equal(beceriMetni(L, "etiket-ve-levha-okuma"), L[2]!.metin);
  assert.match(beceriMetni(L, "yok"), /^Böyle bir beceri yok: "yok"\. Beceriler:\n- B01 /);
});

test("becerilerde gerçek veri yok; yayında dosyalar S.A.Y'ın ucunun izinde; döngü becerileri yükler", () => {
  for (const b of L) {
    assert.doesNotMatch(b.metin, /\d{10,}|[\w.-]+@[\w-]+\.[a-z]{2,}|\b0?5\d{2}[ -]?\d{3}[ -]?\d{2}[ -]?\d{2}\b|QA-\d/, `${b.kod}: gerçek veriye benzer`);
  }
  assert.ok(readFileSync("next.config.ts", "utf8").includes('"/api/say": ["./src/modules/say/beceriler/*.md"]'));
  const d = readFileSync("src/modules/say/server/dongu.ts", "utf8");
  assert.ok(d.includes("saySistemi(SAY_KILAVUZU, ISLEM_DIZINI, beceriDizini(BECERILER))") && d.includes('c.name === "beceri_oku"'));
});
