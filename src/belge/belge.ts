/* RAPOR BELGESİ ÇİZİCİ — tek üretici (pkproje §4.2, §8.3; RAPOR-FORMAT §1 "Görünüm", §9-2 "PDF motoru aynı tanımdan"; maket maket-belge.js
   MB.belge / resmiBas). Raporun açıldığı FORMAT TANIMINDAN çizer: başlık tablosu (logo yeri · firma · akreditasyon yeri · belge adı · doküman
   bilgisi), sonra saha ekranıyla aynı sırada bölümler — 1 Firma bilgileri (künye + kontrol tarihleri + metot), 2 Ekipman bilgileri (formatın
   ekipman bölümü buraya katılır), formatın cihaz bölümü yoksa ve rapora cihaz eklendiyse Ölçüm cihazları, ardından formatın bölümleri; formatta
   imza bölümü yoksa Yetkili kişi en sonda; madde fotoğrafları ekte. Değerlendirme (kusurlar, satır / değer sonuçları) motordan (format/motor.ts),
   saha ekranındakiyle aynı. Sonuç cümlesi yalnız seçilen sonuçla biter (§3.8-2). Onaylayan teknik yönetici yalnız imza bölümünde "teknik" yeri
   varsa basılır (karar 105). SAF ve React'in kaçışıyla (ham HTML yok): aynı veri → aynı belge — önizleme ve PDF aynı çiziciden.
   JSX değil createElement: düğüm test koşucusu (node --test) bu dosyayı doğrudan yükler (tests/belge.test.ts). */
import { createElement as h, Fragment, type ReactNode } from "react";
import { SINIR_ISARETI } from "../format/hesap.ts";
import {
  altYazisi, BAS_GENISLIK, basSatirlari, basSirasi, basTuru, belgeStilSiniflari, cihazSutunlari, fotoKutulari, sonucSozcugu, ekipmanEtiketleri, firmaSatirlari, listeBasliklari,
  maddeNumaralari, olcumBasliklari, raporDuzeni, sabitEkipmanAlanlari, testBasliklari,
} from "../format/duzen.ts";
import { gecerliKunye, kilitliKunye, metotMetni } from "../format/kunye.ts";
import { formulUygula } from "../format/formul.ts";
import { degerlendir } from "../format/motor.ts";
import { EKIPMAN_ALAN_ADI, ekAnahtari, HAZIR_AD, type BasSatiri, type Bolum, type BolumOf, type CihazAlani, type FirmaSatiri, type ImzaSatiri, type KusurAlani } from "../format/tanim.ts";
/* veri.ts: saf tanımlar (tanimlar.ts node:crypto kullanır — 451: Format kurucunun belge önizlemesi bu çiziciyi tarayıcıda koşar) */
import { TANIMLAR } from "../tanim/veri.ts";
import type { BelgeFotosu, BelgeVerisi, ImzaKisiBilgisi } from "./veri.ts";
/* eimza.ts'nin işaret adresi burada da yazılı (eimza.ts pdf-lib'i içe aktarır; çizici tarayıcıda da koşar — kilit tests/eimza.test.ts aynılığı denetler) */
const EIMZA_ISARETI = "probata-eimza:uzman";
/** 2026-10-17 (İ5): onaylayanın (teknik yönetici) İmza hücresinin işareti — eimza.ts EIMZA_ISARETI_2 ile aynı */
const EIMZA_ISARETI_2 = "probata-eimza:teknik";

const tarihNo = (s: string | null | undefined) => (s ? `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)}` : "-");
const saatliNo = (s: string | null | undefined) => (s ? `${tarihNo(s)} ${s.slice(11, 16)}` : "-");
const deger = (s: string | null | undefined) => (s && s.trim() ? s : "-");
const SAYI_AD = ["sıfır", "bir", "iki", "üç", "dört", "beş"];
const SONUC = { uygun: "Uygun", uygun_degil: "Uygun değil", sartli: "Şartlı uygun" } as const;
const kucuk = (s: string) => s.toLocaleLowerCase("tr");
const ZAMAN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
/** zaman damgası → "GG.AA.YYYY SS:DD" (Türkiye saati) */
export const zamanNo = (iso: string) => saatliNo(ZAMAN.format(new Date(iso)).replace(", ", "T"));
const nushaYazi = (n: number) => `Bu rapor ${SAYI_AD[n] ?? String(n)} (${n}) nüsha olarak hazırlanmıştır.`;
/** 595 (madde 26): sayfa altındaki şeridin yazısı — imzaya hazırlanan (kesin) belgede e-imza cümlesi; imzalı raporun yeniden basılan kopyasında ve
    önizlemede ne olduğu. Sayfa numarası PDF motorunda (pdf.ts alt bilgi şablonu) eklenir. */
