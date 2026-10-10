/* NEREDEN GELDİ: RAPOR-FORMAT.md §6 Format kurucu (maket maket-kurucu.js kb-ekle / kb-yukari / kb-asagi / kb-sil / kb-alan-ekle / kb-madde-ekle /
   kb-sutun-ekle / kb-oge-sil) + §7 "cevaplar bölüm / alan kimlikleriyle saklanır, sıra değişse de bozulmaz" + §3 "Bakanlık formatlı türde zorunlu
   alanlar kilitli — silinemez". Saf düzenleme işlemleri (K4; veritabanısız): her adımdan sonra tanım şemadan geçer, yeni kimlik tekil, kilitli
   bölüm / öğe silinmez. Sunucunun taslak kaydı ve yayın engeli tests/rapor-format.test.ts. Olumsuz kanıt tests/bozan/format-kurucu.bozan.ts. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { BLOKLAR, FormatTanimi, type BolumOf } from "../src/format/tanim.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { kilitDenetimi, kilitNormallestir } from "../src/format/motor.ts";
import { bolumAdi, bolumDuzeni, bolumOgeleri, bolumSil, cevaplarYaz, gorunumYaz, grupEkle, grupSil, grupYaz, kimlikler, maddeEkle, notlarYaz, ogeEkle, ogeSil, ogeYaz, satirlar, tasi, yeniBolum, yeniKimlik } from "../src/modules/rapor-format/kurucu.ts";

const zpkr02 = () => structuredClone(SABLONLAR.ZPKR02.tanim);
const gecerli = (t: unknown) => { const r = FormatTanimi.safeParse(t); assert.ok(r.success, JSON.stringify(!r.success && r.error.issues.slice(0, 3))); };

test("her blok eklenir; yeni kimlikler tanımda tekil ve tanım şemadan geçer", () => {
  let t = zpkr02();
  const once = kimlikler(t).size;
  for (const b of BLOKLAR) t = { ...t, bolumler: [...t.bolumler, yeniBolum(t, b, `Deneme ${b}`)] };
  gecerli(t);
  assert.equal(t.bolumler.length, SABLONLAR.ZPKR02.tanim.bolumler.length + BLOKLAR.length);
  assert.ok(kimlikler(t).size > once);
  const liste = t.bolumler.at(-BLOKLAR.length + BLOKLAR.indexOf("liste"))!;
  assert.ok(liste.blok === "liste" && liste.cevaplar.length === 3 && liste.gruplar.length === 1);
  assert.notEqual(yeniKimlik(t, "b"), t.bolumler.at(-1)!.id);
});

/* 2026-10-10 (470, reisim hata listesi 38: "başlık komple silmek vb hala imkansız biraz daha serbestlik lütfen"): Bakanlık öğesi ve şablon
   sütunu da kurucudan silinir — kilit denetimi bunu "silinmiş" diye listeler, yayında UYARI olur (eskiden "silinmez" denetleniyordu) */
