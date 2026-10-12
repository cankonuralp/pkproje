/* S.A.Y'A EK (522; pkproje §3.10 m.17, maket say.js ekran 11 — reisim 2026-10-12: "yazma kutusunun yanında ataç → Fotoğraf çek · Galeriden seç ·
   Belge ekle (PDF, Word)"). Saf, yalnız sunucu: tür İÇERİKTEN (uzantıya ve tarayıcının bildirdiği türe güvenilmez), fotoğrafın konum bilgisi silinir,
   Word'ün yalnız metni; adet ve toplam boy sınırlı. Dosya SAKLANMAZ — yalnız o soruda yapay zekâya gider; geçmişte adı, türü ve boyu kalır. */
import { jpegTemizle, pngTemizle, turBul } from "../../../server/dosya/tur.ts";
import type { SohbetEkAdi } from "../../../server/yz/sohbet.ts";
import type { SayEki } from "../../../server/yz/say.ts";
import { wordMetni } from "../../../server/yz/word.ts";
import { EK_EN_COK_ADET, EK_EN_COK_BAYT } from "../ek-sinir.ts";

export interface SayEkDosyasi { ad: SohbetEkAdi; icerik: SayEki }
export const EK_TUR_HATASI = "Yalnız fotoğraf (JPEG, PNG), PDF ya da Word (.docx) eklenir.";
export const EK_BOY_HATASI = "Ekler toplam en çok 4 MB olabilir.";

/** ekranda ve geçmişte görünen ad: denetim karakterleri ve yol ayırıcıları atılır, en çok 120 karakter */
export function ekAdi(ad: string, yedek: string): string {
  return ad.replace(/[\u0000-\u001f\u007f/\\<>:"|?*]/g, "").trim().slice(0, 120) || yedek;
}

/** tek ek: tür içerikten; fotoğraf temizlenir, Word'ün metni çıkarılır */
export function sayEkiOku(b: Uint8Array, ad: string): SayEkDosyasi | { durum: "red"; neden: string } {
  if (!b.length) return { durum: "red", neden: `${ekAdi(ad, "Ek")}: dosya boş.` };
  if (b.length > EK_EN_COK_BAYT) return { durum: "red", neden: EK_BOY_HATASI };
  const tur = turBul(b, ["pdf", "jpeg", "png"]);
  if (tur === "pdf") return { ad: { ad: ekAdi(ad, "belge.pdf"), boyut: b.length, tur: "pdf" }, icerik: { tur: "pdf", bayt: b } };
  if (tur === "jpeg" || tur === "png") {
    try {
      const bayt = tur === "jpeg" ? jpegTemizle(b) : pngTemizle(b);
      return { ad: { ad: ekAdi(ad, "fotograf.jpg"), boyut: bayt.length, tur: "foto" }, icerik: { tur, bayt } };
    } catch { return { durum: "red", neden: `${ekAdi(ad, "Fotoğraf")}: fotoğraf bozuk.` }; }
  }
  const metin = wordMetni(b);
  if (metin === null) return { durum: "red", neden: EK_TUR_HATASI };
  if (!metin.trim()) return { durum: "red", neden: `${ekAdi(ad, "Word belgesi")}: belgede metin bulunamadı.` };
  return { ad: { ad: ekAdi(ad, "belge.docx"), boyut: b.length, tur: "word" }, icerik: { tur: "metin", metin } };
}

/** soru başına ekler: adet ve toplam boy sınırı, her biri okunur; biri bile uymazsa soru gitmez (sessiz atlama yok) */
export function sayEkleriOku(l: readonly { bayt: Uint8Array; ad: string }[]): SayEkDosyasi[] | { durum: "red"; neden: string } {
  if (l.length > EK_EN_COK_ADET) return { durum: "red", neden: `Bir soruya en çok ${EK_EN_COK_ADET} ek konur.` };
  if (l.reduce((t, x) => t + x.bayt.length, 0) > EK_EN_COK_BAYT) return { durum: "red", neden: EK_BOY_HATASI };
  const sonuc: SayEkDosyasi[] = [];
  for (const x of l) {
    const e = sayEkiOku(x.bayt, x.ad);
    if ("durum" in e) return e;
    sonuc.push(e);
  }
  return sonuc;
}
