/* NEREDEN GELDİ: 2026-10-24 — reisim: "ben şablon yükledim bu şablondan başlat dedim neden yapay zeka çalışıyor ?", "en baştan beri bunu istedim".
   Basılı formdan şablon YAPAY ZEKÂSIZ: PDF'in kendi içeriği (yazılar, tablo çizgileri, dolgular, resimler) kurallarla BASILI ham'a çevrilir
   (src/modules/rapor-format/pdf-izgara.ts pdfIzgara) ve o ham basili.ts basilidanTanim'in girdisidir. Kilitler: çizgilerden ızgara, kenarı açık
   hücrelerin birleşmesi (birleşik başlık şeridi), dikdörtgen olmayan birleşik bölgede üst üste binmeme, etiket → kayıt / alan (sayı + birim, tarih),
   kontrol cevabı + sıra no (tek sütun U/UD/X, yan yana U | UD | X sütunları, belgedeki açıklamadan kodlar), imza tablosu (uzman / teknik, birkaç
   satırlık imza kutusu), sonuç cümlesi, zemin / kalın / orta hiza / kenar kalınlığı, yan yana tablolar, tablo dışı başlık ve sayfa altı (250
   karaktere sığmayan kesilmez), iki sayfa (tekrarlanan sayfa başlığı bir kez), kenarsız hücre, onay kutusu tablo sayılmaz; çıktı basilidanTanim'den
   geçip FormatTanimi şemasından geçer. Saf (veritabanısız); bütün sayfalar UYDURMA. Olumsuz kanıt: tests/bozan/pdf-izgara.bozan.ts.
   2026-10-24 (denetim — gerçek formla ve uydurma sayfalarla bulunan kusurlar): sayfa kenarlığı / çift dış kenar tabloyu yutmaz; çift çizgi tek
   (kalın) çizgi, yazısız ince şerit sütun / satır açmaz; tek parça çizilmiş form bantlara ve yan yana yarılara bölünür (bitişik bantlar ortak çizgiyi
   bir kez çizer, aralık 0); firmanın "Unvanı" imza bloğu yüzünden uzmanın mesleği olmaz; madde yazısı imza başlığı sayılmaz; çok satırlı listenin
   sütun başlığından kayıt verilmez; tarih / saat hücresinde aynı kayıt iki kez verilmez; iki bilgi soran etiket hücreyi ikiye böler; hücre
   çizgisini aşan birleşik yazı bölünür, taşan yazı komşusunu alan yapmaz; başlıklı kutudaki hazır cümle alanın hazır değeri; sayfa altı satır
   satır (kod satırı altYazi, uzun paragraf yerinde) ve önceksiz form kodu; iki sayfaya bölünen tablo tek tablo; çok bölümlü form çeviriden geçer. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { formulUygula } from "../src/format/formul.ts";
import { sahaTanimi, siraNumaralari } from "../src/format/tablo.ts";
import { Cevaplar, FormatTanimi, TABLO_KAYNAKLARI, type BolumOf } from "../src/format/tanim.ts";
import { basilidanTanim } from "../src/modules/rapor-format/basili.ts";
import { IMZA_ETIKETLERI, KAYIT_ETIKETLERI, katla, kayitKaynagi, pdfIzgara, yaziTipi } from "../src/modules/rapor-format/pdf-izgara.ts";
import type { BasiliHam, HamBolum, HamHucre, PdfCizgi, PdfDolgu, PdfSayfasi, PdfYazi } from "../src/modules/rapor-format/pdf-tipler.ts";

/* ── uydurma sayfa kurucuları ── */
const sayfa = (o: Partial<PdfSayfasi> = {}): PdfSayfasi => ({ en: 595, boy: 842, yazilar: [], dolgular: [], cizgiler: [], resimler: [], ...o });
function yazi(s: string, x: number, y: number, o: Partial<PdfYazi> = {}): PdfYazi {
  const boy = o.boy ?? 9;
  return { s, x, y, g: s.length * boy * 0.5, h: boy, boy, kalin: false, egik: false, aile: "ArialMT", ...o };
}
const genislik = (s: string, boy = 9) => s.length * boy * 0.5;
/** hücrede solda (3 pt boşluk), dikeyde ortada */
const sol = (s: string, x0: number, y0: number, y1: number, o: Partial<PdfYazi> = {}) => yazi(s, x0 + 3, (y0 + y1) / 2 - (o.boy ?? 9) / 2, o);
/** hücrenin ortasında */
const orta = (s: string, x0: number, x1: number, y0: number, y1: number, o: Partial<PdfYazi> = {}) =>
  yazi(s, (x0 + x1) / 2 - genislik(s, o.boy ?? 9) / 2, (y0 + y1) / 2 - (o.boy ?? 9) / 2, o);
/** ızgara çizgileri: xs sütun sınırları, ys satır sınırları; bos — çizilmeyen kenarlar ("y:r:c": r. yatay çizginin c. sütundaki parçası, "d:r:c":
    c. dikey çizginin r. satırdaki parçası); kalin — kalın kenarlar; dolgu — ince dolgu olarak (Word PDF'leri böyle çizer), değilse çizilen çizgi */
function izgara(xs: number[], ys: number[], o: { bos?: string[]; kalin?: string[]; dolgu?: boolean } = {}): { cizgiler: PdfCizgi[]; dolgular: PdfDolgu[] } {
  const bos = new Set(o.bos ?? []), kalin = new Set(o.kalin ?? []), cizgiler: PdfCizgi[] = [], dolgular: PdfDolgu[] = [];
  const ekle = (k: string, x1: number, y1: number, x2: number, y2: number) => {
    if (bos.has(k)) return;
    const t = kalin.has(k) ? 1.5 : 0.5;
    if (!o.dolgu) cizgiler.push({ x1, y1, x2, y2, kalinlik: t });
    else if (y1 === y2) dolgular.push({ x: x1, y: y1 - t / 2, g: x2 - x1, h: t, renk: "#000000" });
    else dolgular.push({ x: x1 - t / 2, y: y1, g: t, h: y2 - y1, renk: "#000000" });
  };
  for (let r = 0; r < ys.length; r++) for (let c = 0; c + 1 < xs.length; c++) ekle(`y:${r}:${c}`, xs[c], ys[r], xs[c + 1], ys[r]);
  for (let c = 0; c < xs.length; c++) for (let r = 0; r + 1 < ys.length; r++) ekle(`d:${r}:${c}`, xs[c], ys[r], xs[c], ys[r + 1]);
  return { cizgiler, dolgular };
}
/** dış çerçevenin kenarları (kalın çizmek için) */
function cerceve(C: number, R: number): string[] {
  const l: string[] = [];
  for (let c = 0; c < C; c++) l.push(`y:0:${c}`, `y:${R}:${c}`);
  for (let r = 0; r < R; r++) l.push(`d:${r}:0`, `d:${r}:${C}`);
  return l;
}
function birlestir(...l: { cizgiler?: PdfCizgi[]; dolgular?: PdfDolgu[]; yazilar?: PdfYazi[] }[]) {
  return { cizgiler: l.flatMap((x) => x.cizgiler ?? []), dolgular: l.flatMap((x) => x.dolgular ?? []), yazilar: l.flatMap((x) => x.yazilar ?? []) };
}
/** HTML tablosu gibi yerleşim: her konum tam bir hücrenin, her satırda sütun sayısı kadar */
function kapsamaTam(b: HamBolum): boolean {
  const C = b.sutunlar.length, R = b.satirlar.length, dolu = new Set<string>();
  for (const [r, s] of b.satirlar.entries()) {
    let c = 0;
    for (const h of s.hucreler) {
      while (dolu.has(`${r},${c}`)) c++;
      if (c + h.sutunBirlesim > C || r + h.satirBirlesim > R) return false;
      for (let a = 0; a < h.satirBirlesim; a++) for (let e = 0; e < h.sutunBirlesim; e++) {
        const k = `${r + a},${c + e}`;
        if (dolu.has(k)) return false;
        dolu.add(k);
      }
      c += h.sutunBirlesim;
    }
  }
  return dolu.size === R * C;
}
const hucre = (b: HamBolum, r: number, n: number): HamHucre => b.satirlar[r].hucreler[n];
const bolum = (h: BasiliHam, ad: string) => { const b = h.bolumler.find((x) => x.ad === ad); assert.ok(b, `bölüm yok: ${ad}`); return b; };

