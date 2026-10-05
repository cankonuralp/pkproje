/* test yardımcısı: ZIP'i merkez dizinden açar (STORE) — ad → bayt; her girdinin yerel başlığı ve CRC'si (Node'un zlib.crc32'siyle) denetlenir */
import assert from "node:assert/strict";
import { crc32 as zlibCrc, deflateRawSync } from "node:zlib";

/** ZIP'i merkez dizinden açar (STORE): ad → bayt; her girdinin CRC'si ve yerel başlığı denetlenir */
export function zipAc(z: Uint8Array): Map<string, Uint8Array> {
  const v = new DataView(z.buffer, z.byteOffset, z.byteLength), td = new TextDecoder();
  const son = z.length - 22;
  assert.equal(v.getUint32(son, true), 0x06054b50, "merkez dizin sonu");
  const n = v.getUint16(son + 10, true), mb = v.getUint32(son + 12, true), mofs = v.getUint32(son + 16, true);
  assert.equal(mofs + mb, son, "merkez dizin boyu");
  const out = new Map<string, Uint8Array>();
  let p = mofs;
  for (let i = 0; i < n; i++) {
    assert.equal(v.getUint32(p, true), 0x02014b50);
    const c = v.getUint32(p + 16, true), boy = v.getUint32(p + 20, true), adBoy = v.getUint16(p + 28, true), yerel = v.getUint32(p + 42, true);
    const ad = td.decode(z.subarray(p + 46, p + 46 + adBoy));
    assert.equal(v.getUint32(yerel, true), 0x04034b50, `${ad}: yerel başlık`);
    assert.equal(v.getUint16(yerel + 8, true), 0, "sıkıştırmasız");
    const yerelAd = v.getUint16(yerel + 26, true);
    const veri = z.subarray(yerel + 30 + yerelAd, yerel + 30 + yerelAd + boy);
    assert.equal(c, zlibCrc(veri), `${ad}: CRC`);
    out.set(ad, veri);
    p += 46 + adBoy;
  }
  return out;
}

/** Excel gibi: DEFLATE sıkıştırmalı ZIP (yöntem 8) */
export function deflateZip(dosyalar: [string, string | Uint8Array][]): Uint8Array {
  const te = new TextEncoder(), parca: Buffer[] = [], merkez: Buffer[] = [];
  let ofs = 0;
  for (const [adM, icerik] of dosyalar) {
    const ad = Buffer.from(te.encode(adM)), veri = Buffer.from(typeof icerik === "string" ? te.encode(icerik) : icerik), sik = deflateRawSync(veri), c = zlibCrc(veri);
    const y = Buffer.alloc(30);
    y.writeUInt32LE(0x04034b50, 0); y.writeUInt16LE(20, 4); y.writeUInt16LE(0x0800, 6); y.writeUInt16LE(8, 8);
    y.writeUInt32LE(c, 14); y.writeUInt32LE(sik.length, 18); y.writeUInt32LE(veri.length, 22); y.writeUInt16LE(ad.length, 26);
    parca.push(y, ad, sik);
    const m = Buffer.alloc(46);
    m.writeUInt32LE(0x02014b50, 0); m.writeUInt16LE(20, 4); m.writeUInt16LE(20, 6); m.writeUInt16LE(0x0800, 8); m.writeUInt16LE(8, 10);
    m.writeUInt32LE(c, 16); m.writeUInt32LE(sik.length, 20); m.writeUInt32LE(veri.length, 24); m.writeUInt16LE(ad.length, 28); m.writeUInt32LE(ofs, 42);
    merkez.push(m, ad);
    ofs += 30 + ad.length + sik.length;
  }
  const mb = merkez.reduce((n, x) => n + x.length, 0), son = Buffer.alloc(22);
  son.writeUInt32LE(0x06054b50, 0); son.writeUInt16LE(dosyalar.length, 8); son.writeUInt16LE(dosyalar.length, 10); son.writeUInt32LE(mb, 12); son.writeUInt32LE(ofs, 16);
  return new Uint8Array(Buffer.concat([...parca, ...merkez, son]));
}
