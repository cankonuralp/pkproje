/* NEREDEN GELDİ — 2026-10-16 (pkproje §9 "SONUÇ KURALI FORMAT YAPICIDA, HESAP LİSTESİ SADE"; reisim: "kurala göre otomatik uygun uygun değil diyor,
   ama ilgili ayar buradan yapılamıyor … koda gömülmüş gibi … format yapıcıya koyalım"; öneriye "onaylıyorum"). Ölçüm tablosunun satır sonucu artık
   tablonun SONUÇ KURALIYLA (formül — src/format/sonuc.ts); kodda duran Bakanlık hesapları (hesap.ts) formüle çevrildi. Bu kilit:
   · EŞDEĞERLİK — eski satır değerlendirmesinin (aşağıda birebir kopyası: hesap + sütun sınırı + olumsuz seçenek + elle) verdiği sonuç, neden,
     ağırlık ve not önerisi yeni motorla (degerlendir) aynı: nokta, selektivite, pd, zi bütün değer bileşimleriyle; linye 20 000 rastgele satırla
     (boş, yazı, virgül / nokta, sınır değerleri, B / C / D / bilinmeyen eğri, RCD var / yok, PE eşikleri 16 / 35). Yayındaki raporların sonucu
     değişmez.
   · Bilinçli fark yazılı: linye'de In (zorunlu) boşken Ib / Iz kuralı değerlendirilmez (eski hesap "Uygun" sayıyordu).
   · Kural yoksa (boş liste) kendiliğinden sonuç yok, sütun sınırı yine geçerli; firmanın kendi kuralı (DOĞRU / YANLIŞ, "Uygun değil: …", "=" neden,
     ağır kusur); kurucu açılışında kurallar tanıma yazılır, sonuç aynı; kilit özü ve yayın denetimi. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { kurucuyaHazirla } from "../src/format/duzen.ts";
import { formulDenet, tabloAdlari } from "../src/format/formul.ts";
import { linyeHesap, noktaHesap, pdHesap, rcdTestYeter, SINIR_ISARETI, sinirSonucu, ziHesap } from "../src/format/hesap.ts";
import { degerlendir, ELLE_GEREKCE, ELLE_SONUC, elleSonucu, kilitDenetimi, sonucKurallari, yayinDenetimi, type SatirDegerlendirmesi } from "../src/format/motor.ts";
import { SABLONLAR } from "../src/format/sablonlar.ts";
import { etkinKurallar, kuralDegeri, varsayilanKurallar } from "../src/format/sonuc.ts";
import { Cevaplar, FormatTanimi, TABLO_SATIR_EN_COK, type BolumOf } from "../src/format/tanim.ts";

type Olcum = BolumOf<"olcum">;
const olcum = (t: FormatTanimi, id: string) => t.bolumler.find((b) => b.id === id) as Olcum;

/* ── ESKİ satır değerlendirmesi (motor.ts, 2026-10-16 öncesi — birebir) ── */
const virgul = (n: number) => String(n).replace(".", ",");
const bos = (v: unknown) => (Array.isArray(v) ? v.length === 0 : String(v ?? "").trim() === "");
function eskiSatir(b: Olcum, s: Record<string, string>, ik3: string): SatirDegerlendirmesi {
  const neden: string[] = [];
  let uygun: boolean | null = null;
  let oneriNot: number | null = null;
  let agir = false;
  if (b.hesap === "nokta") {
    const h = noktaHesap({ egri: s.egri ?? "", In: s.inom, zx: s.zx, rcd: s.rcd, priz: s.priz === "evet" });
    oneriNot = h.not;
    if (h.zx !== null) { uygun = h.zx <= h.zs; if (!uygun) neden.push(`Zx ${virgul(h.zx)} Ω > Zs ${virgul(h.zs)} Ω`); }
  } else if (b.hesap === "selektivite") {
    const r = rcdTestYeter(s.idn, s.id, s.td);
    if (r !== null) { uygun = r; if (!r) neden.push("RCD testi yetersiz"); }
  } else if (b.hesap) {
    const h = b.hesap === "linye" ? linyeHesap({ akim: s.akim, ib: s.ib, iz: s.iz, faz: s.faz, npen: s.npen, pe: s.pe, icu: s.icu, rcd: s.rcd, id: s.id, td: s.td }, ik3)
      : b.hesap === "pd" ? pdHesap({ kesit: s.kesit, tkesit: s.tkesit }) : ziHesap({ direnc: s.direnc });
    if (h) { uygun = h.uygun; neden.push(...h.neden); }
  }
  for (const c of b.sutunlar) {
    if (c.olumsuz?.length && !bos(s[c.id])) {
      if (c.olumsuz.includes(s[c.id])) { neden.push(`${c.ad}: ${s[c.id]}`); uygun = false; agir ||= c.agir; }
      else if (uygun === null) uygun = true;
      continue;
    }
    const r = sinirSonucu(c.op, c.sinir, s[c.id]);
    if (r === null) continue;
    if (!r) { neden.push(`${c.ad} ${s[c.id]}${c.birim ? ` ${c.birim}` : ""} (sınır ${SINIR_ISARETI[c.op!]} ${virgul(c.sinir!)})`); uygun = false; agir ||= c.agir; }
    else if (uygun === null) uygun = true;
  }
  const elle = b.notlar?.length ? null : elleSonucu(s);
  if (elle !== null) {
    const gerekce = (s[ELLE_GEREKCE] ?? "").trim();
    return { uygun: elle, neden: elle ? [] : [...neden, `Denetçi: ${gerekce || "gerekçe yazılmadı"}`], oneriNot, agir: elle ? false : agir, elle: { kural: uygun, gerekce } };
  }
  return { uygun, neden, oneriNot, agir };
}

