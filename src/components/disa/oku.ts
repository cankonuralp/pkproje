/* TABLO OKUYUCU (tek üretici; maket maket-ortak.js MK.tabloOku'nun karşılığı — pkproje §3.6: "Excel'den yükle gerçek .xlsx / .csv okur (dış
   kütüphane yok; Excel'in tarih sayısı çevrilir; ilk satır başlıksa atlanır)"). Saf: tarayıcıda ve düğümde aynı (açma DecompressionStream ile).
   Kişinin kendi seçtiği dosya kendi tarayıcısında okunur; sunucuya gitmez. Yine de sınırlar var (bozuk / kötü niyetli dosya sekmeyi kilitlemesin):
   dosya 10 MB, açılmış parçalar TOPLAM 50 MB (sıkıştırma bombası), 5 000 satır, 50 sütun. Tarih biçimli hücre "YYYY-AA-GG" olur. İlk sayfa
   okunur. Başlık satırını atlamak çağıranın işi (hangi sütunların beklendiğini o bilir).
   324–327 incelemesi: XML etiketleri DOĞRUSAL taranır (indexOf); kapanmayan etiket "bozuk" sayılır. Tembel düzenli ifade ([\s\S]*?) kapanmayan
   etikette her başlangıçtan metnin sonuna kadar arıyordu (karesel; birkaç on KB'lık sıkıştırılmış dosya sekmeyi saatlerce kilitliyordu). */

export const OKU_SINIR = { dosya: 10 * 1024 * 1024, parca: 50 * 1024 * 1024, satir: 5000, sutun: 50 } as const;

/** okunamayan dosya: iletisi olduğu gibi gösterilir */
export class TabloHatasi extends Error {}

type Giris = { yontem: number; boyut: number; acik: number; yerel: number };

/** ZIP'in merkez dizininden ad → giriş (yalnız okunacak parçalar açılır) */
function zipDizini(z: Uint8Array): Map<string, Giris> {
  const v = new DataView(z.buffer, z.byteOffset, z.byteLength);
  let son = -1;
  for (let i = z.length - 22; i >= Math.max(0, z.length - 22 - 65535); i--) if (v.getUint32(i, true) === 0x06054b50) { son = i; break; }
  if (son < 0) throw new TabloHatasi("Dosya .xlsx değil ya da bozuk.");
  const n = v.getUint16(son + 10, true);
  let p = v.getUint32(son + 16, true);
  const td = new TextDecoder(), l = new Map<string, Giris>();
  for (let i = 0; i < n; i++) {
    if (p + 46 > z.length || v.getUint32(p, true) !== 0x02014b50) throw new TabloHatasi("Dosya .xlsx değil ya da bozuk.");
    const adBoy = v.getUint16(p + 28, true), ekBoy = v.getUint16(p + 30, true), notBoy = v.getUint16(p + 32, true);
    l.set(td.decode(z.subarray(p + 46, p + 46 + adBoy)), {
      yontem: v.getUint16(p + 10, true), boyut: v.getUint32(p + 20, true), acik: v.getUint32(p + 24, true), yerel: v.getUint32(p + 42, true),
    });
    p += 46 + adBoy + ekBoy + notBoy;
  }
  return l;
}

