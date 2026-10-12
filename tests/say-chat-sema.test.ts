/* NEREDEN GELDİ: 523 — S.A.Y Chat ayarları (pkproje §3.10 m.5–6, m.13–16; maket 521 maket-veri.js sayChatAlanlar / sayChatBasliklar / sayChatAyar,
   maket-turler.js ekran 12 — reisim 2026-10-13 "onayılıyorum, yap bitir"). Saf (src/modules/say-chat/sema.ts):
   · rapordaki alan seçenekleri: ekipman bilgileri (formatın kendi adıyla), formatın bilgi alanları ve test değerleri — formülle hesaplanan, kayıttan
     gelen (künye) ve çoklu seçim alanı yok —, Muayene uzmanı yorumu;
   · okunacak fotoğraf başlıkları: fotoğraftan doldurması açık bölümler (ölçüm tablosu; test değerleri kâğıtta kapatılmadıkça); ekipman bölümü yok;
   · hazır ayar: formatın ekipman bilgisi alanlarından (uzun ad kısaltılır) + Not; ekipman bölümü yoksa marka, model, seri, imal, konum + Not;
   · denetim: ad dolu ve kısa, alan formatta ve tekil, hazır değer kısa, en az 1 en çok 30 satır; başlık formatta ve tekil; kayıtlı ayar formata göre
     süzülür (düşen sayılır);
   · dağılım (m.5): n. satır n. madde; "-" ya da boş = bilinmiyor; fazla satırlar yoruma; not → yorum. Olumsuz kanıt: tests/bozan/say-chat-sema.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { FormatTanimi } from "../src/format/tanim.ts";
import { AD_EN_COK, chatAlanlari, chatBasliklari, dagit, hazirTanim, SATIR_EN_COK, tanimDenetle, tanimiSuz, type ChatTanimi } from "../src/modules/say-chat/sema.ts";

const T = (k: keyof typeof SABLONLAR) => FormatTanimi.parse(SABLONLAR[k].tanim);
const IC = T("ZPKR02"), KREN = T("ZPKR06");
const neden = (x: ReturnType<typeof tanimDenetle>) => (x.durum === "hata" ? x.hata : null);

test("rapordaki alanlar: ekipman bilgileri, bilgi alanları, test değerleri, yorum; formül / künye / çoklu yok", () => {
  const l = chatAlanlari(IC), k = l.map(([x]) => x);
  assert.deepEqual(k.slice(0, 7), ["e:marka", "e:model", "e:seri", "e:imal", "e:konum", "e:amac", "e:bolum"]);
  assert.equal(l.at(-1)?.[0], "yorum");
  assert.equal(l.at(-1)?.[1], "Muayene uzmanı yorumu");
  for (const b of IC.bolumler) {
    if (b.blok === "test") for (const d of b.degerler) assert.equal(k.includes(`d:${d.id}`), !d.formul, `test değeri ${d.ad}`);
    if (b.blok === "bilgi") for (const a of b.alanlar) assert.equal(k.includes(`a:${a.id}`), !a.ekipman && !a.kaynak && !a.formul && a.tur !== "coklu", `alan ${a.ad}`);
  }
  assert.ok(l.some(([x, ad]) => x.startsWith("d:") && ad.startsWith("Fonksiyon")), "ZPKR02 test değerleri bölüm adıyla");
  /* tam ekipman bölümünde ekipman alanının adı formatın adı */
  assert.equal(chatAlanlari(KREN).find(([x]) => x === "e:marka")?.[1], "Ekipman bilgileri › Markası/Modeli");
  assert.deepEqual(chatAlanlari(null).map(([x]) => x), ["e:marka", "e:model", "e:seri", "e:imal", "e:konum", "e:amac", "e:bolum", "yorum"]);
});