/* ── UYDURMA FORM (tek sayfa) ── */
const T1 = { xs: [40, 200, 555], ys: [70, 88, 106, 124, 142, 160] };
const T2 = { xs: [40, 160, 290], ys: [180, 198, 216, 234] };
const T3 = { xs: [310, 430, 555], ys: [180, 198, 216, 234] };
const T4 = { xs: [40, 70, 450, 555], ys: [250, 268, 286, 304, 322] };
const T5 = { xs: [40, 555], ys: [350, 370] };
const T6 = { xs: [40, 160, 360, 555], ys: [390, 408, 426, 444, 480] };
const satirYazilari = (t: { xs: number[]; ys: number[] }, satirlar: string[][]) =>
  satirlar.flatMap((l, r) => l.map((s, c) => (s ? sol(s, t.xs[c], t.ys[r], t.ys[r + 1]) : null)).filter((x): x is PdfYazi => !!x));
function form(): PdfSayfasi {
  const baslik = "VINC PERIYODIK KONTROL FORMU";
  const parca = birlestir(
    /* 1. firma bilgileri: ince dolgu çizgiler, ilk satır birleşik başlık şeridi (zeminli, kalın, ortalı) */
    izgara(T1.xs, T1.ys, { bos: ["d:0:1"], dolgu: true }),
    { yazilar: [orta("1. FIRMA BILGILERI", 40, 555, 70, 88, { kalin: true }),
      ...satirYazilari(T1, [[], ["Firma Unvanı", ""], ["İSG-KATİP Sözl. ID", ""], ["Kontrol Tarihi", ""], ["Bir Sonraki Kontrol Tarihi", ""]])] },
    /* 2 ve 3 yan yana: teknik bilgiler / ekipman bilgileri */
    izgara(T2.xs, T2.ys), { yazilar: satirYazilari(T2, [["Kapasite (kg)", ""], ["Halat çapı", ""], ["Test tarihi", ""]]) },
    izgara(T3.xs, T3.ys), { yazilar: satirYazilari(T3, [["Marka", ""], ["Seri No", ""], ["Açıklama", ""]]) },
    /* 4. kontrol listesi: sıra no, madde, U/UD/X sütunu (başlık ortalı) */
    izgara(T4.xs, T4.ys),
    { yazilar: [sol("No", 40, 250, 268), sol("Kontrol maddesi", 70, 250, 268), orta("U/UD/X", 450, 555, 250, 268),
      ...satirYazilari(T4, [[], ["1", "Fren sistemi", ""], ["2", "Kanca emniyet mandalı", ""], ["3", "Halat ve makaralar", ""]])] },
    /* tablo dışı açıklama */
    { yazilar: [yazi("U: Uygun  UD: Uygun Değil  X: Kapsam dışı", 40, 330, { boy: 8 })] },
    /* 5. sonuç cümlesi */
    izgara(T5.xs, T5.ys), { yazilar: [sol("Yukarıda bilgileri verilen ekipman KULLANIMA UYGUNDUR / UYGUN DEĞİLDİR", 40, 350, 370)] },
    /* 6. imza tablosu: dış çerçeve kalın */
    izgara(T6.xs, T6.ys, { kalin: cerceve(3, 4) }),
    { yazilar: [orta("KONTROLÜ YAPAN", 160, 360, 390, 408, { kalin: true }), orta("ONAYLAYAN", 360, 555, 390, 408, { kalin: true }),
      ...satirYazilari(T6, [[], ["Adı Soyadı", "", ""], ["Unvanı", "", ""], ["İmza", "", ""]])] },
  );
  return sayfa({
    yazilar: [orta(baslik, 40, 555, 36, 50, { boy: 14, kalin: true }), ...parca.yazilar,
      /* sayfa altı: solda form kodu, sağda sayfa no (arası çok açık) */
      yazi("FR.099 Rev.00 01.01.2026", 40, 805, { boy: 8 }), yazi("Sayfa 1/1", 510, 805, { boy: 8 })],
    /* sayfanın beyaz zemini önce, başlık şeridinin zemini sonra */
    dolgular: [{ x: 0, y: 0, g: 595, h: 842, renk: "#FFFFFF" }, { x: 40, y: 70, g: 515, h: 18, renk: "#F2DCDB" }, ...parca.dolgular],
    cizgiler: parca.cizgiler,
  });
}

test("bloklar formun sırasıyla: tablo dışı başlık, tablolar, açıklama; sayfa altı ayrı", () => {
  const h = pdfIzgara([form()]);
  assert.deepEqual(h.bolumler.map((b) => b.ad), [
    "VINC PERIYODIK KONTROL FORMU", "1. FIRMA BILGILERI", "Kapasite (kg)", "Marka", "No", "U: Uygun UD: Uygun Değil X: Kapsam dışı",
    "Yukarıda bilgileri verilen ekipman KULLANIMA UYGUNDUR", "KONTROLÜ YAPAN",
  ]);
  assert.equal(h.baslik, "VINC PERIYODIK KONTROL FORMU");
  assert.equal(h.formKodu, "FR.099");
  assert.equal(h.altYazi, "FR.099 Rev.00 01.01.2026 · Sayfa 1/1");
  assert.deepEqual(h.yazi, { tip: "arimo", boy: 9 });
  assert.equal(h.cevap, "");
  for (const b of h.bolumler) assert.ok(kapsamaTam(b), `yerleşim tam değil: ${b.ad}`);
  /* tablo dışı başlık: kenarsız 1×1, ortalı, kalın, belgeden büyük */
  const b0 = h.bolumler[0];
  assert.deepEqual([b0.sutunlar, b0.satirlar.length], [[100], 1]);
  assert.deepEqual(hucre(b0, 0, 0).kenar, { u: 0, a: 0, s: 0, g: 0 });
  assert.deepEqual([hucre(b0, 0, 0).tur, hucre(b0, 0, 0).hiza, hucre(b0, 0, 0).kalin, hucre(b0, 0, 0).boy], ["yazi", "orta", true, 14]);
});

test("birleşik başlık şeridi: kenarı açık hücreler tek hücre; zemin, kalın, orta hiza; ince dolgu çizgiler", () => {
  const t = bolum(pdfIzgara([form()]), "1. FIRMA BILGILERI");
  assert.equal(t.satirlar.length, 5);
  assert.deepEqual(t.sutunlar, [31.07, 68.93]);
  assert.equal(t.satirlar[0].hucreler.length, 1);
  const s = hucre(t, 0, 0);
  assert.deepEqual([s.sutunBirlesim, s.tur, s.metin, s.kalin, s.hiza, s.zemin], [2, "yazi", "1. FIRMA BILGILERI", true, "orta", "#F2DCDB"]);
  assert.deepEqual(s.kenar, { u: 1, a: 1, s: 1, g: 1 });
  /* beyaz sayfa zemini zemin değildir */
  assert.equal(hucre(t, 1, 0).zemin, "");
  assert.equal(t.satirlar[1].yukseklik, 6.5);
  /* sözlükten kayıt (Türkçe katlanarak) */
  assert.deepEqual(t.satirlar.slice(1).map((r) => [r.hucreler[0].tur, r.hucreler[1].tur, r.hucreler[1].kaynak]), [
    ["yazi", "kayit", "firma"], ["yazi", "kayit", "isg"], ["yazi", "kayit", "bas"], ["yazi", "kayit", "sonraki"],
  ]);
  assert.deepEqual(t.cevaplar, []);
});