/** girişin açılmış baytları; açılmış boyut sınırı aşılınca durur (bildirilen boyuta güvenilmez) */
async function zipParca(z: Uint8Array, g: Giris, sinir: number = OKU_SINIR.parca): Promise<Uint8Array> {
  const v = new DataView(z.buffer, z.byteOffset, z.byteLength);
  if (g.yerel + 30 > z.length || v.getUint32(g.yerel, true) !== 0x04034b50) throw new TabloHatasi("Dosya .xlsx değil ya da bozuk.");
  const bas = g.yerel + 30 + v.getUint16(g.yerel + 26, true) + v.getUint16(g.yerel + 28, true);
  const veri = z.subarray(bas, bas + g.boyut);
  if (g.yontem === 0) { if (veri.length > sinir) throw new TabloHatasi("Dosya çok büyük."); return veri; }
  if (g.yontem !== 8) throw new TabloHatasi("Dosyanın sıkıştırması desteklenmiyor.");
  const okuyucu = new Blob([veri as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw")).getReader();
  const parcalar: Uint8Array[] = [];
  let top = 0;
  for (;;) {
    const { done, value } = await okuyucu.read();
    if (done) break;
    top += value.length;
    if (top > sinir) { await okuyucu.cancel(); throw new TabloHatasi("Dosya çok büyük."); }
    parcalar.push(value);
  }
  const out = new Uint8Array(top);
  let i = 0;
  for (const x of parcalar) { out.set(x, i); i += x.length; }
  return out;
}

const VARLIK: Record<string, string> = { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'" };
/** XML metni: varlıklar ve OOXML'in _xHHHH_ kaçışı */
export const xmlCoz = (s: string) => s
  .replace(/&(#x[0-9a-fA-F]+|#\d+|lt|gt|amp|quot|apos);/g, (_t, k: string) =>
    k[0] === "#" ? String.fromCodePoint(k[1] === "x" ? parseInt(k.slice(2), 16) : Number(k.slice(1))) : VARLIK[k])
  .replace(/_x([0-9a-fA-F]{4})_/g, (_t, h: string) => String.fromCharCode(parseInt(h, 16)));
const ozellik = (etiket: string, ad: string) => new RegExp(`\\s${ad}="([^"]*)"`).exec(etiket)?.[1] ?? null;
const BOZUK = "Dosya .xlsx değil ya da bozuk.";
const adSonu = (c: string) => c === ">" || c === "/" || c === " " || c === "\t" || c === "\n" || c === "\r";
/** <ad …/> ya da <ad …>iç</ad> etiketleri sırayla (iç içe aynı ad yok — OOXML'de böyle); öz: etiketin özellik kısmı, iç: içerik (kendiliğinden
    kapanansa null). Doğrusal: her konum bir kez geçilir; kapanmayan etiket bozuk dosya */
export function* etiketler(x: string, ad: string): Generator<{ oz: string; ic: string | null }> {
  const ac = `<${ad}`, kap = `</${ad}>`;
  let i = 0;
  for (;;) {
    const b = x.indexOf(ac, i);
    if (b < 0) return;
    const o = b + ac.length;
    if (!adSonu(x.charAt(o))) { i = o; continue; }   // aynı önekli başka ad (<rowBreaks, <sheets …)
    const son = x.indexOf(">", o);
    if (son < 0) throw new TabloHatasi(BOZUK);
    if (x.charAt(son - 1) === "/") { yield { oz: x.slice(o, son - 1), ic: null }; i = son + 1; continue; }
    const k = x.indexOf(kap, son + 1);
    if (k < 0) throw new TabloHatasi(BOZUK);
    yield { oz: x.slice(o, son), ic: x.slice(son + 1, k) };
    i = k + kap.length;
  }
}
/** ilk etiketin içi (yoksa null) */
const ilkIc = (x: string, ad: string) => { for (const e of etiketler(x, ad)) return e.ic ?? ""; return null; };
/** <si> / <is> içindeki metin: bütün <t> parçaları (fonetik <rPh> hariç) */
function metinler(x: string): string {
  let y = "", i = 0;
  for (;;) {   // <rPh> blokları çıkarılır (doğrusal)
    const b = x.indexOf("<rPh", i);
    if (b < 0 || !adSonu(x.charAt(b + 4))) { y += x.slice(i, b < 0 ? undefined : b + 4); if (b < 0) break; i = b + 4; continue; }
    y += x.slice(i, b);
    const k = x.indexOf("</rPh>", b);
    if (k < 0) throw new TabloHatasi(BOZUK);
    i = k + 6;
  }
  return [...etiketler(y, "t")].map((e) => xmlCoz(e.ic ?? "")).join("");
}

/** sütun harfi → sıra (A → 0) */
const sutunNo = (r: string) => { let n = 0; for (const c of r.replace(/\d+$/, "")) n = n * 26 + (c.charCodeAt(0) - 64); return n - 1; };
/** Excel gün sayısı (1900 sistemi) → YYYY-AA-GG */
export function excelTarihi(n: number): string {
  const d = new Date(Date.UTC(1899, 11, 30) + Math.round(n * 86400000));
  return d.toISOString().slice(0, 10);
}
const TARIH_KODLARI = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 30, 36, 45, 46, 47, 50, 57]);
/** biçim kodu tarih mi: tırnak / köşeli parantez içi dışında d, m, y */
const tarihBicimi = (kod: string) => /[dmy]/i.test(kod.replace(/"[^"]*"|\[[^\]]*\]|\\./g, ""));

async function xlsxOku(z: Uint8Array): Promise<string[][]> {
  const d = zipDizini(z), td = new TextDecoder();
  let kalan: number = OKU_SINIR.parca;   // açılan bütün parçalar birlikte
  const oku = async (ad: string) => {
    const g = d.get(ad);
    if (!g) return null;
    const b = await zipParca(z, g, kalan);
    kalan -= b.length;
    return td.decode(b);
  };
  /* ilk sayfa: çalışma kitabındaki ilk <sheet>'in ilişkisi; yoksa sheet1 */
  let sayfaYolu = "xl/worksheets/sheet1.xml";
  const kitap = await oku("xl/workbook.xml"), iliski = await oku("xl/_rels/workbook.xml.rels");
  const ilk = kitap ? etiketler(kitap, "sheet").next().value?.oz : undefined;
  const rid = ilk && /\s[a-zA-Z0-9]+:id="([^"]*)"/.exec(` ${ilk}`)?.[1];
  if (rid && iliski) {
    const r = [...etiketler(iliski, "Relationship")].map((e) => ` ${e.oz}`).find((x) => ozellik(x, "Id") === rid);
    const hedef = r && ozellik(r, "Target");
    if (hedef) sayfaYolu = hedef.startsWith("/") ? hedef.slice(1) : `xl/${hedef.replace(/^\.\//, "")}`;
  }
  const sayfa = await oku(sayfaYolu);
  if (sayfa === null) throw new TabloHatasi("Dosyada sayfa bulunamadı.");
  const ortak = [...etiketler((await oku("xl/sharedStrings.xml")) ?? "", "si")].map((e) => metinler(e.ic ?? ""));
  /* tarih biçimli stiller (cellXfs sırası) */
  const stil = (await oku("xl/styles.xml")) ?? "";
  const ozel = new Map([...etiketler(stil, "numFmt")].map((e) => [Number(ozellik(` ${e.oz}`, "numFmtId")), xmlCoz(ozellik(` ${e.oz}`, "formatCode") ?? "")]));
  const xf = ilkIc(stil, "cellXfs") ?? "";
  const tarihStil = [...etiketler(xf, "xf")].map((e) => {
    const k = Number(ozellik(` ${e.oz}`, "numFmtId") ?? 0);
    return TARIH_KODLARI.has(k) || (ozel.has(k) && tarihBicimi(ozel.get(k)!));
  });
  const satirlar: string[][] = [];
  for (const sm of etiketler(sayfa, "row")) {
    const no = Number(ozellik(` ${sm.oz}`, "r") ?? satirlar.length + 1) - 1;
    if (no >= OKU_SINIR.satir) throw new TabloHatasi(`Dosyada en çok ${OKU_SINIR.satir.toLocaleString("tr-TR")} satır okunur.`);
    const satir: string[] = [];
    let sira = 0;
    for (const cm of etiketler(sm.ic ?? "", "c")) {
      const oz = ` ${cm.oz}`, r = ozellik(oz, "r"), i = r ? sutunNo(r) : sira;
      sira = i + 1;
      if (i < 0 || i >= OKU_SINIR.sutun) continue;
      const t = ozellik(oz, "t"), s = Number(ozellik(oz, "s") ?? 0), ic = cm.ic ?? "";
      const v = ilkIc(ic, "v") ?? undefined;
      let deger = "";
      if (t === "s") deger = ortak[Number(v)] ?? "";
      else if (t === "inlineStr") deger = metinler(ilkIc(ic, "is") ?? "");
      else if (t === "b") deger = v === "1" ? "DOĞRU" : "YANLIŞ";
      else if (t === "str" || t === "e") deger = xmlCoz(v ?? "");
      else if (v !== undefined) deger = tarihStil[s] && Number.isFinite(Number(v)) ? excelTarihi(Number(v)) : xmlCoz(v);
      while (satir.length < i) satir.push("");
      satir[i] = deger;
    }
    while (satirlar.length < no) satirlar.push([]);
    satirlar[no] = satir;
  }
  return satirlar;
}

/** CSV: ayraç ilk satırdan (; Türkçe Excel'in varsayılanı, yoksa , ya da sekme); tırnaklı alan, "" kaçışı, satır içi satır sonu */
export function csvOku(metin: string): string[][] {
  const s = metin.replace(/^﻿/, "");
  const ilk = s.split(/\r?\n/, 1)[0] ?? "";
  const say = (c: string) => ilk.split(c).length - 1;
  const ayrac = [";", ",", "\t"].sort((a, b) => say(b) - say(a))[0];
  const satirlar: string[][] = [];
  let satir: string[] = [], alan = "", tirnak = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (tirnak) {
      if (c === '"') { if (s[i + 1] === '"') { alan += '"'; i++; } else tirnak = false; } else alan += c;
    } else if (c === '"' && alan === "") tirnak = true;
    else if (c === ayrac) { satir.push(alan); alan = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      satir.push(alan); satirlar.push(satir); satir = []; alan = "";
      if (satirlar.length > OKU_SINIR.satir) throw new TabloHatasi(`Dosyada en çok ${OKU_SINIR.satir.toLocaleString("tr-TR")} satır okunur.`);
    } else alan += c;
  }
  if (alan !== "" || satir.length) { satir.push(alan); satirlar.push(satir); }
  return satirlar.map((x) => x.slice(0, OKU_SINIR.sutun));
}

/** .xlsx ya da .csv → satırlar (hücreler metin; boş satır boş dizi). Uzantı ya da içerik (ZIP imzası) belirler. */
export async function tabloOku(ad: string, bayt: Uint8Array): Promise<string[][]> {
  if (bayt.length > OKU_SINIR.dosya) throw new TabloHatasi("Dosya çok büyük (en çok 10 MB).");
  const zip = bayt.length >= 4 && bayt[0] === 0x50 && bayt[1] === 0x4b && bayt[2] === 3 && bayt[3] === 4;
  if (zip) return xlsxOku(bayt);
  if (/\.xlsx?$/i.test(ad)) throw new TabloHatasi(/\.xls$/i.test(ad) ? "Eski .xls desteklenmiyor; Excel'de .xlsx olarak kaydedin." : "Dosya .xlsx değil ya da bozuk.");
  /* CSV: UTF-8; geçersizse Türkçe Windows kodlaması (Excel'in "CSV" kaydı) */
  let metin: string;
  try { metin = new TextDecoder("utf-8", { fatal: true }).decode(bayt); } catch { metin = new TextDecoder("windows-1254").decode(bayt); }
  return csvOku(metin);
}
