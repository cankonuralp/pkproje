/* S.A.Y'A YAZILAN KISA KOMUT (542; sunum 541 onaylı — reisim 2026-10-14: "say asistandan gir ve fotoğrafı okuyup ilgili yerlere girişleri yap
   diyeceğim ve yapacak") — kuralla tanınır (yapay zekâ çağrısı yok, ücretsiz): "fotoğrafları oku ve gir", "maddeleri uygun işaretle", "sonucu uygun
   yap" / "sonucu uygun değil yap", "üstüne yaz", "geri al". Soru ya da tanınmayan istek yapay zekâya gider. Saf. */
export type Istek = "oku" | "ustune" | "maddeler" | "sonuc_uygun" | "sonuc_uygun_degil" | "geri";
const kucuk = (s: string) => s.toLocaleLowerCase("tr").replace(/[.!?,;:]+/g, " ").replace(/\s+/g, " ").trim();
/** kişinin yazdığı kısa isteği tanır ("fotoğrafı oku ve gir", "maddeleri uygun işaretle", "sonucu uygun yap", "üstüne yaz", "geri al");
    tanınmayan (ya da soru) null — yapay zekâya gider */
export function istekTani(metin: string): Istek | null {
  const m = kucuk(metin);
  /* soru yapay zekâya gider ("\b" Türkçe harfte çalışmaz — boşlukla) */
  if (!m || m.length > 120 || metin.includes("?") || /(^| )(mi|mı|mu|mü|misin|mısın)( |$)|nasıl|neden|nedir|niye/.test(m)) return null;
  if (/^(geri al|geri alın|geri al lütfen|geri getir)$/.test(m)) return "geri";
  /* "evet": S.A.Y "Değiştireyim mi?" diye sorduysa (ekran bakar — bekleyen yoksa yapay zekâya gider) */
  if (/(üstüne|üzerine) yaz|dolu (alanları|olanları)?.*(değiştir|yaz)|^(evet|evet değiştir|değiştir)$/.test(m)) return "ustune";
  if (/sonuc|sonuç/.test(m)) {
    if (/uygun değil|uygunsuz|olumsuz/.test(m)) return "sonuc_uygun_degil";
    if (/uygun|olumlu/.test(m)) return "sonuc_uygun";
  }
  if (/madde/.test(m) && /uygun/.test(m) && !/değil/.test(m)) return "maddeler";
  if (/(foto|fotoğraf|resim|görsel|etiket|plaka|pano)/.test(m) && /(oku|gir|doldur|yaz|işle|aktar)/.test(m)) return "oku";
  if (/^(oku ve gir|okuyup gir|doldur|oku gir)$/.test(m)) return "oku";
  return null;
}