test("öğe ekle / sil: alan, madde (son gruba), sütun, değer; Bakanlık maddesi ve şablon sütunu da silinir, kilit denetimi listeler", () => {
  let t = zpkr02();
  t = { ...t, bolumler: [...t.bolumler, yeniBolum(t, "bilgi", "Ek bilgiler")] };
  t = { ...t, bolumler: [...t.bolumler, yeniBolum(t, "olcum", "Ek ölçüm")] };   // ekran bölümleri birer birer ekler
  const bi = t.bolumler.length - 2, oi = t.bolumler.length - 1;
  t = ogeEkle(t, bi, "  Deneme   alanı "); t = ogeEkle(t, bi, "İkinci"); t = ogeEkle(t, oi, "Direnç");
  t = ogeEkle(t, bi, "   ");
  gecerli(t);
  assert.deepEqual(bolumOgeleri(t.bolumler[bi]).map((x) => x.ad), ["Deneme alanı", "İkinci"], "ad kırpılır, boş eklenmez");
  const ilk = bolumOgeleri(t.bolumler[bi])[0].id;
  t = ogeSil(t, bi, ilk);
  assert.deepEqual(bolumOgeleri(t.bolumler[bi]).map((x) => x.ad), ["İkinci"]);
  /* kilitli: Gözle kontrol maddeleri, ölçüm noktaları sütunları */
  const gozle = t.bolumler.findIndex((b) => b.id === "gozle"), nokta = t.bolumler.findIndex((b) => b.blok === "olcum" && b.kilit);
  const madde = bolumOgeleri(t.bolumler[gozle])[0];
  assert.ok(madde.kilit);
  const md = ogeSil(t, gozle, madde.id);
  assert.equal(bolumOgeleri(md.bolumler[gozle]).length, bolumOgeleri(t.bolumler[gozle]).length - 1, "Bakanlık maddesi silindi");
  assert.ok(kilitDenetimi(md, zpkr02()).some((x) => x.includes(`silinmiş: ${madde.id}`)), "yayın denetimi silinen Bakanlık maddesini listeler");
  const sutun = bolumOgeleri(t.bolumler[nokta])[0];
  const sd = ogeSil(t, nokta, sutun.id);
  assert.equal(bolumOgeleri(sd.bolumler[nokta]).length, bolumOgeleri(t.bolumler[nokta]).length - 1, "şablon sütunu silindi");
  assert.ok(kilitDenetimi(sd, zpkr02()).some((x) => x.includes(`silinmiş: ${t.bolumler[nokta].id}.${sutun.id}`)), "yayın denetimi silinen sütunu listeler");
  /* 337–339 incelemesi: kilitli tabloya kurucuda eklenen sütun çıkarılır (şablonunki çıkmaz) */
  const t3 = ogeEkle(t, nokta, "Ek sütun"), ek = bolumOgeleri(t3.bolumler[nokta]).at(-1)!;
  assert.deepEqual([ek.ad, ek.kilit], ["Ek sütun", false]);
  assert.equal(bolumOgeleri(ogeSil(t3, nokta, ek.id).bolumler[nokta]).length, bolumOgeleri(t.bolumler[nokta]).length, "eklenen sütun çıktı");
  /* kilitli bölüme yeni madde eklenebilir (RAPOR-FORMAT §3: yalnız sırası / görünümü değişir; yeni kilitsiz öğe serbest) */
  const t2 = ogeEkle(t, gozle, "Firmanın ek maddesi");
  gecerli(t2);
  assert.equal(bolumOgeleri(t2.bolumler[gozle]).at(-1)!.kilit, false);
});

/* 2026-10-10 (470): Bakanlık bölümü de silinir ve adı değişir — kilit denetimi listeler (eskiden "silinmez, adı değişmez") */
test("bölüm sırala, sil, adlandır: Bakanlık bölümü de silinir / adı değişir, kilit denetimi listeler; sıra değişince kimlikler aynı", () => {
  const t = zpkr02();
  const k = t.bolumler.findIndex((b) => b.kilit), s = tasi(t.bolumler, 0, 2);
  assert.deepEqual(s.map((b) => b.id).sort(), t.bolumler.map((b) => b.id).sort());
  assert.equal(s[2].id, t.bolumler[0].id);
  assert.deepEqual(tasi(t.bolumler, 0, 99).map((b) => b.id), t.bolumler.map((b) => b.id), "sınır dışı taşıma değiştirmez");
  assert.equal(bolumSil(t, k).bolumler.length, t.bolumler.length - 1, "Bakanlık bölümü silindi");
  assert.ok(kilitDenetimi(bolumSil(t, k), t).some((x) => x.includes(`silinmiş: ${t.bolumler[k].id}`)));
  assert.equal(bolumAdi(t, k, "Başka ad").bolumler[k].ad, "Başka ad", "Bakanlık bölümünün adı değişti");
  assert.ok(kilitDenetimi(bolumAdi(t, k, "Başka ad"), t).some((x) => x.includes(`değiştirilmiş: ${t.bolumler[k].id}`)));
  const y = { ...t, bolumler: [...t.bolumler, yeniBolum(t, "not", "Yorum")] }, n = y.bolumler.length - 1;
  assert.equal(bolumAdi(y, n, "Uzman yorumu").bolumler[n].ad, "Uzman yorumu");
  assert.equal(bolumSil(y, n).bolumler.length, t.bolumler.length);
  /* boş ad şemadan geçmez (sunucu yazmaz, ekran nedenini söyler) */
  assert.equal(FormatTanimi.safeParse(bolumAdi(y, n, "  ")).success, false);
});

