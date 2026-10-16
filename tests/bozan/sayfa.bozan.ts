/* OLUMSUZ KANIT — tests/sayfa.test.ts ve tests/sayfalama.test.ts (2026-10-16, "herhangi bir liste tablo … 20 den fazlası sayfalı olsun") neyi koruyor.
   Kaynak diskte DEĞİŞTİRİLMEZ (anayasa 13.11): sayfa.ts / sayfa-yeri.ts bellekte bozulup geçici klasörden içe aktarılır; kaynak kilidinin denetim
   işlevlerine gerçek dosyaların bellekte bozulmuş hâli verilir. O zaman:
   1. sayfa sınırı kalkınca son satırı silinen tabloda boş sayfada kalınır;
   2. akış kalkınca eklenen satırın sayfası açılmaz (yeni satır görünmez);
   3. sayfalama kapanınca 21 satır tek sayfada (ekran kasar — işin kendisi);
   4. eksiğe git EN ÜSTTEKİ eksik satır yerine en alttakinin sayfasını açar;
   5. ölçüm tablosunun sayfalayıcısı silinince, Liste tek üreticisi sayfalamayı bırakınca, sayfalamasız yeni bir <table eklenince, sayfalayıcı
      kalıp satırlar dilimsiz (hepsi) çizilince kaynak kilidi yakalar;
   6. süzgeçli listenin tanımından sayfa boyu silinince yakalanır;
   7. taramadaki bir liste ortak parçayı bırakınca yakalanır;
   8. (2026-10-16 inceleme) saha raporunda: tablo değişince sayfa açılmazsa, eksiğe git sayfayı açmazsa, data-satir silinirse, kontrol listesi
      sayfasız çizilirse kaynak kilidi yakalar;
   9. tablonun değişen satırı nesne kimliğiyle bulunursa (değerce aynı yeni nesne değişiklik sayılır — cihazdaki kayıt yüklenince sayfa başa atlar);
      kontrol listesinin sayfasında madde sırası sayfa başına sıfırlanırsa (2. sayfanın numarası yanlış);
   10. ortak sayfa boyu kalıptan okunmazsa (kalip-sayilari kilidi: TABLO_SAYFA = KALIP.sayfa.tablo). */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { dosyalar, oku } from "../yardimci/denetimler.ts";
import { sahaSayfaEksikleri, sayfasizListeler, sayfasizSuzgecTanimlari, sayfasizTablolar } from "../yardimci/sayfalama.ts";
import { KALIP } from "../../src/styles/kalip.ts";

const klasor = mkdtempSync(join(tmpdir(), "sayfa-bozan-"));
after(() => rmSync(klasor, { recursive: true, force: true }));
/* göreli içe aktarmalar mutlak yola (geçici klasörde çözülsün) */
const kaynak = (yol: string) => readFileSync(resolve(yol), "utf8")
  .replace(/from "(\.\.?\/[^"]+)"/g, (_, y: string) => `from "${pathToFileURL(resolve(resolve(yol, ".."), y)).href}"`);
let sira = 0;
async function bozuk<T>(yol: string, eski: string, yeni: string): Promise<T> {
  const k = kaynak(yol);
  assert.ok(k.includes(eski), `bozulacak satır kaynakta yok: ${eski}`);
  const y = join(klasor, `m-${sira++}.ts`);
  writeFileSync(y, k.replace(eski, () => yeni));
  return import(pathToFileURL(y).href) as Promise<T>;
}
type Sayfa = typeof import("../../src/components/liste/sayfa.ts");
type Yer = typeof import("../../src/modules/raporlar/sayfa-yeri.ts");
const YER = "src/modules/raporlar/sayfa-yeri.ts";
const SAYFA = "src/components/liste/sayfa.ts";

test("1. sayfa sınırı kalkınca istenen sayfa sayfa sayısını aşar — boş sayfada kalınır (kilidin koruduğu açık)", async () => {
  const m = await bozuk<Sayfa>(SAYFA, "Math.min(Math.max(1, tamSayi(istenen, 1)), sayfaSayisi)", "Math.max(1, tamSayi(istenen, 1))");
  assert.equal(m.sayfaHesapla(21, 5).sayfa, 5, "bozuk: 21 satırda 5. sayfa");
  assert.equal(m.degisenSayfa(21, 20, 2), 2, "bozuk: 21. satır silinince boş 2. sayfada kalınır");
});