/** satırları tabloya parça parça (raporun sınırı) koyup yeni motorla değerlendirir; her satırı eskisiyle karşılaştırır */
function karsilastir(t: FormatTanimi, bid: string, satirlar: Record<string, string>[], ik3 = "", atla: (s: Record<string, string>) => boolean = () => false): number {
  const b = olcum(t, bid);
  let sayi = 0;
  for (let p = 0; p < satirlar.length; p += TABLO_SATIR_EN_COK) {
    const parca = satirlar.slice(p, p + TABLO_SATIR_EN_COK);
    const d = degerlendir(t, Cevaplar.parse({ tablo: { [bid]: parca }, deger: ik3 ? { ik3 } : {} }));
    parca.forEach((s, i) => {
      if (atla(s)) return;
      assert.deepEqual(d.satirlar[bid][i], eskiSatir(b, s, ik3), `${bid} ${JSON.stringify(s)} ik3=${ik3}`);
      sayi++;
    });
  }
  return sayi;
}
/** değer kümelerinin bütün bileşimleri */
function bilesim(k: Record<string, readonly string[]>): Record<string, string>[] {
  let l: Record<string, string>[] = [{}];
  for (const [ad, v] of Object.entries(k)) l = l.flatMap((s) => v.map((x) => (x === "" ? { ...s } : { ...s, [ad]: x })));
  return l;
}
/** tohumlu rastgele (testler her koşuda aynı satırları üretir) */
function rastgele(tohum: number) {
  let x = tohum >>> 0;
  return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 2 ** 32; };
}

const Z1 = FormatTanimi.parse(SABLONLAR.ZPKR01.tanim), Z2 = FormatTanimi.parse(SABLONLAR.ZPKR02.tanim);

test("eşdeğerlik — ZPKR01 ölçüm noktaları (Zx ≤ Zs, ZS işlevi): bütün eğri × In × Zx × RCD × priz bileşimleri", () => {
  const n = karsilastir(Z1, "nokta", bilesim({
    ad: ["N1"], egri: ["", "B", "C", "D", "X"], inom: ["", "0", "6", "10", "16", "32", "63", "abc", "2,5", "2.5"],
    zx: ["", "0", "0,365", "0.365", "0,366", "0,1", "1", "12,5", "abc", "7,667"], rcd: ["", "30"], priz: ["", "evet", "hayir"], rcd_td: ["", "150", "201"],
  }));
  assert.ok(n > 5_000, `${n} satır`);
});

