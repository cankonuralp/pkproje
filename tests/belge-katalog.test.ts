/* NEREDEN GELDİ: 2026-10-25 — reisim: "ama sadece zimmet ve bilgilendirme formu değil herhangi bir form ekleme mekaniği bu şekilde çalışmalı aynı
   araca bağlamalıyız zaten araç yapılı sadece bağlama işi yapılacak". Programın bütün belgeleri (zimmet, araç tutanağı, eğitim, izin, masraf, teklif,
   fatura özeti, saha, ön bilgilendirme) rapor şablonunun aracına bağlanır: katalog (src/belge/katalog.ts) her belgenin bilgilerini verisinden
   eşler; firmanın formatında kayıt hücresi veri ("alan" / çoğalan satırda "liste.kolon") ile okur (belge.ts belgeFormu); format yoksa temel format.
   Kilitler: katalogdaki her alan / liste kolonu eşleme işlevinin çıktısında var ve tersi; örnek değerler aynı anahtarlarda; talep satır adları
   sunucuyla aynı; veri hücresi ve çoğalan satır (3 öğe → 3 satır) doğru çizilir; veri'li tanım şemadan geçer; temel ön bilgilendirme formu.
   Saf (veritabanısız). Olumsuz kanıt: tests/bozan/belge-katalog.bozan.ts. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { belgeFormu, raporBelgesi } from "../src/belge/belge.ts";
import { htmlYaz } from "../src/belge/html.ts";
import {
  aracDegerleri, BELGE_KATALOGU, BELGE_TURLERI, belgeCizimi, belgeTuruMu, egitimDegerleri, faturaDegerleri, onBilgiDegerleri, ornekDegerler, sahaDegerleri,
  TALEP_ALANLARI, talepDegerleri, teklifDegerleri, zimmetDegerleri, type BelgeDegerleri, type BelgeKatalogu, type BelgeTuru,
} from "../src/belge/katalog.ts";
import { onBilgiFormu, type OnBilgiVerisi } from "../src/belge/onbilgi.ts";
import { ornekAracTutanagi, ornekBelge, ornekEgitimFormu, ornekFatura, ornekTalep, ornekTeklif, ornekZimmetFormu } from "../src/belge/ornek.ts";
import type { SahaFormuVerisi } from "../src/belge/saha.ts";
import type { TalepFormuVerisi } from "../src/belge/talep.ts";
import { zimmetFormu } from "../src/belge/zimmet.ts";
import { FormatTanimi, Hucre } from "../src/format/tanim.ts";

const SAHA: SahaFormuVerisi = {
  firma: { ad: "Deneme Muayene A.Ş.", kod: "DA" }, no: "P-1026-001-SF1", projeNo: "P-1026-001", baslangic: "2026-10-05", bitis: "2026-10-06",
  musteri: "Deneme Sanayi A.Ş.", tesis: "Merkez", adres: null, ekipmanlar: [{ kod: "HT-1", tur: "Hava tankı", konum: null }], uzmanlar: ["Deneme Bir"],
};
const ON_BILGI: OnBilgiVerisi = {
  firma: { ad: "Deneme Muayene A.Ş.", kod: "DA", adres: "Deneme Cad. 1" }, projeNo: "P-1026-002", tarih: "2026-10-01", musteri: "Deneme <b>Sanayi</b> & Ort.",
  tesis: "Merkez", adres: "Deneme Cad. 2, Gebze / Kocaeli", baslangic: "2026-10-05", bitis: "2026-10-05", uzmanlar: [{ ad: "Deneme Bir", meslek: "Makine mühendisi" }],
  ekipmanlar: [{ kod: "HT-1", tur: "Hava tankı", konum: "Kazan dairesi" }, { kod: "FK-1", tur: "Forklift", konum: null }],
};
const IZIN: TalepFormuVerisi = { ...ornekTalep(), tip: "izin", no: "IZ-1026-001", karar: null,
  alanlar: [["İzin türü", "Yıllık izin"], ["Başlangıç", "12.10.2026"], ["Bitiş", "16.10.2026"], ["Süre", "5 iş günü"], ["Açıklama", ""], ["Ek belge", "-"]] };
/** her belge türünün gerçek veri biçimindeki örneği → eşleme çıktısı */
const ESLEME: Record<BelgeTuru, () => BelgeDegerleri> = {
  zimmet: () => zimmetDegerleri(ornekZimmetFormu()), arac: () => aracDegerleri(ornekAracTutanagi()), egitim: () => egitimDegerleri(ornekEgitimFormu()),
  izin: () => talepDegerleri(IZIN), masraf: () => talepDegerleri(ornekTalep()), teklif: () => teklifDegerleri(ornekTeklif()), fatura: () => faturaDegerleri(ornekFatura()),
  saha: () => sahaDegerleri(SAHA), onbilgi: () => onBilgiDegerleri(ON_BILGI),
};
/** katalogla değerlerin anahtar farkı (boşsa birebir) */
function fark(k: BelgeKatalogu, d: BelgeDegerleri): string[] {
  const f: string[] = [];
  const ayni = (ne: string, a: readonly string[], b: readonly string[]) => {
    for (const x of a) if (!b.includes(x)) f.push(`${ne}: katalogda var, değerlerde yok — ${x}`);
    for (const x of b) if (!a.includes(x)) f.push(`${ne}: değerlerde var, katalogda yok — ${x}`);
  };
  ayni("alan", k.alanlar.map((x) => x.anahtar), Object.keys(d.alanlar));
  ayni("liste", k.listeler.map((x) => x.anahtar), Object.keys(d.listeler));
  for (const l of k.listeler) (d.listeler[l.anahtar] ?? []).forEach((s, i) => ayni(`${l.anahtar}[${i}]`, l.kolonlar.map((x) => x.anahtar), Object.keys(s)));
  for (const [x, y] of Object.entries(d.alanlar)) if (typeof y !== "string") f.push(`alan ${x} metin değil`);
  return f;
}

