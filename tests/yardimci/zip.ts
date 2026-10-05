/* test yardımcısı: ZIP'i merkez dizinden açar (STORE) — ad → bayt; her girdinin yerel başlığı ve CRC'si (Node'un zlib.crc32'siyle) denetlenir */
import assert from "node:assert/strict";
import { crc32 as zlibCrc } from "node:zlib";

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
