/* EXIF ÇEKİM SAATİ (2026-10-31, kalem 2 — S.A.Y malzeme listesi): fotoğrafın konum ve öteki EXIF bilgisi silinmeden ÖNCE yalnız çekim saati okunur
   (DateTimeOriginal, yoksa DateTime). Saf, saldırganın girdisinde sınırlı: her okuma sınır denetimli, bozuk ya da eksik yapı null döner (yükleme durmaz). */

const TARIH = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2})/;

/** JPEG'in çekim saati "YYYY-AA-GG SS:DD" (fotoğrafın kendi saati, dilimsiz) — yoksa null */
export function exifCekimZamani(b: Uint8Array): string | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i + 4 <= b.length && b[i] === 0xff) {
    const isaret = b[i + 1]!;
    if (isaret === 0xda || isaret === 0xd9) return null;
    const uzunluk = (b[i + 2]! << 8) | b[i + 3]!;
    if (uzunluk < 2 || i + 2 + uzunluk > b.length) return null;
    if (isaret === 0xe1 && uzunluk >= 8 && b[i + 4] === 0x45 && b[i + 5] === 0x78 && b[i + 6] === 0x69 && b[i + 7] === 0x66 && b[i + 8] === 0 && b[i + 9] === 0) {
      const z = tiffZamani(b.subarray(i + 10, i + 2 + uzunluk));
      if (z) return z;
    }
    i += 2 + uzunluk;
  }
  return null;
}

function tiffZamani(t: Uint8Array): string | null {
  if (t.length < 8) return null;
  const kucuk = t[0] === 0x49 && t[1] === 0x49, buyuk = t[0] === 0x4d && t[1] === 0x4d;
  if (!kucuk && !buyuk) return null;
  const v = new DataView(t.buffer, t.byteOffset, t.byteLength);
  const u16 = (o: number) => (o + 2 <= t.length ? v.getUint16(o, kucuk) : -1);
  const u32 = (o: number) => (o + 4 <= t.length ? v.getUint32(o, kucuk) : -1);
  if (u16(2) !== 42) return null;
  /* IFD'deki bir etiketin değer konumu ve sayısı */
  const etiket = (ifd: number, ad: number): { tur: number; sayi: number; yer: number } | null => {
    const n = u16(ifd);
    if (n < 0 || n > 512) return null;
    for (let k = 0; k < n; k++) {
      const e = ifd + 2 + k * 12;
      if (e + 12 > t.length) return null;
      if (u16(e) === ad) return { tur: u16(e + 2), sayi: u32(e + 4), yer: e + 8 };
    }
    return null;
  };
  const yazi = (x: { tur: number; sayi: number; yer: number } | null): string | null => {
    if (!x || x.tur !== 2 || x.sayi < 16 || x.sayi > 64) return null;
    const o = u32(x.yer);
    if (o < 0 || o + x.sayi > t.length) return null;
    const m = TARIH.exec(String.fromCharCode(...t.subarray(o, o + x.sayi)));
    if (!m) return null;
    const [, y, a, g, s, d] = m;
    if (+a < 1 || +a > 12 || +g < 1 || +g > 31 || +s > 23 || +d > 59 || +y < 1990) return null;
    return `${y}-${a}-${g} ${s}:${d}`;
  };
  const ifd0 = u32(4);
  if (ifd0 < 8 || ifd0 >= t.length) return null;
  const alt = etiket(ifd0, 0x8769);
  const altYer = alt ? u32(alt.yer) : -1;
  return (altYer >= 8 && altYer < t.length ? yazi(etiket(altYer, 0x9003)) : null) ?? yazi(etiket(ifd0, 0x0132));
}