test("337–339 incelemesi: 'kilit' yalnız kaynakta kilitli öğede kalır — elle işaretlenen bölüm / madde açılır; kaynağın kilitlisi kalır, denetim temiz", () => {
  const kaynak = zpkr02();
  let t = zpkr02();
  const gozle = t.bolumler.findIndex((b) => b.id === "gozle");
  t = ogeEkle(t, gozle, "Firmanın maddesi");
  t = { ...t, bolumler: [...t.bolumler, { ...yeniBolum(t, "not", "Yorum"), kilit: true }] };
  const g = t.bolumler[gozle];
  if (g.blok === "liste") { const s = g.gruplar.at(-1)!; s.maddeler[s.maddeler.length - 1] = { ...s.maddeler.at(-1)!, kilit: true }; }
  const n = kilitNormallestir(t, [kaynak]);
  gecerli(n);
  assert.equal(n.bolumler.at(-1)!.kilit, false, "elle kilitlenen bölüm açıldı");
  assert.equal(bolumOgeleri(n.bolumler[gozle]).at(-1)!.kilit, false, "elle kilitlenen madde açıldı");
  assert.ok(n.bolumler[gozle].kilit && bolumOgeleri(n.bolumler[gozle])[0].kilit, "kaynağın kilitli bölümü ve maddesi kilitli kalır");
  assert.deepEqual(kilitDenetimi(n, kaynak), []);
  assert.ok(kilitNormallestir(t, []).bolumler.every((b) => !b.kilit), "kaynak yoksa hiçbir şey kilitli değil");
});

test("340–345 incelemesi: kilitli tabloya kurucuda eklenen sütun yayınlansa da Bakanlık öğesi değil — sonraki taslakta çıkarılınca engel yok", () => {
  let yayinda = zpkr02();
  const nokta = yayinda.bolumler.findIndex((b) => b.blok === "olcum" && b.kilit);
  yayinda = ogeEkle(yayinda, nokta, "Ek sütun");
  const ek = bolumOgeleri(yayinda.bolumler[nokta]).at(-1)!;
  const taslak = ogeSil(yayinda, nokta, ek.id);
  assert.equal(bolumOgeleri(taslak.bolumler[nokta]).length, bolumOgeleri(yayinda.bolumler[nokta]).length - 1);
  assert.deepEqual(kilitDenetimi(taslak, yayinda), [], "kurucu sütunu silinebilir");
  const sablonSutunu = bolumOgeleri(yayinda.bolumler[nokta])[0].id;
  const bozuk = { ...yayinda, bolumler: yayinda.bolumler.map((b, i) => (i === nokta && b.blok === "olcum" ? { ...b, sutunlar: b.sutunlar.filter((c) => c.id !== sablonSutunu) } : b)) };
  assert.ok(kilitDenetimi(bozuk, yayinda).some((x) => x.includes(`silinmiş: ${yayinda.bolumler[nokta].id}.${sablonSutunu}`)), "şablon sütunu yine zorunlu");
});