test("eşdeğerlik — ZPKR01 RCD selektivite: IΔn × IΔ × TΔ (sayı, boş, yazı, sınır)", () => {
  const v = ["", "30", "29", "31", "abc", "0", "200", "201", "199,5"];
  assert.equal(karsilastir(Z1, "selektif", bilesim({ ad: ["P1"], idn: v, id: v, td: v })), 729);
});

test("eşdeğerlik — ZPKR02 potansiyel dengeleme ve zemin izolasyonu: bütün bileşimler", () => {
  const k = ["", "4", "5,9", "6", "16", "25", "25,1", "abc", "3,9", "25.0"];
  assert.equal(karsilastir(Z2, "pd", bilesim({ yer: ["Y"], kesit: k, tkesit: k })), 100);
  assert.equal(karsilastir(Z2, "zi", bilesim({ yer: ["Y"], direnc: ["", "50", "50,1", "49", "abc", "0", "100", "50.0", "50,0001"] })), 9);
});

test("eşdeğerlik — ZPKR02 pano sigortaları (linye): 20 000 rastgele satır × kısa devre akımı", () => {
  const K: Record<string, readonly string[]> = {
    akim: ["16", "32", "63", "10"], ib: ["", "10", "16", "20", "abc", "32"], iz: ["", "15", "16", "25", "abc"], faz: ["", "1,5", "2.5", "16", "17", "35", "36", "50", "abc"],
    npen: ["", "1,5", "16", "50", "35"], pe: ["", "1,5", "16", "17", "18", "25", "abc", "8"], icu: ["", "4", "6", "10", "abc"], rcd: ["", "30", "abc"],
    id: ["", "25", "31", "30"], td: ["", "150", "200", "201"], tip: ["", "B", "C"],
  };
  const r = rastgele(586);
  const satirlar = Array.from({ length: 20_000 }, (_, i) => {
    const s: Record<string, string> = { no: `F${i + 1}`, devre: "D" };
    for (const [ad, v] of Object.entries(K)) { const x = v[Math.floor(r() * v.length)]; if (x) s[ad] = x; }
    return s;
  });
  let n = 0;
  for (const k3 of ["", "4,8", "6", "abc", "10"]) n += karsilastir(Z2, "linye", satirlar.slice(0, 4_000), k3);
  n += karsilastir(Z2, "linye", satirlar, "4,8");
  assert.ok(n >= 40_000, `${n} satır`);
});

test("eşdeğerlik — elle sonuç (488) ve sütun sınırı kurallarla birlikte aynı", () => {
  const l: Record<string, string>[] = [
    { ad: "N1", egri: "C", inom: "63", zx: "0,5", rcd_td: "250", [ELLE_SONUC]: "uygun", [ELLE_GEREKCE]: "Yerinde yeniden ölçüldü" },
    { ad: "N2", egri: "C", inom: "63", zx: "0,2", [ELLE_SONUC]: "uygun_degil", [ELLE_GEREKCE]: "Kablo hasarlı görüldü" },
  ];
  /* nokta tablosunda uygunluk notu var — elle sonuç orada yok sayılır; notsuz kopyada da aynı */
  const notsuz = { ...Z1, bolumler: Z1.bolumler.map((b) => (b.id === "nokta" && b.blok === "olcum" ? { ...b, notlar: undefined } : b)) };
  assert.equal(karsilastir(Z1, "nokta", l), 2);
  assert.equal(karsilastir(notsuz, "nokta", l), 2);
});

