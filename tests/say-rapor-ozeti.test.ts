/* NEREDEN GELDİ: 384 — S.A.Y serbest sorusunda açık raporun özeti (ARKA-UC §5.3 "Ne bilir: o raporun alanları, türün kriterleri ve formatı"; §5.4
   "gönderilen veri en aza: müşteri unvanı, adres, kişi adı … gönderilmez"). Saf, ZPKR02 şablonuyla: özet yalnız formatın adları (madde, test
   değeri, bölüm), seçenekler ve sayılar; kusur açıklaması / not, bilgi alanlarının değerleri, ölçüm satırının kullanıcı yazdığı etiketi ve yorum
   GİTMEZ; şemaya uymayan cevap özet üretmez; liste uzunluğu sınırlı. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { raporOzeti } from "../src/modules/say/rapor-ozeti.ts";

const T = SABLONLAR.ZPKR02.tanim;
const maddeler = T.bolumler.flatMap((b) => (b.blok === "liste" ? b.gruplar.flatMap((g) => g.maddeler) : []));

test("özet formatın adlarıyla: uygun değil maddeler, sınır dışı test / ölçüm, boş alanlar, sonuç; serbest metin ve künye yok", () => {
  const c = {
    alan: { kurulus: "Gizli Sanayi Kuruluşu", gerilim: "Seri-12345" },
    madde: { [maddeler[0].id]: { c: "Uygun değil", not: "Ahmet Bey'in odasındaki kablo" }, [maddeler[1].id]: { c: "Uygun" } },
    tablo: { pd: [{ yer: "Müdür odası (gizli)", kesit: "2", tkesit: "6" }] },
    deger: { zx: "5" },
    yorum: "Gizli yorum metni",
    sonuc: "uygun",
  };
  const o = raporOzeti(T, "Elektrik iç tesisatı", c)!;
  assert.ok(o, "özet üretildi");
  assert.match(o, /^Ekipman türü: Elektrik iç tesisatı\. Formatın bölümleri: Firma bilgileri, Ekipman bilgileri, /);
  assert.match(o, new RegExp(`Kontrol maddeleri: 2 / ${maddeler.length} cevaplandı\\.`));
  assert.ok(o.includes(`“Uygun değil” işaretli maddeler: Gözle kontrol › ${maddeler[0].metin}.`), o);
  assert.match(o, /Sınır dışı ölçüm \/ test: [^\n]*Potansiyel dengeleme · 1\. satır/);
  assert.match(o, /Boş zorunlu alanlar \(\d+\): /);
  assert.match(o, /Sonuç: Uygun; kriterlere göre öneri: Uygun değil\./);
  for (const gizli of ["Gizli Sanayi", "Seri-12345", "Ahmet", "Müdür odası", "Gizli yorum"]) assert.ok(!o.includes(gizli), `${gizli} gitmez`);
});

test("şemaya uymayan cevap özet üretmez; uzun listeler kısalır", () => {
  assert.equal(raporOzeti(T, "Tür", { madde: "bozuk" }), null);
  assert.equal(raporOzeti(T, "Tür", null), null);
  const hepsi = Object.fromEntries(maddeler.map((m) => [m.id, { c: "Uygun değil" }]));
  const o = raporOzeti(T, "Tür", { madde: hepsi })!;
  assert.ok(maddeler.length > 15);
  assert.match(o, new RegExp(`… ve ${maddeler.length - 15} tane daha`));
});
