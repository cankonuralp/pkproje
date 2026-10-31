/* NEREDEN GELDİ: 2026-10-31, K1 + K1b (sunum "S.A.Y'a tam yetenek", reisim: "Önerdiğin gibi onay"). 2026-10-28 canlı denemede aynı araç çağrısına
   iki sonuç yazıldı (gerçek sonuç + "iş yarıda bırakıldı"), hizmet sonraki her isteği reddetti, ret hata kaydına düşmedi. Bu kilit tutar:
   (1) bozuk konuşma okurken onarılır (fazla / öksüz sonuç düşer, sonuçsuz çağrı kapanır, yanlış iletideki sonuç yerine taşınır), sağlam konuşma AYNEN
   döner (önbellek bozulmaz), sondaki açık çağrılara dokunulmaz; (2) yalnız hâlâ açık çağrının sonucu yazılır; (3) konuşmaya yazan yollar kilitli,
   döngü onarımı ve yapay zekâ reddini hata kaydına yazar (kaynak kilidi). Olumsuz kanıt: tests/bozan/say-butunluk.bozan.ts. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { acikSonuclar, konusmaDuzelt, type KonusmaMesaji } from "../src/server/yz/konusma-denetim.ts";

const Y = "YARIDA";
const cagri = (...idler: string[]): KonusmaMesaji => ({ role: "assistant", content: [{ type: "thinking", thinking: "…", signature: "s" }, ...idler.map((id) => ({ type: "tool_use", id, name: "islem", input: {} }))] });
const sonuc = (id: string, s = "tamam") => ({ type: "tool_result", tool_use_id: id, content: s });
const yazi = (t: string) => ({ type: "text", text: t });

export const SAGLAM: KonusmaMesaji[] = [
  { role: "user", content: [yazi("raporları hazırla")] }, { role: "system", content: "Kullanıcı şu sayfada: Planlar." },
  cagri("a1", "a2"), { role: "user", content: [sonuc("a1"), sonuc("a2")] },
  { role: "assistant", content: [yazi("Bitti.")] }, { role: "user", content: [yazi("teşekkürler")] },
];
/* 2026-10-28'deki bozukluk: gerçek sonuç (sıra 100), ardından aynı çağrıya "yarıda" + yeni soru (sıra 101) */
export const BOZUK: KonusmaMesaji[] = [
  { role: "user", content: [yazi("fotoğrafları incele")] }, cagri("t1"),
  { role: "user", content: [sonuc("t1", "ekipman listesi")] },
  { role: "user", content: [sonuc("t1", Y), yazi("devam et")] }, { role: "system", content: "Kullanıcı şu sayfada: Planlar." },
];

test("sağlam konuşma aynen döner; düzeltme yok", () => {
  const d = konusmaDuzelt(SAGLAM, Y);
  assert.deepEqual(d.duzeltmeler, []);
  assert.deepEqual(d.mesajlar, SAGLAM);
});

test("aynı çağrıya iki sonuç: ilki kalır, fazlası düşer, sorunun yazısı kalır", () => {
  const d = konusmaDuzelt(BOZUK, Y);
  assert.deepEqual(d.duzeltmeler, ["1 fazla sonuç düştü"]);
  assert.deepEqual(d.mesajlar[2], { role: "user", content: [sonuc("t1", "ekipman listesi")] });
  assert.deepEqual(d.mesajlar[3], { role: "user", content: [yazi("devam et")] });
  const say = d.mesajlar.flatMap((m) => (Array.isArray(m.content) ? m.content : [])).filter((b) => (b as { type?: string }).type === "tool_result").length;
  assert.equal(say, 1);
  assert.deepEqual(konusmaDuzelt(BOZUK, Y), d, "belirlenimli");
});

test("öksüz sonuç düşer; boşalan ileti çıkar", () => {
  const d = konusmaDuzelt([{ role: "user", content: [sonuc("x")] }, { role: "user", content: [yazi("merhaba")] }, cagri("b1"), { role: "user", content: [sonuc("b1"), sonuc("yok")] }], Y);
  assert.deepEqual(d.duzeltmeler, ["2 öksüz sonuç düştü"]);
  assert.equal(d.mesajlar.length, 3);
  assert.deepEqual(d.mesajlar[2], { role: "user", content: [sonuc("b1")] });
});

test("sonuçsuz çağrı kapanır; yanlış iletideki sonuç ilk kullanıcı iletisine taşınır", () => {
  const d = konusmaDuzelt([cagri("c1", "c2"), { role: "user", content: [yazi("dur")] }, { role: "user", content: [sonuc("c1")] }], Y);
  assert.deepEqual(d.duzeltmeler, ["1 sonuçsuz çağrı kapandı", "1 sonuç yerine taşındı"]);
  assert.deepEqual(d.mesajlar[1], { role: "user", content: [sonuc("c1"), { type: "tool_result", tool_use_id: "c2", content: Y, is_error: true }, yazi("dur")] });
  assert.equal(d.mesajlar.length, 2);
});

test("ardında kullanıcı iletisi olmayan çağrı yapay zekâ iletisinden önce kapanır; sondaki açık çağrıya dokunulmaz", () => {
  const d = konusmaDuzelt([cagri("d1"), { role: "assistant", content: [yazi("…")] }], Y);
  assert.deepEqual(d.mesajlar[1], { role: "user", content: [{ type: "tool_result", tool_use_id: "d1", content: Y, is_error: true }] });
  const s = konusmaDuzelt([{ role: "user", content: [yazi("x")] }, cagri("e1")], Y);
  assert.deepEqual(s.duzeltmeler, []);
});

test("yalnız açık çağrıların sonucu yazılır", () => {
  assert.deepEqual(acikSonuclar(cagri("f1").content, { f1: "a", f2: "b" }), [["f1", "a"]]);
  assert.deepEqual(acikSonuclar([yazi("bitti")], { f1: "a" }), []);
});

test("kaynak kilidi: yazan yollar kilitli; döngü onarır ve reddi hata kaydına yazar", () => {
  const dongu = readFileSync("src/modules/say/server/dongu.ts", "utf8"), say = readFileSync("src/modules/say/server/say.ts", "utf8");
  assert.equal((dongu.match(/await konusmaKilidi\(db\)/g) ?? []).length, 5, "sonuç, yapay zekâ iletisi, sunucu sonuçları, bitiş denetimi notu, bildirim notu (2026-10-31 V21 madde 7)");
  assert.ok(/kullaniciIletisiEkle[^{]*\{\s*await konusmaKilidi\(db\);/.test(say), "kullanıcı iletisi kilitli");
  assert.ok(dongu.includes("konusmaDuzelt((await konusmaOku(db))"), "istekten önce onarım");
  assert.ok(dongu.includes('"say.konusma"') && dongu.includes('"say.istek"'), "onarım ve ret hata kaydına");
  assert.ok(dongu.includes("acikSonuclar(son.icerik, r.sonuclar)"), "yalnız açık çağrıya sonuç");
});