test("bilinçli fark: linye'de In boşken Ib / Iz kuralı değerlendirilmez (eski hesap 'Uygun' sayıyordu — In zorunlu, böyle satır onaya gitmez)", () => {
  const s = { no: "F1", devre: "D", ib: "10", iz: "20" };
  assert.equal(eskiSatir(olcum(Z2, "linye"), s, "").uygun, true);
  const d = degerlendir(Z2, Cevaplar.parse({ tablo: { linye: [s] } }));
  assert.equal(d.satirlar.linye[0].uygun, null);
  /* In yazılınca ikisi aynı */
  assert.equal(karsilastir(Z2, "linye", [{ ...s, akim: "16" }, { ...s, akim: "25" }]), 2);
});

test("varsayılan kurallar sütunlara kimlikle bakar: firma sütunun adını değiştirse de sonuç aynı", () => {
  const ad = (b: Olcum) => ({ ...b, sutunlar: b.sutunlar.map((x) => (x.id === "zx" ? { ...x, ad: "Ölçülen Zx" } : x.id === "inom" ? { ...x, ad: "Anma akımı In" } : x)) });
  const t = { ...Z1, bolumler: Z1.bolumler.map((b) => (b.id === "nokta" && b.blok === "olcum" ? ad(b) : b)) };
  const k = varsayilanKurallar(t, olcum(t, "nokta"));
  assert.ok(k[0].kosul.includes("[Ölçülen Zx]") && k[0].kosul.includes("[Anma akımı In]"), k[0].kosul);
  assert.equal(karsilastir(t, "nokta", [{ ad: "N", egri: "C", inom: "63", zx: "0,4" }, { ad: "N", egri: "B", inom: "16", zx: "2" }]), 2);
});

test("varsayılan kurallar okunur formül: kurucuda görünen biçim, formül denetiminden geçer", () => {
  for (const [t, ids] of [[Z1, ["nokta", "selektif"]], [Z2, ["linye", "pd", "zi"]]] as const) {
    for (const id of ids) {
      const b = olcum(t, id);
      const k = varsayilanKurallar(t, b);
      assert.ok(k.length > 0, id);
      for (const x of k) {
        assert.equal(formulDenet(x.kosul, tabloAdlari(t, b)), null, `${id}: ${x.kosul}`);
        if (x.neden?.startsWith("=")) assert.equal(formulDenet(x.neden.slice(1), tabloAdlari(t, b)), null, `${id}: ${x.neden}`);
        assert.ok(x.aciklama, `${id}: açıklama`);
      }
    }
  }
  assert.deepEqual(varsayilanKurallar(Z1, olcum(Z1, "nokta")).map((k) => k.kosul), ["[Zx] <= ZS([Açma eğrisi]; [In])"]);
  assert.deepEqual(varsayilanKurallar(Z2, olcum(Z2, "zi")).map((k) => k.kosul), ["[Direnç] > 50"]);
  /* açıklamalar eski "Sonuç neye göre çıkar?" cümleleri */
  const linye = sonucKurallari(olcum(Z2, "linye"), Z2);
  assert.ok(linye.includes("Ib ≤ In ≤ Iz") && linye.includes("N/PEN kesiti ≥ faz kesiti"), linye.join(" | "));
});

test("kural kaldırılınca (boş liste) kendiliğinden sonuç yok; sütun sınırı yine geçerli; 'Sonuç neye göre çıkar?' boşalır", () => {
  const t = { ...Z1, bolumler: Z1.bolumler.map((b) => (b.id === "nokta" && b.blok === "olcum" ? { ...b, sonucKurali: [] } : b)) };
  const d = degerlendir(t, Cevaplar.parse({ tablo: { nokta: [{ ad: "N", egri: "C", inom: "63", zx: "5" }, { ad: "N", egri: "C", inom: "63", zx: "5", rcd_td: "250" }] } }));
  assert.deepEqual(d.satirlar.nokta.map((x) => x.uygun), [null, false]);
  assert.deepEqual(sonucKurallari(olcum(t, "nokta"), t), ["RCD testi TΔ ≤ 200 ms"]);
  /* öneri notu (Bakanlık hesabı) kalır */
  assert.equal(d.satirlar.nokta[0].oneriNot, 2);
});