test("etiket + boş hücre: sayı (birim parantezden), tarih, metin; sözlükte olan kayıt — yan yana iki tablo", () => {
  const h = pdfIzgara([form()]);
  const t2 = bolum(h, "Kapasite (kg)"), t3 = bolum(h, "Marka");
  assert.deepEqual(t2.satirlar.map((r) => { const x = r.hucreler[1]; return [x.tur, x.metin, x.alan, x.birim]; }), [
    ["alan", "Kapasite", "sayi", "kg"], ["alan", "Halat çapı", "sayi", ""], ["alan", "Test tarihi", "tarih", ""],
  ]);
  assert.deepEqual(t3.satirlar.map((r) => { const x = r.hucreler[1]; return [x.tur, x.kaynak, x.alan]; }), [
    ["kayit", "marka", "metin"], ["kayit", "seri", "metin"], ["alan", "yok", "metin"],
  ]);
  /* yan yana: ikinci tablo öncekinin yanında, oranlar satırdaki pay */
  assert.deepEqual([t2.yan, t3.yan], [false, true]);
  assert.equal(t2.oran + t3.oran, 100);
  assert.ok(Math.abs(t2.oran - 50) <= 1 && Math.abs(t3.oran - 50) <= 1, `${t2.oran} / ${t3.oran}`);
  assert.equal(bolum(h, "No").yan, false);
});

test("kontrol listesi: art arda tamsayılar sıra no, U/UD/X sütunu cevap; cevaplar başlıktan", () => {
  const t = bolum(pdfIzgara([form()]), "No");
  assert.deepEqual(t.satirlar.map((r) => r.hucreler.map((x) => x.tur)), [
    ["yazi", "yazi", "yazi"], ["sira", "yazi", "cevap"], ["sira", "yazi", "cevap"], ["sira", "yazi", "cevap"],
  ]);
  assert.deepEqual(t.satirlar.slice(1).map((r) => r.hucreler[0].metin), ["", "", ""]);
  assert.equal(hucre(t, 2, 1).metin, "Kanca emniyet mandalı");
  assert.equal(hucre(t, 0, 2).hiza, "orta");
  assert.deepEqual(t.cevaplar, ["U", "UD", "X"]);
});

test("sonuç cümlesi: sözcükten önceki yazı metin, seçenekler formun yazımıyla", () => {
  const t = bolum(pdfIzgara([form()]), "Yukarıda bilgileri verilen ekipman KULLANIMA UYGUNDUR");
  const s = hucre(t, 0, 0);
  assert.deepEqual([s.tur, s.metin, s.secenekler], ["sonuc", "Yukarıda bilgileri verilen ekipman KULLANIMA", ["UYGUNDUR", "UYGUN DEĞİLDİR"]]);
  /* yalnız biri yazılıysa öteki aynı yazımla; başlık harfli yazım; cümle olmayan yazı sonuç değil */
  const tek = (m: string) => hucre(pdfIzgara([sayfa({ ...birlestir(izgara([40, 555], [100, 120])), yazilar: [sol(m, 40, 100, 120)] })]).bolumler[0], 0, 0);
  assert.deepEqual([tek("Ekipman KULLANIMA UYGUNDUR").tur, tek("Ekipman KULLANIMA UYGUNDUR").secenekler], ["sonuc", ["UYGUNDUR", "UYGUN DEĞİLDİR"]]);
  assert.deepEqual(tek("Kullanıma Uygundur / Uygun Değildir").secenekler, ["Uygundur", "Uygun Değildir"]);
  assert.deepEqual(tek("Ekipman UYGUNDUR / UYGUN DEĞİLDİR / ŞARTLI UYGUNDUR").secenekler, ["UYGUNDUR", "UYGUN DEĞİLDİR", "ŞARTLI UYGUNDUR"]);
  assert.equal(tek("Ekipman UYGUNDUR / UYGUN DEĞİLDİR / ŞARTLI UYGUNDUR").metin, "Ekipman");
  assert.equal(tek("Uygundur ifadesinin açıklaması").tur, "yazi");
});

test("imza tablosu: ad / unvan sütunun kişisine göre kayıt, imza satırı imza; dış çerçeve kalın kenar", () => {
  const t = bolum(pdfIzgara([form()]), "KONTROLÜ YAPAN");
  const ozet = (r: number) => t.satirlar[r].hucreler.map((x) => (x.tur === "kayit" ? x.kaynak : x.tur === "imza" ? `imza:${x.kim}` : x.tur));
  assert.deepEqual([ozet(1), ozet(2), ozet(3)], [["yazi", "uzman_ad", "teknik_ad"], ["yazi", "uzman_meslek", "teknik_meslek"], ["yazi", "imza:uzman", "imza:teknik"]]);
  assert.equal(t.satirlar[3].yukseklik, 12.5);
  /* kenarlar: sol üst köşe hücresi üstte ve solda kalın, içte ince */
  assert.deepEqual(hucre(t, 0, 0).kenar, { u: 2, a: 1, s: 2, g: 1 });
  assert.deepEqual(hucre(t, 3, 2).kenar, { u: 1, a: 2, s: 1, g: 2 });
  assert.deepEqual(hucre(t, 0, 1).kenar, { u: 2, a: 1, s: 1, g: 1 });
});

test("imza tablosunda birkaç satırlık boş kutu imza yeri; kişisi sütun başlığından (onay → teknik)", () => {
  /* sütunlar: etiket | uzmanın değeri | İMZA | ONAY; imza ve onay sütunları 4 satırlık tek kutu */
  const xs = [40, 140, 300, 420, 555], ys = [500, 516, 532, 548, 564, 580];
  const bos = ["d:0:1", ...[1, 2, 3].flatMap((r) => [`y:${r + 1}:2`, `y:${r + 1}:3`])];
  const h = pdfIzgara([sayfa({ ...izgara(xs, ys, { bos }), yazilar: [
    sol("KONTROLU YAPAN MUHENDIS", 40, 500, 516, { kalin: true }), orta("IMZA", 300, 420, 500, 516), orta("TEKNIK ONAY", 420, 555, 500, 516),
    ...["Adı Soyadı", "Unvanı", "Diploma No", "EKİPNET No"].map((s, r) => sol(s, 40, ys[r + 1], ys[r + 2])),
  ] })]);
  const t = h.bolumler[0];
  assert.deepEqual(t.satirlar.map((s) => s.hucreler.map((x) => (x.tur === "kayit" ? x.kaynak : x.tur === "imza" ? `imza:${x.kim}:${x.satirBirlesim}` : x.tur))), [
    ["yazi", "yazi", "yazi"], ["yazi", "uzman_ad", "imza:uzman:4", "imza:teknik:4"], ["yazi", "uzman_meslek"], ["yazi", "uzman_diploma"], ["yazi", "uzman_ekipnet"],
  ]);
  assert.ok(kapsamaTam(t));
});

test("sayfa altı 250 karaktere sığmazsa kesilmez, yerinde yazı olarak kalır", () => {
  const uzun = Array.from({ length: 4 }, (_, i) => `Uydurma dipnot satiri ${i + 1} ${"x".repeat(70)}`);
  const h = pdfIzgara([sayfa({ ...izgara([40, 555], [100, 120]), yazilar: [sol("Tablo", 40, 100, 120), ...uzun.map((s, i) => yazi(s, 40, 790 + i * 7, { boy: 6 }))] })]);
  assert.equal(h.altYazi, "");
  assert.deepEqual(h.bolumler.map((b) => b.satirlar[0].hucreler[0].metin), ["Tablo", uzun.join("\n")]);
});

