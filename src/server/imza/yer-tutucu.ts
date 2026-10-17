/* İMZA YER TUTUCUSU (IMZA-SERVISI.md ES2 — imza motoru, 2026-10-17). Saf. Belgeye artımlı ekle imza sözlüğü (/Type /Sig ya da /DocTimeStamp) + onu
   gösteren imza alanı yazılır; sözlükte sabit genişlikli /ByteRange ve sıfır dolu /Contents yer tutucusu. Ek yazıldıktan SONRA kapsam
   hesaplanır, aynı genişlikle yerine yazılır, kapsanan baytların özeti imzalanır, imza (CMS ya da zaman damgası) /Contents'e sığdırılır —
   çapraz başvurudaki konumlar değişmez. Boş imza alanı varsa (src/belge/eimza.ts — formatın e-imza yeri) o doldurulur, yoksa görünmez alan
   eklenir. */
import { anahtarlar, basvuru, degerOku, degerYaz, ekle, nesneOkuyucu, sonDurum, PdfHatasi, type YeniNesne } from "./pdf-ek.ts";

type Oku = (no: number) => string | null;

const KAPSAM = "[0 ********** ********** **********]";
export const VARSAYILAN_YER = 32_768;

export interface YerTutucu {
  /** yer tutuculu belge (kapsam yazılmış, /Contents sıfır) */
  pdf: Buffer;
  /** /Contents onaltılık alanının başı (< 'den sonra) ve uzunluğu */
  icerikBas: number;
  icerikUzunluk: number;
  /** kapsanan parçalar */
  parcalar: [Buffer, Buffer];
}

const pdfTarihi = (t: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `D:${t.getUTCFullYear()}${p(t.getUTCMonth() + 1)}${p(t.getUTCDate())}${p(t.getUTCHours())}${p(t.getUTCMinutes())}${p(t.getUTCSeconds())}Z`;
};
const pdfDize = (s: string) => `(${s.replace(/[\\()]/g, (c) => `\\${c}`).replace(/[^\x20-\x7e]/g, "?")})`;

/** imza alanını bul: adı verilen boş alan (/FT /Sig, /V yok) — katalog › AcroForm › Fields; yoksa null */
function bosAlan(oku: Oku, katalog: string, ad: string): { no: number; govde: string } | null {
  const form = degerOku(katalog, "AcroForm");
  if (!form) return null;
  const fr = basvuru(form);
  const formGovde = fr ? oku(fr[0]) : form;
  const alanlar = formGovde ? degerOku(formGovde, "Fields") : null;
  if (!alanlar) return null;
  const ar = basvuru(alanlar);
  const dizi = ar ? oku(ar[0]) ?? "" : alanlar;
  for (const m of dizi.matchAll(/(\d{1,10})[\x00\t\n\f\r ]+(\d{1,5})[\x00\t\n\f\r ]+R/g)) {
    const no = Number(m[1]), g = oku(no);
    if (!g || !g.startsWith("<<")) continue;
    if (degerOku(g, "FT")?.trim() !== "/Sig" || degerOku(g, "V")) continue;
    const t = degerOku(g, "T")?.trim();
    if (t === pdfDize(ad)) return { no, govde: g };
  }
  return null;
}

/** AcroForm'a alan ekleyen nesne değişiklikleri (katalog ya da AcroForm ya da Fields dizisi yeniden tanımlanır) */
function alanEkle(oku: Oku, kokNo: number, katalog: string, alanNo: number): YeniNesne[] {
  const ref = `${alanNo} 0 R`;
  const form = degerOku(katalog, "AcroForm");
  if (!form) return [{ no: kokNo, govde: degerYaz(katalog, "AcroForm", `<< /Fields [${ref}] /SigFlags 3 >>`) }];
  const fr = basvuru(form);
  const formGovde = fr ? oku(fr[0]) : form;
  if (!formGovde) throw new PdfHatasi("AcroForm okunamadı");
  const alanlar = degerOku(formGovde, "Fields");
  const ar = basvuru(alanlar);
  if (ar) {
    const dizi = oku(ar[0]);
    if (!dizi || !dizi.startsWith("[")) throw new PdfHatasi("Fields okunamadı");
    const yeniForm = degerYaz(formGovde, "SigFlags", "3");
    const l: YeniNesne[] = [{ no: ar[0], govde: `${dizi.slice(0, -1).trimEnd()} ${ref}]` }];
    if (yeniForm !== formGovde) l.push(fr ? { no: fr[0], govde: yeniForm } : { no: kokNo, govde: degerYaz(katalog, "AcroForm", yeniForm) });
    return l;
  }
  const yeniForm = degerYaz(degerYaz(formGovde, "Fields", alanlar ? `${alanlar.slice(0, -1).trimEnd()} ${ref}]` : `[${ref}]`), "SigFlags", "3");
  return [fr ? { no: fr[0], govde: yeniForm } : { no: kokNo, govde: degerYaz(katalog, "AcroForm", yeniForm) }];
}

/** ilk sayfa (sayfa ağacında ilk yaprak) */
function ilkSayfa(oku: Oku, katalog: string): { no: number; govde: string } | null {
  let r = basvuru(degerOku(katalog, "Pages"));
  for (let d = 0; r && d < 32; d++) {
    const g = oku(r[0]);
    if (!g?.startsWith("<<")) return null;
    if (/^\/Page$/.test(degerOku(g, "Type")?.trim() ?? "")) return { no: r[0], govde: g };
    const k = degerOku(g, "Kids");
    const kr = basvuru(k);
    const dizi = kr ? oku(kr[0]) : k;
    const m = dizi ? /(\d{1,10})[\x00\t\n\f\r ]+(\d{1,5})[\x00\t\n\f\r ]+R/.exec(dizi) : null;
    r = m ? [Number(m[1]), Number(m[2])] : null;
  }
  return null;
}