test("okunacak başlıklar: yalnız fotoğraftan doldurması açık bölümler; ekipman bölümü yok; kâğıtta açılan test gelir", () => {
  assert.deepEqual(chatBasliklari(IC).map(([k, , ne]) => [k, ne]), [["linye", "ölçüm tablosu"], ["pd", "ölçüm tablosu"], ["zi", "ölçüm tablosu"]]);
  assert.deepEqual(chatBasliklari(KREN), [], "kule kren: ölçüm tablosu ve test bölümü yok");
  assert.deepEqual(chatBasliklari(null), []);
  const degisik = { ...IC, bolumler: IC.bolumler.map((b) => (b.blok === "test" ? { ...b, doldur: { foto: true, excel: false } } : b.blok === "olcum" && b.id === "zi" ? { ...b, doldur: { foto: false, excel: true } } : b)) } as FormatTanimi;
  assert.deepEqual(chatBasliklari(degisik).map(([k, , ne]) => [k, ne]), [["fonk", "test değerleri"], ["linye", "ölçüm tablosu"], ["pd", "ölçüm tablosu"]]);
});

test("hazır ayar: formatın ekipman alanlarından + Not (uzun ad kısaltılır); ekipman bölümsüz formatta beş alan + Not; başlıklar açık", () => {
  const h = hazirTanim(IC);
  assert.deepEqual(h.satirlar.map((s) => [s.ad, s.alan, s.hazir]), [["Marka", "e:marka", ""], ["Model", "e:model", ""], ["Seri no", "e:seri", ""], ["İmal yılı", "e:imal", ""],
    ["Kullanım yeri", "e:konum", ""], ["Not", "yorum", ""]]);
  assert.deepEqual(h.okunacak, [{ k: "linye", acik: true }, { k: "pd", acik: true }, { k: "zi", acik: true }]);
  const k = hazirTanim(KREN);
  assert.equal(k.satirlar[1].alan, "e:marka");
  assert.equal(k.satirlar.at(-1)?.alan, "yorum");
  assert.ok(k.satirlar.every((s) => s.ad.length <= AD_EN_COK), "uzun ad kısaltıldı");
  assert.equal(tanimDenetle(KREN, k).durum, "tamam", "hazır ayar kendi denetiminden geçer");
  assert.equal(tanimDenetle(IC, h).durum, "tamam");
  assert.deepEqual(hazirTanim(null).satirlar.map((s) => s.alan), ["e:marka", "e:model", "e:seri", "e:imal", "e:konum", "yorum"]);
});

test("denetim: boş / uzun ad, seçilmemiş / formatta olmayan / tekrar alan, uzun hazır değer, satır sayısı, geçersiz başlık; temizler", () => {
  const s = (ad: string, alan: string, hazir = "") => ({ ad, alan, hazir });
  const tamam = tanimDenetle(IC, { satirlar: [s("  Marka  ", "e:marka"), s("Şebeke   gerilimi", "yorum", " 220 V ")], okunacak: [{ k: "linye", acik: false }] });
  assert.deepEqual(tamam, { durum: "tamam", tanim: { satirlar: [s("Marka", "e:marka"), s("Şebeke gerilimi", "yorum", "220 V")], okunacak: [{ k: "linye", acik: false }] } });
  assert.deepEqual(neden(tanimDenetle(IC, { satirlar: [s("Marka", "e:marka"), s(" ", "e:model")] })), { i: 1, ne: "ad", neden: "2. satırın telefonda yazan adı boş." });
  assert.equal(neden(tanimDenetle(IC, { satirlar: [s("x".repeat(AD_EN_COK + 1), "e:marka")] }))?.ne, "ad");
  assert.deepEqual(neden(tanimDenetle(IC, { satirlar: [s("Marka", "")] })), { i: 0, ne: "alan", neden: "1. satırın rapordaki alanı seçilmedi." });
  assert.match(neden(tanimDenetle(IC, { satirlar: [s("X", "a:olmayan")] }))!.neden, /formatta yok/);
  const kunye = IC.bolumler.flatMap((x) => (x.blok === "bilgi" ? x.alanlar : [])).find((x) => x.kaynak);
  assert.ok(kunye, "ZPKR02'de kayıttan gelen alan var");
  assert.match(neden(tanimDenetle(IC, { satirlar: [s("Kod", `a:${kunye!.id}`)] }))!.neden, /formatta yok/, "kayıttan gelen (künye) alan seçilemez");
  assert.match(neden(tanimDenetle(IC, { satirlar: [s("A", "e:marka"), s("B", "e:marka")] }))!.neden, /başka bir satırda/);
  assert.equal(neden(tanimDenetle(IC, { satirlar: [s("A", "e:marka", "x".repeat(41))] }))?.ne, "hazir");
  assert.match(neden(tanimDenetle(IC, { satirlar: [] }))!.neden, /En az bir/);
  assert.match(neden(tanimDenetle(IC, { satirlar: Array.from({ length: SATIR_EN_COK + 1 }, (_, i) => s(`S${i}`, "yorum")) }))!.neden, /En çok 30/);
  assert.equal(neden(tanimDenetle(IC, { satirlar: [s("A", "e:marka")], okunacak: [{ k: "nokta", acik: true }] }))?.ne, "okunacak", "başka formatın başlığı");
  assert.equal(neden(tanimDenetle(IC, { satirlar: [s("A", "e:marka")], okunacak: [{ k: "pd", acik: true }, { k: "pd", acik: false }] }))?.ne, "okunacak");
  assert.equal(neden(tanimDenetle(IC, "bozuk"))?.ne, "satirlar");
});