test("firmanın kendi kuralı: DOĞRU / YANLIŞ, 'Uygun değil: …' yazısı, '=' ile neden, ağır kusur, boş kural, sırası ve tekrar etmeyen neden", () => {
  const t = FormatTanimi.parse({
    sema: 1, bolumler: [{ id: "o", ad: "Ölçüm", blok: "olcum", sutunlar: [{ id: "a", ad: "Direnç" }, { id: "b", ad: "Sıcaklık" }], sonucKurali: [
      { kosul: "[Direnç] >= 1", neden: "Direnç düşük" },
      { kosul: "EĞER([Sıcaklık] > 70; \"Uygun değil: aşırı ısınma\"; \"Uygun\")" },
      { kosul: "[Direnç] < 1000", neden: "=\"Direnç \" & [Direnç] & \" çok yüksek\"", agir: true },
      { kosul: "" },
      { kosul: "[Direnç] >= 1", neden: "Direnç düşük" },
    ] }],
  });
  const d = degerlendir(t, Cevaplar.parse({ tablo: { o: [{ a: "0,5", b: "80" }, { a: "5", b: "20" }, { a: "5000" }, {}, { a: "abc", b: "10" }] } }));
  const r = d.satirlar.o;
  assert.deepEqual([r[0].uygun, r[0].neden, r[0].agir], [false, ["Direnç düşük", "aşırı ısınma"], false]);
  assert.deepEqual([r[1].uygun, r[1].neden], [true, []]);
  assert.deepEqual([r[2].uygun, r[2].neden, r[2].agir], [false, ["Direnç 5000 çok yüksek"], true]);
  /* boş satırda karşılaştırma boş → değerlendirilmez; EĞER ise Excel gibi boşta ikinci kolu verir ("Uygun") — kural yazanın seçimi */
  assert.deepEqual([r[3].uygun, r[3].neden], [true, []]);
  /* sayı kutusunda yazı boş sayılır (kural değerlendirilmez); sıcaklık kuralı "Uygun" */
  assert.deepEqual([r[4].uygun, r[4].neden], [true, []]);
  assert.ok(d.kusurlar.some((k) => k.metin.includes("aşırı ısınma")), "kusur listesinde");
  assert.ok(yayinDenetimi(t).some((x) => x.includes("4. sonuç kuralı boş")), yayinDenetimi(t).join(" | "));
});

test("kuralın değeri: DOĞRU / YANLIŞ / 'Uygun' / 'Uygun değil[: neden]' — sayı ve başka yazı değerlendirilmez", () => {
  assert.deepEqual(kuralDegeri(true), { uygun: true });
  assert.deepEqual(kuralDegeri(false), { uygun: false, neden: null });
  assert.deepEqual(kuralDegeri(" uygun "), { uygun: true });
  assert.deepEqual(kuralDegeri("Uygun değil"), { uygun: false, neden: null });
  assert.deepEqual(kuralDegeri("UYGUN DEĞİL: Kablo  ezik"), { uygun: false, neden: "Kablo  ezik" });
  assert.deepEqual(kuralDegeri("Uygun degil:"), { uygun: false, neden: null });
  for (const x of [0, 1, "", "Uygundur", "Uygun değildir", null]) assert.equal(kuralDegeri(x), null, String(x));
});

