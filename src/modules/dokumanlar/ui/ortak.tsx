/* Dökümanlar ekranlarının ortak parçaları (maket standartlar.html: sekmeler, tarih, boyut) — istemci dosyası DEĞİL (sunucu sayfaları da kullanır) */
export const tarihYaz = (iso: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join(".") : "—");
export const boyutYaz = (bayt: number) => (bayt >= 1 << 20 ? `${(bayt / (1 << 20)).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(bayt / 1024))} KB`);
export const DOKUMAN_SEKMELERI = [["Standartlar", "/dokumanlar"], ["Muayene kriterleri", "/dokumanlar/kriterler"], ["Diğer dökümanlar", "/dokumanlar/diger"], ["Eğitimler", "/dokumanlar/egitimler"]] as const;
