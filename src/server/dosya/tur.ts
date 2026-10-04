/* YÜKLEME DENETİMİ (09-A4) — tür içeriğin ilk baytlarından bulunur, uzantıya ve tarayıcının bildirdiğine güvenilmez.
   İzinli: JPEG, PNG, PDF, .xlsx, .csv (yalnız gereken yerde). SVG ve HTML hiçbir koşulda yüklenmez.
   Fotoğrafın konum ve cihaz bilgisi (EXIF ve metin parçaları) silinir (KVKK); görüntü verisine dokunulmaz. PDF yeniden işlenmez (imzalı PDF bozulur). */

export const TURLER = {
  jpeg: "image/jpeg",
  png: "image/png",
  pdf: "application/pdf",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",
} as const;
export type DosyaTuru = keyof typeof TURLER;

/** tür başına üst sınır (sunucuda da; cihaz fotoğrafı yüklemeden önce küçültür — B1) */
export const SINIR: Record<DosyaTuru, number> = { jpeg: 8 << 20, png: 8 << 20, pdf: 25 << 20, xlsx: 10 << 20, csv: 5 << 20 };

const basliyor = (b: Uint8Array, imza: readonly number[], kayma = 0) => imza.every((x, i) => b[kayma + i] === x);
const metin = (b: Uint8Array, bas: number, son: number) => Buffer.from(b.subarray(bas, son)).toString("latin1");

/** içerikten tür; tanınmazsa null. CSV ancak izin verildiyse ve içerik düz, işaretleme taşımayan UTF-8 metinse. */
export function turBul(b: Uint8Array, izinli: readonly DosyaTuru[]): DosyaTuru | null {
  const bul = (): DosyaTuru | null => {
    if (basliyor(b, [0xff, 0xd8, 0xff])) return "jpeg";
    if (basliyor(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
    if (metin(b, 0, 5) === "%PDF-") return "pdf";
    /* xlsx bir ZIP: ilk girdi "[Content_Types].xml" ya da gövdede "xl/" klasörü olmalı (başka ZIP kabul edilmez) */
    if (basliyor(b, [0x50, 0x4b, 0x03, 0x04])) {
      const govde = metin(b, 0, Math.min(b.length, 1 << 16));
      return govde.includes("[Content_Types].xml") && govde.includes("xl/") ? "xlsx" : null;
    }
    if (izinli.includes("csv")) return csvMi(b) ? "csv" : null;
    return null;
  };
  const t = bul();
  return t && izinli.includes(t) ? t : null;
}

function csvMi(b: Uint8Array): boolean {
  const bas = b.subarray(0, Math.min(b.length, 1 << 16));
  /* Excel'in Türkçe CSV'si çoğu kez Windows-1254: UTF-8 değilse tek baytlık metin olarak denetlenir (denetim karakteri ve işaretleme yine yasak) */
  let yazi: string;
  try { yazi = new TextDecoder("utf-8", { fatal: true }).decode(bas); } catch { yazi = Buffer.from(bas).toString("latin1"); }
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(yazi)) return false;
  /* işaretleme (HTML / SVG / betik) taşıyan "metin" kabul edilmez */
  return !/<\s*(svg|html|script|body|iframe|!doctype|\?xml)/i.test(yazi);
}

/** JPEG: APP1 (EXIF / XMP — konum, cihaz), APP13 (IPTC) ve yorum (COM) parçaları atılır; görüntü baytları aynen kalır. */
export function jpegTemizle(b: Uint8Array): Uint8Array {
  if (!basliyor(b, [0xff, 0xd8])) throw new Error("JPEG değil");
  const parcalar: Uint8Array[] = [b.subarray(0, 2)];
  let i = 2;
  while (i + 4 <= b.length) {
    if (b[i] !== 0xff) throw new Error("Bozuk JPEG");
    const isaret = b[i + 1]!;
    if (isaret === 0xda) { parcalar.push(b.subarray(i)); return birlestir(parcalar); }   // tarama başladı: kalanı görüntü
    if (isaret === 0xd9) { parcalar.push(b.subarray(i, i + 2)); return birlestir(parcalar); }
    const uzunluk = (b[i + 2]! << 8) | b[i + 3]!;
    if (uzunluk < 2 || i + 2 + uzunluk > b.length) throw new Error("Bozuk JPEG");
    const at = isaret === 0xe1 || isaret === 0xed || isaret === 0xfe;
    if (!at) parcalar.push(b.subarray(i, i + 2 + uzunluk));
    i += 2 + uzunluk;
  }
  throw new Error("Bozuk JPEG");
}

/** PNG: eXIf ve metin parçaları (tEXt, zTXt, iTXt) ile zaman (tIME) atılır; parçalar bağımsızdır, CRC'ler aynen kalır. */
export function pngTemizle(b: Uint8Array): Uint8Array {
  const ATILAN = new Set(["eXIf", "tEXt", "zTXt", "iTXt", "tIME"]);
  const parcalar: Uint8Array[] = [b.subarray(0, 8)];
  let i = 8;
  while (i + 12 <= b.length) {
    const uzunluk = ((b[i]! << 24) >>> 0) + (b[i + 1]! << 16) + (b[i + 2]! << 8) + b[i + 3]!;
    const ad = metin(b, i + 4, i + 8);
    const son = i + 12 + uzunluk;
    if (son > b.length) throw new Error("Bozuk PNG");
    if (!ATILAN.has(ad)) parcalar.push(b.subarray(i, son));
    i = son;
    if (ad === "IEND") return birlestir(parcalar);
  }
  throw new Error("Bozuk PNG");
}

function birlestir(p: Uint8Array[]): Uint8Array {
  const sonuc = new Uint8Array(p.reduce((t, x) => t + x.length, 0));
  let k = 0;
  for (const x of p) { sonuc.set(x, k); k += x.length; }
  return sonuc;
}
