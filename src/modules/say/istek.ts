/* S.A.Y'A YAZILAN KISA KOMUT (542; sunum 541 onaylı — reisim 2026-10-14: "say asistandan gir ve fotoğrafı okuyup ilgili yerlere girişleri yap
   diyeceğim ve yapacak") — kuralla tanınır (yapay zekâ çağrısı yok, ücretsiz): "fotoğrafları oku ve gir", "maddeleri uygun işaretle", "sonucu uygun
   yap" / "sonucu uygun değil yap", "üstüne yaz", "geri al". Soru ya da tanınmayan istek yapay zekâya gider. Saf.
   550 (sunum 546 K6 — reisim 2026-10-14: "S.A.Y. de herhangi bir kısıt kural vb olmasını istemiyorum … aynı claude kullanır gibi"): yalnız
   "Fotoğrafları oku ve gir", "geri al" ve bekleyen "Değiştireyim mi?"ye "evet / üstüne yaz" ekranda kalır; "maddeleri uygun işaretle", "sonucu …
   yap" ve her başka istek Haiku'ya gider (rapora_yaz aracıyla cümlenin TAMAMINI yapar — "4.2'yi uygun değil işaretle ve sonucu uygun değil yap"
   eskiden yalnız sonucu yapıyordu). */
export type Istek = "oku" | "ustune" | "geri";
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
  /* yalnız "fotoğrafları oku (ve gir)" gibi kısa istek — başka iş de istenen uzun cümle Haiku'ya gider */
  if (m.split(" ").length <= 6 && /(foto|fotoğraf|resim|görsel|etiket|plaka)/.test(m) && /(oku|gir|doldur|işle|aktar)/.test(m) && !/ ve (?!gir)/.test(m.replace(/oku ve gir|okuyup gir/, ""))) return "oku";
  if (/^(oku ve gir|okuyup gir|oku gir)$/.test(m)) return "oku";
  return null;
}
