/* YÖNETİM KAREKODU (407) — iki adımlı giriş kurulumunda doğrulama uygulamasının (Google Authenticator vb.) okuyacağı karekod. reisim 2026-10-08:
   anahtarı uygulamaya elle yazamadı ("süre geçti" hatası) — karekodla anahtar ve ayarlar (TOTP, 6 hane, 30 sn) uygulamaya eksiksiz geçer.
   Sunucuda üretilir (qrcode paketi, yalnız modül dizisi); ekran bunu SVG yolu olarak çizer (HTML enjekte edilmez). Saf işlev. */
import QRCode from "qrcode";

/** karekodun boyu (modül) ve koyu modüllerin SVG yolu (satır satır art arda koyu modüller tek dikdörtgen: "M x y h<uzunluk>v1h-<uzunluk>z";
    kenar boşluğunu çizen ekler) */
export interface Karekod { boyut: number; yol: string }

export function karekod(metin: string): Karekod {
  const q = QRCode.create(metin, { errorCorrectionLevel: "M" });
  const n = q.modules.size;
  const parca: string[] = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n;) {
      if (!q.modules.get(y, x)) { x++; continue; }
      let u = 1;
      while (x + u < n && q.modules.get(y, x + u)) u++;
      parca.push(`M${x} ${y}h${u}v1h-${u}z`);
      x += u;
    }
  }
  return { boyut: n, yol: parca.join("") };
}