test("katalog: her belge türünde; anahtarlar tekil ve kayıt hücresinin veri biçiminde (alan, liste.kolon); belgeTuruMu", () => {
  assert.deepEqual(Object.keys(BELGE_KATALOGU).sort(), [...BELGE_TURLERI].sort());
  for (const b of BELGE_TURLERI) {
    const k = BELGE_KATALOGU[b];
    assert.equal(k.anahtar, b);
    assert.ok(k.ad.trim());
    const alanlar = k.alanlar.map((x) => x.anahtar), listeler = k.listeler.map((x) => x.anahtar);
    assert.equal(new Set(alanlar).size, alanlar.length, `${b}: alan iki kez`);
    assert.equal(new Set(listeler).size, listeler.length, `${b}: liste iki kez`);
    for (const x of ["firma_ad", "firma_adres", "form_kod", "belge_no", "tarih"]) assert.ok(alanlar.includes(x), `${b}: ortak alan ${x}`);
    const veri = [...alanlar, ...k.listeler.flatMap((l) => {
      const kl = l.kolonlar.map((x) => x.anahtar);
      assert.equal(new Set(kl).size, kl.length, `${b}.${l.anahtar}: kolon iki kez`);
      return kl.map((x) => `${l.anahtar}.${x}`);
    })];
    for (const x of veri) assert.ok(Hucre.safeParse({ r: 0, c: 0, tur: "kayit", veri: x }).success, `${b}: veri biçimi ${x}`);
  }
  assert.ok(belgeTuruMu("zimmet") && belgeTuruMu("onbilgi"));
  assert.ok(!belgeTuruMu("rapor") && !belgeTuruMu(null) && !belgeTuruMu("toString"));
});

