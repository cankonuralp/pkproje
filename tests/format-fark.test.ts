/* NEREDEN GELDİ: 471 (reisim 2026-10-10, maket kararı k5 "evet": sürüm sayfasında önceki sürüme göre değişenler) + 472 (saha ekranının kullanım
   özeti, örnek raporun başlangıç cevapları). Saf işlevler (veritabanısız): src/modules/rapor-format/fark.ts surumFarki — öğeler kimlikle eşlenir
   (ad değişse de aynı öğe), çıkarılan bölümün öğeleri ayrıca sayılmaz; kullanim.ts; raporlar/ornek.ts ilkCevaplar / cevaplariTamamla /
   ornekSahaRaporu. Olumsuz kanıt tests/bozan/format-fark.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { FormatTanimi } from "../src/format/tanim.ts";
import { surumFarki } from "../src/modules/rapor-format/fark.ts";
import { kullanim } from "../src/modules/rapor-format/kullanim.ts";
import { bolumAdi, bolumSil, cevaplarYaz, gorunumYaz, maddeEkle, ogeSil, ogeYaz, yeniBolum } from "../src/modules/rapor-format/kurucu.ts";
import { cevaplariTamamla, ilkCevaplar, ornekSahaRaporu } from "../src/modules/raporlar/ornek.ts";

const zpkr02 = () => structuredClone(SABLONLAR.ZPKR02.tanim);
const metinler = (t0: FormatTanimi, t1: FormatTanimi) => surumFarki(t0, t1).map((x) => `${x.tur}: ${x.metin}`);

test("aynı tanım: fark yok", () => {
  assert.deepEqual(surumFarki(zpkr02(), zpkr02()), []);
});

test("bölüm eklendi / çıkarıldı / adı değişti; çıkarılan bölümün öğeleri ayrıca sayılmaz", () => {
  const t0 = zpkr02();
  const liste = t0.bolumler.findIndex((b) => b.blok === "liste");
  const ad = t0.bolumler[liste].ad;
  let t1 = bolumAdi(t0, liste, "Yeni ad");
  t1 = { ...t1, bolumler: [...t1.bolumler, yeniBolum(t1, "not", "Ek yorum")] };
  const m = metinler(t0, t1);
  assert.ok(m.includes(`degis: Bölüm adı: “${ad}” → “Yeni ad”`), m.join("\n"));
  assert.ok(m.includes("ekle: Bölüm eklendi: “Ek yorum” (Not / yorum)"), m.join("\n"));
  const t2 = bolumSil(t0, liste);
  const m2 = metinler(t0, t2);
  assert.deepEqual(m2.filter((x) => x.startsWith("cikar")), [`cikar: Bölüm çıkarıldı: “${ad}”`]);
});

test("öğe: kimlikle eşlenir — ad değişti, ayar değişti, eklendi, çıkarıldı; cevap seti; kural; görünüm", () => {
  const t0 = zpkr02();
  const i = t0.bolumler.findIndex((b) => b.blok === "liste");
  const b = t0.bolumler[i];
  assert.ok(b.blok === "liste");
  const [m1, m2] = b.gruplar.flatMap((g) => g.maddeler);
  let t1 = ogeYaz(t0, i, m1.id, { ad: "Değişen madde" });
  t1 = ogeYaz(t1, i, m2.id, { std: "TS 0000" });
  t1 = maddeEkle(t1, i, b.gruplar[0].id, "Eklenen madde");
  const silinen = b.gruplar.flatMap((g) => g.maddeler)[2];
  t1 = ogeSil(t1, i, silinen.id);
  t1 = cevaplarYaz(t1, i, ["Evet", "Hayır"]);
  t1 = { ...t1, kurallar: { ...t1.kurallar, foto: !t1.kurallar.foto } };
  t1 = gorunumYaz(t1, { formKodu: "XX-01", cevap: "tus" });
  const m = metinler(t0, t1);
  const beklenen = [
    `degis: Madde (${b.ad}): “${m1.metin}” → “Değişen madde”`,
    `degis: Madde ayarları değişti (${b.ad}): “${m2.metin}”`,
    `ekle: Madde eklendi (${b.ad}): “Eklenen madde”`,
    `cikar: Madde çıkarıldı (${b.ad}): “${silinen.metin}”`,
    `degis: Cevap seti (${b.ad}): ${b.cevaplar.join(" / ")} → Evet / Hayır`,
    `degis: Kural: “Uygun değil” maddede fotoğraf zorunlu — ${t1.kurallar.foto ? "açıldı" : "kapandı"}`,
    `degis: Doküman kodu: “${t0.gorunum.formKodu || "—"}” → “XX-01”`,
    "degis: Madde cevabı: Açılır liste → Yan yana tuşlar",
  ];
  for (const x of beklenen) assert.ok(m.includes(x), `${x}\n— bulunan:\n${m.join("\n")}`);
  /* m1'in yalnız adı değişti: ayar satırı yok */
  assert.ok(!m.some((x) => x.includes(`ayarları değişti (${b.ad}): “Değişen madde”`)));
});

