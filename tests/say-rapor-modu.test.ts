/* NEREDEN GELDİ: 2026-11-09 S.A.Y Chat Rapor modu (sunum claude.ai HBwuL3s9G693uopxSzTbjH K1–K6 — reisim: "eskisi gibi direk rapor oluşturma modu olsun", "Evet, önerilerle"). Saf kurallar:
   · K1: satırlar formatın ekipman bilgilerinden + Not; bölüm yoksa marka, model, seri, imal, konum + Not; kayıttan / formülden gelen alan satır olmaz;
   · n. satır n. bilgi, "-" ya da boş bilinmiyor, fazla satır nota;
   · plandaki bütün ekipman görünür; seçilemeyen nedeniyle; kişinin Yeni raporu seçilir; kuyruk girdisi şemadan geçer.
   Sunucu ve rapor tests/raporlar.test.ts (PG); uçtan uca e2e/say-chat-rapor.spec.ts. Olumsuz kanıt: tests/bozan/say-rapor-modu.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import type { FormatTanimi } from "../src/format/tanim.ts";
import { dagit, ekipmanDurumu, RaporFotoGirdisi, RaporKaydiGirdisi, raporSatirlari } from "../src/modules/say-chat/rapor-modu.ts";

const P = "11111111-1111-4111-8111-111111111111";

test("K1: bölüm yoksa hazır beş satır + Not", () => {
  assert.deepEqual(raporSatirlari(null).map((s) => s.alan), ["e:marka", "e:model", "e:seri", "e:imal", "e:konum", "yorum"]);
  assert.equal(raporSatirlari({ bolumler: [] } as unknown as FormatTanimi).at(-1)!.ad, "Not");
});

test("mesaj: n. satır n. bilgi; tire ve boş bilinmiyor; fazla satır nota", () => {
  const s = [{ ad: "Marka", alan: "e:marka" }, { ad: "Seri", alan: "e:seri" }, { ad: "Not", alan: "yorum" }];
  const d = dagit(s, ["  Örnek  ", "-", "Yıpranmış", "ikinci not", "—"]);
  assert.deepEqual(d.degerler, { "e:marka": "Örnek", yorum: "Yıpranmış\nikinci not" });
  assert.deepEqual(d.satirlar.map((x) => x.deger), ["Örnek", "", "Yıpranmış"]);
  assert.deepEqual(dagit(s, []).degerler, {});
});

test("ekipman: pasif, formatsız, başkasının ya da yazılmış raporu kapalı; kendi Yeni raporu seçilir; raporsuz uygun", () => {
  const e = { id: "a", pasif: false }, r = (durum: string, benimTaslak: boolean) => [{ ekipmanId: "a", durum, benimTaslak }];
  assert.equal(ekipmanDurumu({ ...e, pasif: true }, [], true).durum, "kapali");
  assert.equal(ekipmanDurumu(e, [], false).durum, "kapali");
  assert.equal(ekipmanDurumu(e, r("taslak", false), true).neden, "Başka birinin raporu var");
  assert.equal(ekipmanDurumu(e, r("onayda", false), true).neden, "Raporu yazılmış");
  assert.equal(ekipmanDurumu(e, r("taslak", true), true).durum, "rapor");
  assert.equal(ekipmanDurumu(e, [], true).durum, "uygun");
});

test("kuyruk girdisi: alan biçimi, plan kimliği, fotoğraf rolü denetlenir", () => {
  const g = { plan: P, ekipman: { tip: "plan", id: P }, satirlar: [{ ad: "Not", alan: "yorum" }], mesaj: ["x"] };
  assert.equal(RaporKaydiGirdisi.safeParse(g).success, true);
  assert.equal(RaporKaydiGirdisi.safeParse({ ...g, satirlar: [{ ad: "x", alan: "hesap_id" }] }).success, false, "bilinmeyen alan yazılmaz");
  assert.equal(RaporKaydiGirdisi.safeParse({ ...g, ekipman: { tip: "yeni" } }).success, false);
  assert.equal(RaporKaydiGirdisi.safeParse({ ...g, plan: "x" }).success, false);
  assert.equal(RaporFotoGirdisi.safeParse({ plan: P, rol: "ekipman", ad: "a.jpg", veri: "AA" }).success, true);
  assert.equal(RaporFotoGirdisi.safeParse({ plan: P, rol: "baska", ad: "a.jpg", veri: "AA" }).success, false);
});