/** belgenin doküman kodu: formatın kodu ya da <firma>-FR-<tür>-<sürüm> */
export const belgeFormKodu = (v: Pick<BelgeVerisi, "tanim" | "firma" | "tur" | "formatSira">) => v.tanim.gorunum.formKodu || `${v.firma.kod}-FR-${v.tur.kod}-${v.formatSira}`;
export function belgeAltYazisi(v: Pick<BelgeVerisi, "kesin" | "imza" | "no" | "revizyon"> & Partial<Pick<BelgeVerisi, "tanim" | "firma" | "tur" | "formatSira">>): { metin: string; no: string; format: string } {
  const no = v.revizyon ? `${v.no}-R${v.revizyon}` : v.no;
  const metin = v.kesin ? "Bu rapor 5070 sayılı Elektronik İmza Kanunu'na uygun güvenli elektronik imza ile imzalanmıştır."
    : v.imza ? "E-imzalı raporun basılı kopyasıdır; asıl belge e-imzalı PDF'tir."
      : "İmzasız önizleme — muayene uzmanının son imzasıyla geçerli olur.";
  /* 595 (madde 14): formatın KENDİ sayfa altı yazısı (adres, telefon, gizlilik notu …) şeritte her sayfada, sayfa numarasının yanında; yazısız
     formatta şerit bugünkü gibi */
  const format = v.tanim?.gorunum.altYazi?.trim() && v.firma && v.tur && v.formatSira !== undefined
    ? altYazisi(v.tanim, v.firma, belgeFormKodu({ tanim: v.tanim, firma: v.firma, tur: v.tur, formatSira: v.formatSira })) : "";
  return { metin, no, format };
}

type Cift = readonly [etiket: string, deger: ReactNode, tam?: boolean];
const kolonlar = (l: readonly string[]) => h("colgroup", null, ...l.map((w, i) => h("col", { key: i, style: { width: w } })));
/** etiket – değer çiftleri iki sütunda (mavi etiket hücresi); tam satır olanlar tek başına */
/** başlığın logo hücresi (334; maket MB.logo): firmanın logosu (veri adresi) yoksa "LOGO" yeri */
export function firmaLogosu(f: { ad: string; logo?: string | null }): ReactNode {
  return f.logo ? h("img", { className: "rb-logo-resim", src: f.logo, alt: `${f.ad} logosu` }) : "LOGO";
}
/** firma hücresinde adın altına adres (maket resmiBas: <b>ad</b><br>adres) */
export function firmaAdresi(f: { adres?: string | null }): ReactNode[] {
  return f.adres ? [h("br", { key: "br" }), f.adres] : [];
}

/** 595 (madde 9): n — bir satırda kaç bilgi (1 · 2 · 3); 2 bugünkü düzen (aynı çizim) */
function bilgiTablosu(l: readonly Cift[], n: 1 | 2 | 3 = 2): ReactNode {
  if (n === 1) return h("table", null, kolonlar(["30%", "70%"]), h("tbody", null, ...l.map(([e, d], i) => h("tr", { key: i }, h("td", { className: "rb-e" }, e), h("td", null, d)))));
  if (n === 3) {
    const satirlar: ReactNode[] = [];
    let bekleyen: Cift[] = [];
    const bosalt = () => {
      if (!bekleyen.length) return;
      const hucreler = bekleyen.flatMap(([e, d], j) => [h("td", { key: `e${j}`, className: "rb-e" }, e),
        h("td", { key: `d${j}`, ...(j === bekleyen.length - 1 && bekleyen.length < 3 ? { colSpan: 1 + (3 - bekleyen.length) * 2 } : {}) }, d)]);
      satirlar.push(h("tr", { key: satirlar.length }, ...hucreler));
      bekleyen = [];
    };
    for (const c of l) {
      if (c[2]) { bosalt(); satirlar.push(h("tr", { key: satirlar.length }, h("td", { className: "rb-e" }, c[0]), h("td", { colSpan: 5 }, c[1]))); continue; }
      bekleyen.push(c);
      if (bekleyen.length === 3) bosalt();
    }
    bosalt();
    return h("table", null, kolonlar(["14%", "19.33%", "14%", "19.33%", "14%", "19.34%"]), h("tbody", null, ...satirlar));
  }
  const satirlar: ReactNode[] = [];
  for (let i = 0; i < l.length; i++) {
    const [e, d, tam] = l[i], s = l[i + 1];
    if (tam || !s || s[2]) satirlar.push(h("tr", { key: i }, h("td", { className: "rb-e" }, e), h("td", { colSpan: 3 }, d)));
    else { satirlar.push(h("tr", { key: i }, h("td", { className: "rb-e" }, e), h("td", null, d), h("td", { className: "rb-e" }, s[0]), h("td", null, s[1]))); i++; }
  }
  return h("table", null, kolonlar(["22%", "28%", "22%", "28%"]), h("tbody", null, ...satirlar));
}
/* 427: numara "5" → "5. Ad" (h2) · alt bölüm "5.1" → "5.1 Ad" (h3, üst başlığın altında) · numarasız (null) → yalnız ad */
const bolum = (no: string | null, ad: string, ...icerik: ReactNode[]) => h("section", { className: "rb-bolum", key: `${no ?? "-"}-${ad}` },
  no?.includes(".") ? h("h3", null, `${no} ${ad}`) : h("h2", null, no ? `${no}. ${ad}` : ad), ...icerik);
const ustBaslik = (no: string, ad: string) => h("section", { className: "rb-bolum rb-ust", key: `ust-${no}` }, h("h2", null, `${no}. ${ad}`));
/* seçenek işareti yazı tipinden bağımsız, CSS ile çizilir: gömülü Carlito alt kümelerinde ● / ○ yok — sunucusuz Chromium'da sistem yazı tipi de
   yok, kutu basılırdı (315–317 incelemesi; kilit tests/belge.test.ts "yazı tipi kapsamı") */