/* 426 (reisim 2026-10-09: "kullanıcı bu ve benzeri rapor formatlarını isterse kendi eli ile format yapıcıdan yapabilsin"): öğe düzenleyici, gruplar,
   cevap seti, uygunluk notları, görünüm. Kilitli (Bakanlık) maddede yalnız talimat değişir; şablon sütunu değişmez; olumsuz seçenek seçeneklerin
   dışına çıkmaz; tür değişince sınır / seçenekler temizlenir; her adımın sonucu şemadan geçer. Olumsuz kanıt: tests/bozan/kurucu.bozan.ts. */
/* 2026-10-10 (470): Bakanlık maddesinin metni / standardı da değişir — kilit denetimi "değiştirilmiş" listeler (yayında uyarı); talimat denetime
   girmez (eskiden "kilitli madde yalnız talimat alır") */
test("426 / 470: Bakanlık maddesine talimat yazmak denetime girmez; metni değişirse listelenir; kurucu maddesi metin / standart / grup değiştirir", () => {
  let t = SABLONLAR.ZPKR02.tanim;
  const i = t.bolumler.findIndex((b) => b.id === "gozle");
  const once = JSON.stringify(t.bolumler[i]);
  t = ogeYaz(t, i, "g1_1", { talimat: "Kabloyu gözle kontrol et." });
  const g = t.bolumler[i];
  assert.ok(g.blok === "liste");
  const m = g.gruplar[0].maddeler[0], ilk = (SABLONLAR.ZPKR02.tanim.bolumler[i] as BolumOf<"liste">).gruplar[0].maddeler[0];
  assert.deepEqual([m.metin, m.std, m.talimat], [ilk.metin, ilk.std, "Kabloyu gözle kontrol et."], "metin ve standart aynı, talimat yazıldı");
  assert.notEqual(JSON.stringify(t.bolumler[i]), once);
  assert.deepEqual(kilitDenetimi(t, SABLONLAR.ZPKR02.tanim), [], "talimat denetime girmez");
  const degisik = ogeYaz(t, i, "g1_1", { ad: "Başka metin", std: "x" });
  assert.equal((degisik.bolumler[i] as BolumOf<"liste">).gruplar[0].maddeler[0].metin, "Başka metin", "470: Bakanlık maddesinin metni değişti");
  assert.ok(kilitDenetimi(degisik, SABLONLAR.ZPKR02.tanim).some((x) => x.includes("değiştirilmiş: g1_1")), "yayında uyarı");
  t = grupEkle(t, i, "Firma ek kontrolleri");
  const yeni = (t.bolumler[i] as BolumOf<"liste">).gruplar.at(-1)!;
  t = maddeEkle(t, i, yeni.id, "Pano kapağı kilitli mi");
  const mid = (t.bolumler[i] as BolumOf<"liste">).gruplar.at(-1)!.maddeler[0].id;
  t = ogeYaz(t, i, mid, { ad: "Pano kapağı kilitli mi?", std: "TS HD 60364", talimat: "Anahtarla dene.", grup: (t.bolumler[i] as BolumOf<"liste">).gruplar[0].id });
  const gl = (t.bolumler[i] as BolumOf<"liste">).gruplar;
  assert.equal(gl.at(-1)!.maddeler.length, 0, "madde başka gruba taşındı");
  assert.ok(gl[0].maddeler.some((x) => x.id === mid && x.metin === "Pano kapağı kilitli mi?" && x.std === "TS HD 60364"));
  assert.equal(grupSil(t, i, gl[0].id), t, "dolu grup silinmez");
  assert.equal((grupSil(t, i, gl.at(-1)!.id).bolumler[i] as BolumOf<"liste">).gruplar.length, gl.length - 1, "boş grup silinir");
  assert.equal((grupYaz(t, i, gl[0].id, { ad: "Başka grup" }).bolumler[i] as BolumOf<"liste">).gruplar[0].ad, "Başka grup", "470: Bakanlık grubunun adı da değişir");
  assert.equal((grupYaz(t, i, gl[0].id, { talimat: "Grup talimatı" }).bolumler[i] as BolumOf<"liste">).gruplar[0].talimat, "Grup talimatı", "talimat yazılır");
  assert.deepEqual((cevaplarYaz(t, i, ["A", "B"]).bolumler[i] as BolumOf<"liste">).cevaplar, ["A", "B"], "470: Bakanlık bölümünün cevap seti de değişir");
  assert.ok(kilitDenetimi(cevaplarYaz(t, i, ["A", "B"]), SABLONLAR.ZPKR02.tanim).some((x) => x.includes("değiştirilmiş: gozle")), "yayında uyarı");
  assert.ok(FormatTanimi.safeParse(t).success);
});