test("2. akış kalkınca eklenen satırın sayfası açılmaz (kilidin koruduğu açık)", async () => {
  const m = await bozuk<Sayfa>(SAYFA, "  if (simdiki > onceki) return satirSayfasi(onceki, boy);\n", "");
  assert.equal(m.degisenSayfa(20, 21, 1), 1, "bozuk: 21. satır eklenince 1. sayfada kalınır");
});

test("3. sayfalama kapanınca 21 satır tek sayfada (kilidin koruduğu açık)", async () => {
  const m = await bozuk<Sayfa>(SAYFA, "sayfali: t > b", "sayfali: false");
  assert.equal(m.sayfaHesapla(21, 1).sayfali, false, "bozuk: sayfalayıcı çizilmez");
});

test("4. eksiğe git en alttaki eksiğin sayfasını açar (kilidin koruduğu açık)", async () => {
  const m = await bozuk<Yer>(YER, "y.satir < ilk[y.bolum]", "y.satir > ilk[y.bolum]");
  assert.deepEqual(m.hedefSayfalari([{ bolum: "linye", satir: 22 }, { bolum: "linye", satir: 45 }]), { linye: 3 }, "bozuk: 23. satır yerine 46.'nın sayfası");
});

const tsx = dosyalar("src", [".tsx"]).map((ad) => ({ ad, metin: oku(ad) }));
const degistir = (ad: string, eski: string, yeni: string) => tsx.map((d) => {
  if (d.ad !== ad) return d;
  assert.ok(d.metin.includes(eski), `bozulacak satır kaynakta yok: ${ad} · ${eski}`);
  return { ad: d.ad, metin: d.metin.replace(eski, yeni) };
});

test("5. kaynak kilidi: ölçüm tablosunun sayfalayıcısı silinince, Liste sayfalamayı bırakınca, sayfalamasız yeni tablo eklenince yakalanır", () => {
  assert.deepEqual(sayfasizTablolar(tsx), []);
  /* Bloklar'da iki sayfalayıcı (ölçüm tablosu + kontrol listesi), bir tablo: tablonun sayfalayıcısı silinince saha raporu denetimi, satırları
     dilimsiz çizilince tablo denetimi yakalar */
  const bloklar = oku("src/modules/raporlar/ui/Bloklar.tsx"), saha = oku("src/modules/raporlar/ui/SahaRaporu.tsx");
  assert.ok(sahaSayfaEksikleri(bloklar.replace("<TabloSayfalari s={sy} ad={b.ad} />", ""), saha).includes("ölçüm tablosunun ve kontrol listesinin sayfalayıcısı"),
    "bozuk Bloklar (sayfalayıcı) yakalanmadı");
  const b = sayfasizTablolar(degistir("src/modules/raporlar/ui/Bloklar.tsx", "sy.dilim(satirlar).map(", "satirlar.map("));
  assert.ok(b.some((x) => x.startsWith("modules/raporlar/ui/Bloklar.tsx:")), `bozuk Bloklar (dilim) yakalanmadı: ${b.join(" | ")}`);
  const l = sayfasizTablolar(degistir("src/components/liste/Liste.tsx", "...sayfa.dilim(kayitlar),", "...kayitlar,"));
  assert.ok(l.some((x) => x.startsWith("components/liste/Liste.tsx:")), `bozuk Liste yakalanmadı: ${l.join(" | ")}`);
  /* sayfalayıcı duruyor, satırlar dilimsiz: ekranda bütün satırlar + sayfa tuşları */
  const d = sayfasizTablolar(degistir("src/modules/firma-ayarlari/ui/IceAktarma.tsx", "sy.dilim(dosya.satirlar).map(", "dosya.satirlar.map("));
  assert.ok(d.some((x) => x.startsWith("modules/firma-ayarlari/ui/IceAktarma.tsx:") && x.includes("dilim")), `dilimsiz tablo yakalanmadı: ${d.join(" | ")}`);
  const y = sayfasizTablolar([...tsx, { ad: "src/modules/yeni/ui/YeniTablo.tsx", metin: "export const T = () => <table><tbody>{[].map(() => null)}</tbody></table>;" }]);
  assert.ok(y.some((x) => x.startsWith("modules/yeni/ui/YeniTablo.tsx:")), `sayfalamasız yeni tablo yakalanmadı: ${y.join(" | ")}`);
});

