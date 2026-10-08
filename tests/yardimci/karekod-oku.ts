/* karekod okuyucu (407 kilidi ve olumsuz kanıtı): ekranın çizdiği SVG yolunu piksele çevirip jsQR ile okur */
import jsQR from "jsqr";

/** SVG yolunu (satır dikdörtgenleri) piksele çevirip okur: kenar boşluğu 4 modül, modül 4 piksel, koyu = 0, açık = 255 */
export function yolOku(k: { boyut: number; yol: string }): string | null {
  const s = 4, kenar = 4, w = (k.boyut + 2 * kenar) * s;
  const p = new Uint8ClampedArray(w * w * 4).fill(255);
  for (const m of k.yol.matchAll(/M(\d+) (\d+)h(\d+)v1h-(\d+)z/g)) {
    const x0 = Number(m[1]), y0 = Number(m[2]), u = Number(m[3]);
    for (let y = (y0 + kenar) * s; y < (y0 + kenar + 1) * s; y++) {
      for (let x = (x0 + kenar) * s; x < (x0 + kenar + u) * s; x++) { const i = (y * w + x) * 4; p[i] = p[i + 1] = p[i + 2] = 0; }
    }
  }
  return jsQR(p, w, w)?.data ?? null;
}