test("426: sütun ve değer düzenleyici — seçenekler, olumsuz (seçeneklerle sınırlı), ağır, sınır; tür değişince temizlenir", () => {
  let t = FormatTanimi.parse({ sema: 1, bolumler: [
    { id: "x", ad: "Testler", blok: "olcum", sutunlar: [] },
    { id: "y", ad: "Değerler", blok: "test", degerler: [] },
    { id: "z", ad: "Kontroller", blok: "liste", cevaplar: ["Uygun", "Uygun değil"], gruplar: [{ id: "g", ad: "", maddeler: [] }] },
  ] });
  t = ogeEkle(t, 0, "Test"); t = ogeEkle(t, 1, "RB");
  const s = (t.bolumler[0] as BolumOf<"olcum">).sutunlar[0].id, d = (t.bolumler[1] as BolumOf<"test">).degerler[0].id;
  t = ogeYaz(t, 0, s, { tur: "secim", secenekler: satirlar("U\nUD\n\nUG\nU"), olumsuz: ["UD", "YOK"], agir: true });
  let c = (t.bolumler[0] as BolumOf<"olcum">).sutunlar[0];
  assert.deepEqual([c.giris, c.secenekler, c.olumsuz, c.agir], ["secim", ["U", "UD", "UG"], ["UD"], true]);
  t = ogeYaz(t, 0, s, { tur: "sayi", op: "<", sinir: 2 });
  c = (t.bolumler[0] as BolumOf<"olcum">).sutunlar[0];
  assert.deepEqual([c.giris, c.secenekler, c.olumsuz, c.op, c.sinir], ["sayi", undefined, undefined, "<", 2]);
  t = ogeYaz(t, 1, d, { op: ">=", sinir: 1.5, birim: "Ω" });
  t = ogeYaz(t, 1, d, { tur: "secim", secenekler: ["Not 1: Uygun", "Not 2: Yetersiz"], olumsuz: ["Not 2: Yetersiz"] });
  const v = (t.bolumler[1] as BolumOf<"test">).degerler[0];
  assert.deepEqual([v.secenekler, v.olumsuz, v.op, v.sinir, v.metin], [["Not 1: Uygun", "Not 2: Yetersiz"], ["Not 2: Yetersiz"], undefined, undefined, false]);
  t = cevaplarYaz(t, 2, ["U", "UD", "UG"]);
  assert.deepEqual((t.bolumler[2] as BolumOf<"liste">).cevaplar, ["U", "UD", "UG"]);
  assert.equal(cevaplarYaz(t, 2, ["Tek"]), t, "tek cevap olmaz");
  assert.ok(FormatTanimi.safeParse(t).success);
});

