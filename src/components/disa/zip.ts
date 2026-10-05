/* ZIP YAZICI (tek üretici; maket maket-ortak.js zipYaz'ın karşılığı) — sıkıştırmasız (STORE), adlar UTF-8 (bayrak 0x0800). Saf: tarayıcıda ve
   sunucuda aynı. Excel (.xlsx) ve toplu indirme bunu kullanır. Sınır: 65 535 dosya, 4 GB (ZIP64 yok) — aşan girdi hata verir, bozuk dosya üretilmez. */

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
export function crc32(b: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export type ZipDosyasi = readonly [ad: string, icerik: string | Uint8Array];

/** [[ad, metin ya da bayt]] → ZIP baytları; ad "/" ayraçlı göreli yol olmalı (mutlak yol, "..", ters bölü reddedilir — açan klasör dışına yazmasın) */
export function zipBayt(dosyalar: readonly ZipDosyasi[]): Uint8Array {
  if (dosyalar.length > 0xffff) throw new Error("ZIP: çok fazla dosya");
  const te = new TextEncoder(), parca: Uint8Array[] = [], merkez: Uint8Array[] = [];
  let ofs = 0;
  const adlar = new Set<string>();
  for (const [adMetni, icerik] of dosyalar) {
    if (!adMetni || adMetni.startsWith("/") || adMetni.includes("\\") || adMetni.split("/").some((p) => p === ".." || p === "") || adlar.has(adMetni)) {
      throw new Error(`ZIP: geçersiz dosya adı: ${adMetni}`);
    }
    adlar.add(adMetni);
    const ad = te.encode(adMetni), veri = typeof icerik === "string" ? te.encode(icerik) : icerik, c = crc32(veri);
    if (ofs + 30 + ad.length + veri.length > 0xffffffff) throw new Error("ZIP: 4 GB sınırı");
    const yerel = new DataView(new ArrayBuffer(30));
    yerel.setUint32(0, 0x04034b50, true); yerel.setUint16(4, 20, true); yerel.setUint16(6, 0x0800, true); yerel.setUint16(8, 0, true);
    yerel.setUint16(10, 0, true); yerel.setUint16(12, 0x21, true); yerel.setUint32(14, c, true); yerel.setUint32(18, veri.length, true);
    yerel.setUint32(22, veri.length, true); yerel.setUint16(26, ad.length, true); yerel.setUint16(28, 0, true);
    parca.push(new Uint8Array(yerel.buffer), ad, veri);
    const m = new DataView(new ArrayBuffer(46));
    m.setUint32(0, 0x02014b50, true); m.setUint16(4, 20, true); m.setUint16(6, 20, true); m.setUint16(8, 0x0800, true); m.setUint16(10, 0, true);
    m.setUint16(12, 0, true); m.setUint16(14, 0x21, true); m.setUint32(16, c, true); m.setUint32(20, veri.length, true); m.setUint32(24, veri.length, true);
    m.setUint16(28, ad.length, true); m.setUint32(42, ofs, true);
    merkez.push(new Uint8Array(m.buffer), ad);
    ofs += 30 + ad.length + veri.length;
  }
  const mb = merkez.reduce((n, x) => n + x.length, 0);
  const son = new DataView(new ArrayBuffer(22));
  son.setUint32(0, 0x06054b50, true); son.setUint16(8, dosyalar.length, true); son.setUint16(10, dosyalar.length, true);
  son.setUint32(12, mb, true); son.setUint32(16, ofs, true);
  const hepsi = [...parca, ...merkez, new Uint8Array(son.buffer)];
  const out = new Uint8Array(hepsi.reduce((n, x) => n + x.length, 0));
  let i = 0;
  for (const x of hepsi) { out.set(x, i); i += x.length; }
  return out;
}
