/* RAPOR BELGESİ ÇİZİCİ — tek üretici (pkproje §4.2, §8.3; RAPOR-FORMAT §1 "Görünüm", §9-2 "PDF motoru aynı tanımdan"; maket maket-belge.js
   MB.belge / resmiBas). Raporun açıldığı FORMAT TANIMINDAN çizer: başlık tablosu (logo yeri · firma · akreditasyon yeri · belge adı · doküman
   bilgisi), sonra saha ekranıyla aynı sırada bölümler — 1 Firma bilgileri (künye + kontrol tarihleri + metot), 2 Ekipman bilgileri (formatın
   ekipman bölümü buraya katılır), formatın cihaz bölümü yoksa ve rapora cihaz eklendiyse Ölçüm cihazları, ardından formatın bölümleri; formatta
   imza bölümü yoksa Yetkili kişi en sonda; madde fotoğrafları ekte. Değerlendirme (kusurlar, satır / değer sonuçları) motordan (format/motor.ts),
   saha ekranındakiyle aynı. Sonuç cümlesi yalnız seçilen sonuçla biter (§3.8-2). Onaylayan teknik yönetici yalnız imza bölümünde "teknik" yeri
   varsa basılır (karar 105). SAF ve React'in kaçışıyla (ham HTML yok): aynı veri → aynı belge — önizleme ve PDF aynı çiziciden.
   JSX değil createElement: düğüm test koşucusu (node --test) bu dosyayı doğrudan yükler (tests/belge.test.ts). */
import { createElement as h, Fragment, type ReactNode } from "react";
import { degerlendir } from "../format/motor.ts";
import type { Bolum, BolumOf } from "../format/tanim.ts";
import { TANIMLAR } from "../tanim/tanimlar.ts";
import type { BelgeFotosu, BelgeVerisi } from "./veri.ts";

const tarihNo = (s: string | null | undefined) => (s ? `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)}` : "-");
const saatliNo = (s: string | null | undefined) => (s ? `${tarihNo(s)} ${s.slice(11, 16)}` : "-");
const deger = (s: string | null | undefined) => (s && s.trim() ? s : "-");
const SAYI_AD = ["sıfır", "bir", "iki", "üç", "dört", "beş"];
const SONUC = { uygun: "Uygun", uygun_degil: "Uygun değil" } as const;
const kucuk = (s: string) => s.toLocaleLowerCase("tr");
const ZAMAN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
/** zaman damgası → "GG.AA.YYYY SS:DD" (Türkiye saati) */
export const zamanNo = (iso: string) => saatliNo(ZAMAN.format(new Date(iso)).replace(", ", "T"));
const nushaYazi = (n: number) => `Bu rapor ${SAYI_AD[n] ?? String(n)} (${n}) nüsha olarak hazırlanmıştır.`;

type Cift = readonly [etiket: string, deger: ReactNode, tam?: boolean];
const kolonlar = (l: readonly string[]) => h("colgroup", null, ...l.map((w, i) => h("col", { key: i, style: { width: w } })));
/** etiket – değer çiftleri iki sütunda (mavi etiket hücresi); tam satır olanlar tek başına */
function bilgiTablosu(l: readonly Cift[]): ReactNode {
  const satirlar: ReactNode[] = [];
  for (let i = 0; i < l.length; i++) {
    const [e, d, tam] = l[i], s = l[i + 1];
    if (tam || !s || s[2]) satirlar.push(h("tr", { key: i }, h("td", { className: "rb-e" }, e), h("td", { colSpan: 3 }, d)));
    else { satirlar.push(h("tr", { key: i }, h("td", { className: "rb-e" }, e), h("td", null, d), h("td", { className: "rb-e" }, s[0]), h("td", null, s[1]))); i++; }
  }
  return h("table", null, kolonlar(["22%", "28%", "22%", "28%"]), h("tbody", null, ...satirlar));
}
const bolum = (no: string, ad: string, ...icerik: ReactNode[]) => h("section", { className: "rb-bolum", key: `${no}-${ad}` }, h("h2", null, `${no}. ${ad}`), ...icerik);
const secenekler = (secilen: readonly string[], liste: readonly string[]) =>
  h(Fragment, null, ...liste.map((x) => h("span", { key: x, className: "rb-sec" }, `${secilen.some((y) => kucuk(y) === kucuk(x)) ? "●" : "○"} ${x}`)));
