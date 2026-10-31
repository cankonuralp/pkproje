/* S.A.Y'A EK (522; 2026-10-23 baştan — reisim: "hiç bir kısıtı olmasın"): dosya konuşmada KALIR (Anthropic Dosya API'si — yz_ek; "Sohbeti temizle"
   ile silinir); adet ve boy sınırı yok (büyük dosya tarayıcıdan parça parça gelir — src/app/api/say/ek). Saf, yalnız sunucu: tür İÇERİKTEN
   (uzantıya ve tarayıcının bildirdiğine güvenilmez); fotoğrafın konum bilgisi silinir; Word'ün metni (tablolar "|" ile) çıkarılır; düz metin
   (CSV, TXT … ve tarayıcının Excel'den çevirdiği tablo) olduğu gibi gider.
   2026-10-31 (kalem 2, karar "dosya adı ve çekim saati gider" — 522'deki "ad gitmez" değişti): ek malzeme numarası, temizlenmiş adı ve fotoğrafın çekim
   saatiyle gider ("M03 · F02 — fotoğraf · komp.jpeg · çekim 27.10.2026 09:56"); sohbet dışa aktarımı tek düzene çevrilir (say/malzeme.ts). */
import { exifCekimZamani } from "../../../server/dosya/exif.ts";
import { jpegTemizle, pngTemizle, turBul } from "../../../server/dosya/tur.ts";
import type { EkTuru } from "../../../server/yz/konusma.ts";
import { wordMetni } from "../../../server/yz/word.ts";
import { cekimAdindan, ekBasligi, malzemeOzeti, malzemeSirasi, sohbetDuzeni, sohbetIletileri, type MalzemeEki } from "../malzeme.ts";

export interface HazirEk { tur: EkTuru; mime: string; bayt: Uint8Array; ad: string; dosyaAdi: string; cekim: string | null }
export const EK_TUR_HATASI = "Bu dosya okunamadı: fotoğraf (JPEG, PNG), PDF, Word (.docx), Excel ya da metin dosyası eklenir.";

/** ekranda ve geçmişte görünen ad: denetim karakterleri ve yol ayırıcıları atılır */
export function ekAdi(ad: string, yedek: string): string {
  return ad.replace(/[\u0000-\u001f\u007f/\\<>:"|?*]/g, "").trim() || yedek;
}

/** bayt dizisi düz metin mi (UTF-8, boş bayt yok) */
function duzMetin(b: Uint8Array): string | null {
  if (b.includes(0)) return null;
  try { return new TextDecoder("utf-8", { fatal: true }).decode(b); } catch { return null; }
}

/** tek ek: tür içerikten; fotoğraf temizlenir, Word'ün metni çıkarılır, düz metin olduğu gibi. tablo: tarayıcı Excel'i metne çevirdi */
export function sayEkiHazirla(b: Uint8Array, ad: string, tablo = false): HazirEk | { durum: "red"; neden: string } {
  const gorunen = ekAdi(ad, "ek");
  if (!b.length) return { durum: "red", neden: `${gorunen}: dosya boş.` };
  const tur = turBul(b, ["pdf", "jpeg", "png"]);
  if (tur === "pdf") return { tur: "pdf", mime: "application/pdf", bayt: b, ad: gorunen, dosyaAdi: "ek.pdf", cekim: null };
  if (tur === "jpeg" || tur === "png") {
    try {
      /* çekim saati konum ve öteki EXIF silinmeden önce okunur */
      const cekim = (tur === "jpeg" ? exifCekimZamani(b) : null) ?? cekimAdindan(gorunen);
      return { tur: "foto", mime: `image/${tur}`, bayt: tur === "jpeg" ? jpegTemizle(b) : pngTemizle(b), ad: gorunen, dosyaAdi: `ek.${tur === "jpeg" ? "jpg" : "png"}`, cekim };
    } catch { return { durum: "red", neden: `${gorunen}: fotoğraf bozuk.` }; }
  }
  const word = wordMetni(b, Number.POSITIVE_INFINITY);
  if (word !== null) {
    if (!word.trim()) return { durum: "red", neden: `${gorunen}: belgede metin bulunamadı.` };
    return { tur: "word", mime: "text/plain", bayt: new TextEncoder().encode(word), ad: gorunen, dosyaAdi: "ek.txt", cekim: null };
  }
  const metin = duzMetin(b);
  if (metin !== null && metin.trim()) {
    /* sohbet dışa aktarımı: tek düzen (zaman, medyanın dosya adı; gönderen adı çıkar) */
    const sohbet = tablo ? null : sohbetIletileri(metin);
    return { tur: tablo ? "tablo" : "metin", mime: "text/plain", bayt: sohbet ? new TextEncoder().encode(sohbetDuzeni(sohbet)) : b, ad: gorunen, dosyaAdi: "ek.txt", cekim: null };
  }
  return { durum: "red", neden: EK_TUR_HATASI };
}

/** konuşmaya giden bloklar: malzeme özeti, her ek için başlığı (numara, ad, çekim saati) + dosyanın kendisi (Dosya API kimliğiyle), sonra yazı */
export function ekBloklari(ekler: readonly MalzemeEki[], metin: string): Record<string, unknown>[] {
  const l: Record<string, unknown>[] = [];
  if (ekler.length) l.push({ type: "text", text: malzemeOzeti(ekler) });
  for (const e of malzemeSirasi(ekler)) {
    const baslik = ekBasligi(e);
    l.push({ type: "text", text: `${baslik}:` });
    l.push(e.tur === "foto" ? { type: "image", source: { type: "file", file_id: e.dosya } }
      : { type: "document", source: { type: "file", file_id: e.dosya }, title: baslik });
  }
  l.push({ type: "text", text: metin });
  return l;
}
