/* S.A.Y HAZIR ÖNERİLERİ — TEK KAYIT (2026-10-31, kalem 8 — E6; sunum "S.A.Y'a tam yetenek", 02-HAZIR-SABLONLAR.md; 2026-10-14'teki "tek hazır tuş" kararı
   2026-10-23'te değişti, bu kayıtla uygulanıyor). Saf; ekran (ui/Oneriler.tsx) ve sunucu (sayfa notuna şablon notu — server/say.ts) aynı kaydı kullanır.
   Sayfada tek öneri → tek tuş; birden çok → ilk öneri + "…" listesi (sıra: sayfanın durumu → kişinin son kullandıkları → kayıt sırası). Girdisi olan öneri
   küçük bir form açar; "Başlat" kullanıcının balonunda okunur komutu gönderir, aynı iletiyle şablon notu (talimat değişmez). İkinci onaylı öneriler yine
   sunucunun onay kapısından geçer (src/server/yz/islem.ts). Kilit tests/say-sablon.test.ts. */

export type GirdiTuru = "tarih" | "saat" | "metin" | "sayi" | "secim" | "onay" | "ek";
export interface SablonGirdisi { ad: string; etiket: string; tur: GirdiTuru; secenekler?: readonly string[]; varsayilan?: string | boolean; zorunlu?: boolean }
export interface Sablon {
  id: string; ad: string; aciklama: string;
  /** rota desenleri (yol, sorgu ve çapa hariç) */
  sayfalar: readonly RegExp[];
  girdiler: readonly SablonGirdisi[];
  beceri: string;
  komut: (g: Readonly<Record<string, string | boolean>>) => string;
  onceSun?: boolean;
  /** imzaya, onaya ya da dışarıya gider (pencerede işaret; onayı yine sunucu ister) */
  ikinciOnay?: boolean;
  /** yalnız bu rollere görünür (kişisel belgeli öneriler) */
  roller?: readonly string[];
}

