/* S.A.Y'A EK (522; 2026-10-23 baştan — reisim: "hiç bir kısıtı olmasın"): dosya konuşmada KALIR (Anthropic Dosya API'si — yz_ek; "Sohbeti temizle"
   ile silinir); adet ve boy sınırı yok (büyük dosya tarayıcıdan parça parça gelir — src/app/api/say/ek). Saf, yalnız sunucu: tür İÇERİKTEN
   (uzantıya ve tarayıcının bildirdiğine güvenilmez); fotoğrafın konum bilgisi silinir; Word'ün metni (tablolar "|" ile) çıkarılır; düz metin
   (CSV, TXT … ve tarayıcının Excel'den çevirdiği tablo) olduğu gibi gider. Yapay zekâya dosyanın adı gitmez ("Ek 1"). */
import { jpegTemizle, pngTemizle, turBul } from "../../../server/dosya/tur.ts";
import type { EkTuru } from "../../../server/yz/konusma.ts";
import { wordMetni } from "../../../server/yz/word.ts";

export interface HazirEk { tur: EkTuru; mime: string; bayt: Uint8Array; ad: string; dosyaAdi: string }
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
  if (tur === "pdf") return { tur: "pdf", mime: "application/pdf", bayt: b, ad: gorunen, dosyaAdi: "ek.pdf" };
  if (tur === "jpeg" || tur === "png") {
    try {
      return { tur: "foto", mime: `image/${tur}`, bayt: tur === "jpeg" ? jpegTemizle(b) : pngTemizle(b), ad: gorunen, dosyaAdi: `ek.${tur === "jpeg" ? "jpg" : "png"}` };
    } catch { return { durum: "red", neden: `${gorunen}: fotoğraf bozuk.` }; }
  }
  const word = wordMetni(b, Number.POSITIVE_INFINITY);
  if (word !== null) {
    if (!word.trim()) return { durum: "red", neden: `${gorunen}: belgede metin bulunamadı.` };
    return { tur: "word", mime: "text/plain", bayt: new TextEncoder().encode(word), ad: gorunen, dosyaAdi: "ek.txt" };
  }
  const metin = duzMetin(b);
  if (metin !== null && metin.trim()) return { tur: tablo ? "tablo" : "metin", mime: "text/plain", bayt: b, ad: gorunen, dosyaAdi: "ek.txt" };
  return { durum: "red", neden: EK_TUR_HATASI };
}

const TUR_ADI: Record<EkTuru, string> = { foto: "fotoğraf", pdf: "PDF", word: "Word belgesinin metni", metin: "metin dosyası", tablo: "Excel tablosu (metin)" };
/** konuşmaya giden bloklar: her ek için "Ek n (tür)" + dosyanın kendisi (Dosya API kimliğiyle), sonra kullanıcının yazısı */
export function ekBloklari(ekler: readonly { dosya: string; tur: EkTuru }[], metin: string): Record<string, unknown>[] {
  const l: Record<string, unknown>[] = [];
  ekler.forEach((e, i) => {
    l.push({ type: "text", text: `Ek ${i + 1} (${TUR_ADI[e.tur]}):` });
    l.push(e.tur === "foto" ? { type: "image", source: { type: "file", file_id: e.dosya } }
      : { type: "document", source: { type: "file", file_id: e.dosya }, title: `Ek ${i + 1}` });
  });
  l.push({ type: "text", text: metin });
  return l;
}
