/* DENEME PDF YAZICISI (2026-10-17, src/modules/raporlar/imza-esdeger.ts): uydurma rapor PDF'i — sayfalar (boyut sayfa ağacından miras), sıkıştırılmış
   çizim akışları, yazı tipi, resim, grafik durumu, sayfa başına doğrulama bağlantısı, son sayfada boş e-imza alanı; çapraz başvuru tablosu ve
   trailer doğru — ve imza servisinin (imzayeri — OpenPDF) yaptığı gibi YENİDEN YAZIM: nesneler yeniden numaralanır, dizgiler onaltılık, uzun
   ondalıklar iki basamak, sıkıştırılmış akışlar yeniden sıkıştırılır, her sayfanın çizimi "q" … "Q q 1 0 0 1 25 6 cm /Xi0 Do Q Q" ile sarılır,
   damga formu ve servisin bağlantısı eklenir, boş imza alanı atılır. Olumsuz denemeler için her adım değiştirilebilir. Gerçek veri yok. */
import { deflateSync } from "node:zlib";
import { nesneOkuyucu, sonDurum } from "../../src/server/imza/pdf-ek.ts";

export interface Nesne { no: number; sozluk: string; akis?: Buffer }
const L = (s: string) => Buffer.from(s, "latin1");

/** nesnelerden PDF: başlık, nesneler, çapraz başvuru tablosu, trailer, startxref (akışın /Length'i yazıcıda) */
export function pdfYaz(nesneler: Nesne[], kok: number): Uint8Array {
  const parcalar: Buffer[] = [L("%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")];
  let konum = parcalar[0].length;
  const yer = new Map<number, number>();
  for (const n of [...nesneler].sort((a, b) => a.no - b.no)) {
    yer.set(n.no, konum);
    const sozluk = n.akis ? n.sozluk.replace(/>>\s*$/, ` /Length ${n.akis.length} >>`) : n.sozluk;
    const p = Buffer.concat([L(`${n.no} 0 obj\n${sozluk}\n`), ...(n.akis ? [L("stream\n"), n.akis, L("\nendstream\n")] : []), L("endobj\n")]);
    parcalar.push(p);
    konum += p.length;
  }
  const boyut = Math.max(...yer.keys()) + 1;
  let xref = `xref\n0 ${boyut}\n0000000000 65535 f \n`;
  for (let i = 1; i < boyut; i++) xref += yer.has(i) ? `${String(yer.get(i)).padStart(10, "0")} 00000 n \n` : "0000000000 00000 f \n";
  parcalar.push(L(`${xref}trailer\n<< /Size ${boyut} /Root ${kok} 0 R >>\nstartxref\n${konum}\n%%EOF\n`));
  return new Uint8Array(Buffer.concat(parcalar));
}

