/* YALNIZ TEST VERİSİ ÜRETİR; ürün kodu bu klasörü import edemez — imza üretimi probata-sign'da (reisim 2026-10-17: "probatanın kaynak kodlarına
   bunları bulaştırma"; kilit tests/imza-ayrim.test.ts). PDF ARTIMLI EK YAZICISI: belgenin özgün baytlarına DOKUNMADAN sonuna yeni nesneler, yeni
   çapraz başvuru (özgündeki türde: klasik tablo ya da xref akışı) ve trailer ekler; sözlükte üst düzey anahtarı yazar. Testler bununla imza / DSS /
   belge damgası eki ve imzadan sonraki değişiklik kurar; okuyucu (src/server/imza/pdf-ek.ts) ve çözümleyici (pdf-imzalar.ts) probata'da kalır.
   src/server/imza/pdf-ek.ts'in yazıcı kısmından taşındı (davranış aynı). */
import { anahtarlar, sonDurum, PdfHatasi, type SonDurum } from "../../../src/server/imza/pdf-ek.ts";

/** sözlükte anahtarı yaz (varsa değiştir, yoksa sona ekle) */
export function degerYaz(sozluk: string, ad: string, deger: string): string {
  const y = anahtarlar(sozluk).get(ad);
  if (y) return `${sozluk.slice(0, y[0])}${deger}${sozluk.slice(y[1])}`;
  const son = sozluk.lastIndexOf(">>");
  return `${sozluk.slice(0, son).replace(/[\x00\t\n\f\r ]*$/, "")} /${ad} ${deger} >>`;
}

export interface YeniNesne { no: number; govde: string | Buffer }

/** akış nesnesi gövdesi (sıkıştırmasız) */
export const akisGovdesi = (veri: Buffer, sozluk = "") => Buffer.concat([Buffer.from(`<< ${sozluk}/Length ${veri.length} >>\nstream\n`, "latin1"), veri, Buffer.from("\nendstream", "latin1")]);

/** nesneleri sona ekler, özgündeki türde çapraz başvuru + trailer yazar; dönen: yeni dosya ve her nesnenin konumu */
export function ekle(pdf: Uint8Array, nesneler: readonly YeniNesne[], d: SonDurum = sonDurum(pdf)): { pdf: Buffer; konum: Map<number, number> } {
  const parcalar: Buffer[] = [Buffer.from(pdf)];
  let uzunluk = pdf.length;
  const yaz = (b: Buffer | string) => { const x = typeof b === "string" ? Buffer.from(b, "latin1") : b; parcalar.push(x); uzunluk += x.length; };
  if (pdf[pdf.length - 1] !== 0x0a && pdf[pdf.length - 1] !== 0x0d) yaz("\n");
  const konum = new Map<number, number>();
  for (const x of nesneler) {
    if (!Number.isSafeInteger(x.no) || x.no < 1) throw new PdfHatasi("nesne no");
    konum.set(x.no, uzunluk);
    yaz(`${x.no} 0 obj\n`); yaz(x.govde); yaz("\nendobj\n");
  }
  let boyut = Math.max(d.boyut, ...[...konum.keys()].map((n) => n + 1));
  const ekler = [`/Root ${d.kok}`, `/Prev ${d.xref}`, ...(d.bilgi ? [`/Info ${d.bilgi}`] : []), ...(d.kimlik ? [`/ID ${d.kimlik}`] : [])].join(" ");
  if (!d.akis) {
    const xref = uzunluk;
    yaz(`xref\n0 1\n0000000000 65535 f\r\n${altBolumler([...konum]).map((g) => `${g[0][0]} ${g.length}\n${g.map(([, o]) => `${String(o).padStart(10, "0")} 00000 n\r\n`).join("")}`).join("")}`);
    yaz(`trailer\n<< /Size ${boyut} ${ekler} >>\nstartxref\n${xref}\n%%EOF\n`);
  } else {
    const no = boyut++, xref = uzunluk;
    const girdiler = [...konum, [no, xref] as [number, number]];
    const gruplar = altBolumler(girdiler);
    const veri = Buffer.concat(gruplar.flat().map(([, o]) => { const b = Buffer.alloc(7); b[0] = 1; b.writeUInt32BE(o, 1); b.writeUInt16BE(0, 5); return b; }));
    yaz(`${no} 0 obj\n`);
    yaz(akisGovdesi(veri, `/Type /XRef /Size ${boyut} /W [1 4 2] /Index [${gruplar.map((g) => `${g[0][0]} ${g.length}`).join(" ")}] ${ekler} `));
    yaz(`\nendobj\nstartxref\n${xref}\n%%EOF\n`);
  }
  return { pdf: Buffer.concat(parcalar), konum };
}

/** ardışık numaralı alt bölümler */
function altBolumler(l: [number, number][]): [number, number][][] {
  const s = [...l].sort((a, b) => a[0] - b[0]);
  const g: [number, number][][] = [];
  for (const x of s) { const son = g[g.length - 1]; if (son && son[son.length - 1][0] + 1 === x[0]) son.push(x); else g.push([x]); }
  return g;
}