test("6. süzgeçli listenin tanımından sayfa boyu silinince yakalanır", () => {
  const ts = dosyalar("src", [".ts", ".tsx"]).map((ad) => ({ ad, metin: oku(ad) }));
  assert.deepEqual(sayfasizSuzgecTanimlari(ts), []);
  const bozuk = ts.map((d) => (d.ad === "src/modules/olcum-cihazlari/ui/CihazListesi.tsx" ? { ad: d.ad, metin: d.metin.replace("sayfa: TABLO_SAYFA, ", "") } : d));
  assert.ok(sayfasizSuzgecTanimlari(bozuk).some((x) => x.startsWith("modules/olcum-cihazlari/ui/CihazListesi.tsx:")), "sayfasız süzgeç tanımı yakalanmadı");
});

test("7. taramadaki liste ortak parçayı bırakınca yakalanır", () => {
  assert.deepEqual(sayfasizListeler(tsx), []);
  const b = sayfasizListeler(degistir("src/modules/zimmetler/ui/VarlikParcalari.tsx", "<SayfaliListe", "<ListeYok"));
  assert.ok(b.some((x) => x.startsWith("modules/zimmetler/ui/VarlikParcalari.tsx:")), `bozuk liste yakalanmadı: ${b.join(" | ")}`);
});

test("8. saha raporu: tablo değişince sayfa açılmazsa, eksiğe git sayfayı açmazsa, data-satir silinirse, kontrol listesi sayfasızsa yakalanır", () => {
  const bloklar = oku("src/modules/raporlar/ui/Bloklar.tsx"), saha = oku("src/modules/raporlar/ui/SahaRaporu.tsx");
  assert.deepEqual(sahaSayfaEksikleri(bloklar, saha), []);
  const bozukSaha = (eski: string, yeni: string) => { assert.ok(saha.includes(eski), `bozulacak satır kaynakta yok: ${eski}`); return sahaSayfaEksikleri(bloklar, saha.replace(eski, yeni)); };
  const bozukBlok = (eski: string, yeni: string) => { assert.ok(bloklar.includes(eski), `bozulacak satır kaynakta yok: ${eski}`); return sahaSayfaEksikleri(bloklar.replace(eski, yeni), saha); };
  assert.ok(bozukSaha("ilkDegisenSatirlar(gorulenTablo, cevaplar.tablo)", "{}").includes("tablo değişince ilk değişen satırın sayfası"), "değişiklik kuralı");
  assert.ok(bozukSaha("const sayfalar = sayfalariAc(l.flatMap(", "const sayfalar = hedefSayfalari(l.flatMap(").includes("eksiğe git en üstteki eksiğin sayfasını açar (tablo ve kontrol listesi)"), "eksiğe git");
  assert.ok(bozukBlok("data-satir={satirlar.length}", "").includes("tablonun bütün satır sayısı bölgede (data-satir)"), "data-satir");
  assert.ok(bozukBlok("maddeDilimi(b.gruplar, sy.bas, sy.son).map(({ g, gi, maddeler })", "b.gruplar.map((g, gi) => ({ g, gi, maddeler: g.maddeler.map((m, mi) => ({ m, mi })) })).map(({ g, gi, maddeler })")
    .includes("kontrol listesi sayfanın maddeleriyle çizilir (gruplar boyunca, numara genel)"), "kontrol listesi");
});

test("9. tablonun değişen satırı nesne kimliğiyle bulununca ve madde sırası sayfa başına sıfırlanınca yakalanır (kilidin koruduğu açık)", async () => {
  const k = await bozuk<Yer>(YER, "!ayniSatir(a[i], y[i])", "a[i] !== y[i]");
  assert.deepEqual(k.ilkDegisenSatirlar({ linye: [{ no: "F1" }] }, { linye: [{ no: "F1" }] }), { linye: 0 }, "bozuk: değerce aynı yeni nesne değişiklik sayıldı");
  const m = await bozuk<Yer>(YER, "({ m, mi: ilk + k })", "({ m, mi: k })");
  assert.deepEqual(m.maddeDilimi([{ maddeler: ["a", "b", "c"] }], 2, 3)[0].maddeler, [{ m: "c", mi: 0 }], "bozuk: 2. sayfanın maddesi grubun 1. maddesi gibi numaralandı");
});

test("10. ortak sayfa boyu kalıptan okunmazsa yakalanır (kalip-sayilari: TABLO_SAYFA = KALIP.sayfa.tablo)", async () => {
  const m = await bozuk<Sayfa>(SAYFA, "export const TABLO_SAYFA: number = KALIP.sayfa.tablo;", "export const TABLO_SAYFA: number = 10;");
  assert.notEqual(m.TABLO_SAYFA, KALIP.sayfa.tablo, "bozuk: sayfa boyu kalıptan değil");
});
