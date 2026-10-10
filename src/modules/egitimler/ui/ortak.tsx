/* Eğitimler ekranlarının ortak parçaları — istemci dosyası DEĞİL (sunucu sayfaları da kullanır) */
export const tarihYaz = (iso: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join(".") : "—");
/** 479 (reisim 2026-10-10: "eğitimlere tıklayınca alt sekme gibi gözüksün eğitim türleri yana gelmesin"): Eğitimler'in ALT sekmeleri — üst
    sırada yalnız Dökümanlar'ın dört bölümü (Eğitimler seçili), altında kayıtlar ve türler (442 alt sekme deseni, Standartlar'daki Mekanik / Elektrik) */
export const egitimAltSekmeleri = (kayit: number, tur: number) =>
  [[`Eğitim kayıtları (${kayit})`, "/dokumanlar/egitimler"], [`Eğitim türleri (${tur})`, "/dokumanlar/egitimler/turler"]] as const;