/** sarili: e-imza alanı konan sayfanın çizimi pdf-lib'in yaptığı gibi "q" … "Q" akışlarıyla sarılı (2026-10-17, gerçek imzasız PDF'teki düzen) */
export interface OrnekSecenek { sayfa?: number; metin?: string; dogrulama?: string | null; imzaYeri?: boolean; resim?: Buffer; sarili?: boolean }
/** uydurma rapor PDF'i (Chromium çıktısına benzer düzen) */
export function ornekPdf(p: OrnekSecenek = {}): Uint8Array {
  const sayfa = p.sayfa ?? 2, metin = p.metin ?? "Rapor", imzaYeri = p.imzaYeri ?? true;
  const n: Nesne[] = [
    { no: 3, sozluk: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>" },
    { no: 4, sozluk: "<< /Type /XObject /Subtype /Image /Width 2 /Height 2 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode >>",
      akis: p.resim ?? L("\xff\xd8\xff\xe0 deneme resmi \xff\xd9") },
    { no: 5, sozluk: "<< /Type /ExtGState /CA 1 /ca 1 >>" },
  ];
  const sayfalar: number[] = [];
  for (let i = 0; i < sayfa; i++) {
    const s = 10 + i * 3, c = s + 1, b = s + 2, son = i === sayfa - 1;
    sayfalar.push(s);
    const cizim = `q 1 0 0 -1 0 841.89 cm\nq 0.75 0 0 0.75 0 0 cm\nBT /F1 12 Tf 1 0 0 -1 40 60 Tm (${metin} - Uygun - sayfa ${i + 1}) Tj ET\n`
      + `0 0 0 RG 1 w 30 30 m 560 30 l S\nq 120 0 0 -60 40 200 cm /Im1 Do Q\n/G1 gs\nQ\nQ\n`;
    const annots = [...(p.dogrulama ? [`${b} 0 R`] : []), ...(son && imzaYeri ? ["6 0 R"] : [])];
    const sar = son && imzaYeri && !!p.sarili;
    n.push({ no: s, sozluk: `<< /Type /Page /Parent 2 0 R /Contents ${sar ? `[7 0 R ${c} 0 R 8 0 R]` : `${c} 0 R`} /Resources << /Font << /F1 3 0 R >> /XObject << /Im1 4 0 R >> `
      + `/ExtGState << /G1 5 0 R >> /ProcSet [/PDF /Text /ImageC] >>${annots.length ? ` /Annots [${annots.join(" ")}]` : ""} >>` });
    n.push({ no: c, sozluk: "<< /Filter /FlateDecode >>", akis: deflateSync(L(cizim)) });
    if (p.dogrulama) n.push({ no: b, sozluk: `<< /Type /Annot /Subtype /Link /Rect [480 8 560 52] /Border [0 0 0] /A << /S /URI /URI (${p.dogrulama}) >> >>` });
  }
  if (imzaYeri && p.sarili) n.push({ no: 7, sozluk: "<< /Filter /FlateDecode >>", akis: deflateSync(L("q\n")) }, { no: 8, sozluk: "<< /Filter /FlateDecode >>", akis: deflateSync(L("Q\n")) });
  if (imzaYeri) n.push({ no: 6, sozluk: `<< /Type /Annot /Subtype /Widget /FT /Sig /T (probata-eimza) /F 4 /Rect [380 120 560 180] /P ${sayfalar.at(-1)} 0 R >>` });
  n.push({ no: 2, sozluk: `<< /Type /Pages /Kids [${sayfalar.map((x) => `${x} 0 R`).join(" ")}] /Count ${sayfa} /MediaBox [0 0 595.27559 841.88976] >>` });
  n.push({ no: 1, sozluk: `<< /Type /Catalog /Pages 2 0 R /Lang (tr)${imzaYeri ? " /AcroForm << /Fields [6 0 R] >>" : ""} >>` });
  return pdfYaz(n, 1);
}

export interface YenidenSecenek {
  /** nesne numarası kayması */
  kaydir?: number;
  /** sayfanın çiziminin önüne / arkasına eklenen akışlar */
  onek?: string;
  sonek?: string;
  /** damga formunun kutusu */
  damga?: [number, number, number, number];
  /** boş imza alanı kalsın; bizim bağlantılarımız atılsın */
  imzaAlaniKalsin?: boolean;
  baglantiAt?: boolean;
  /** bizim çizimimiz (çözülmüş) değiştirilir */
  icerik?: (v: Buffer, sayfa: number) => Buffer;
  /** nesnenin (yeni numarasıyla) sözlüğü değiştirilir — olumsuz denemeler */
  sozluk?: (s: string, eskiNo: number) => string;
  /** ek nesneler (yeni numaralı) ve sayfanın açıklamalarına eklenecekler */
  ekNesne?: Nesne[];
  ekAciklama?: string[];
}
/** imza servisi gibi baştan yeniden yazar (OpenPDF'in yaptıkları — dosyanın başındaki açıklama) */
export function yenidenYaz(a: Uint8Array, p: YenidenSecenek = {}): Uint8Array {
  const k = p.kaydir ?? 100, o = nesneOkuyucu(a), kok = Number(sonDurum(a).kok.split(" ")[0]);
  const onekNo = 9000, sonekNo = 9001, damgaNo = 9002, servisNo = 9003;
  const nesneler: Nesne[] = [];
  const hex = (s: string) => `<${Buffer.from(s.replace(/\\([()\\])/g, "$1"), "latin1").toString("hex")}>`;
  const donustur = (s: string) => s.replace(/\((?:[^()\\]|\\.)*\)/g, (m) => hex(m.slice(1, -1)))
    .replace(/(\d+) (\d+) R/g, (_, n: string, g: string) => `${Number(n) + k} ${g} R`)
    .replace(/\d+\.\d{3,}/g, (m) => Number(m).toFixed(2)).replace(/\/Length \d+ ?/, "");
  const tur = (no: number) => o(no) ?? "";
  /* atılan açıklamalar (boş imza alanı, bizim bağlantılarımız) dosyaya hiç yazılmaz — araç başvurulmayan nesneyi taşımaz */
  const atilan = new Set<number>();
  for (const [no, y] of o.yerler ?? new Map()) {
    const g = y.tur === "duz" ? tur(no) : "";
    if ((!p.imzaAlaniKalsin && /\/FT \/Sig/.test(g)) || (!!p.baglantiAt && /\/Subtype \/Link/.test(g))) atilan.add(no);
  }
  let sayfaSira = 0;
  for (const [no, y] of o.yerler ?? new Map()) {
    if (y.tur !== "duz" || no === 0 || atilan.has(no)) continue;
    const ham = o.ham(no), cozulmus = o.akis(no);
    let s = donustur(tur(no));
    let akis = ham ?? undefined;
    if (cozulmus && /\/FlateDecode/.test(s)) akis = deflateSync(cozulmus, { level: 1 });
    if (no === kok) s = s.replace(/ ?\/AcroForm <<[^<>]*>>/, "");
    if (/\/Type \/Page\b/.test(s)) {
      const sira = sayfaSira++;
      s = s.replace(/\/Contents (?:(\d+ \d+ R)|\[([^\]]*)\])/, (_, tek: string | undefined, dizi: string | undefined) =>
        `/Contents [${onekNo + 10 * sira} 0 R ${(tek ?? dizi ?? "").trim()} ${sonekNo + 10 * sira} 0 R]`)
        .replace("/XObject <<", `/XObject << /Xi0 ${damgaNo} 0 R`);
      const at = (r: string) => atilan.has(Number(r.split(" ")[0]) - k);
      const eski = /\/Annots \[([^\]]*)\]/.exec(s)?.[1].trim().match(/\d+ \d+ R/g) ?? [];
      const yeni = [...eski.filter((r) => !at(r)), `${servisNo} 0 R`, ...(p.ekAciklama ?? [])];
      s = /\/Annots \[/.test(s) ? s.replace(/\/Annots \[[^\]]*\]/, `/Annots [${yeni.join(" ")}]`) : s.replace(/>>\s*$/, `/Annots [${yeni.join(" ")}] >>`);
      nesneler.push({ no: onekNo + 10 * sira, sozluk: "<< >>", akis: L(p.onek ?? "q\n") });
      nesneler.push({ no: sonekNo + 10 * sira, sozluk: "<< >>", akis: L(p.sonek ?? " Q\nq\nq 1 0 0 1 25 6 cm /Xi0 Do Q\nQ\n") });
    }
    if (p.icerik && cozulmus && !/\/Type/.test(s) && /\/FlateDecode/.test(s)) {
      const sira = [...(o.yerler ?? new Map()).keys()].filter((x) => /\/Type \/Page\b/.test(tur(x))).findIndex((x) => new RegExp(`/Contents (?:\\[[^\\]]*\\b)?${no} 0 R`).test(tur(x)));
      if (sira >= 0) akis = deflateSync(p.icerik(cozulmus, sira));
    }
    nesneler.push({ no: no + k, sozluk: p.sozluk ? p.sozluk(s, no) : s, akis });
  }
  const [x0, y0, x1, y1] = p.damga ?? [0, 0, 497, 43];
  nesneler.push({ no: damgaNo, sozluk: `<< /Type /XObject /Subtype /Form /BBox [${x0} ${y0} ${x1} ${y1}] /Matrix [1 0 0 1 0 0] /Resources << >> >>`,
    akis: L(`0.9 0.9 0.9 rg ${x0} ${y0} ${x1 - x0} ${y1 - y0} re f`) });
  nesneler.push({ no: servisNo, sozluk: "<< /Subtype /Link /H /T /Border [0 0 0] /Rect [49 6 546 49] /A << /S /URI /URI (https://imza.example/d/DENEME1) >> >>" });
  nesneler.push(...(p.ekNesne ?? []));
  return pdfYaz(nesneler, kok + k);
}

/** 2026-10-17 (yüklemede raporun doğrulama bağlantısı şart — raporlar.ts dogrulamaBagli): testlerin uydurma imzasız PDF'ine bağlantı (URI eylemi)
    eklenir; adres imzaHazirla'nın verdiği (BelgeVerisi.dogrulama). Bağlantının adresi testlerde bu firma adresiyle kurulur. */
export const DENEME_ADRESI = "https://deneme-a.deneme.example";
export function baglantiliPdf(metin: string, dogrulama?: string | null): Uint8Array {
  const i = metin.includes("trailer") ? metin.lastIndexOf("trailer") : metin.lastIndexOf("%%EOF");
  return new TextEncoder().encode(`${metin.slice(0, i)}9999 0 obj << /S /URI /URI (${dogrulama ?? ""}) >> endobj\n${metin.slice(i)}`);
}