const U = "[0-9a-f-]{36}";
const R = (s: string) => new RegExp(`^${s}$`);
const PLAN = R(`/planlar/${U}`), RAPOR = R(`/raporlar/${U}`), TUR = R(`/ekipman-turleri/${U}(?:/sablon/${U}/kurucu)?`);
const ek = (etiket: string): SablonGirdisi => ({ ad: "ek", etiket, tur: "ek" });
const onceSun = (v = false): SablonGirdisi => ({ ad: "onceSun", etiket: "Önce bana sun", tur: "onay", varsayilan: v });
const evet = (g: Readonly<Record<string, string | boolean>>, k: string) => g[k] === true;
const deger = (g: Readonly<Record<string, string | boolean>>, k: string) => (typeof g[k] === "string" ? (g[k] as string).trim() : "");
const trTarih = (s: string) => (/^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)}` : s);

export const SABLONLAR: readonly Sablon[] = [
  /* rapor ekranında ilk öneri (maket 1): ekranın kendi okuması */
  { id: "S13", ad: "Fotoğrafları oku ve gir", aciklama: "Eklenen fotoğrafları okuyup boş alanlara yazar", sayfalar: [RAPOR], beceri: "B03", girdiler: [], komut: () => "Fotoğrafları oku ve gir" },
  { id: "S1", ad: "Saha bilgisinden raporları hazırla", aciklama: "Notlar ve fotoğraflardan raporları açar, doldurur, kaydeder", sayfalar: [PLAN], beceri: "B01",
    girdiler: [ek("Saha bilgisi (fotoğraf, not, ZIP, PDF, Excel, ekran görüntüsü, sohbet dökümü) — panele ekleyin"), { ad: "gun", etiket: "Kontrol günü", tur: "tarih" },
      { ad: "saat", etiket: "Başlangıç saati", tur: "saat" }, { ad: "sgk", etiket: "SGK / DETSİS", tur: "metin" }, onceSun(true)],
    komut: (g) => `Bu planın raporlarını eklediğim saha bilgisine göre hazırla.${deger(g, "gun") ? ` Kontrol günü ${trTarih(deger(g, "gun"))}` : ""}${deger(g, "saat") ? `, saatler ${deger(g, "saat")}'ten başlasın` : ""}${deger(g, "sgk") ? `, SGK/DETSİS ${deger(g, "sgk")}` : ""}. Kaydet, gönderme.`, onceSun: true },
  { id: "S2", ad: "Fotoğrafları eşleştir ve ekle", aciklama: "Her rapora ekipmanın kendi fotoğrafından bir tane", sayfalar: [PLAN], beceri: "B02",
    girdiler: [ek("Fotoğraflar — panele ekleyin"), { ad: "degistir", etiket: "Var olan fotoğrafları değiştir", tur: "onay" }, onceSun()],
    komut: (g) => `Eklediğim fotoğrafları plandaki ekipmanlarla eşleştir; her rapora yalnız ekipmanın kendi fotoğrafından bir tane ekle. Etiket fotoğraflarını ekleme.${evet(g, "degistir") ? " Var olan fotoğrafları değiştir." : ""}` },
  { id: "S3", ad: "Etiketlerden ekipman bilgilerini doldur", aciklama: "Marka, model, seri no, imal yılı, kapasite", sayfalar: [PLAN, RAPOR], beceri: "B03",
    girdiler: [ek("Etiket fotoğrafları — panele ekleyin")],
    komut: () => "Etiket fotoğraflarından marka, model, seri no, imal yılı ve kapasiteyi oku, ekipman bilgilerine yaz. Emin olmadığını yazma, listele." },
  { id: "S4", ad: "Tarih ve saatleri düzenle", aciklama: "Gün, başlangıç saati, süre; sonraki kontrol periyottan", sayfalar: [PLAN], beceri: "B06",
    girdiler: [{ ad: "gun", etiket: "Gün", tur: "tarih", zorunlu: true }, { ad: "saat", etiket: "Başlangıç saati", tur: "saat", zorunlu: true },
      { ad: "sure", etiket: "Süre (dakika; boş = türün süresi)", tur: "sayi" }, { ad: "kapsam", etiket: "Kapsam", tur: "secim", secenekler: ["Bütün raporlar", "Türe göre", "Seçili raporlar"], varsayilan: "Bütün raporlar" }],
    komut: (g) => `${deger(g, "kapsam") || "Bütün"} raporların tarihini ${trTarih(deger(g, "gun"))} yap; ${deger(g, "saat")}'ten başlayarak ${deger(g, "sure") ? `${deger(g, "sure")} dakika arayla` : "türün süresiyle"} dağıt; sonraki kontrolü periyoda göre yaz; saatleri bana tablo olarak ver.` },
  { id: "S5", ad: "SGK / firma bilgilerini güncelle", aciklama: "Plan künyesi ve taslak raporlar", sayfalar: [PLAN], beceri: "B06",
    girdiler: [{ ad: "sgk", etiket: "SGK / DETSİS", tur: "metin", zorunlu: true }, { ad: "tesis", etiket: "Tesis kartını da güncelle", tur: "onay" }],
    komut: (g) => `Bu planın SGK/DETSİS numarasını ${deger(g, "sgk")} yap ve taslak raporlara uygula${evet(g, "tesis") ? "; tesis kartını da güncelle" : ""}.` },
  { id: "S6", ad: "Sonuç ve açıklama uygula", aciklama: "Raporlara aynı sonuç ve yorum", sayfalar: [PLAN, RAPOR], beceri: "B05",
    girdiler: [{ ad: "raporlar", etiket: "Raporlar (boş = bu rapor)", tur: "metin" }, { ad: "sonuc", etiket: "Sonuç", tur: "secim", secenekler: ["Uygun", "Şartlı uygun", "Uygun değil"], zorunlu: true },
      { ad: "aciklama", etiket: "Açıklama", tur: "metin" }, { ad: "madde", etiket: "İlgili maddeyi de uygun değil yap", tur: "onay" }],
    komut: (g) => `${deger(g, "raporlar") || "Bu"} raporunun sonucunu ${deger(g, "sonuc")} yap${deger(g, "aciklama") ? `, yoruma '${deger(g, "aciklama")}' yaz` : ""}${evet(g, "madde") ? "; ilgili maddeyi de uygun değil yap" : ""}.` },
  { id: "S7", ad: "Tablolu raporu listeden doldur", aciklama: "Tüp, dolap, raf tablosu listedeki adetle", sayfalar: [RAPOR, PLAN], beceri: "B05",
    girdiler: [ek("Liste (fotoğraf, Excel, PDF ya da yazı) — panele ekleyin"), { ad: "uygun", etiket: "Seçim sütunlarını uygun işaretle", tur: "onay" }, { ad: "notsuz", etiket: "Listedeki notları göz ardı et", tur: "onay" }],
    komut: (g) => `Bu raporun tablosunu eklediğim listeye göre doldur; satır sayısı listedeki adet kadar olsun${evet(g, "uygun") ? "; seçilebilir bütün sütunları uygun işaretle" : ""}${evet(g, "notsuz") ? "; listedeki notları göz ardı et" : ""}.` },
  { id: "S8", ad: "Gönderim öncesi denetle", aciklama: "Rapor rapor sorun listesi", sayfalar: [PLAN, R("/raporlar")], beceri: "B07", girdiler: [],
    komut: () => "Bu planın raporlarını gönderim öncesi denetle; sorunları rapor rapor listele ve düzeltebildiklerini düzelt." },
  { id: "S9", ad: "Hazır raporları onaya gönder", aciklama: "Denetimden geçenler gider", sayfalar: [PLAN, R("/raporlar")], beceri: "B07", ikinciOnay: true,
    girdiler: [{ ad: "kapsam", etiket: "Kapsam", tur: "secim", secenekler: ["Bu konuşmada hazırlananlar", "Plandaki bütün Yeni raporlar", "Seçili raporlar"], varsayilan: "Bu konuşmada hazırlananlar" }],
    komut: (g) => `${deger(g, "kapsam") || "Bu konuşmada hazırlanan"} raporları denetle; sorunsuzları onaya gönder, gönderilemeyenleri nedeniyle listele.` },
  { id: "S10", ad: "Eski rapordan envanter çıkar", aciklama: "Eski sonuçlar alınmaz", sayfalar: [PLAN], beceri: "B09", girdiler: [ek("Eski rapor PDF'leri — panele ekleyin")],
    komut: () => "Eklediğim eski raporlardan ekipman envanterini çıkar, özetle ve plana aktar; eski sonuçları alma." },
  { id: "S11", ad: "Firma formundan format kur", aciklama: "PDF'ten şablon; yalnız eksikleri ekler", sayfalar: [TUR], beceri: "B08",
    girdiler: [ek("Form (PDF) — panele ekleyin"), { ad: "bagla", etiket: "Standart ve cihazları da bağla", tur: "onay" }],
    komut: (g) => `Bu türün formatını eklediğim firma formuna göre kur; yalnız eksikleri ekle${evet(g, "bagla") ? "; standartları ve cihazları bağla" : ""}. Yayınlama.` },
  { id: "S12", ad: "Mükerrerleri temizle", aciklama: "Boş Yeni raporlar silinir", sayfalar: [PLAN], beceri: "B10", ikinciOnay: true,
    girdiler: [{ ad: "bos", etiket: "Boş mükerrer raporları sil", tur: "onay", varsayilan: true }, { ad: "foto", etiket: "Fazla fotoğrafları kaldır", tur: "onay" }],
    komut: (g) => `Bu plandaki mükerrer rapor ve ekipmanları bul; ${evet(g, "bos") ? "boş olan Yeni raporları sil, " : ""}dolu olanları listele${evet(g, "foto") ? "; raporlarda yalnız ekipman fotoğrafı kalsın" : ""}.` },
  { id: "S14", ad: "Belgelerden personel kaydı", aciklama: "Özlük belgelerini okur, kaydı açar ya da günceller", sayfalar: [R("/personel"), R(`/personel/${U}`)], beceri: "B11",
    roller: ["firma_yoneticisi"], girdiler: [ek("Özlük belgeleri — panele ekleyin"), { ad: "ac", etiket: "Kayıt yoksa aç", tur: "onay" }, onceSun(true)],
    komut: (g) => `Eklediğim belgeleri oku; kişinin personel kaydını ${evet(g, "ac") ? "aç ya da güncelle" : "güncelle (kayıt yoksa bana sor)"}, her belgeyi özlük dosyasına türüyle ekle. Okuyamadığını yazma, listele.`, onceSun: true },
  { id: "S15", ad: "Bordroları dağıt", aciklama: "Tek dosyadaki bordroları kişilere ayırır", sayfalar: [R("/personel"), R(`/personel/${U}`)], beceri: "B11", roller: ["firma_yoneticisi"], ikinciOnay: true,
    girdiler: [ek("Bordro PDF'i — panele ekleyin"), { ad: "donem", etiket: "Dönem (YYYY-AA)", tur: "metin", zorunlu: true }, { ad: "imza", etiket: "İmzaya gönder", tur: "onay" }, onceSun(true)],
    komut: (g) => `Eklediğim bordroları kişilere ayır, her birini kişinin kaydına ${deger(g, "donem")} bordrosu olarak ekle${evet(g, "imza") ? "; imzaya gönder" : ""}.`, onceSun: true },
  { id: "S16", ad: "Sertifikadan / katılım listesinden kayıt", aciklama: "Kişi, eğitim türü, tarih, kurum", sayfalar: [R("/dokumanlar/egitimler"), R(`/dokumanlar/egitimler/${U}`)], beceri: "B11",
    girdiler: [ek("Sertifika(lar) ya da imzalı katılım listesi — panele ekleyin"), { ad: "tur", etiket: "Eğitim türü (boş = belgeden)", tur: "metin" }, onceSun(true)],
    komut: (g) => `Eklediğim belgelerden eğitim kayıtlarını aç: kişi, eğitim türü${deger(g, "tur") ? ` (${deger(g, "tur")})` : ""}, tarih, kurum; her kişinin sertifikasını kaydına ekle. Listede adı olup personelde olmayanları söyle.`, onceSun: true },
  { id: "S17", ad: "Katılım formunu imzaya gönder", aciklama: "Katılımcıların imzasına", sayfalar: [R(`/dokumanlar/egitimler/${U}`)], beceri: "B11", ikinciOnay: true, girdiler: [],
    komut: () => "Bu eğitimin katılım formunu katılımcıların imzasına gönder." },
  { id: "S18", ad: "Kalibrasyon sertifikasını işle", aciklama: "Seri no ile cihaz; kalibrasyon kaydı ve sertifika", sayfalar: [R("/olcum-cihazlari"), R(`/olcum-cihazlari/${U}`)], beceri: "B11",
    girdiler: [ek("Sertifika(lar) — panele ekleyin"), { ad: "ac", etiket: "Kayıt yoksa cihaz aç", tur: "onay" }, onceSun()],
    komut: (g) => `Eklediğim kalibrasyon sertifikalarını oku; seri no ile cihazı bul${evet(g, "ac") ? " (yoksa cihazı aç)" : " (yoksa bana sor)"}; kalibrasyon kaydını (tarih, bitiş, laboratuvar, sertifika no, sonuç) ekle, sertifikayı kayda koy. Bitiş yazmıyorsa sor.` },
  { id: "S19", ad: "Döküman / standart yükle", aciklama: "Ad, no, sürüm belgeden", sayfalar: [R("/dokumanlar")], beceri: "B11",
    girdiler: [ek("PDF(ler) — panele ekleyin"), { ad: "tur", etiket: "Tür", tur: "secim", secenekler: ["Belgeden", "Döküman", "Standart"], varsayilan: "Belgeden" }],
    komut: () => "Eklediğim belgeleri kütüphaneye yükle; ad, no / kod, revizyon ya da sürüm, branş belgeden. Aynı numara varsa yeni sürüm olarak ekle." },
  { id: "S20", ad: "Fişten gider kaydı", aciklama: "Tarih, tutar, KDV, açıklama; fiş kayda eklenir", sayfalar: [R("/muhasebe(?:/giderler)?")], beceri: "B11",
    girdiler: [ek("Fiş / fatura fotoğrafları — panele ekleyin"), { ad: "odeme", etiket: "Ödeme", tur: "secim", secenekler: ["Ödendi", "Ödenecek"], varsayilan: "Ödendi" }],
    komut: (g) => `Eklediğim fişlerden gider kaydı aç (${deger(g, "odeme") || "Ödendi"}): tarih, tutar, KDV, açıklama; fişi kayda ekle. Okunmayan tutarı yazma, söyle.` },
  { id: "S21", ad: "Fişten masraf talebi", aciklama: "Hazırlar, sunar; onaylarsanız gönderir", sayfalar: [R("/talepler")], beceri: "B11", ikinciOnay: true, girdiler: [ek("Fiş fotoğrafları — panele ekleyin")],
    komut: () => "Eklediğim fişlerden masraf talebi hazırla, bana sun; onaylarsam gönder." },
  { id: "S22", ad: "Fatura ve dekont işle", aciklama: "Fatura işe, dekont tahsilata", sayfalar: [R(`/muhasebe/is/${U}`), R(`/muhasebe/f/${U}`)], beceri: "B11", girdiler: [ek("Fatura PDF'i ya da dekont — panele ekleyin")],
    komut: () => "Eklediğim faturayı bu işe kaydet (no, tarih, tutar; kalemler raporlarla eşleşsin, farkı söyle) ya da dekonttan tahsilat yaz." },
  { id: "S23", ad: "Araç belgelerinden kayıt", aciklama: "Plaka, tür, marka; muayene / sigorta / kasko bitişleri", sayfalar: [R("/araclar"), R(`/araclar/${U}`)], beceri: "B11",
    girdiler: [ek("Ruhsat, muayene, sigorta, kasko — panele ekleyin"), { ad: "ac", etiket: "Kayıt yoksa aç", tur: "onay" }],
    komut: (g) => `Belgelerden aracın plaka, tür, marka, model, yıl, yakıt ve muayene / sigorta / kasko bitiş tarihlerini yaz${evet(g, "ac") ? " (araç yoksa aç)" : ""}; belgeleri araca ekle.` },
  { id: "S24", ad: "Araç teslim tutanağı", aciklama: "Açı fotoğraflarıyla hazırlar, imzaya gönderir", sayfalar: [R(`/araclar/${U}`)], beceri: "B11", ikinciOnay: true,
    girdiler: [ek("Açı fotoğrafları — panele ekleyin"), { ad: "alan", etiket: "Teslim alan", tur: "metin", zorunlu: true }, { ad: "km", etiket: "Kilometre", tur: "sayi" }],
    komut: (g) => `Aracın teslim tutanağını eklediğim fotoğraflarla hazırla (teslim alan: ${deger(g, "alan")}${deger(g, "km") ? `, kilometre ${deger(g, "km")}` : ""}) ve imzaya gönder.` },
  { id: "S25", ad: "Listeden demirbaş ve zimmet", aciklama: "Kod, ad; kimde yazıyorsa teslim", sayfalar: [R("/zimmetler")], beceri: "B11",
    girdiler: [ek("Liste (fotoğraf, Excel, PDF) — panele ekleyin"), { ad: "imza", etiket: "Zimmet formunu imzaya gönder", tur: "onay" }],
    komut: (g) => `Listedeki demirbaşları ekle (kod, ad); kimde yazıyorsa teslim et${evet(g, "imza") ? "; zimmet formunu imzaya gönder" : ""}. Listede olup sistemde olmayan kişiyi söyle.` },
  { id: "S26", ad: "Sözleşme / İSG-KATİP belgesini işle", aciklama: "Sözleşme ID'leri; imzalı sözleşme", sayfalar: [R("/sozlesmeler"), R(`/sozlesmeler/${U}`)], beceri: "B11", girdiler: [ek("İSG-KATİP çıktısı ya da imzalı sözleşme — panele ekleyin")],
    komut: () => "İSG-KATİP çıktısından sözleşme ID'lerini (tesis × denetçi) yaz, belgeyi ekle; imzalı sözleşmeyi sözleşmeye ekle." },
  { id: "S27", ad: "Belgeden müşteri / tesis kaydı", aciklama: "Ünvan, vergi no, adres, tesisler", sayfalar: [R("/musteriler")], beceri: "B11",
    girdiler: [ek("Vergi levhası, kartvizit, yazışma — panele ekleyin"), { ad: "ac", etiket: "Kayıt yoksa aç", tur: "onay" }],
    komut: (g) => `Belgeden müşterinin ünvanını, vergi no / dairesini, adresini ve tesislerini oku; vergi no ile ara, ${evet(g, "ac") ? "yoksa aç, varsa güncelle" : "varsa güncelle, yoksa bana sor"}.` },
  { id: "S28", ad: "Talep yazısından teklif taslağı", aciklama: "Müşteri, tesis, türler, adetler; fiyatlar listeden", sayfalar: [R("/teklifler")], beceri: "B11", girdiler: [ek("Müşterinin talebi — panele ekleyin")],
    komut: () => "Müşterinin talebinden teklif taslağı hazırla: müşteri, tesis, ekipman türleri ve adetler; fiyatlar fiyat listesinden. Gönderme." },
  { id: "S29", ad: "Firma dosyalarını yükle", aciklama: "Logo, ön bilgilendirme, bordro formatı", sayfalar: [R("/firma-ayarlari")], beceri: "B11", roller: ["firma_yoneticisi"],
    girdiler: [ek("Dosya — panele ekleyin"), { ad: "tur", etiket: "Ne", tur: "secim", secenekler: ["Logo", "Ön bilgilendirme formatı", "Bordro formatı"], zorunlu: true }],
    komut: (g) => `Eklediğim dosyayı firmanın ${(deger(g, "tur") || "logo").toLocaleLowerCase("tr")} olarak yükle.` },
  { id: "S30", ad: "İmzalı belgeleri yükle", aciklama: "İlgili kayıtlara ekler; eşleşmeyeni söyler", sayfalar: [R("/onaylar(?:/[a-z]+)?")], beceri: "B11", girdiler: [ek("İmzalı PDF'ler — panele ekleyin")],
    komut: () => "Eklediğim imzalı belgeleri ilgili kayıtlara ekle; eşleşmeyeni söyle." },
  { id: "S31", ad: "Yaklaşanları özetle", aciklama: "Kalibrasyon, eğitim, araç belgesi, sözleşme", sayfalar: [R("/"), R("/uyarilar")], beceri: "B11", girdiler: [],
    komut: () => "Süresi yaklaşan ve geçen kalibrasyon, eğitim, araç belgesi ve sözleşmeleri listele; hangisi için belge bekliyorsun, söyle." },
];