test("çıktı basilidanTanim'in girdisidir: FormatTanimi şemasından geçer, hiçbir bölüm atılmaz", () => {
  const h = pdfIzgara([form()]);
  const r = basilidanTanim(structuredClone(h), "Vinç");
  assert.ok(r, "çeviri null");
  const t = FormatTanimi.parse(r.tanim);
  assert.deepEqual(r.atilan, []);
  assert.equal(t.gorunum.serbest, true);
  assert.equal(t.gorunum.baslik, "VINC PERIYODIK KONTROL FORMU");
  assert.equal(t.gorunum.formKodu, "FR.099");
  assert.deepEqual(t.gorunum.yazi, { tip: "arimo" });
  /* sonuç ve uzmanın imzası formda var — eklenmez; fotoğraf yok — sonda */
  assert.deepEqual(t.bolumler.map((b) => b.blok), [...h.bolumler.map(() => "tablo"), "foto"]);
  const firma = t.bolumler[1] as BolumOf<"tablo">;
  const serit = firma.hucreler.find((x) => x.r === 0 && x.c === 0);
  assert.deepEqual([serit?.cs, serit?.s?.z, serit?.s?.k, serit?.s?.a], [2, "#F2DCDB", true, "o"]);
  assert.deepEqual(firma.hucreler.filter((x) => x.tur === "kayit").map((x) => x.kaynak), ["firma", "isg", "bas", "sonraki"]);
  const liste = t.bolumler[4] as BolumOf<"tablo">;
  assert.equal(liste.hucreler.filter((x) => x.tur === "cevap" && x.id).length, 3);
  assert.equal(liste.hucreler.filter((x) => x.tur === "sira").length, 3);
  const imza = t.bolumler[7] as BolumOf<"tablo">;
  assert.deepEqual(imza.hucreler.filter((x) => x.tur === "imza").map((x) => [x.kim, x.eimza]), [["uzman", true], ["teknik", true]]);
  /* kalın dış çerçeve görünümde */
  assert.deepEqual(imza.hucreler.find((x) => x.r === 0 && x.c === 0)?.s?.kn, { u: 2, a: 1, s: 2, g: 1 });
  /* yan yana tablo kurucuda da yanında */
  assert.equal((t.bolumler[3] as BolumOf<"tablo">).yan, true);
});

test("iki sayfa: sayfalar alt alta, tekrarlanan sayfa başlığı ve sayfa altı bir kez; başlık hücresindeki resim logo", () => {
  const ust = (n: number): PdfSayfasi => {
    const x = birlestir(izgara([40, 140, 555], [30, 70]), izgara([40, 555], [100, 120, 140]), {
      yazilar: [orta("KONTROL FORMU", 140, 555, 30, 70, { boy: 12, kalin: true }), sol(`Bolum ${n}`, 40, 100, 120), sol(`satir ${n}`, 40, 120, 140),
        yazi("FR-12 Rev.01", 40, 810)],
    });
    return sayfa({ ...x, resimler: [{ x: 50, y: 35, g: 80, h: 30 }] });
  };
  const h = pdfIzgara([ust(1), ust(2)]);
  assert.deepEqual(h.bolumler.map((b) => b.ad), ["KONTROL FORMU", "Bolum 1", "Bolum 2"]);
  assert.deepEqual(h.bolumler[0].satirlar[0].hucreler.map((x) => [x.tur, x.gorsel]), [["gorsel", "logo"], ["yazi", "logo"]]);
  assert.equal(h.bolumler[0].satirlar[0].hucreler[1].boy, 12);
  assert.equal(h.altYazi, "FR-12 Rev.01");
  assert.equal(h.formKodu, "FR-12");
  assert.equal(h.baslik, "KONTROL FORMU");
  /* ikinci sayfanın tablosu birincininkiyle birleşmez */
  assert.deepEqual(h.bolumler.slice(1).map((b) => [b.satirlar.length, b.yan]), [[2, false], [2, false]]);
  const r = basilidanTanim(h, "Vinç");
  assert.ok(r && FormatTanimi.safeParse(r.tanim).success && r.atilan.length === 0);
});

test("dikdörtgen olmayan birleşik bölge tek tek hücre; kenarsız hücrenin kenarı 0; üst üste binme yok", () => {
  /* L biçimi: (0,0)-(0,1) ve (0,0)-(1,0) açık, (0,1)-(1,1) ve (1,0)-(1,1) kapalı */
  const l = pdfIzgara([sayfa(izgara([0, 100, 200], [0, 20, 40, 60], { bos: ["d:0:1", "y:1:0"] }))]).bolumler[0];
  assert.deepEqual(l.satirlar.map((s) => s.hucreler.map((x) => `${x.satirBirlesim}x${x.sutunBirlesim}`)), [["1x1", "1x1"], ["1x1", "1x1"], ["1x1", "1x1"]]);
  assert.deepEqual(hucre(l, 0, 0).kenar, { u: 1, a: 0, s: 1, g: 0 });
  assert.ok(kapsamaTam(l));
  /* sağ üst köşe açık (üstü ve sağı çizgisiz): hücre kalır, o yanlar 0 */
  const a = pdfIzgara([sayfa(izgara([0, 100, 200], [0, 20, 40], { bos: ["y:0:1", "d:0:2"] }))]).bolumler[0];
  assert.deepEqual(a.satirlar.map((s) => s.hucreler.length), [2, 2]);
  assert.deepEqual(hucre(a, 0, 1).kenar, { u: 0, a: 1, s: 1, g: 0 });
  assert.ok(kapsamaTam(a));
  /* hiçbir satırda çizilmeyen çizgi sütun açmaz */
  const c = pdfIzgara([sayfa(izgara([0, 100, 200, 300], [0, 20, 40, 60], { bos: ["d:0:1", "d:0:2", "d:1:1", "d:2:1", "y:2:0", "y:2:1"] }))]).bolumler[0];
  assert.deepEqual(c.sutunlar, [66.67, 33.33]);
  assert.deepEqual(c.satirlar.map((s) => s.hucreler.map((x) => `${x.satirBirlesim}x${x.sutunBirlesim}`)), [["1x2"], ["2x1", "1x1"], ["1x1"]]);
  /* birleşik dikdörtgen: üstte şerit, altında 2×2 */
  const b = pdfIzgara([sayfa(izgara([0, 100, 200, 300], [0, 20, 40, 60, 80], { bos: ["d:0:1", "d:0:2", "d:1:1", "d:2:1", "y:2:0", "y:2:1"] }))]).bolumler[0];
  assert.deepEqual(b.satirlar.map((s) => s.hucreler.map((x) => `${x.satirBirlesim}x${x.sutunBirlesim}`)), [["1x3"], ["2x2", "1x1"], ["1x1"], ["1x1", "1x1", "1x1"]]);
  assert.ok(kapsamaTam(b) && kapsamaTam(c));
  for (const x of [l, a, b, c]) assert.ok(basilidanTanim({ bolumler: [x] }, "T")?.atilan.length === 0);
});