/* 2026-10-10 (470): Bakanlık formatında form kodu / başlık da değişir — kilit denetimi listeler (eskiden "değişmez") */
test("426 / 470: uygunluk notları ve görünüm — Bakanlık formatında form kodu / başlık değişince listelenir; dayanak ve talimat denetime girmez", () => {
  let t = FormatTanimi.parse({ sema: 1, bolumler: [{ id: "x", ad: "Noktalar", blok: "olcum", sutunlar: [{ id: "a", ad: "A" }] }] });
  t = notlarYaz(t, 0, [{ metin: "Uygun", kusur: false, agir: true }, { metin: "Yetersiz", kusur: true, agir: true }, { metin: " ", kusur: true, agir: false }]);
  assert.deepEqual((t.bolumler[0] as BolumOf<"olcum">).notlar, [{ metin: "Uygun", kusur: false, agir: false }, { metin: "Yetersiz", kusur: true, agir: true }]);
  t = gorunumYaz(t, { formKodu: "FR-01", baslik: "Firma raporu", dayanak: satirlar("TS 1\nTS 2", 20, 300), talimat: "Önce enerjiyi kes." });
  assert.deepEqual([t.gorunum.formKodu, t.gorunum.baslik, t.gorunum.dayanak, t.gorunum.talimat], ["FR-01", "Firma raporu", ["TS 1", "TS 2"], "Önce enerjiyi kes."]);
  const z = gorunumYaz(SABLONLAR.ZPKR02.tanim, { talimat: "Genel talimat", dayanak: ["TS HD 60364-6"] });
  assert.deepEqual([z.gorunum.formKodu, z.gorunum.talimat], ["ZPKR02", "Genel talimat"]);
  assert.deepEqual(kilitDenetimi(z, SABLONLAR.ZPKR02.tanim), [], "talimat ve dayanak denetime girmez");
  const kod = gorunumYaz(SABLONLAR.ZPKR02.tanim, { formKodu: "X", baslik: "Y" });
  assert.deepEqual([kod.gorunum.formKodu, kod.gorunum.baslik], ["X", "Y"]);
  assert.ok(kilitDenetimi(kod, SABLONLAR.ZPKR02.tanim).some((x) => x.includes("form kodu ve başlığı değiştirilmiş")), "yayında uyarı");
});

/* 427: bölümün belgedeki düzeni (üst başlık, numarasızlık) kurucudan — firma kendi formatını Bakanlık formatları gibi 5.1 / 5.2 diye kurabilir;
   Bakanlık bölümünde değişmez (kilit denetimi de özde tutar) */
/* 2026-10-10 (470): Bakanlık bölümünün düzeni de değişir — kilit denetimi listeler (eskiden "kilitli bölümde değişmez") */
test("427 / 470: bölüm düzeni — üst başlık ve numarasızlık yazılır, boş üst başlık kalkar; Bakanlık bölümünde değişince listelenir", () => {
  let t = FormatTanimi.parse({ sema: 1, bolumler: [{ id: "a", ad: "Gözle", blok: "not" }, { id: "b", ad: "Testler", blok: "not" }, { id: "c", ad: "Foto", blok: "foto" }] });
  t = bolumDuzeni(t, 0, { ust: "Tespitler" });
  t = bolumDuzeni(t, 1, { ust: "Tespitler" });
  t = bolumDuzeni(t, 2, { numarasiz: true });
  assert.deepEqual(t.bolumler.map((b) => [b.ust, b.numarasiz]), [["Tespitler", undefined], ["Tespitler", undefined], [undefined, true]]);
  t = bolumDuzeni(bolumDuzeni(t, 0, { ust: "" }), 2, { numarasiz: false });
  assert.deepEqual(t.bolumler.map((b) => [b.ust, b.numarasiz]), [[undefined, undefined], ["Tespitler", undefined], [undefined, undefined]]);
  assert.ok(FormatTanimi.safeParse(t).success);
  const z = SABLONLAR.ZPKR04.tanim, i = z.bolumler.findIndex((b) => b.id === "gozle");
  assert.equal(bolumDuzeni(z, i, { ust: "Başka" }).bolumler[i].ust, "Başka", "Bakanlık bölümünün üst başlığı değişti");
  assert.ok(kilitDenetimi(bolumDuzeni(z, i, { ust: "Başka" }), z).some((x) => x.includes("değiştirilmiş: gozle")), "yayında uyarı");
});