test("kayıtlı ayar formata göre süzülür (formattan çıkan alan / başlık düşer, sayısı söylenir)", () => {
  const a: ChatTanimi = { satirlar: [{ ad: "Marka", alan: "e:marka", hazir: "" }, { ad: "Eski", alan: "a:silinen", hazir: "" }, { ad: "Not", alan: "yorum", hazir: "" }],
    okunacak: [{ k: "linye", acik: true }, { k: "silinen", acik: true }] };
  assert.deepEqual(tanimiSuz(IC, a), { tanim: { satirlar: [a.satirlar[0], a.satirlar[2]], okunacak: [a.okunacak[0]] }, dusen: 2 });
});

test("dağılım: n. satır n. madde; '-' ya da boş bilinmiyor; fazla satırlar yoruma; not yorum", () => {
  const t: ChatTanimi = { satirlar: [{ ad: "Marka", alan: "e:marka", hazir: "" }, { ad: "Model", alan: "e:model", hazir: "" }, { ad: "İmal yılı", alan: "e:imal", hazir: "" },
    { ad: "Şebeke gerilimi", alan: "a:gerilim", hazir: "220 V" }, { ad: "Not", alan: "yorum", hazir: "" }], okunacak: [] };
  const d = dagit(t, ["  Örnek   Elektrik ", "-", "", "220 V", "pano kapağı kilitsiz", "iç kapak yok", "  ", "—"]);
  assert.deepEqual(d.satirlar.map((x) => [x.ad, x.deger, x.bilinmiyor]), [["Marka", "Örnek Elektrik", false], ["Model", "", true], ["İmal yılı", "", true],
    ["Şebeke gerilimi", "220 V", false], ["Not", "pano kapağı kilitsiz", false]]);
  assert.deepEqual(d.fazla, ["iç kapak yok"]);
  assert.deepEqual(d.degerler, { "e:marka": "Örnek Elektrik", "a:gerilim": "220 V", yorum: "pano kapağı kilitsiz\niç kapak yok" });
  /* not boşken fazla satırlar yorum olur; kısa mesajda kalan satırlar bilinmiyor */
  assert.deepEqual(dagit(t, ["A", "B", "C", "D", "", "fazla"]).degerler.yorum, "fazla");
  assert.deepEqual(dagit(t, ["A"]).satirlar.filter((x) => x.bilinmiyor).length, 4);
});