test("kurucu açılışında hesaplı tabloların kuralları tanıma yazılır; sonuç aynı, kilit özü değişmez; kural değişince uyarı", () => {
  const h = kurucuyaHazirla(Z2);
  const linye = olcum(h, "linye");
  assert.ok(linye.sonucKurali && linye.sonucKurali.length === 5, "linye: beş kural");
  assert.deepEqual(etkinKurallar(h, linye), varsayilanKurallar(Z2, olcum(Z2, "linye")));
  assert.deepEqual(kilitDenetimi(h, Z2), [], "yazılan kurallar Bakanlık kuralıyla aynı");
  const c = Cevaplar.parse({ tablo: { linye: [{ no: "F1", devre: "D", akim: "16", ib: "20", faz: "50", pe: "16", icu: "4" }] }, deger: { ik3: "4,8" } });
  assert.deepEqual(degerlendir(h, c).satirlar, degerlendir(Z2, c).satirlar);
  /* firma kuralı değiştirince Bakanlık uyarısı (engel değil) */
  const degisen = { ...h, bolumler: h.bolumler.map((b) => (b.id === "zi" && b.blok === "olcum" ? { ...b, sonucKurali: [{ kosul: "[Direnç] > 40" }] } : b)) };
  assert.ok(kilitDenetimi(degisen, Z2).some((x) => x.includes("zi")), kilitDenetimi(degisen, Z2).join(" | "));
  /* hesapsız tablo kurallarsız kalır */
  const k = FormatTanimi.parse(SABLONLAR.KOMPRESOR?.tanim ?? Z1);
  for (const b of kurucuyaHazirla(k).bolumler) if (b.blok === "olcum" && !b.hesap) assert.equal(b.sonucKurali, undefined, b.id);
});

/* ── kurucu, S.A.Y ve sürüm farkı ── */
test("kurucu: kural biçimi (köşeli parantez, \"=\" neden), en çok 20, boş liste; ad değişince kuraldaki ad da; Bakanlık kuralına dön", async () => {
  const { bakanlikKuralinaDon, kuralDuzelt, ogeYaz, sonucKuraliYaz } = await import("../src/modules/rapor-format/kurucu.ts");
  assert.deepEqual(kuralDuzelt({ kosul: "Direnç>50", neden: "=  \"D \" & Direnç ", aciklama: "  çok   boşluk ", agir: false }),
    { kosul: "[Direnç] > 50", neden: "=\"D \" & [Direnç]", aciklama: "çok boşluk" });
  assert.deepEqual(kuralDuzelt({ kosul: "", neden: "  " }), { kosul: "" });
  const h = kurucuyaHazirla(Z2), i = h.bolumler.findIndex((b) => b.id === "zi");
  const y = sonucKuraliYaz(h, i, Array.from({ length: 25 }, (_, j) => ({ kosul: `[Direnç] > ${j}` })));
  assert.equal(olcum(y, "zi").sonucKurali?.length, 20);
  assert.deepEqual(olcum(sonucKuraliYaz(h, i, []), "zi").sonucKurali, []);
  /* sütunun adı değişince kuraldaki adı da değişir (koşul ve "=" neden) */
  const ad = ogeYaz(h, i, "direnc", { ad: "Ölçülen direnç" });
  assert.equal(olcum(ad, "zi").sonucKurali?.[0].kosul, "[Ölçülen direnç] > 50");
  const n = h.bolumler.findIndex((b) => b.id === "nokta" || b.id === "linye");
  const lin = ogeYaz(h, n, "icu", { ad: "Kesme kapasitesi" });
  assert.ok(olcum(lin, "linye").sonucKurali!.some((k) => k.kosul.includes("[Kesme kapasitesi]") && k.neden?.includes("[Kesme kapasitesi]")));
  /* değiştirilen kural Bakanlık kuralına döner */
  const d = sonucKuraliYaz(h, i, [{ kosul: "[Direnç] > 1" }]);
  assert.deepEqual(olcum(bakanlikKuralinaDon(d, i), "zi").sonucKurali, varsayilanKurallar(h, olcum(h, "zi")));
});