test("sıra değişince tek satır", () => {
  const t0 = zpkr02();
  const t1 = { ...t0, bolumler: [t0.bolumler[1], t0.bolumler[0], ...t0.bolumler.slice(2)] };
  assert.deepEqual(metinler(t0, t1), ["degis: Bölümlerin sırası değişti"]);
});

test("kullanım özeti: bölüm, madde sayısı, dokunuş (açılır liste 2, tuş 1), yazılan / seçilen kutu, ölçüm tabloları", () => {
  const t = zpkr02();
  const k = kullanim(t);
  const madde = t.bolumler.reduce((n, b) => n + (b.blok === "liste" ? b.gruplar.reduce((x, g) => x + g.maddeler.length, 0) : 0), 0);
  assert.equal(k.madde, madde);
  assert.ok(k.madde > 0);
  assert.deepEqual([k.acilir, k.tus], [madde * 2, madde]);
  assert.ok(k.bolum > 2 && k.bolum <= t.bolumler.length + 2);
  assert.deepEqual(k.tablolar.map((x) => x.ad), t.bolumler.filter((b) => b.blok === "olcum").map((b) => b.ad));
});

test("örnek rapor: maddeler ilk cevapla; kurucuda eklenen maddeye ilk cevap, çıkarılanın cevabı düşer; uydurma künye, kaydedilmez", () => {
  const t0 = zpkr02();
  const c = ilkCevaplar(t0);
  const i = t0.bolumler.findIndex((b) => b.blok === "liste");
  const b = t0.bolumler[i];
  assert.ok(b.blok === "liste");
  const ilk = b.gruplar[0].maddeler[0];
  assert.equal(c.madde[ilk.id].c, b.cevaplar[0]);
  const degisen = { ...c, madde: { ...c.madde, [ilk.id]: { c: b.cevaplar[1], not: "kusur" } } };
  const t1 = ogeSil(maddeEkle(t0, i, b.gruplar[0].id, "Yeni"), i, b.gruplar[0].maddeler[1].id);
  const yeni = cevaplariTamamla(t1, degisen);
  assert.deepEqual(yeni.madde[ilk.id], { c: b.cevaplar[1], not: "kusur" });
  assert.equal(yeni.madde[b.gruplar[0].maddeler[1].id], undefined);
  const eklenen = t1.bolumler[i].blok === "liste" ? t1.bolumler[i].gruplar[0].maddeler.at(-1)! : null;
  assert.equal(yeni.madde[eklenen!.id].c, b.cevaplar[0]);
  const v = ornekSahaRaporu(t0, { id: "x", ad: "Tür", kod: "TR", brans: "e", periyot: 12, std: ["TS HD 60364-6"], cihaz: ["Ölçer"] }, "2026-10-10", { standartlar: null, kriterler: [] });
  assert.equal(v.id, "ornek");
  assert.equal(v.izin.sil, false);
  assert.equal(v.yz, false);
  assert.equal(v.tarih.bas, "2026-10-10T09:00");
  assert.match(v.kunye.eposta ?? "", /\.example$/);
  assert.equal(v.cihazlar.length, 1);
  assert.equal(v.cihazlar[0].cihaz?.bitis, "2027-10-10");
});