const secenekler = (secilen: readonly string[], liste: readonly string[]) =>
  h(Fragment, null, ...liste.map((x) => h("span", { key: x, className: "rb-sec" },
    h("span", { className: secilen.some((y) => kucuk(y) === kucuk(x)) ? "rb-isaret rb-secili" : "rb-isaret" }), ` ${x}`)));
const kutu = (...icerik: ReactNode[]) => h("p", { className: "rb-kutu-metin" }, ...icerik);
const baslikSatiri = (...l: string[]) => h("thead", null, h("tr", null, ...l.map((x, i) => h("th", { key: i, className: "rb-ab" }, x))));

export function raporBelgesi(v: BelgeVerisi): ReactNode {
  const t = v.tanim;
  /* sayılar raporun kendi listesinden (saha ekranı ve sunucuyla aynı) */
  const foto: Record<string, number> = {}, mf: Record<string, number> = {};
  const kutular = fotoKutulari(t);
  for (const f of v.fotolar) { if (f.madde) mf[f.madde] = (mf[f.madde] ?? 0) + 1; if (!f.madde || kutular.has(f.madde)) foto[f.bolum] = (foto[f.bolum] ?? 0) + 1; }
  const formKod = belgeFormKodu(v);
  const no = v.revizyon ? `${v.no}-R${v.revizyon}` : v.no;
  /* 492: denetçinin raporda değiştirdiği künye bilgisi (formatın kilitli bilgisi hariç) — saha ekranıyla aynı işlev */
  const kunye = gecerliKunye(v.kunye, metotMetni(t, v.tur.kontrolStd), v.cevaplar.kunye, kilitliKunye(t));
  const meslek = TANIMLAR.meslekler.find((m) => m.k === v.yazan.meslek)?.ad ?? v.yazan.meslek;
  const kaynak: Record<string, string> = {
    firma_adi: kunye.firma, tesis_adresi: deger(kunye.adres), sgk: deger(kunye.sgk), isg_id: deger(kunye.isg), kontrol_tarihi: tarihNo(v.tarih.bas),
    rapor_no: no, ekipman_kodu: v.ekipman.kod, ekipman_adi: v.tur.ad, seri_no: deger(v.ekipman.seri), kullanim_yeri: deger(v.ekipman.konum),
  };
  /* 495 → 556: formüllü kutuların değeri basılır (kaydedilen cevaplarda yok — saha ekranı ve motorla aynı işlev); formül kayıttan gelen ve ekipman
     bilgisini de okur (boşu boş: "-" değil) */
  const ham = (s: string | null | undefined) => (s && s.trim() ? s : null);
  const c = formulUygula(t, v.cevaplar, {
    kaynak: Object.fromEntries(Object.entries(kaynak).map(([k, x]) => [k, x === "-" ? null : x])),
    ekipman: Object.fromEntries(Object.entries(v.ekipman).flatMap(([k, x]) => (ham(x) ? [[k, x as string]] : []))),
  });
  const d = degerlendir(t, { ...c, foto, cihaz: v.cihazlar.length, madde: Object.fromEntries(Object.entries(c.madde).map(([k, x]) => [k, { ...x, foto: mf[k] ?? 0 }])) });
  const maddeAdi = new Map(t.bolumler.flatMap((b) => (b.blok === "liste" ? b.gruplar.flatMap((g) => g.maddeler.map((m) => [m.id, m.metin] as const)) : [])));

  /* saha ekranıyla aynı düzen ve numaralar (format/duzen.ts, 427): kayıttan gelen alanlı bilgi bölümü 1. bölümün kopyası (çizilmez); ekipman
     bilgi bölümü 2. bölüme katılır ve adı 2. bölümün başlığı olur; formatın sorduğu alan sabit satırda tekrar edilmez */
  const cihazEk = !t.bolumler.some((b) => b.blok === "cihaz") && v.cihazlar.length > 0;
  const duzen = raporDuzeni(t, cihazEk);
  const katilan = duzen.katilan;
  const imzaVar = t.bolumler.some((b) => b.blok === "imza");
  /* 595 (madde 16): fotoğraf kutusunun fotoğrafı kendi bölümünde (ekte değil) */
  const kutuAdi = new Map(t.bolumler.flatMap((b) => (b.blok === "foto" ? (b.kutular ?? []).map((k) => [k.id, k.ad] as const) : [])));
  const maddeFotolari = v.fotolar.filter((f) => f.madde && !kutuAdi.has(f.madde));

  const alanDegeri = (a: BolumOf<"bilgi">["alanlar"][number]): ReactNode => {
    /* 460: ekipman kaydına bağlı alan — raporun ekipman bilgisinden */
    /* 556: formüllü ekipman bilgisi boşsa formülün değeri; kayıttan gelen alanda denetçinin yazdığı ya da formülün değeri kayıttakinden önce */
    if (a.ekipman) return deger(v.ekipman[a.ekipman] || (typeof c.alan[a.id] === "string" ? c.alan[a.id] as string : null));
    if (a.kaynak && !c.alan[a.id]?.length) return kaynak[a.kaynak] ?? "-";
    const x = c.alan[a.id];
    if (a.tur === "secim" || a.tur === "coklu") return secenekler(Array.isArray(x) ? x : x ? [x] : [], a.secenekler ?? []);
    if (a.tur === "evet") return secenekler(typeof x === "string" ? [x] : [], ["Evet", "Hayır"]);
    if (a.tur === "tarih") return tarihNo(typeof x === "string" ? x : null);
    const s = Array.isArray(x) ? x.join(", ") : x;
    return s && s.trim() ? `${s}${a.birim ? ` ${a.birim}` : ""}` : "-";
  };
  /* katılan ekipman bölümünde kayıttan gelen alanlar (kod, seri, kullanım yeri …) sabit satırlarda zaten var — tekrar edilmez */
  /* 595 (madde 9): alanın tam satırlığı formatta seçilebilir (verilmemişse çoklu seçim / uzun seçenek listesi tam); bölümün dizilişi 1 · 2 · 3 */
  const tamMi = (a: BolumOf<"bilgi">["alanlar"][number]) => a.tam ?? (a.tur === "coklu" || (a.secenekler?.length ?? 0) > 3);
  const bilgi = (b: BolumOf<"bilgi">, kaynaksiz = false) => bilgiTablosu(b.alanlar.filter((a) => !(kaynaksiz && a.kaynak))
    .map((a) => [a.ad, alanDegeri(a), tamMi(a)] as const), b.dizilis ?? 2);
  /* 595 (madde 2): sütunlar formatın (cihaz kaydından seçilir; verilmemişse bugünkü 5 sütun — duzen.ts cihazSutunlari) */
  const cihazDegeri = (x: BelgeVerisi["cihazlar"][number], a: CihazAlani): string => {
    switch (a) {
      case "cihaz": return `${x.turAd}${x.marka || x.model ? ` · ${[x.marka, x.model].filter(Boolean).join(" ")}` : ""}`;
      case "tur": return x.turAd;
      case "kod_seri": return `${x.kod}${x.seri ? ` / ${x.seri}` : ""}`;
      case "kod": return x.kod;
      case "seri": return deger(x.seri);
      case "marka": return deger(x.marka);
      case "model": return deger(x.model);
      case "kal_tarih": return tarihNo(x.kalTarih);
      case "kal_bitis": return tarihNo(x.kalBitis);
      case "sertifika": return deger(x.sertifika);
    }
  };
  const cihazTablosu = (b?: BolumOf<"cihaz">) => {
    const l = cihazSutunlari(b);
    return h("table", null, baslikSatiri(...l.map((s) => s.ad)),
      h("tbody", null, ...(v.cihazlar.length ? v.cihazlar.map((x, i) => h("tr", { key: i }, ...l.map((s) => h("td", { key: s.id }, cihazDegeri(x, s.alan)))))
        : [h("tr", { key: 0 }, h("td", { colSpan: l.length }, "-"))])));
  };
  const fotolar = (l: readonly BelgeFotosu[], etiket: (f: BelgeFotosu) => string = (f) => f.ad) => l.length
    ? h("div", { className: "rb-fotolar" }, ...l.map((f, i) => h("figure", { key: i, className: "rb-foto" },
      f.src ? h("img", { src: f.src, alt: f.ad }) : h("div", { className: "rb-foto-bos" }, f.ad), h("figcaption", null, etiket(f)))))
    : kutu("Fotoğraf yok.");
  /* 595 (sunum 595 madde 1): satırları tanımlı imza bölümü — her satırın adı ve sırası formatın, değeri kişinin kaydından (uzman: raporu yazan;
     teknik: onaylayan teknik yönetici, hesabı bir personele bağlıysa onun kaydından; serbest satır: formatın sabit yazısı ya da boş hücre — ıslak
     imza, kaşe). Ardışık aynı kişinin satırları tek tabloda (eski düzen gibi: uzman tablosu, teknik yönetici tablosu) */
  const meslekAdi = (k: ImzaKisiBilgisi) => (k.meslek === "diger" && k.meslekMetin ? k.meslekMetin : TANIMLAR.meslekler.find((m) => m.k === k.meslek)?.ad ?? k.meslek);
  const imzaYazisi = () => (v.imza ? `Güvenli elektronik imza (${v.imza.yontem}) · ${zamanNo(v.imza.zaman)}`
    : v.kesin ? "Güvenli elektronik imza ile imzalanmıştır (imza bilgisi bu PDF'in elektronik imzasındadır)."
      : "İmzasız — muayene uzmanı son imzayı atınca geçerli olur.");
  /* 595 (madde 25): imzaya hazırlanan belgede, e-imzanın yeri İmza hücresiyse hücreye görünmez işaret — PDF motoru (eimza.ts) işaretin yerine boş
     imza alanı koyar. Yalnız ilk İmza hücresine */
  let isaretKondu = false;
  const imzaHucresi = (): ReactNode => {
    const yazi = imzaYazisi();
    if (!v.kesin || isaretKondu || (t.gorunum.eimza?.yer ?? "hucre") !== "hucre") return yazi;
    isaretKondu = true;
    return h("a", { className: "rb-eimza", href: EIMZA_ISARETI }, yazi);
  };
  /* İ5 (2026-10-17): onaylayanın e-imza yeri teknik yöneticinin İmza hücresiyse aynı işaret düzeni (ikinci boş imza alanı) */
  let isaret2Kondu = false;
  const teknikImzaHucresi = (zaman: string): ReactNode => {
    const yazi = `Elektronik onay · ${zamanNo(zaman)}`;
    if (!v.kesin || isaret2Kondu || t.gorunum.eimza2?.yer !== "hucre") return yazi;
    isaret2Kondu = true;
    return h("a", { className: "rb-eimza", href: EIMZA_ISARETI_2 }, yazi);
  };
  const kisiDegeri = (k: ImzaKisiBilgisi | null | undefined, alan: ImzaSatiri["alan"]): string => {
    if (!k) return "-";
    if (alan === "meslek") return meslekAdi(k);
    if (alan === "ekipnet" || alan === "diploma" || alan === "oda" || alan === "eposta" || alan === "tel") return deger(k[alan]);
    return "-";
  };
  const satirDegeri = (s: ImzaSatiri): ReactNode => {
    if (s.kim === "diger") return s.metin?.trim() ?? "";
    if (s.kim === "uzman") return s.alan === "ad" ? v.yazan.ad : s.alan === "imza" ? imzaHucresi() : kisiDegeri(v.yazan, s.alan);
    /* 595 (madde 1): ikinci uzman sahada seçilen kişinin kaydından, tesis yetkilisi sahada yazılan; imzaları boş hücre (ıslak imza) */
    if (s.kim === "uzman2") return s.alan === "imza" ? "" : !v.ikinci ? "-" : s.alan === "ad" ? v.ikinci.ad : kisiDegeri(v.ikinci, s.alan);
    if (s.kim === "tesis") return s.alan === "ad" ? deger(c.imzaci.tesisAd) : s.alan === "unvan" ? deger(c.imzaci.tesisUnvan) : "";
    if (!v.onay) return "-";
    return s.alan === "ad" ? v.onay.ad : s.alan === "zaman" ? zamanNo(v.onay.zaman) : s.alan === "imza" ? teknikImzaHucresi(v.onay.zaman) : kisiDegeri(v.onay.kisi, s.alan);
  };
  const imzaSatirli = (l: readonly ImzaSatiri[]) => {
    const gruplar: ImzaSatiri[][] = [];
    for (const s of l) { const son = gruplar.at(-1); if (son && son[0].kim === s.kim) son.push(s); else gruplar.push([s]); }
    return h(Fragment, null, ...gruplar.map((g, i) => h(Fragment, { key: i }, bilgiTablosu(g.map((s) => [s.ad, satirDegeri(s), !!s.tam] as const)))),
      h("p", { key: "n" }, nushaYazi(v.firma.nusha)));
  };
  const imza = (b?: BolumOf<"imza">) => {
    if (b?.satirlar) return imzaSatirli(b.satirlar);
    const yerler = b?.imzalar ?? ["uzman"];
    return h(Fragment, null,
      yerler.includes("uzman") ? h(Fragment, { key: "u" }, bilgiTablosu([
        ["Adı soyadı", v.yazan.ad], ["Mesleği", meslek], ["Yetkili kişi kayıt no (EKİPNET)", deger(v.yazan.ekipnet)], ["Diploma no", deger(v.yazan.diploma)],
        ["Oda sicil no", deger(v.yazan.oda)],
        ["İmzası", imzaHucresi(), true],
      ])) : null,
      yerler.includes("teknik") ? h(Fragment, { key: "t" }, bilgiTablosu([["Onaylayan teknik yönetici", v.onay ? v.onay.ad : "-"], ["Onay zamanı", v.onay ? zamanNo(v.onay.zaman) : "-"]])) : null,
      h("p", { key: "n" }, nushaYazi(v.firma.nusha)));
  };

  const formatBolumu = (b: Bolum): ReactNode => {
    switch (b.blok) {
      case "bilgi": return bilgi(b);
      /* 595 (madde 7): ek sütunlar — açıklama (maddenin açıklaması), standart maddesi, fotoğraf adları, serbest yazı */
      case "liste": {
        const ek = b.ekSutunlar ?? [];
        const genis = ek.length ? ["8%", `${100 - 8 - 18 - 14 * ek.length}%`, "18%", ...ek.map(() => "14%")] : ["8%", "70%", "22%"];
        const ekDegeri = (m: BolumOf<"liste">["gruplar"][number]["maddeler"][number], s: (typeof ek)[number]): string => {
          if (s.alan === "aciklama") return deger(c.madde[m.id]?.not);
          if (s.alan === "std") return deger(m.std);
          if (s.alan === "foto") return v.fotolar.filter((f) => f.madde === m.id).map((f) => f.ad).join(", ") || "-";
          return deger(c.ek[ekAnahtari(m.id, s.id)]);
        };
        /* 2026-10-23: numara grup içinde ya da baştan sona (duzen.ts maddeNumaralari — kâğıt ve saha ekranı aynı) */
        const no = maddeNumaralari(b);
        const cevap = (m: BolumOf<"liste">["gruplar"][number]["maddeler"][number]) => {
          const x = c.madde[m.id], olumsuz = !!x && x.c === b.cevaplar[1];
          const derece = olumsuz && t.kurallar.derece ? (x.derece === "agir" ? " **" : " *") : "";
          return x ? `${x.c}${derece}` : "-";
        };
        /* 2026-10-23 (basılı formdan şablon): iki sütun yan yana — satırlar (grup başlıkları dahil) sırayla ikiye bölünür, sol yarı önce dolar */
        if (b.yanYana && !ek.length) {
          type Gir = { g: string; ad: string } | { m: BolumOf<"liste">["gruplar"][number]["maddeler"][number] };
          const l: Gir[] = b.gruplar.flatMap((g) => [...(g.ad ? [{ g: g.id, ad: g.ad }] : []), ...g.maddeler.map((m) => ({ m }))]);
          const yari = Math.ceil(l.length / 2), sol = l.slice(0, yari), sag = l.slice(yari);
          const hucreler = (x: Gir | undefined, s: string): ReactNode[] => !x ? [h("td", { key: `${s}0` }), h("td", { key: `${s}1` }), h("td", { key: `${s}2` })]
            : "g" in x ? [h("td", { key: `${s}g`, colSpan: 3, className: "rb-grup" }, x.ad)]
              : [h("td", { key: `${s}0`, className: "rb-orta" }, no.get(x.m.id) ?? ""), h("td", { key: `${s}1` }, x.m.metin), h("td", { key: `${s}2` }, cevap(x.m))];
          const bas = Object.values(listeBasliklari(b));
          return h("table", null, kolonlar(["5%", "34%", "11%", "5%", "34%", "11%"]), baslikSatiri(...bas, ...bas),
            h("tbody", null, ...sol.map((x, i) => h("tr", { key: i }, ...hucreler(x, "a"), ...hucreler(sag[i], "b")))));
        }
        return h("table", null, kolonlar(genis), baslikSatiri(...Object.values(listeBasliklari(b)), ...ek.map((s) => s.ad)),
          h("tbody", null, ...b.gruplar.flatMap((g) => [
            ...(g.ad ? [h("tr", { key: `g-${g.id}` }, h("td", { colSpan: 3 + ek.length, className: "rb-grup" }, g.ad))] : []),
            ...g.maddeler.map((m) => h("tr", { key: m.id }, h("td", { className: "rb-orta" }, no.get(m.id) ?? ""), h("td", null, m.metin),
              h("td", null, cevap(m)), ...ek.map((s) => h("td", { key: s.id }, ekDegeri(m, s))))),
          ])));
      }
      case "olcum": {
        const satirlar = c.tablo[b.id] ?? [], sonuclar = d.satirlar[b.id] ?? [];
        /* 595 (madde 4): sabit sütunların başlıkları formatın; Sonuç sütunu sonda (varsayılan), başta ya da gizli (sonuç kuralı yine çalışır) */
        const ob = olcumBasliklari(b), yer = b.sonucYeri ?? "son";
        const sutunAdlari = b.sutunlar.map((s) => `${s.ad}${s.birim ? ` (${s.birim})` : ""}`);
        return h(Fragment, null,
          h("table", null, baslikSatiri(ob.sira, ...(yer === "bas" ? [ob.sonuc] : []), ...sutunAdlari, ...(yer === "son" ? [ob.sonuc] : [])),
            h("tbody", null, ...(satirlar.length ? satirlar.map((s, i) => {
              const r = sonuclar[i], not = Number(s.not);
              const ad = (u: boolean | null | undefined) => (u === true ? "Uygun" : u === false ? "Uygun değil" : "-");
              /* 488: elle değiştirilen sonuçta kural sonucu da yazar ("Uygun değil (elle; kural: Uygun)"), gerekçe tablonun altında */
              const sonuc = not > 0 ? `Not-${not}` : r?.elle ? `${ad(r.uygun)} (elle; kural: ${ad(r.elle.kural)})` : ad(r?.uygun);
              const sonucHucresi = h("td", { key: "_sonuc" }, sonuc);
              /* 595 (madde 5): hazır satırın adı sıra sütununda */
              return h("tr", { key: i }, h("td", { className: "rb-orta" }, s[HAZIR_AD] || String(i + 1)), ...(yer === "bas" ? [sonucHucresi] : []),
                ...b.sutunlar.map((x) => h("td", { key: x.id }, deger(s[x.id]))), ...(yer === "son" ? [sonucHucresi] : []));
            }) : [h("tr", { key: 0 }, h("td", { colSpan: b.sutunlar.length + (yer === "gizli" ? 1 : 2) }, "-"))]))),
          b.notlar?.length ? h("ol", { className: "rb-notlar" }, ...b.notlar.map((n, i) => h("li", { key: i }, `Not-${i + 1}: ${n.metin}`))) : null,
          sonuclar.some((r) => r?.elle) ? h("ul", { className: "rb-notlar" }, ...sonuclar.flatMap((r, i) => (r?.elle
            ? [h("li", { key: i }, `${i + 1}. satırın sonucu muayene uzmanınca değiştirildi (kural: ${r.elle.kural === true ? "Uygun" : r.elle.kural === false ? "Uygun değil" : "-"}): ${r.elle.gerekce || "-"}`)] : []))) : null);
      }
      /* 595 (madde 6): ek sütunlar sonda (sahada her değerde yazılan) */
      case "test": return h("table", null, baslikSatiri(...Object.values(testBasliklari(b)), ...(b.ekSutunlar ?? []).map((s) => s.ad)), h("tbody", null, ...b.degerler.map((x) => {
        const s = c.deger[x.id], r = d.degerler[x.id];
        const sinir = x.op && x.sinir !== undefined ? `${SINIR_ISARETI[x.op]} ${String(x.sinir).replace(".", ",")}${x.birim ? ` ${x.birim}` : ""}`
          : x.olumsuz?.length ? (x.secenekler ?? []).filter((o) => !x.olumsuz!.includes(o)).join(" / ") || "-" : deger(x.not);
        return h("tr", { key: x.id }, h("td", null, x.ad), h("td", null, s && s.trim() ? `${s}${x.birim ? ` ${x.birim}` : ""}` : "-"), h("td", null, sinir),
          h("td", null, r === true ? "Uygun" : r === false ? "Uygun değil" : "-"), ...(b.ekSutunlar ?? []).map((s) => h("td", { key: s.id }, deger(c.ek[ekAnahtari(x.id, s.id)]))));
      })));
      case "cihaz": return cihazTablosu(b);
      /* 595 (madde 16): önce kutuların fotoğrafları (kutu sırasıyla, altında kutunun adı), sonra kutusuzlar */
      case "foto": {
        const sira = new Map((b.kutular ?? []).map((k, j) => [k.id, j]));
        const l = v.fotolar.filter((f) => f.bolum === b.id && (!f.madde || sira.has(f.madde)))
          .map((f, j) => ({ f, j })).sort((x, y) => (sira.get(x.f.madde ?? "") ?? 99) - (sira.get(y.f.madde ?? "") ?? 99) || x.j - y.j).map((x) => x.f);
        return fotolar(l, (f) => (f.madde && kutuAdi.has(f.madde) ? kutuAdi.get(f.madde)! : f.ad));
      }
      /* 595 (madde 10): sütunları tanımlıysa tablo (No · Bölüm · Uygunluk · Ağırlık · Fotoğraf — formatın seçtikleri, adlarıyla) */
      case "kusur": if (b.sutunlar?.length) {
        const bolumAdi = new Map(t.bolumler.map((x) => [x.id, x.ad]));
        const hucre = (k: (typeof d.kusurlar)[number], i: number, a: KusurAlani): string => {
          if (a === "sira") return String(i + 1);
          if (a === "bolum") return bolumAdi.get(k.bolum) ?? "-";
          if (a === "metin") return k.metin;
          if (a === "agir") return k.agir ? "Ağır" : "Hafif";
          const fl = v.fotolar.filter((f) => f.madde && f.madde === k.ref).map((f) => f.ad);
          return fl.length ? fl.join(", ") : "-";
        };
        return h("table", null, baslikSatiri(...b.sutunlar.map((s) => s.ad)), h("tbody", null, ...(d.kusurlar.length
          ? d.kusurlar.map((k, i) => h("tr", { key: i }, ...b.sutunlar!.map((s) => h("td", { key: s.id, ...(s.alan === "sira" ? { className: "rb-orta" } : {}) }, hucre(k, i, s.alan)))))
          : [h("tr", { key: 0 }, h("td", { colSpan: b.sutunlar.length }, "Kusur yok."))])));
      }
      return d.kusurlar.length
        ? h("ul", { className: "rb-kusurlar" }, ...d.kusurlar.map((k, i) => {
          const fl = v.fotolar.filter((f) => f.madde && f.madde === k.ref).map((f) => f.ad);
          return h("li", { key: i }, `${k.agir ? "** " : "* "}${k.metin}${fl.length ? ` (Fotoğraf: ${fl.join(", ")})` : ""}`);
        }))
        : kutu("Kusur yok.");
      case "sonuc": {
        const cumle = b.cumle.trim(), aciklama = b.aciklama.trim();
        return h(Fragment, null, cumle
          ? kutu(`${cumle} `, h("b", null, sonucSozcugu(b, v.sonuc) ?? "-"), ".")
          : kutu("Sonuç: ", h("b", null, v.sonuc ? SONUC[v.sonuc] : "-")),
          /* 426: Bakanlık formatının sonuç metni (ağır kusurlar tanımı, açıklamalar) satır satır */
          aciklama ? h("div", { className: "rb-aciklama" }, ...aciklama.split("\n").map((s, i) => h("p", { key: i }, s))) : null);
      }
      /* 595 (madde 11): yorum boşsa yönlendirme yazısı; satır sayısı formatın (en az o kadar boşluk) */
      case "not": {
        const y = c.yorum.trim();
        const stil = b.satir ? { minHeight: `${(b.satir * 1.25).toFixed(2)}em` } : undefined;
        return h("p", { className: "rb-kutu-metin", ...(stil ? { style: stil } : {}) }, y || (b.yonlendirme ? b.yonlendirme : "-"));
      }
      case "imza": return imza(b);
      /* 495: serbest metin — formatın sabit yazısı, satır satır */
      case "metin": return b.metin.trim() ? h("div", { className: "rb-aciklama" }, ...b.metin.trim().split("\n").map((s, i) => h("p", { key: i }, s))) : kutu("-");
    }
  };

  /* 595 (madde 3): 1. bölümün satır değeri — plandan / kayıttan / sahadan; serbest satır formatın sabit yazısı (boşsa boş hücre) */
  const firmaDegeri = (s: FirmaSatiri): ReactNode => {
    switch (s.kaynak) {
      case "firma": return kunye.firma;
      case "adres": return deger(kunye.adres);
      case "rapor_no": return no;
      case "rapor_tarihi": return tarihNo(v.tarih.rapor);
      case "isg": return kunye.isg ?? "Yok";
      case "sgk": return kunye.sgk ?? "Yok";
      case "bas": return saatliNo(v.tarih.bas);
      case "bit": return saatliNo(v.tarih.bit);
      case "sonraki": return tarihNo(v.tarih.sonraki);
      case "takip": return tarihNo(v.tarih.takip);
      case "metot": return kunye.metot || "-";
      case "eposta": return deger(kunye.eposta);
      case "tel": return deger(kunye.tel);
      case "plan_no": return deger(v.planNo);
      case "serbest": return s.metin?.trim() ?? "";
    }
  };
  /* 595 (madde 13): başlık tablosunun doküman bilgisi */
  const basDegeri = (s: BasSatiri): string => {
    switch (s.kaynak) {
      case "kod": return formKod;
      case "surum": return String(v.formatSira);
      case "no": return no;
      case "tarih": return tarihNo(v.tarih.rapor);
      case "revizyon": return String(v.revizyon);
      case "nusha": return String(v.firma.nusha);
      case "sonraki": return tarihNo(v.tarih.sonraki);
      case "serbest": return s.metin?.trim() || "";
    }
  };
  /* 2. bölüm: kod ve tür; tam ekipman bölümlü formatta (460) ardından YALNIZ o bölümün alanları, formatın sırasıyla ve adıyla; eski formatta
     kayıttan başlayan sabit satırlar (formatın aynı adlı alanı yoksa — saha ekranıyla aynı liste), "Ekipman bölümü", sonra formatın ekipman alanları */
  const ekipman: Cift[] = [
    [ekipmanEtiketleri(t).kod, v.ekipman.kod], [ekipmanEtiketleri(t).tur, v.tur.ad],
    ...(duzen.tam ? duzen.tam.alanlar.map((a): Cift => [a.ad, alanDegeri(a), tamMi(a)])
      : [...sabitEkipmanAlanlari(t).map((k): Cift => [EKIPMAN_ALAN_ADI[k], deger(v.ekipman[k])]), ["Ekipman bölümü", deger(v.ekipman.bolum)] as Cift]),
  ];
  const belgeAdi = t.gorunum.baslik || `${v.tur.ad} periyodik kontrol raporu`;
  /* 2026-10-23 (basılı formdan şablon): görünüm sınıfları (bölüm başlığı zemini / hizası, etiket hücresi) ve belgenin başı formatın */
  return h("article", { className: ["rb-sayfa", belgeStilSiniflari(t)].filter(Boolean).join(" "), "aria-label": `${no} rapor belgesi` },
    basTuru(t) === "ad" ? h("table", { className: "rb-bas rb-bas-yalniz" }, h("tbody", null, h("tr", null, h("td", { className: "rb-bas-ad" }, belgeAdi))))
    /* 595 (madde 13): hücrelerin sırası ve doküman bilgisi satırları formatın (verilmemişse bugünkü tablo) */
    : h("table", { className: "rb-bas" }, kolonlar(basSirasi(t).map((x) => BAS_GENISLIK[x])), h("tbody", null, h("tr", null,
      ...basSirasi(t).map((x) => x === "logo" ? h("td", { key: x, className: "rb-logo" }, firmaLogosu(v.firma))
        : x === "firma" ? h("td", { key: x, className: "rb-firma" }, h("b", null, v.firma.ad), ...firmaAdresi(v.firma))
        /* akreditasyon (TÜRKAK) numarası Firma ayarlarından; yoksa hücre boş (458: "AKR." yer tutucusu anlaşılmıyordu) */
        : x === "akr" ? h("td", { key: x, className: "rb-logo" }, v.firma.akr ? `AKR. ${v.firma.akr}` : "")
        : x === "ad" ? h("td", { key: x, className: "rb-bas-ad" }, belgeAdi)
        : h("td", { key: x, className: "rb-dok" }, ...basSatirlari(t).map((s) => h("div", { key: s.id }, h("span", null, s.ad), `: ${basDegeri(s)}`))))))),
    v.imza || v.kesin ? null : h("p", { className: "rb-taslak" }, "İmzasız önizleme — muayene uzmanının son imzasıyla geçerli olur."),
    /* 595 (madde 3): satırlar formatın (adı, sırası, varlığı — format/duzen.ts firmaSatirlari; verilmemişse bugünkü 11 satır), değer kayıttan */
    bolum("1", "Firma bilgileri", bilgiTablosu([
      ...firmaSatirlari(t).map((s): Cift => [s.ad, firmaDegeri(s), !!s.tam]),
      /* 486: formatta ekipman bölümü kaldırıldıysa kod ve tür burada (rapor hangi ekipmanın — her belgede) */
      ...(duzen.ekipman ? [] : ekipman.slice(0, 2)),
    ])),
    duzen.ekipman ? bolum("2", duzen.ekipmanBaslik, bilgiTablosu(ekipman, duzen.tam?.dizilis ?? 2), ...(duzen.tam ? [] : katilan).map((b) => h(Fragment, { key: b.id }, bilgi(b, true)))) : null,
    duzen.cihazNo ? bolum(duzen.cihazNo, "Ölçüm cihazları", cihazTablosu()) : null,
    ...duzen.bolumler.flatMap((x) => [x.ust ? ustBaslik(x.ust.no, x.ust.ad) : null, bolum(x.no, x.b.ad, formatBolumu(x.b))]),
    imzaVar ? null : bolum(duzen.sonraki, "Yetkili kişi", imza()),
    maddeFotolari.length ? bolum("Ek", "Kontrol maddelerinin fotoğrafları", fotolar(maddeFotolari, (f) => `${f.ad} · ${maddeAdi.get(f.madde!) ?? ""}`)) : null,
    h("footer", { className: "rb-alt" }, altYazisi(t, v.firma, formKod)));
}