test("eşleme: katalogdaki her alan ve liste kolonu belgenin verisinden gelir, fazlası yok; örnek değerler aynı anahtarlarda, listeleri dolu", () => {
  for (const b of BELGE_TURLERI) {
    assert.deepEqual(fark(BELGE_KATALOGU[b], ESLEME[b]()), [], `${b} eşleme`);
    const o = ornekDegerler(b);
    assert.deepEqual(fark(BELGE_KATALOGU[b], o), [], `${b} örnek`);
    for (const l of BELGE_KATALOGU[b].listeler) assert.ok(o.listeler[l.anahtar].length >= 1, `${b}.${l.anahtar} örneği boş`);
  }
});

test("değerler: tarih GG.AA.YYYY, tutar kuruştan '1.234,56 TL', zaman Türkiye saatiyle; yok olan bilgi boş; temel formatın kodu ve metinleri", () => {
  const z = zimmetDegerleri(ornekZimmetFormu());
  assert.deepEqual([z.alanlar.tarih, z.alanlar.form_kod, z.alanlar.belge_no, z.alanlar.alan_ad, z.alanlar.eden_ad], ["06.10.2026", "DA-FR-ZMT-01", "ZF-1026-001", "Deneme Denetçi", "Deneme Yönetici"]);
  assert.deepEqual(z.listeler.varlik.map((x) => [x.kod, x.teslim, x.not]), [["OC-201", "01.09.2026", "kalibrasyon 15.03.2027"], ["34 DNM 001", "", ""]]);
  assert.equal(zimmetDegerleri({ ...ornekZimmetFormu(), no: null, eden: null }).alanlar.eden_ad, "Firma adına");
  const t = teklifDegerleri(ornekTeklif());
  assert.deepEqual([t.alanlar.ara_toplam, t.alanlar.kdv_tutari, t.alanlar.genel_toplam, t.alanlar.kdv_orani], ["3.400,50 TL", "680,10 TL", "4.080,60 TL", "%20"]);
  assert.deepEqual(t.listeler.kalem.map((k) => [k.tur, k.brans, k.periyot, k.adet, k.birim_fiyat, k.tutar]),
    [["Hava tankı", "Mekanik", "12 ay", "2", "1.250,00 TL", "2.500,00 TL"], ["Elektrik iç tesisatı", "Elektrik", "12 ay", "1", "900,50 TL", "900,50 TL"]]);
  assert.ok(t.alanlar.kosullar.startsWith("Bu teklif 04.11.2026 tarihine kadar geçerlidir."));
  const f = faturaDegerleri(ornekFatura());
  assert.deepEqual(f.listeler.kalem.map((k) => [k.birim_fiyat, k.tutar, k.teklif_disi]), [["1.250,00 TL", "2.500,00 TL", ""], ["900,00 TL", "900,00 TL", "teklif dışı"], ["fiyatsız", "", ""]]);
  assert.deepEqual([f.alanlar.kalan, f.listeler.tahsilat[0].tarih], ["2.000,00 TL", "10.10.2026"]);
  const a = aracDegerleri(ornekAracTutanagi());
  assert.deepEqual([a.alanlar.tarih, a.alanlar.saat, a.alanlar.eden_ad, a.alanlar.form_kod], ["06.10.2026", "09:30", "Depo · firma adına", "DA-FR-ARC-01"]);
  assert.deepEqual(a.listeler.kontrol.map((x) => [x.kalem, x.var, x.yok]), [["Ruhsat", "X", ""], ["Trafik sigortası poliçesi", "X", ""], ["Anahtar (2 adet)", "", "X"]]);
  const m = talepDegerleri(ornekTalep());
  assert.deepEqual([m.alanlar.form_kod, m.alanlar.tarih, m.alanlar.gonderildi, m.alanlar.masraf_turu, m.alanlar.tutar, m.alanlar.odendi, m.alanlar.karar],
    ["DA-FR-MSR-01", "05.10.2026", "05.10.2026 12:30", "Yakıt", "250,00 TL", "", "Onaylandı"]);
  const i = talepDegerleri(IZIN);
  assert.deepEqual([i.alanlar.form_kod, i.alanlar.izin_turu, i.alanlar.sure, i.alanlar.karar, i.alanlar.onaylayan], ["DA-FR-IZN-01", "Yıllık izin", "5 iş günü", "", ""]);
  const s = sahaDegerleri(SAHA);
  assert.deepEqual([s.alanlar.tarih, s.alanlar.adres, s.alanlar.form_kod], ["05.10.2026 – 06.10.2026", "", "DA-FR-SAH-01"]);
  const o = onBilgiDegerleri(ON_BILGI);
  assert.deepEqual([o.alanlar.form_kod, o.alanlar.belge_no, o.alanlar.planlanan, o.listeler.ekipman[1].konum], ["DA-FR-OBF-01", "P-1026-002", "05.10.2026", ""]);
});