test("yan yana kontrol cevabı sütunları (U | UD | X) tek cevap hücresi; cevaplar başlıklardan", () => {
  const xs = [40, 70, 400, 450, 500, 555], ys = [100, 118, 136, 154];
  const h = pdfIzgara([sayfa({ ...izgara(xs, ys), yazilar: [
    sol("No", 40, 100, 118), sol("Kontrol maddesi", 70, 100, 118), orta("U", 400, 450, 100, 118), orta("UD", 450, 500, 100, 118), orta("X", 500, 555, 100, 118),
    ...[["1", "Fren"], ["2", "Kanca"]].flatMap(([n, m], r) => [sol(n, 40, ys[r + 1], ys[r + 2]), sol(m, 70, ys[r + 1], ys[r + 2])]),
  ] })]);
  const t = h.bolumler[0];
  assert.deepEqual(t.satirlar.map((s) => s.hucreler.map((x) => `${x.tur}:${x.sutunBirlesim}`)), [
    ["yazi:1", "yazi:1", "yazi:1", "yazi:1", "yazi:1"], ["sira:1", "yazi:1", "cevap:3"], ["sira:1", "yazi:1", "cevap:3"],
  ]);
  assert.deepEqual(t.cevaplar, ["U", "UD", "X"]);
  assert.ok(kapsamaTam(t));
  assert.ok(basilidanTanim(h, "T")?.atilan.length === 0);
});

test("yan yana cevap sütunlarının başlığı UYGUNDUR / UYGUN DEĞİLDİR ise başlıklar sonuç değil yazı; cevaplar başlıkların yazımıyla", () => {
  const xs = [40, 380, 470, 555], ys = [100, 118, 136];
  const h = pdfIzgara([sayfa({ ...izgara(xs, ys), yazilar: [sol("Kontrol maddesi", 40, 100, 118), orta("UYGUNDUR", 380, 470, 100, 118),
    orta("UYGUN DEĞİLDİR", 470, 555, 100, 118), sol("Fren", 40, 118, 136)] })]);
  const t = h.bolumler[0];
  assert.deepEqual(t.satirlar.map((s) => s.hucreler.map((x) => `${x.tur}:${x.sutunBirlesim}`)), [["yazi:1", "yazi:1", "yazi:1"], ["yazi:1", "cevap:2"]]);
  assert.deepEqual(t.cevaplar, ["UYGUNDUR", "UYGUN DEĞİLDİR"]);
});

test("cevap kodları belgedeki açıklamadan (olumlu, olumsuz, ötekiler); Sonuç başlıklı sütun", () => {
  const xs = [40, 400, 555], ys = [100, 118, 136];
  const h = pdfIzgara([sayfa({ ...izgara(xs, ys), yazilar: [sol("Madde", 40, 100, 118), sol("Sonuç", 400, 100, 118), sol("Fren", 40, 118, 136),
    yazi("Y: Yok, H: Uygun değil, E: Uygun", 40, 150)] })]);
  assert.deepEqual(h.bolumler[0].satirlar[1].hucreler.map((x) => x.tur), ["yazi", "cevap"]);
  assert.deepEqual(h.bolumler[0].cevaplar, ["E", "H", "Y"]);
});

test("onay kutusu (küçük kare) tablo sayılmaz; tablo dışı paragraf satırları birleşir", () => {
  const kutu = izgara([300, 308], [600, 608]);
  const h = pdfIzgara([sayfa({ ...kutu, yazilar: [yazi("Birinci satir", 40, 500), yazi("ikinci satir", 40, 511), yazi("Uzak paragraf", 40, 560)] })]);
  assert.deepEqual(h.bolumler.map((b) => [b.ad, b.satirlar[0].hucreler[0].metin]), [["Birinci satir", "Birinci satir\nikinci satir"], ["Uzak paragraf", "Uzak paragraf"]]);
  /* zeminsiz paragrafın yüksekliği serbest */
  assert.equal(h.bolumler[0].satirlar[0].yukseklik, 0);
});

test("yazı tipi ailesi ve Türkçe katlama; etiket sözlüğü kilidi", () => {
  assert.deepEqual(["TimesNewRomanPS-BoldMT", "Georgia", "LiberationSerif", "Arial-BoldMT", "Helvetica", "Liberation Sans", "Tahoma", "Calibri", "DejaVuSans", "g_d0_f1"]
    .map(yaziTipi), ["tinos", "tinos", "tinos", "arimo", "arimo", "arimo", "arimo", "carlito", "carlito", "carlito"]);
  assert.equal(katla("İSG-KATİP Sözl. ID:"), "isg katip sozl id");
  assert.equal(katla("ŞİRKET ÜNVANI* (Çğ)"), "sirket unvani cg");
  assert.equal(katla("ISIK S.G.K."), "isik sgk");
  /* sözlüğün her kaynağı tanımda var; anahtarlar katlanmış yazılmış */
  for (const [a, k] of KAYIT_ETIKETLERI) {
    assert.ok((TABLO_KAYNAKLARI as readonly string[]).includes(k), k);
    assert.equal(katla(a.replace(/^=/, "")), a.replace(/^=/, ""), a);
  }
  for (const [a, l] of IMZA_ETIKETLERI) {
    for (const k of Object.values(l)) assert.ok((TABLO_KAYNAKLARI as readonly string[]).includes(k), k);
    assert.equal(katla(a.replace(/^=/, "")), a.replace(/^=/, ""), a);
  }
  const beklenen: [string, string | null][] = [
    ["İSG-KATİP Sözl. ID", "isg"], ["ISG KATIP SOZLESME ID", "isg"], ["S.G.K. Sicil No", "sgk"], ["Firma Unvanı", "firma"], ["İşveren", "firma"],
    ["İşveren Adresi", "adres"], ["E-posta Adresi", "eposta"], ["Tel", "tel"], ["Bir Sonraki Kontrol Tarihi", "sonraki"], ["Geçerlilik Tarihi", "sonraki"],
    ["Periyodik Kontrol Tarihi", "bas"], ["Rapor Tarihi", "rapor_tarihi"], ["Rapor No", "rapor_no"], ["Makine Kodu", "ekipman_kod"], ["Ekipman No", "ekipman_kod"],
    ["Markası", "marka"], ["Modeli", "model"], ["Seri Numarası", "seri"], ["İmal Yılı", "imal"], ["Kullanım Yeri", "konum"], ["Referans Standartlar", "metot"],
    ["Muayene Firması", "muayene_firmasi"], ["Halat Tel Çapı", null], ["İmalatçı Firma", null], ["Kapasite", null],
  ];
  assert.deepEqual(beklenen.map(([e]) => [e, kayitKaynagi(e)]), beklenen);
});

test("bozuk / boş girdi: düşmez, boş ham şemadan geçer; sınırlar uygulanır", () => {
  const bos = pdfIzgara([]);
  assert.deepEqual(bos, { cevap: "", baslik: "", formKodu: "", altYazi: "", yazi: { tip: "carlito", boy: 9 }, bolumler: [] });
  assert.ok(basilidanTanim(bos, "Vinç"));
  const bozuk = sayfa({
    yazilar: [{ s: "x", x: NaN, y: 0, g: 1, h: 1, boy: 9, kalin: false, egik: false, aile: "" }, { ...yazi("   ", 10, 10) }],
    dolgular: [{ x: 0, y: 0, g: Infinity, h: 1, renk: "kırmızı" }], cizgiler: [{ x1: 0, y1: 0, x2: 10, y2: 10, kalinlik: 1 }], resimler: [{ x: 0, y: 0, g: 595, h: 842 }],
  });
  assert.deepEqual(pdfIzgara([bozuk]).bolumler, []);
  /* çok sütunlu ızgara 40 sütuna sığdırılır */
  const xs = Array.from({ length: 61 }, (_, i) => 10 + i * 9);
  const genis = pdfIzgara([sayfa(izgara(xs, [100, 120]))]).bolumler[0];
  assert.ok(genis.sutunlar.length <= 40 && kapsamaTam(genis), String(genis.sutunlar.length));
});