test("formül paneli: tuşlarda yalnız bölümün (tablonun) adları, öteki kutular 'Diğer'de bölüm bölüm; ad bir kez, kendisi yok", async () => {
  const { formulAdGruplari } = await import("../src/modules/rapor-format/kurucu.ts");
  const linye = olcum(Z2, "linye");
  const g = formulAdGruplari(Z2, linye, "Iz");
  assert.ok(g.kendi.includes("Ib") && !g.kendi.includes("Iz"), g.kendi.join(", "));
  assert.ok(!g.kendi.includes("Hesaplanan 3 fazlı kısa devre akımı"));
  const fonk = g.diger.find((x) => x.bolum === "Fonksiyon testleri");
  assert.ok(fonk?.adlar.includes("Hesaplanan 3 fazlı kısa devre akımı"), JSON.stringify(g.diger.map((x) => x.bolum)));
  assert.ok(g.diger.some((x) => x.bolum === "Pano sigortaları (linye) (bütün tablo)"));
  const hepsi = [...g.kendi, ...g.diger.flatMap((x) => x.adlar)].map((x) => x.toLocaleLowerCase("tr"));
  assert.equal(new Set(hepsi).size, hepsi.length, "ad bir kez");
  /* bilgi alanında: kendi bölümünün alanları önce */
  const ek = Z2.bolumler.find((b) => b.id === "ekipman")!;
  const e = formulAdGruplari(Z2, ek, "Şebeke tipi");
  assert.ok(e.kendi.includes("Şebeke gerilimi") && !e.kendi.includes("Şebeke tipi"));
  assert.ok(e.diger.some((x) => x.bolum === "Pano sigortaları (linye)" && x.adlar.includes("Icu")));
});

test("S.A.Y format yapıcıda: haritada sonuç kuralı; sonuc_kurali yazar / kaldırır / Bakanlık kuralına döner; ölçüm tablosu değilse nedeniyle", async () => {
  const { formatHaritasi, formatIslemleri, FORMAT_ARACI } = await import("../src/modules/rapor-format/say-kurucu.ts");
  const h = kurucuyaHazirla(Z2);
  assert.match(formatHaritasi(h), /^ {2}sonuç kuralı \(Bakanlık tablosu\):$/m);
  assert.match(formatHaritasi(h), /^ {2}1\) \[Direnç\] > 50 · neden Zemin izolasyon direnci 50 kΩ'dan büyük değil$/m);
  const r = formatIslemleri(h, [
    { islem: "sonuc_kurali", bolum: "zi", kurallar: [{ kosul: "Direnç>40", neden: "Düşük" }] },
    { islem: "sonuc_kurali", bolum: "Potansiyel dengeleme", kurallar: [] },
    { islem: "sonuc_kurali", bolum: "fonk", kurallar: [] },
    { islem: "sonuc_kurali", bolum: "linye", bakanlik: true },
    { islem: "sonuc_kurali", bolum: "zi" },
  ]);
  assert.deepEqual(olcum(r.t, "zi").sonucKurali, [{ kosul: "[Direnç] > 40", neden: "Düşük" }]);
  assert.deepEqual(olcum(r.t, "pd").sonucKurali, []);
  assert.equal(r.yapilan.length, 3);
  assert.equal(r.gecersiz.length, 2, r.gecersiz.join(" | "));
  assert.ok(r.gecersiz[0].includes("yalnız ölçüm tablosunda") && r.gecersiz[1].includes("kurallar listesi yok"));
  const enumlar = FORMAT_ARACI.input_schema.properties.islemler.items.properties.islem.enum as readonly string[];
  assert.ok(enumlar.includes("sonuc_kurali"));
});

test("sürüm farkı: kuralın tanıma yazılması değişiklik değil; kural değişince 'Sonuç kuralı değişti'", async () => {
  const { surumFarki } = await import("../src/modules/rapor-format/fark.ts");
  const h = kurucuyaHazirla(Z2);
  assert.ok(!surumFarki(Z2, h).some((f) => f.metin.includes("Pano sigortaları") || f.metin.includes("Sonuç kuralı")), JSON.stringify(surumFarki(Z2, h)));
  const i = h.bolumler.findIndex((b) => b.id === "zi");
  const { sonucKuraliYaz } = await import("../src/modules/rapor-format/kurucu.ts");
  assert.ok(surumFarki(h, sonucKuraliYaz(h, i, [])).some((f) => f.metin === "Sonuç kuralı değişti: “Zemin izolasyonu”"));
});