/** sayfanın önerileri, kişinin rolleriyle; sıra: kayıt sırası, kişinin son kullandıkları öne */
export function sayfaOnerileri(yol: string, roller: readonly string[], sonKullanilan: readonly string[] = []): Sablon[] {
  const p = yol.split(/[?#]/)[0] || "/";
  const l = SABLONLAR.filter((s) => s.sayfalar.some((d) => d.test(p)) && (!s.roller || s.roller.some((r) => roller.includes(r))));
  const sira = (s: Sablon) => { const i = sonKullanilan.indexOf(s.id); return i < 0 ? Number.MAX_SAFE_INTEGER : i; };
  return [...l].sort((a, b) => sira(a) - sira(b) || l.indexOf(a) - l.indexOf(b));
}
/** zorunlu girdiler dolu mu (ek girdisi panelden — burada sayılmaz) */
export function eksikGirdiler(s: Sablon, g: Readonly<Record<string, string | boolean>>): string[] {
  return s.girdiler.filter((x) => x.zorunlu && x.tur !== "ek" && !(typeof g[x.ad] === "string" ? (g[x.ad] as string).trim() : g[x.ad])).map((x) => x.etiket);
}
/** sayfa notuna giden şablon notu (talimat değişmez; kullanıcının verdiği değerler aynen) */
export function sablonNotu(s: Sablon, g: Readonly<Record<string, string | boolean>>): string {
  const girdi = Object.fromEntries(s.girdiler.filter((x) => x.tur !== "ek" && x.ad !== "onceSun").map((x) => [x.ad, g[x.ad] ?? ""]));
  const once = g.onceSun === true || (g.onceSun === undefined && !!s.onceSun);
  return `Şablon: ${s.id} ${s.ad}; beceri: ${s.beceri}; girdiler: ${JSON.stringify(girdi)}; önce sun: ${once ? "evet — işe başlamadan envanteri ve planı tablo olarak göster, kullanıcının \"Uygula\"sını bekle" : "hayır"}.`;
}