/* ── 2026-10-24 DENETİM KİLİTLERİ ── */
const ozetle = (b: HamBolum) => b.satirlar.map((s) => s.hucreler.map((x) => (x.tur === "kayit" ? `k:${x.kaynak}` : x.tur === "imza" ? `imza:${x.kim}` : x.tur === "alan" ? `a:${x.metin}` : x.tur)));
const zemin = (x: number, y: number, g: number, h: number): PdfDolgu => ({ x, y, g, h, renk: "#D9D9D9" });

test("sayfa kenarlığı ve çift dış kenarın dış çizgisi tabloyu yutmaz; sıkı dış çizgi tablonun dış kenarını kalın yapar", () => {
  const xs = [60, 200, 340, 480], ys = [100, 130, 160, 190];
  const yazilar = ys.slice(0, -1).flatMap((y0, r) => xs.slice(0, -1).map((x0, c) => sol(`R${r}C${c}`, x0, y0, ys[r + 1])));
  /* sayfa kenarlığı (20 pt içeride) + 3×3 tablo + ayrı ikinci tablo */
  const kenarlik = izgara([20, 575], [20, 822]);
  const ikinci = izgara([60, 480], [300, 330]);
  const h = pdfIzgara([sayfa({ ...birlestir(kenarlik, izgara(xs, ys), ikinci), yazilar: [...yazilar, sol("Ikinci", 60, 300, 330)] })]);
  assert.deepEqual(h.bolumler.map((b) => [b.satirlar.length, b.sutunlar.length]), [[3, 3], [1, 1]]);
  assert.equal(hucre(h.bolumler[0], 1, 1).metin, "R1C1");
  /* çift dış kenar (3 pt arayla dış çizgi): tablo kalır, dış kenarı kalın, iç kenarı ince */
  const cift = pdfIzgara([sayfa({ ...birlestir(izgara([57, 483], [97, 193]), izgara(xs, ys)), yazilar })]).bolumler;
  assert.equal(cift.length, 1);
  assert.deepEqual([cift[0].satirlar.length, cift[0].sutunlar.length], [3, 3]);
  assert.deepEqual(hucre(cift[0], 0, 0).kenar, { u: 2, a: 1, s: 2, g: 1 });
});

test("çift çizgi tek kalın çizgi; arasında yazı olmayan ince şerit satır / sütun açmaz", () => {
  /* üst ve alt kenar 3 pt arayla çift, dikeyler iki çizgiyi de keser */
  const xs = [60, 200, 340, 480];
  const l = izgara(xs, [97, 100, 130, 160, 190, 193]);
  const yazilar = [100, 130, 160].flatMap((y0, r) => xs.slice(0, -1).map((x0, c) => sol(`R${r}C${c}`, x0, y0, y0 + 30)));
  const b = pdfIzgara([sayfa({ ...l, yazilar })]).bolumler[0];
  assert.equal(b.satirlar.length, 3, "ince şerit satır değil");
  assert.ok(ozetle(b).flat().every((x) => x === "yazi"), "şeride alan / kayıt verilmez");
  assert.deepEqual([hucre(b, 0, 0).kenar?.u, hucre(b, 2, 0).kenar?.a, hucre(b, 1, 0).kenar?.u], [2, 2, 1]);
  /* 4 pt arayla çift dikey: %1'lik sütun yok */
  const d = pdfIzgara([sayfa({ ...izgara([60, 200, 204, 340, 480], [100, 130, 160]), yazilar: [sol("Kapasite (kg)", 60, 100, 130), sol("Yer", 204, 100, 130)] })]).bolumler[0];
  assert.equal(d.sutunlar.length, 3);
  assert.ok(d.sutunlar.every((w) => w > 20), d.sutunlar.join(","));
});

/** tek parça çizilmiş uydurma form: başlık şeridi · firma (şerit + satırlar) · yan yana HALAT | KANCA · imza bloğu (başlık satırı + kişiler) */
function tekParcaForm(): PdfSayfasi {
  const xs = [40, 200, 300, 400, 555], ys = [50, 66, 82, 98, 114, 130, 146, 162, 178, 194, 224];
  const bos = [
    ...[0, 1].flatMap((r) => [1, 2, 3].map((c) => `d:${r}:${c}`)), ...[2, 3].flatMap((r) => [2, 3].map((c) => `d:${r}:${c}`)),
    "d:4:1", "d:4:3", "d:6:3", "d:7:3", "d:8:3", "d:9:3",
  ];
  const k = { kalin: true };
  const cizgi = izgara(xs, ys, { bos, dolgu: true });
  return sayfa({
    dolgular: [zemin(40, 50, 515, 16), zemin(40, 66, 515, 16), zemin(40, 114, 260, 16), zemin(300, 114, 255, 16), ...cizgi.dolgular],
    yazilar: [
      orta("UYDURMA KONTROL FORMU", 40, 555, 50, 66, k), sol("1. FIRMA BILGILERI", 40, 66, 82, k),
      sol("Firma Unvanı", 40, 82, 98), sol("Adres", 40, 98, 114),
      orta("HALAT", 40, 300, 114, 130, k), orta("KANCA", 300, 555, 114, 130, k),
      sol("Cap (mm)", 40, 130, 146), sol("Emniyet mandali", 300, 130, 146),
      sol("KISI", 40, 146, 162, k), sol("KONTROLU YAPAN", 200, 146, 162, k), sol("ONAYLAYAN", 300, 146, 162, k),
      sol("Adı Soyadı", 40, 162, 178), sol("Unvanı", 40, 178, 194), sol("İmza", 40, 194, 224),
    ],
  });
}

test("tek parça çizilmiş form bantlara bölünür: şeritler, yan yana yarılar, imza bloğu; bitişik bantların ortak çizgisi bir kez", () => {
  const h = pdfIzgara([tekParcaForm()]);
  assert.deepEqual(h.bolumler.map((b) => [b.ad, b.yan]), [
    ["UYDURMA KONTROL FORMU", false], ["1. FIRMA BILGILERI", false], ["HALAT", false], ["KANCA", true], ["KISI", false],
  ]);
  for (const b of h.bolumler) assert.ok(kapsamaTam(b), `yerleşim tam değil: ${b.ad}`);
  assert.equal(h.yazi.ara, 0, "bitişik bantlar arasında boşluk yok");
  const [baslik, firma, halat, kanca, imza] = h.bolumler;
  assert.deepEqual([baslik.sutunlar, baslik.satirlar.length], [[100], 1]);
  /* firma: sütunlar yalnız bandın kullandıkları; üst kenar üstteki bandın (0), alt kenar çizili */
  assert.deepEqual(ozetle(firma), [["yazi"], ["yazi", "k:firma"], ["yazi", "k:adres"]]);
  assert.equal(firma.sutunlar.length, 2);
  assert.deepEqual([hucre(firma, 0, 0).kenar?.u, hucre(firma, 0, 0).kenar?.a], [0, 1]);
  /* yan yana: oranlar formdaki genişlik payı, sağ yarının sol kenarı soldakinin */
  assert.deepEqual([halat.oran, kanca.oran], [50, 50]);
  assert.deepEqual(ozetle(halat), [["yazi"], ["yazi", "a:Cap"]]);
  assert.deepEqual([hucre(kanca, 0, 0).kenar?.s, hucre(halat, 0, 0).kenar?.s], [0, 1]);
  /* imza bloğu: kişinin bilgisi başlığın kişisine göre */
  assert.deepEqual(ozetle(imza), [["yazi", "yazi", "yazi"], ["yazi", "k:uzman_ad", "k:teknik_ad"], ["yazi", "k:uzman_meslek", "k:teknik_meslek"], ["yazi", "imza:uzman", "imza:teknik"]]);
  const r = basilidanTanim(structuredClone(h), "Vinç");
  assert.ok(r && r.atilan.length === 0);
  assert.equal(r.tanim.gorunum.yazi?.ara, 0);
  assert.deepEqual(r.tanim.bolumler.filter((b) => b.yan || b.oran).map((b) => [b.ad, !!b.yan, b.oran]), [["HALAT", false, 50], ["KANCA", true, 50]]);
});