test("talep satır adları talepler sunucusundakiyle aynı (ad değişirse alan boş kalırdı)", () => {
  const sunucu = readFileSync("src/modules/talepler/server/talepler.ts", "utf8");
  for (const [tip, l] of Object.entries(TALEP_ALANLARI)) for (const [, etiket] of l) assert.ok(sunucu.includes(`["${etiket}", `), `${tip}: "${etiket}" sunucuda yok`);
});

/* firmanın zimmet formu: üstte veri hücresi, altta çoğalan satır (sıra · kod · ad) varlık listesinden */
const TANIM = FormatTanimi.parse({
  sema: 1, gorunum: { serbest: true }, bolumler: [{
    id: "b1", ad: "Form", blok: "tablo", sutun: [20, 40, 40], satirlar: [{}, { tekrar: true, id: "v1" }, {}],
    hucreler: [
      { r: 0, c: 0, tur: "yazi", m: "Teslim alan" }, { r: 0, c: 1, cs: 2, tur: "kayit", veri: "alan_ad" },
      { r: 1, c: 0, tur: "sira" }, { r: 1, c: 1, tur: "kayit", veri: "varlik.kod" }, { r: 1, c: 2, tur: "kayit", veri: "varlik.ad" },
      { r: 2, c: 0, tur: "yazi", m: "İmza" }, { r: 2, c: 1, tur: "imza", kim: "uzman" }, { r: 2, c: 2, tur: "kayit", veri: "varlik.kod" },
    ],
  }],
});
const ZIMMET3 = { ...ornekZimmetFormu(), varliklar: [
  { kod: "OC-201", ad: "Topraklama <ölçer>", tur: "Ölçüm cihazı", teslim: null, not: null }, { kod: "DM-2", ad: "Dizüstü", tur: "Demirbaş", teslim: null, not: null },
  { kod: "DM-3", ad: "Yazıcı", tur: "Demirbaş", teslim: null, not: null }] };

test("veri'li tanım şemadan geçer (kayıt hücresinde kaynak yok); veri biçimi dışındaki değer reddedilir", () => {
  assert.ok(TANIM.bolumler[0].blok === "tablo" && TANIM.bolumler[0].hucreler[1].veri === "alan_ad");
  for (const veri of ["Alan", "a.b.c", "liste.", "1abc", "a-b"]) assert.equal(Hucre.safeParse({ r: 0, c: 0, tur: "kayit", veri }).success, false, veri);
  const yok = { ...TANIM, bolumler: [{ ...TANIM.bolumler[0], hucreler: [{ r: 0, c: 0, cs: 3, tur: "kayit" }, ...(TANIM.bolumler[0] as { hucreler: Hucre[] }).hucreler.slice(2)] }] };
  assert.equal(FormatTanimi.safeParse(yok).success, false, "ne kaynak ne veri: reddedilir");
});