/** görünmez alanı ilk sayfanın açıklamalarına ekleyen değişiklik (sayfa ya da dolaylı Annots dizisi yeniden tanımlanır) */
function sayfayaEkle(oku: Oku, sayfa: { no: number; govde: string }, alanNo: number): YeniNesne {
  const ref = `${alanNo} 0 R`;
  const a = degerOku(sayfa.govde, "Annots");
  const ar = basvuru(a);
  if (ar) {
    const dizi = oku(ar[0]);
    if (!dizi?.startsWith("[")) throw new PdfHatasi("Annots okunamadı");
    return { no: ar[0], govde: `${dizi.slice(0, -1).trimEnd()} ${ref}]` };
  }
  return { no: sayfa.no, govde: degerYaz(sayfa.govde, "Annots", a ? `${a.slice(0, -1).trimEnd()} ${ref}]` : `[${ref}]`) };
}

/** belgeye imza sözlüğü + alan yer tutucusu ekler */
export function yerTutucuEkle(pdf: Uint8Array, p: {
  tur: "imza" | "belge_damgasi";
  /** doldurulacak boş imza alanının adı (yoksa görünmez yeni alan) */
  alan?: string;
  yeniAlanAdi?: string;
  zaman?: Date;
  neden?: string;
  yer?: number;
}): YerTutucu {
  const d = sonDurum(pdf);
  const kok = basvuru(d.kok);
  if (!kok) throw new PdfHatasi("kök yok");
  const oku = nesneOkuyucu(pdf);
  const katalog = oku(kok[0]);
  if (!katalog?.startsWith("<<")) throw new PdfHatasi("katalog okunamadı");
  anahtarlar(katalog);
  const uzunluk = p.yer ?? VARSAYILAN_YER;
  let no = d.boyut;
  const sigNo = no++;
  const sozluk = p.tur === "imza"
    ? `<< /Type /Sig /Filter /Adobe.PPKLite /SubFilter /ETSI.CAdES.detached /M (${pdfTarihi(p.zaman ?? new Date())})${p.neden ? ` /Reason ${pdfDize(p.neden)}` : ""} /ByteRange ${KAPSAM} /Contents <${"0".repeat(uzunluk)}> >>`
    : `<< /Type /DocTimeStamp /Filter /Adobe.PPKLite /SubFilter /ETSI.RFC3161 /ByteRange ${KAPSAM} /Contents <${"0".repeat(uzunluk)}> >>`;
  const nesneler: YeniNesne[] = [{ no: sigNo, govde: sozluk }];
  const bos = p.alan ? bosAlan(oku, katalog, p.alan) : null;
  if (bos) nesneler.push({ no: bos.no, govde: degerYaz(bos.govde, "V", `${sigNo} 0 R`) });
  else {
    /* görünmez alan: Rect sıfır, gizli + kilitli; ilk sayfanın açıklaması (imza araçları alanı sayfadan da bulur) */
    const alanNo = no++;
    const sayfa = ilkSayfa(oku, katalog);
    if (!sayfa) throw new PdfHatasi("sayfa bulunamadı");
    nesneler.push({ no: alanNo, govde: `<< /Type /Annot /Subtype /Widget /FT /Sig /F 132 /Rect [0 0 0 0] /P ${sayfa.no} 0 R /T ${pdfDize(p.yeniAlanAdi ?? (p.tur === "imza" ? "Imza" : "Arsiv damgasi"))} /V ${sigNo} 0 R >>` });
    nesneler.push(sayfayaEkle(oku, sayfa, alanNo), ...alanEkle(oku, kok[0], katalog, alanNo));
  }
  const { pdf: yeni, konum } = ekle(pdf, nesneler, d);
  /* yer tutucunun yeri: imza nesnesinin içinde */
  const s = yeni.toString("latin1");
  const kb = s.indexOf(`/ByteRange ${KAPSAM}`, konum.get(sigNo)!);
  const ib = s.indexOf("/Contents <", kb) + "/Contents <".length;
  if (kb < 0 || ib < "/Contents <".length) throw new PdfHatasi("yer tutucu bulunamadı");
  const a = ib - 1, b = ib + uzunluk + 1, c = yeni.length - b;
  const kapsam = `[0 ${String(a).padEnd(10)} ${String(b).padEnd(10)} ${String(c).padEnd(10)}]`;
  if (kapsam.length !== KAPSAM.length) throw new PdfHatasi("kapsam sığmadı");
  yeni.write(kapsam, kb + "/ByteRange ".length, "latin1");
  return { pdf: yeni, icerikBas: ib, icerikUzunluk: uzunluk, parcalar: [yeni.subarray(0, a), yeni.subarray(b)] };
}

/** imzayı (DER) /Contents'e yazar — sığmazsa hata */
export function icerikYaz(y: YerTutucu, der: Buffer): Buffer {
  const hex = der.toString("hex");
  if (hex.length > y.icerikUzunluk) throw new PdfHatasi(`imza yer tutucuya sığmadı (${hex.length} > ${y.icerikUzunluk})`);
  const sonuc = Buffer.from(y.pdf);
  sonuc.write(hex, y.icerikBas, "latin1");
  return sonuc;
}