test("tek tablodaki firma unvanı, aynı tablonun altındaki imza bloğu yüzünden uzmanın mesleği olmaz (bant bölünmese de)", () => {
  /* şeritsiz, zeminsiz, kalınsız: bant bölme yok — imza kuralı yalnız imza başlığının altındaki hücrede */
  const xs = [40, 200, 380, 555], ys = [100, 116, 132, 148, 164];
  const h = pdfIzgara([sayfa({ ...izgara(xs, ys, { bos: ["d:0:2", "d:1:2"] }), yazilar: [
    sol("Firma Unvanı", 40, 100, 116), sol("Adres", 40, 116, 132), sol("Bilgi", 40, 132, 148), sol("KONTROLU YAPAN", 200, 132, 148), sol("ONAYLAYAN", 380, 132, 148),
    sol("Unvanı", 40, 148, 164),
  ] })]);
  assert.equal(h.bolumler.length, 1);
  assert.deepEqual(ozetle(h.bolumler[0]), [["yazi", "k:firma"], ["yazi", "k:adres"], ["yazi", "yazi", "yazi"], ["yazi", "k:uzman_meslek", "k:teknik_meslek"]]);
});

test("iki sütunlu kontrol listesi: sıra numaraları ve sahadaki madde sırası sütun sütun (önce sol), maddeye ötekinin yazısı karışmaz", () => {
  const xs = [40, 70, 250, 300, 330, 510, 555], ys = [100, 118, 136, 154, 172];
  const yazilar = [sol("No", 40, 100, 118), sol("Kontrol maddesi", 70, 100, 118), sol("Sonuç", 250, 100, 118), sol("No", 300, 100, 118), sol("Kontrol maddesi", 330, 100, 118), sol("Sonuç", 510, 100, 118)];
  for (let r = 0; r < 3; r++) yazilar.push(sol(String(r + 1), 40, ys[r + 1], ys[r + 2]), sol(`Sol ${r + 1}`, 70, ys[r + 1], ys[r + 2]), sol(String(r + 4), 300, ys[r + 1], ys[r + 2]), sol(`Sag ${r + 4}`, 330, ys[r + 1], ys[r + 2]));
  const h = pdfIzgara([sayfa({ ...izgara(xs, ys), yazilar })]);
  const r = basilidanTanim(structuredClone(h), "Vinç")!;
  const t = r.tanim.bolumler[0] as BolumOf<"tablo">;
  const no = siraNumaralari(r.tanim);
  const sutun = (c: number) => t.hucreler.filter((x) => x.tur === "sira" && x.c === c).sort((a, b) => a.r - b.r).map((x) => no.get(`${t.id}:${x.r},${x.c}`));
  assert.deepEqual([sutun(0), sutun(3)], [[1, 2, 3], [4, 5, 6]]);
  const liste = sahaTanimi(r.tanim).bolumler.find((b) => b.blok === "liste");
  assert.ok(liste && liste.blok === "liste");
  assert.deepEqual(liste.gruplar[0].maddeler.map((m) => m.metin), ["Sol 1", "Sol 2", "Sol 3", "Sag 4", "Sag 5", "Sag 6"]);
});

test("sayfa altı satır satır: kısa kod / tarih / revizyon satırı altYazi, uzun yasal paragraf yerinde; önceksiz form kodu sayfa altından", () => {
  const uzun = Array.from({ length: 3 }, (_, i) => `Uydurma yasal uyari satiri ${i + 1} ${"y".repeat(130)}`);
  const h = pdfIzgara([sayfa({ ...izgara([40, 555], [100, 120]), yazilar: [sol("Tablo", 40, 100, 120),
    yazi("ABC.021", 40, 790, { boy: 7 }), yazi("01.01.2026", 250, 790, { boy: 7 }), yazi("Rev.0", 500, 790, { boy: 7 }),
    ...uzun.map((s, i) => yazi(s, 40, 804 + i * 7, { boy: 6 }))] })]);
  assert.equal(h.altYazi, "ABC.021 · 01.01.2026 · Rev.0");
  assert.equal(h.formKodu, "ABC.021");
  assert.deepEqual(h.bolumler.map((b) => b.satirlar[0].hucreler[0].metin), ["Tablo", uzun.join("\n")]);
  /* gövdedeki kısaltma form kodu sayılmaz */
  assert.equal(pdfIzgara([sayfa({ ...izgara([40, 555], [100, 120]), yazilar: [sol("TSE.123 standardina gore", 40, 100, 120)] })]).formKodu, "");
});

test("başlıklı kutudaki tek kısa cümle sahada değiştirilen alanın hazır değeri (belgede formdaki gibi basılır)", () => {
  const cumle = "Uygunsuzluk tespit edilmemistir.";
  const cizgi = izgara([40, 555], [400, 416, 466]);
  const h = pdfIzgara([sayfa({ cizgiler: cizgi.cizgiler, dolgular: [zemin(40, 400, 515, 16)],
    yazilar: [sol("NOTLAR / UYGUNSUZLUKLAR", 40, 400, 416, { kalin: true }), orta(cumle, 40, 555, 436, 446)] })]);
  const x = hucre(h.bolumler[0], 1, 0);
  assert.deepEqual([x.tur, x.alan, x.metin, x.formul], ["alan", "metin", "", `"${cumle}"`]);
  const t = basilidanTanim(structuredClone(h), "Vinç")!.tanim;
  const id = (t.bolumler[0] as BolumOf<"tablo">).hucreler.find((y) => y.tur === "alan")!.id!;
  assert.equal(formulUygula(t, Cevaplar.parse({})).alan[id], cumle, "boşsa formdaki cümle");
  assert.equal(formulUygula(t, Cevaplar.parse({ alan: { [id]: "Kanca mandali gevsek." } })).alan[id], "Kanca mandali gevsek.", "yazılan kalır");
});

test("tarih ve saat isteyen etiketin iki değer hücresi: kayıt bir kez, ikincisi Saat alanı; iki bilgi soran etiket hücreyi ikiye böler", () => {
  const t1 = pdfIzgara([sayfa({ ...izgara([40, 200, 300, 400], [100, 118]), yazilar: [sol("Kontrol Tarihi / Saati", 40, 100, 118)] })]).bolumler[0];
  assert.deepEqual(ozetle(t1), [["yazi", "k:bas", "a:Saat"]]);
  /* imza bloğunda "Unvanı / Oda Sicil No" — değer hücresi tek sütun: sütun bölünür, iki kayıt yan yana, aradaki kenar çizilmez */
  const h = pdfIzgara([sayfa({ ...izgara([40, 200, 555], [100, 118, 136]), yazilar: [sol("KISI", 40, 100, 118, { kalin: true }), sol("KONTROLU YAPAN", 200, 100, 118, { kalin: true }),
    sol("Unvanı / Oda Sicil No", 40, 118, 136)] })]).bolumler[0];
  assert.equal(h.sutunlar.length, 3);
  assert.ok(kapsamaTam(h));
  assert.deepEqual(ozetle(h), [["yazi", "yazi"], ["yazi", "k:uzman_meslek", "k:uzman_oda"]]);
  assert.deepEqual([hucre(h, 0, 1).sutunBirlesim, hucre(h, 1, 1).kenar?.g, hucre(h, 1, 2).kenar?.s], [2, 0, 0]);
  /* tek bilgi bölünmez */
  assert.deepEqual(ozetle(pdfIzgara([sayfa({ ...izgara([40, 200, 555], [100, 118]), yazilar: [sol("E-posta", 40, 100, 118)] })]).bolumler[0]), [["yazi", "k:eposta"]]);
});

