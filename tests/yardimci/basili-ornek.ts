/* Basılı formdan şablon (2026-10-23) testlerinin UYDURMA okuması — yapay zekânın cevabı biçiminde bir vinç formu (gerçek firmanın formu depoya
   girmez). tests/basili-format.test.ts ve olumsuz kanıtı tests/bozan/basili-format.bozan.ts ortak. */
const bos = { alt: false, numarasiz: false, dizilis: 2, alanlar: [], cevaplar: [], gruplar: [], yanYana: false, numara: "grup", degerler: [], sutunlar: [], metin: "" };
const alan = (ad: string, ek: Record<string, unknown> = {}) => ({ ad, tur: "metin", ekipman: "yok", birim: "", secenekler: [], formul: "", tam: false, ...ek });
export const HAM = {
  cevap: "Yan yana iki bilgi tablosu alt alta kuruldu.",
  baslik: "VİNÇ MUAYENE FORMU", formKodu: "FR.099", basTuru: "ad", basSatirlari: [], altYazi: "FR.099 · 01.01.2026 · REV00",
  stil: { zemin: "gri", hiza: "orta", etiket: "kalin" },
  firmaSatirlari: [
    { ad: "Unvan", kaynak: "firma", metin: "", tam: false }, { ad: "Rapor No", kaynak: "rapor_no", metin: "", tam: false },
    { ad: "Adres", kaynak: "adres", metin: "", tam: true }, { ad: "Kontrol Tarihi / Saati", kaynak: "bas", metin: "", tam: false },
    { ad: "SGK Sicil", kaynak: "sgk", metin: "", tam: false }, { ad: "Unvan (iki kez)", kaynak: "firma", metin: "", tam: false },
    { ad: "Firma notu", kaynak: "serbest", metin: "Sabit not", tam: false },
  ],
  ekipmanKodAdi: "Ekipman no / yeri", ekipmanTurAdi: "",
  ekipman: { var: true, ad: "TEKNİK ÖZELLİKLER", dizilis: 3, alanlar: [
    alan("Marka / Yapımcı", { ekipman: "marka", tur: "sayi" }), alan("Seri no", { ekipman: "seri" }), alan("Kapasite", { tur: "sayi", birim: "kg" }),
    alan("Statik test yükü", { tur: "sayi", birim: "kg", formul: "[Kapasite] * 1,25" }), alan("İkinci marka", { ekipman: "marka" }),
    alan("Vinç tipi", { tur: "secim", secenekler: [] }),
  ] },
  bolumler: [
    { ...bos, blok: "bilgi", ad: "Halat bilgileri", numarasiz: true, alanlar: [alan("Halat çapı", { tur: "sayi", birim: "mm" }), alan("Tel kırıklığı", { tur: "sayi", birim: "adet", tam: true })] },
    { ...bos, blok: "liste", ad: "TESPİT VE DEĞERLENDİRMELER (U: Uygun | UD: Uygun Değil | X: Özellik Yok)", cevaplar: ["U", "UD", "X"], yanYana: true, numara: "surekli",
      gruplar: [{ ad: "GENEL KONTROLLER", maddeler: ["Bakım kayıtları", "*Ray bağlantıları"] }, { ad: "YÜK TESTLERİ", maddeler: ["*Dinamik yük deneyi (1,1 x P)"] }] },
    { ...bos, blok: "kusur", ad: "NOTLAR / UYGUNSUZLUKLAR" },
    { ...bos, blok: "bozuk", ad: "Olmayan bölüm türü" },
  ],
  sonuc: { ad: "SONUÇ", numarasiz: false, cumle: "Yukarıda teknik özellikleri belirtilen vincin bir sonraki kontrol tarihine kadar kullanılması", uygunMetin: "UYGUNDUR", uygunDegilMetin: "UYGUN DEĞİLDİR" },
  imza: { ad: "KONTROLÜ YAPAN MÜHENDİS", numarasiz: true, satirlar: [
    { ad: "Ad Soyad", kim: "uzman", bilgi: "ad", metin: "", tam: false }, { ad: "Diploma No", kim: "uzman", bilgi: "diploma", metin: "", tam: false },
    { ad: "Firma onayı", kim: "teknik", bilgi: "imza", metin: "", tam: false }, { ad: "Uymayan", kim: "uzman", bilgi: "zaman", metin: "", tam: false },
    { ad: "Kaşe", kim: "diger", bilgi: "yok", metin: "", tam: true },
  ] },
};