test("belgeFormu: veri hücresi belgenin alanından, çoğalan satır listenin her öğesi için (3 öğe → 3 satır, sıra 1–3); imza boş, rapor bilgisi yok", () => {
  const agac = belgeFormu(TANIM, ZIMMET3.firma, zimmetDegerleri(ZIMMET3), "Zimmet teslim formu");
  const html = renderToStaticMarkup(agac as never);
  assert.equal(htmlYaz(agac), html, "kesin PDF'in HTML'i React'le birebir");
  assert.ok(html.includes(">Deneme Denetçi<"), "veri hücresi");
  assert.equal((html.match(/<tr/g) ?? []).length, 5, "1 + 3 kopya + 1");
  for (const [i, kod] of ["OC-201", "DM-2", "DM-3"].entries()) assert.ok(html.includes(`>${i + 1}</td><td`) && html.includes(`>${kod}<`), kod);
  assert.ok(html.includes("Topraklama &lt;ölçer&gt;") && !html.includes("<ölçer>"), "kaçış");
  /* çoğalan satırın dışındaki liste kolonu boş */
  assert.ok(/İmza<\/td><td[^>]*><\/td><td[^>]*><\/td><\/tr>/.test(html), html);
  assert.ok(!/İmzasız|rapor belgesi|probata-eimza|Güvenli elektronik/.test(html));
  assert.ok(html.includes("Deneme Muayene A.Ş. · DA-FR-ZMT-01"), "doküman kodu temel formatınki");
  assert.ok(html.includes('aria-label="Zimmet teslim formu · ZF-1026-001"'));
  /* boş liste: bir boş satır */
  const bos = renderToStaticMarkup(belgeFormu(TANIM, ZIMMET3.firma, zimmetDegerleri({ ...ZIMMET3, varliklar: [] }), "Zimmet teslim formu") as never);
  assert.equal((bos.match(/<tr/g) ?? []).length, 3);
});

test("belgeCizimi: format yoksa temel format aynen, varsa firmanın formatı; rapor belgesinin veri'siz çizimi değişmez", () => {
  const v = ornekZimmetFormu();
  assert.equal(renderToStaticMarkup(belgeCizimi("zimmet", v, zimmetDegerleri, zimmetFormu) as never), renderToStaticMarkup(zimmetFormu(v) as never));
  assert.equal(renderToStaticMarkup(belgeCizimi("zimmet", { ...v, format: null }, zimmetDegerleri, zimmetFormu) as never), renderToStaticMarkup(zimmetFormu(v) as never));
  const f = renderToStaticMarkup(belgeCizimi("zimmet", { ...v, format: TANIM }, zimmetDegerleri, zimmetFormu) as never);
  assert.ok(f.includes("rb-serbest") && !f.includes("temel format") && f.includes(">Deneme Denetçi<"));
  /* rapor: kayıt hücresinin veri'si rapor belgesinde okunmaz (belge değeri yok) — kaynaklı hücre eskisi gibi */
  const r = renderToStaticMarkup(raporBelgesi({ ...ornekBelge("ZPKR02"), tanim: TANIM }) as never);
  assert.ok(r.includes("İmzasız önizleme") && !r.includes("Deneme Denetçi"));
});

test("temel ön bilgilendirme formu: form kodu (DA-FR-OBF-01), proje no, tarih, müşteri / tesis / adres, ekipmanlar, metin, imza yerleri; kaçış; React'le birebir", () => {
  const agac = onBilgiFormu(ON_BILGI), html = renderToStaticMarkup(agac as never);
  assert.equal(htmlYaz(agac), html);
  for (const x of ["DA-FR-OBF-01", "P-1026-002", "01.10.2026", "Merkez", "Deneme Cad. 2, Gebze / Kocaeli", ">HT-1<", ">FK-1<", "Kazan dairesi", "Deneme Bir · Makine mühendisi",
    "Muayene firması", "Tesis yetkilisi", "Ön bilgilendirme formu", "temel format"]) assert.ok(html.includes(x), x);
  assert.ok(html.includes("Deneme &lt;b&gt;Sanayi&lt;/b&gt; &amp; Ort.") && !html.includes("<b>Sanayi"), "kaçış");
  assert.ok(html.includes(">05.10.2026<"), "tek günlük plan tek tarih");
  assert.ok(renderToStaticMarkup(onBilgiFormu({ ...ON_BILGI, ekipmanlar: [] }) as never).includes("Planda ekipman yok."));
});