test("hücre çizgisini aşan birleşik yazı (sıra no + madde) çizgideki boşluktan bölünür; komşu boş hücreye taşan yazı onu alan yapmaz", () => {
  /* pdf.js iki yazıyı araya boşlukla tek öğe yapmış: "1 Madde 1" — boşluk No sütununun çizgisinde */
  const w = 4.5, x = 60 - 1.5 * w;
  const h = pdfIzgara([sayfa({ ...izgara([40, 60, 300, 400], [100, 118, 136, 154]), yazilar: [sol("No", 40, 100, 118), sol("Kontrol maddesi", 60, 100, 118), sol("Sonuç", 300, 100, 118),
    yazi("1 Madde 1", x, 122), yazi("2 Madde 2", x, 140)] })]).bolumler[0];
  assert.deepEqual(ozetle(h), [["yazi", "yazi", "yazi"], ["sira", "yazi", "cevap"], ["sira", "yazi", "cevap"]]);
  assert.equal(hucre(h, 1, 1).metin, "Madde 1");
  /* tek yazı iki hücreye taşar (çizgide boşluk yok): üstünden geçtiği boş hücre yazı kalır */
  const t = pdfIzgara([sayfa({ ...izgara([40, 200, 300, 555], [200, 218]), yazilar: [yazi("Cok uzun bir aciklama metni iki hucreye tasar", 43, 204)] })]).bolumler[0];
  assert.deepEqual([hucre(t, 0, 0).metin, hucre(t, 0, 1).tur, hucre(t, 0, 1).metin], ["Cok uzun bir aciklama metni iki hucreye tasar", "yazi", ""]);
});

test("madde yazısı imza başlığı sayılmaz: kontrol listesindeki açıklama kutusu imza yeri olmaz", () => {
  const xs = [40, 70, 400, 555], ys = [100, 118, 136, 154, 234];
  const h = pdfIzgara([sayfa({ ...izgara(xs, ys, { bos: ["d:3:2"] }), yazilar: [sol("No", 40, 100, 118), sol("Kontrol maddesi", 70, 100, 118), sol("Sonuc", 400, 100, 118),
    sol("1", 40, 118, 136), sol("Fren sistemi", 70, 118, 136), sol("2", 40, 136, 154), sol("Uzman onayi gereken parcalar", 70, 136, 154), sol("Aciklamalar", 40, 154, 234)] })]);
  const turler = ozetle(h.bolumler[0]).flat();
  assert.ok(!turler.some((x) => x.startsWith("imza")), turler.join(","));
  assert.deepEqual(ozetle(h.bolumler[0]).slice(1, 3), [["sira", "yazi", "cevap"], ["sira", "yazi", "cevap"]]);
});

test("çok satırlı listenin sütun başlığı (ölçüm cihazları: marka, seri no) ekipmanın kaydı değildir — her satır numaralı alan", () => {
  const xs = [40, 180, 300, 420, 555], ys = [100, 118, 136, 154, 172, 190];
  const h = pdfIzgara([sayfa({ ...izgara(xs, ys, { bos: ["d:0:1", "d:0:2", "d:0:3"] }), yazilar: [sol("KULLANILAN OLCUM CIHAZLARI", 40, 100, 118),
    sol("Cihaz adi", 40, 118, 136), sol("Marka", 180, 118, 136), sol("Seri no", 300, 118, 136), sol("Kalibrasyon tarihi", 420, 118, 136)] })]);
  const b = h.bolumler[0];
  assert.deepEqual(ozetle(b).slice(2), [1, 2, 3].map((i) => [`a:Cihaz adi ${i}`, `a:Marka ${i}`, `a:Seri no ${i}`, `a:Kalibrasyon tarihi ${i}`]));
  assert.equal(hucre(b, 2, 3).alan, "tarih");
  /* tek değer satırı (ekipmanın bilgisi) kayıttan kalır */
  const tek = pdfIzgara([sayfa({ ...izgara([40, 300, 555], [100, 118, 136]), yazilar: [sol("Marka", 40, 100, 118), sol("Seri no", 300, 100, 118)] })]).bolumler[0];
  assert.deepEqual(ozetle(tek), [["yazi", "yazi"], ["k:marka", "k:seri"]]);
});

test("iki sayfaya bölünen tablo tek tablo: sonraki sayfada tekrarlanan başlık satırı atılır, sıra no 1'den yeniden başlamaz", () => {
  const sf = (bas: number, y0: number): PdfSayfasi => {
    const ys = Array.from({ length: 26 }, (_, i) => y0 + i * 25);
    const yazilar = [sol("No", 40, ys[0], ys[1], { kalin: true }), sol("Kontrol maddesi", 80, ys[0], ys[1], { kalin: true })];
    for (let r = 1; r < 25; r++) yazilar.push(sol(String(bas + r - 1), 40, ys[r], ys[r + 1]), sol(`Madde ${bas + r - 1}`, 80, ys[r], ys[r + 1]));
    return sayfa({ ...izgara([40, 80, 555], ys), yazilar });
  };
  const h = pdfIzgara([sf(1, 100), sf(25, 40)]);
  assert.equal(h.bolumler.length, 1);
  assert.equal(h.bolumler[0].satirlar.length, 49);
  const r = basilidanTanim(structuredClone(h), "Vinç")!;
  const no = [...siraNumaralari(r.tanim).values()];
  assert.deepEqual([no.length, no[0], no[no.length - 1]], [48, 1, 48]);
  /* sayfanın üstündeki aynı sütunlu ayrı tablo (önceki sayfanın sonuna inmeyen tablonun devamı değil) birleşmez */
  const ayri = pdfIzgara([sayfa({ ...izgara([40, 555], [100, 120]), yazilar: [sol("Bolum A", 40, 100, 120)] }), sayfa({ ...izgara([40, 555], [100, 120]), yazilar: [sol("Bolum B", 40, 100, 120)] })]);
  assert.equal(ayri.bolumler.length, 2);
});

test("çok bölümlü form çeviriden geçer: 45 paragraf, dikey çizgisiz 25 satırlık liste; eklenecek bölümlere yer bırakılır", () => {
  const paragraf = pdfIzgara([sayfa({ yazilar: Array.from({ length: 45 }, (_, i) => yazi(`Paragraf ${i + 1}`, 40, 40 + i * 16)) })]);
  assert.ok(paragraf.bolumler.length <= 37, String(paragraf.bolumler.length));
  const r1 = basilidanTanim(structuredClone(paragraf), "Vinç");
  assert.ok(r1 && JSON.stringify(r1.tanim).includes("Paragraf 45"));
  /* yalnız yatay çizgili etiket | değer satırları (tablo sayılmaz, yan yana paragraflar) */
  const yatay = izgara([60, 480], Array.from({ length: 26 }, (_, i) => 40 + i * 26), { bos: Array.from({ length: 25 }, (_, r) => [`d:${r}:0`, `d:${r}:1`]).flat() });
  const liste = pdfIzgara([sayfa({ ...yatay, yazilar: Array.from({ length: 25 }, (_, r) => [yazi(`Etiket ${r + 1}`, 63, 46 + r * 26), yazi(`Deger ${r + 1}`, 343, 46 + r * 26)]).flat() })]);
  const r2 = basilidanTanim(structuredClone(liste), "Vinç");
  assert.ok(r2 && r2.tanim.bolumler.length <= 40 && JSON.stringify(r2.tanim).includes("Deger 25"));
});