const kutu = (...icerik: ReactNode[]) => h("p", { className: "rb-kutu-metin" }, ...icerik);
const baslikSatiri = (...l: string[]) => h("thead", null, h("tr", null, ...l.map((x, i) => h("th", { key: i, className: "rb-ab" }, x))));

export function raporBelgesi(v: BelgeVerisi): ReactNode {
  const { tanim: t, cevaplar: c } = v;
  /* sayılar raporun kendi listesinden (saha ekranı ve sunucuyla aynı) */
  const foto: Record<string, number> = {}, mf: Record<string, number> = {};
  for (const f of v.fotolar) { if (f.madde) mf[f.madde] = (mf[f.madde] ?? 0) + 1; else foto[f.bolum] = (foto[f.bolum] ?? 0) + 1; }
  const d = degerlendir(t, { ...c, foto, cihaz: v.cihazlar.length, madde: Object.fromEntries(Object.entries(c.madde).map(([k, x]) => [k, { ...x, foto: mf[k] ?? 0 }])) });
  const formKod = t.gorunum.formKodu || `${v.firma.kod}-FR-${v.tur.kod}-${v.formatSira}`;
  const no = v.revizyon ? `${v.no}-R${v.revizyon}` : v.no;
  const metot = [...t.gorunum.dayanak, ...v.tur.kontrolStd];
  const meslek = TANIMLAR.meslekler.find((m) => m.k === v.yazan.meslek)?.ad ?? v.yazan.meslek;
  const kaynak: Record<string, string> = {
    firma_adi: v.kunye.firmaAdi, tesis_adresi: deger(v.kunye.adres), sgk: deger(v.kunye.sgk), isg_id: deger(v.kunye.isgNo), kontrol_tarihi: tarihNo(v.tarih.bas),
    rapor_no: no, ekipman_kodu: v.ekipman.kod, ekipman_adi: v.tur.ad, seri_no: deger(v.ekipman.seri), kullanim_yeri: deger(v.ekipman.konum),
  };
  const maddeAdi = new Map(t.bolumler.flatMap((b) => (b.blok === "liste" ? b.gruplar.flatMap((g) => g.maddeler.map((m) => [m.id, m.metin] as const)) : [])));

  /* saha ekranıyla aynı düzen (SahaRaporu.tsx): kayıttan gelen alanlı bilgi bölümü 1. bölümün kopyası (çizilmez); adında "ekipman" geçen bilgi
     bölümü 2. bölüme katılır; formatın sorduğu alan sabit satırda tekrar edilmez */
  const ekipmanBlogu = (b: Bolum) => b.blok === "bilgi" && kucuk(b.ad).includes("ekipman") && b.alanlar.some((a) => !a.kaynak);
  const katilan = t.bolumler.filter(ekipmanBlogu).flatMap((b) => (b.blok === "bilgi" ? [b] : []));
  const bolumler = t.bolumler.filter((b) => !ekipmanBlogu(b) && !(b.blok === "bilgi" && b.alanlar.length > 0 && b.alanlar.every((a) => a.kaynak)));
  const formatAdlari = t.bolumler.flatMap((b) => (b.blok === "bilgi" ? b.alanlar.filter((a) => !a.kaynak).map((a) => kucuk(a.ad)) : []));
  const formatta = (x: string) => formatAdlari.some((ad) => ad.includes(x));
  const cihazEk = !t.bolumler.some((b) => b.blok === "cihaz") && v.cihazlar.length > 0;
  const imzaVar = t.bolumler.some((b) => b.blok === "imza");
  const maddeFotolari = v.fotolar.filter((f) => f.madde);
  let sira = 0;
  const yeniNo = () => String(++sira);

  const alanDegeri = (a: BolumOf<"bilgi">["alanlar"][number]): ReactNode => {
    if (a.kaynak) return kaynak[a.kaynak] ?? "-";
    const x = c.alan[a.id];
    if (a.tur === "secim" || a.tur === "coklu") return secenekler(Array.isArray(x) ? x : x ? [x] : [], a.secenekler ?? []);
    if (a.tur === "evet") return secenekler(typeof x === "string" ? [x] : [], ["Evet", "Hayır"]);
    if (a.tur === "tarih") return tarihNo(typeof x === "string" ? x : null);
    const s = Array.isArray(x) ? x.join(", ") : x;
    return s && s.trim() ? `${s}${a.birim ? ` ${a.birim}` : ""}` : "-";
  };
  /* katılan ekipman bölümünde kayıttan gelen alanlar (kod, seri, kullanım yeri …) sabit satırlarda zaten var — tekrar edilmez */
  const bilgi = (b: BolumOf<"bilgi">, kaynaksiz = false) => bilgiTablosu(b.alanlar.filter((a) => !(kaynaksiz && a.kaynak))
    .map((a) => [a.ad, alanDegeri(a), a.tur === "coklu" || (a.secenekler?.length ?? 0) > 3] as const));
  const cihazTablosu = () => h("table", null, baslikSatiri("Cihaz", "Kod / seri no", "Kalibrasyon tarihi", "Geçerlilik", "Sertifika no"),
    h("tbody", null, ...(v.cihazlar.length ? v.cihazlar.map((x, i) => h("tr", { key: i },
      h("td", null, `${x.turAd}${x.marka || x.model ? ` · ${[x.marka, x.model].filter(Boolean).join(" ")}` : ""}`), h("td", null, `${x.kod}${x.seri ? ` / ${x.seri}` : ""}`),
      h("td", null, tarihNo(x.kalTarih)), h("td", null, tarihNo(x.kalBitis)), h("td", null, deger(x.sertifika))))
      : [h("tr", { key: 0 }, h("td", { colSpan: 5 }, "-"))])));
  const fotolar = (l: readonly BelgeFotosu[], etiket: (f: BelgeFotosu) => string = (f) => f.ad) => l.length
    ? h("div", { className: "rb-fotolar" }, ...l.map((f, i) => h("figure", { key: i, className: "rb-foto" },
      f.src ? h("img", { src: f.src, alt: f.ad }) : h("div", { className: "rb-foto-bos" }, f.ad), h("figcaption", null, etiket(f)))))
    : kutu("Fotoğraf yok.");
  const imza = (b?: BolumOf<"imza">) => {
    const yerler = b?.imzalar ?? ["uzman"];
    return h(Fragment, null,
      yerler.includes("uzman") ? h(Fragment, { key: "u" }, bilgiTablosu([
        ["Adı soyadı", v.yazan.ad], ["Mesleği", meslek], ["Yetkili kişi kayıt no (EKİPNET)", deger(v.yazan.ekipnet)], ["Diploma no", deger(v.yazan.diploma)],
        ["Oda sicil no", deger(v.yazan.oda)],
        ["İmzası", v.imza ? `Güvenli elektronik imza (${v.imza.yontem}) · ${zamanNo(v.imza.zaman)}`
          : v.kesin ? "Güvenli elektronik imza ile imzalanmıştır (imza bilgisi bu PDF'in elektronik imzasındadır)."
            : "İmzasız — muayene uzmanı son imzayı atınca geçerli olur.", true],
      ])) : null,
      yerler.includes("teknik") ? h(Fragment, { key: "t" }, bilgiTablosu([["Onaylayan teknik yönetici", v.onay ? v.onay.ad : "-"], ["Onay zamanı", v.onay ? zamanNo(v.onay.zaman) : "-"]])) : null,
      h("p", { key: "n" }, nushaYazi(v.firma.nusha)));
  };

  const formatBolumu = (b: Bolum): ReactNode => {
    switch (b.blok) {
      case "bilgi": return bilgi(b);
      case "liste": return h("table", null, kolonlar(["8%", "70%", "22%"]), baslikSatiri("No", "Kontrol maddesi", "Sonuç"),
        h("tbody", null, ...b.gruplar.flatMap((g, gi) => [
          ...(g.ad ? [h("tr", { key: `g-${g.id}` }, h("td", { colSpan: 3, className: "rb-grup" }, g.ad))] : []),
          ...g.maddeler.map((m, mi) => {
            const x = c.madde[m.id], olumsuz = !!x && x.c === b.cevaplar[1];
            const derece = olumsuz && t.kurallar.derece ? (x.derece === "agir" ? " **" : " *") : "";
            return h("tr", { key: m.id }, h("td", { className: "rb-orta" }, b.gruplar.length > 1 ? `${gi + 1}.${mi + 1}` : String(mi + 1)), h("td", null, m.metin),
              h("td", null, x ? `${x.c}${derece}` : "-"));
          }),
        ])));
      case "olcum": {
        const satirlar = c.tablo[b.id] ?? [], sonuclar = d.satirlar[b.id] ?? [];
        return h(Fragment, null,
          h("table", null, baslikSatiri("No", ...b.sutunlar.map((s) => `${s.ad}${s.birim ? ` (${s.birim})` : ""}`), "Sonuç"),
            h("tbody", null, ...(satirlar.length ? satirlar.map((s, i) => {
              const r = sonuclar[i], not = Number(s.not);
              const sonuc = not > 0 ? `Not-${not}` : r?.uygun === true ? "Uygun" : r?.uygun === false ? "Uygun değil" : "-";
              return h("tr", { key: i }, h("td", { className: "rb-orta" }, String(i + 1)), ...b.sutunlar.map((x) => h("td", { key: x.id }, deger(s[x.id]))), h("td", null, sonuc));
            }) : [h("tr", { key: 0 }, h("td", { colSpan: b.sutunlar.length + 2 }, "-"))]))),
          b.notlar?.length ? h("ol", { className: "rb-notlar" }, ...b.notlar.map((n, i) => h("li", { key: i }, `Not-${i + 1}: ${n.metin}`))) : null);
      }
      case "test": return h("table", null, baslikSatiri("Ölçüm", "Değer", "Sınır", "Sonuç"), h("tbody", null, ...b.degerler.map((x) => {
        const s = c.deger[x.id], r = d.degerler[x.id];
        const sinir = x.op && x.sinir !== undefined ? `${x.op === "<=" ? "≤" : "≥"} ${String(x.sinir).replace(".", ",")}${x.birim ? ` ${x.birim}` : ""}` : deger(x.not);
        return h("tr", { key: x.id }, h("td", null, x.ad), h("td", null, s && s.trim() ? `${s}${x.birim ? ` ${x.birim}` : ""}` : "-"), h("td", null, sinir),
          h("td", null, r === true ? "Uygun" : r === false ? "Uygun değil" : "-"));
      })));
      case "cihaz": return cihazTablosu();
      case "foto": return fotolar(v.fotolar.filter((f) => !f.madde && f.bolum === b.id));
      case "kusur": return d.kusurlar.length
        ? h("ul", { className: "rb-kusurlar" }, ...d.kusurlar.map((k, i) => {
          const fl = v.fotolar.filter((f) => f.madde && f.madde === k.ref).map((f) => f.ad);
          return h("li", { key: i }, `${k.agir ? "** " : "* "}${k.metin}${fl.length ? ` (Fotoğraf: ${fl.join(", ")})` : ""}`);
        }))
        : kutu("Kusur yok.");
      case "sonuc": {
        const cumle = b.cumle.trim();
        return cumle
          ? kutu(`${cumle} `, h("b", null, v.sonuc === "uygun" ? "uygundur" : v.sonuc === "uygun_degil" ? "uygun değildir" : "-"), ".")
          : kutu("Sonuç: ", h("b", null, v.sonuc ? SONUC[v.sonuc] : "-"));
      }
      case "not": return kutu(deger(c.yorum));
      case "imza": return imza(b);
    }
  };

  const ekipman: Cift[] = [
    ["Ekipman kodu", v.ekipman.kod], ["Ekipman türü", v.tur.ad],
    ...([["marka", "Marka", v.ekipman.marka], ["model", "Model", v.ekipman.model], ["seri no", "Seri no", v.ekipman.seri], ["imal", "İmal yılı", v.ekipman.imal],
      ["kullanım yeri", "Kullanım yeri", v.ekipman.konum], ["kullanım amacı", "Kullanım amacı", v.ekipman.amac]] as const)
      .filter(([k]) => !formatta(k)).map(([, e, x]) => [e, deger(x)] as const),
    ["Ekipman bölümü", deger(v.ekipman.bolum)],
  ];
  return h("article", { className: "rb-sayfa", "aria-label": `${no} rapor belgesi` },
    h("table", { className: "rb-bas" }, kolonlar(["11%", "27%", "10%", "27%", "25%"]), h("tbody", null, h("tr", null,
      h("td", { className: "rb-logo" }, "LOGO"), h("td", { className: "rb-firma" }, h("b", null, v.firma.ad)), h("td", { className: "rb-logo" }, "AKR."),
      h("td", { className: "rb-bas-ad" }, t.gorunum.baslik || `${v.tur.ad} periyodik kontrol raporu`),
      h("td", { className: "rb-dok" },
        h("div", null, h("span", null, "Doküman Kodu"), `: ${formKod}`), h("div", null, h("span", null, "Format sürümü"), `: ${v.formatSira}`),
        h("div", null, h("span", null, "Rapor No"), `: ${no}`), h("div", null, h("span", null, "Rapor Tarihi"), `: ${tarihNo(v.tarih.rapor)}`))))),
    v.imza || v.kesin ? null : h("p", { className: "rb-taslak" }, "İmzasız önizleme — muayene uzmanının son imzasıyla geçerli olur."),
    bolum(yeniNo(), "Firma bilgileri", bilgiTablosu([
      ["Firma adı", v.kunye.firmaAdi, true], ["Periyodik kontrol adresi", deger(v.kunye.adres), true],
      ["Rapor numarası", no], ["Rapor tarihi", tarihNo(v.tarih.rapor)],
      ["İSG-KATİP sözleşme ID", v.kunye.isgNo ?? "Yok"], ["SGK sicil numarası", v.kunye.sgk ?? "Yok"],
      ["Başlangıç tarihi ve saati", saatliNo(v.tarih.bas)], ["Bitiş tarihi ve saati", saatliNo(v.tarih.bit)],
      ["Bir sonraki periyodik kontrol tarihi", tarihNo(v.tarih.sonraki)], ["Takip kontrol tarihi", tarihNo(v.tarih.takip)],
      ["Periyodik kontrol metodu ve kapsamı", metot.length ? metot.join(" · ") : "-", true],
    ])),
    bolum(yeniNo(), "Ekipman bilgileri", bilgiTablosu(ekipman), ...katilan.map((b) => h(Fragment, { key: b.id }, bilgi(b, true)))),
    cihazEk ? bolum(yeniNo(), "Ölçüm cihazları", cihazTablosu()) : null,
    ...bolumler.map((b) => bolum(yeniNo(), b.ad, formatBolumu(b))),
    imzaVar ? null : bolum(yeniNo(), "Yetkili kişi", imza()),
    maddeFotolari.length ? bolum("Ek", "Kontrol maddelerinin fotoğrafları", fotolar(maddeFotolari, (f) => `${f.ad} · ${maddeAdi.get(f.madde!) ?? ""}`)) : null,
    h("footer", { className: "rb-alt" }, `${v.firma.ad} · ${formKod}`));
}
