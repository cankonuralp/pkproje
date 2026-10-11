/* NEREDEN GELDİ: 492 — reisim 2026-10-11, hata listesi 9: "hayır böyle olmaz kayıttan geliyor diye değiştirilemez olmasın kayıttan gelenlerde
   değiştirilebilir olsun sadece sgk no ve isg katip no değiştirilemez olsun ve format yapıcıda bu belirlenebilir olsun belki başka bir firma onuda
   değiştirilebilir isteyecek". Saf işlevler (src/format/kunye.ts): denetçinin raporda değiştirdiği künye bilgisi geçerli olur (kayıt değişmez),
   formatın kilitli bilgisi (verilmemişse SGK ve İSG-KATİP) değişmez — ekranda girdi yok, sunucu reddeder; format güncellenince yeni sürümde
   kilitlenenin değişikliği düşer; planlamacının yeni künyesi gelince değişen bilgininki düşer. Kurucuda kilit (kurucu.ts kunyeKilitYaz), sürüm
   farkında satır (fark.ts), belgede (PDF) geçerli künye. Sunucuda gerçek PostgreSQL'le: tests/raporlar.test.ts "künye düzeltme". Olumsuz kanıt:
   tests/bozan/kunye.bozan.ts, tests/bozan/raporlar.bozan.ts (8). Tarayıcıda: e2e/saha-raporu.spec.ts, e2e/rapor-format.spec.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { raporBelgesi } from "../src/belge/belge.ts";
import { ornekBelge } from "../src/belge/ornek.ts";
import { gecerliKunye, kilitliKunye, kunyeFarkTemizle, kunyeKilitHatalari, kunyeKilitTemizle, metotMetni } from "../src/format/kunye.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { Cevaplar, FormatTanimi, VARSAYILAN_KILITLI } from "../src/format/tanim.ts";
import { surumFarki } from "../src/modules/rapor-format/fark.ts";
import { kunyeKilitYaz } from "../src/modules/rapor-format/kurucu.ts";

const T = SABLONLAR.KOMPRESOR.tanim;
const KOPYA = { firmaAdi: "Deneme Sanayi A.Ş.", adres: "Deneme Cad. 1", sgk: "1".repeat(26), isgNo: "ISG-1", eposta: "iletisim@deneme.example", tel: "0 000 000 00 00" };

test("kilit: verilmemişse SGK ve İSG-KATİP; formatta yazılırsa o; boş liste hepsini açar; şema bilinmeyen bilgiyi kabul etmez", () => {
  assert.deepEqual([...kilitliKunye(T)], ["sgk", "isg"]);
  assert.deepEqual([...VARSAYILAN_KILITLI], ["sgk", "isg"]);
  assert.deepEqual([...kilitliKunye({ gorunum: { ...T.gorunum, kilitli: ["firma"] } })], ["firma"]);
  assert.equal(kilitliKunye({ gorunum: { ...T.gorunum, kilitli: [] } }).size, 0);
  assert.equal(FormatTanimi.safeParse({ ...T, gorunum: { ...T.gorunum, kilitli: ["rapor_no"] } }).success, false, "rapor no künye değil — kilitlenemez de açılamaz da");
});

test("geçerli künye: değiştirilen bilgi geçer, değiştirilmeyen kayıttan; kilitli bilginin değişikliği yok sayılır; boş yazılan boş (firma adı boş olamaz)", () => {
  const metot = metotMetni(T, ["TS EN 286-1"]);
  assert.equal(metot, [...T.gorunum.dayanak, "TS EN 286-1"].join(" · "));
  const k = gecerliKunye(KOPYA, metot, { firma: "Düzeltilmiş Ünvan", adres: "", sgk: "9999", metot: "Üretici talimatı" }, kilitliKunye(T));
  assert.deepEqual(k, { firma: "Düzeltilmiş Ünvan", adres: null, sgk: KOPYA.sgk, isg: "ISG-1", eposta: KOPYA.eposta, tel: KOPYA.tel, metot: "Üretici talimatı" });
  const acik = gecerliKunye(KOPYA, metot, { sgk: "9999" }, new Set());
  assert.equal(acik.sgk, "9999", "kilit açılınca SGK da değişir");
  assert.equal(Cevaplar.safeParse({ kunye: { firma: "  " } }).success, false, "firma adı boş olamaz");
  assert.deepEqual(Cevaplar.parse({}).kunye, {}, "eski raporun cevaplarında künye değişikliği yok");
});

test("sunucu denetimi: kilitli bilgiye yazılan değişiklik alan hatası (ekranda girdisi yok); açık bilgide hata yok", () => {
  assert.deepEqual(kunyeKilitHatalari(T, { sgk: "9", isg: "X", firma: "Y" }), {
    "cevaplar.kunye.sgk": "SGK DETSİS NO bu formatta sahada değiştirilmez.",
    "cevaplar.kunye.isg": "İSG-KATİP SÖZLEŞME ID bu formatta sahada değiştirilmez.",
  });
  assert.deepEqual(kunyeKilitHatalari({ gorunum: { ...T.gorunum, kilitli: [] } }, { sgk: "9" }), {});
});

test("format güncellenince yeni sürümde kilitlenenin değişikliği düşer; planlamacının yeni künyesi gelince değişen bilgininki düşer", () => {
  assert.deepEqual(kunyeKilitTemizle({ firma: "A", tel: "1", sgk: "9" }, { gorunum: { ...T.gorunum, kilitli: ["tel", "sgk"] } }), { firma: "A" });
  const yeni = { ...KOPYA, adres: "Başka Cad. 9" };
  assert.deepEqual(kunyeFarkTemizle({ firma: "Düzeltilmiş", adres: "Elle adres" }, KOPYA, yeni), { firma: "Düzeltilmiş" });
  assert.deepEqual(kunyeFarkTemizle({ firma: "Düzeltilmiş" }, KOPYA, { ...KOPYA, firmaAdi: "Yeni Ünvan" }), {});
});

test("kurucu: kilit basınca kilitlenir, yeniden basınca açılır; sürüm farkı söyler", () => {
  const ac = kunyeKilitYaz(T, "sgk", false);
  assert.deepEqual(ac.gorunum.kilitli, ["isg"]);
  const kilitle = kunyeKilitYaz(ac, "firma", true);
  assert.deepEqual(kilitle.gorunum.kilitli, ["firma", "isg"], "sıra KUNYE_ALANLARI sırası");
  assert.ok(FormatTanimi.safeParse(kilitle).success);
  assert.ok(surumFarki(T, kilitle).some((f) => f.metin === "Sahada değiştirilemeyen künye bilgileri: SGK DETSİS NO, İSG-KATİP SÖZLEŞME ID → Firma adı, İSG-KATİP SÖZLEŞME ID"));
  assert.ok(!surumFarki(T, T).some((f) => f.metin.startsWith("Sahada değiştirilemeyen")));
});

test("belge (PDF): denetçinin değiştirdiği firma adı, adres ve metot basılır; kilitli SGK kayıttaki", () => {
  const o = ornekBelge("KOMPRESOR");
  const html = renderToStaticMarkup(raporBelgesi({
    ...o, kunye: { ...o.kunye, sgk: "1".repeat(26) },
    cevaplar: { ...o.cevaplar, kunye: { firma: "Düzeltilmiş Ünvan Ltd.", adres: "Elle Cad. 7", metot: "Elle yazılan metot", sgk: "9999" } },
  }) as never);
  assert.match(html, /Düzeltilmiş Ünvan Ltd\./);
  assert.match(html, /Elle Cad\. 7/);
  assert.match(html, /Elle yazılan metot/);
  assert.ok(!html.includes(o.kunye.firmaAdi), "kayıttaki firma adı basılmadı");
  assert.ok(html.includes("1".repeat(26)) && !html.includes("9999"), "kilitli SGK kayıttaki");
});
