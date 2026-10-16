/* FORMAT TANIMI — firmanın tür başına kurduğu rapor formatının ŞEMASI (RAPOR-FORMAT.md §1–3, §7; §8.3 onaylı 2026-10-02). Saha ekranı ve PDF bu
   tanımdan çizilir; çizen ve değerlendiren motor kodda tektir (motor.ts). Tanım veritabanında JSON olarak saklanır (rapor_format.tanim), her okuma
   ve yazmada bu şemadan geçer — istemciden ya da yapay zekâ taslağından gelen tanım şemaya uymazsa yazılmaz.
   Kimlikler (bölüm, alan, madde, sütun, değer) BÜTÜN tanımda tekildir: cevaplar kimlikle saklanır, sıra değişse de bozulmaz. Şema sürümü 1. */
import { z } from "zod";

export const SEMA_SURUMU = 1;
/** Format kurucusunda eklenen öğe mi (kimliği "k_" ile başlar; hazır şablonların kimliklerinde bu önek yok — 343, 340–345 incelemesi) */
export const kurucudan = (id: string) => id.startsWith("k_");
const kimlik = z.string().regex(/^[a-z][a-z0-9_]{0,23}$/, "Kimlik küçük harf, rakam, alt çizgi (en çok 24).");
const ad = z.string().trim().min(1, "Ad yazılmalı.").max(200, "En çok 200 karakter.");
const kisa = z.string().max(40);
const metin = z.string().max(2000);

export const ALAN_TURLERI = ["metin", "sayi", "tarih", "secim", "coklu", "evet"] as const;
/** kayıttan gelen alanlar (raporda salt okunur): plan, tesis, müşteri, sözleşme ve ekipmandan */
export const KAYNAKLAR = ["firma_adi", "tesis_adresi", "sgk", "isg_id", "kontrol_tarihi", "rapor_no", "ekipman_kodu", "ekipman_adi", "seri_no", "kullanim_yeri"] as const;
/** 492 (reisim 2026-10-11, hata listesi 9: "kayıttan geliyor diye değiştirilemez olmasın kayıttan gelenlerde değiştirilebilir olsun sadece sgk no ve
    isg katip no değiştirilemez olsun ve format yapıcıda bu belirlenebilir olsun"): raporun KÜNYESİ — plandan / kayıttan gelir, denetçi raporun
    KENDİ kopyasında değiştirir (kayıt değişmez; cevaplar.kunye). Formatın gorunum.kilitli listesindekiler sahada değişmez; verilmemişse SGK ve
    İSG-KATİP. Rapor no, ekipman kodu ve türü raporun kimliği — künye değil, değişmez. */
export const KUNYE_ALANLARI = ["firma", "adres", "sgk", "isg", "eposta", "tel", "metot"] as const;
export type KunyeAlani = (typeof KUNYE_ALANLARI)[number];
export const KUNYE_ALAN_ADI: Record<KunyeAlani, string> = {
  firma: "Firma adı", adres: "Periyodik kontrol adresi", sgk: "SGK DETSİS NO", isg: "İSG-KATİP SÖZLEŞME ID", eposta: "E-posta", tel: "Telefon",
  metot: "Periyodik kontrol metodu ve kapsamı",
};
export const KUNYE_EN_COK: Record<KunyeAlani, number> = { firma: 200, adres: 400, sgk: 40, isg: 60, eposta: 200, tel: 40, metot: 1000 };
export const VARSAYILAN_KILITLI: readonly KunyeAlani[] = ["sgk", "isg"];
/** 460: ekipman kaydına BAĞLI alanlar — değeri raporun ekipman bilgisinde durur (raporlar/sema.ts EkipmanBilgisi: etiketten okunur, kopyada
    gelir, seri no / kullanım yeri kayıttan alanlara yansır), formattaki adı ve yeri serbest. Yalnız "tam" ekipman bölümünde olur. */
export const EKIPMAN_ALANLARI = ["marka", "model", "seri", "imal", "konum", "amac", "bolum"] as const;
export type EkipmanAlani = (typeof EKIPMAN_ALANLARI)[number];
export const EKIPMAN_ALAN_ADI: Record<EkipmanAlani, string> = {
  marka: "Marka", model: "Model", seri: "Seri no", imal: "İmal yılı", konum: "Kullanım yeri", amac: "Kullanım amacı", bolum: "Ekipman bölümü",
};
/** 2026-10-16 (sunum 595 madde 1 — reisim: "format yapıcıda bu ve benzeri kısımlarda değişiklik yapamıyorum, tıklayıp değiştiremiyorum, satır
    sütun ekleyemiyorum" · "mesela teknik yönetici için unvan diploma no gibi satırlar eklemek istedim ekleyemedim"): imza bölümünün SATIRLARI —
    adı, sırası, varlığı formatın; değeri kişinin kaydından (imza anında kopyalanır). kim: uzman (raporu yazan muayene uzmanı) · teknik (onaylayan
    teknik yönetici) · diger (serbest satır: tesis yetkilisi, kaşe …; değeri formatın sabit yazısı, boşsa boş hücre). alan: kişinin hangi bilgisi
    (imza: uzmanda elektronik imza hücresi, teknikte onay; zaman: teknikte onay zamanı). */
export const IMZA_KISILERI = ["uzman", "teknik", "diger"] as const;
export type ImzaKisisi = (typeof IMZA_KISILERI)[number];
export const IMZA_ALANLARI = ["ad", "meslek", "ekipnet", "diploma", "oda", "eposta", "tel", "imza", "zaman"] as const;
export type ImzaAlani = (typeof IMZA_ALANLARI)[number];
export const IMZA_ALAN_ADI: Record<ImzaAlani, string> = {
  ad: "Adı soyadı", meslek: "Mesleği / unvanı", ekipnet: "Yetkili kişi kayıt no (EKİPNET)", diploma: "Diploma no", oda: "Oda sicil no", eposta: "E-posta",
  tel: "Telefon", imza: "İmzası", zaman: "Onay zamanı",
};
export const IMZA_KISI_ADI: Record<ImzaKisisi, string> = { uzman: "Muayene uzmanı", teknik: "Teknik yönetici", diger: "Serbest satır" };
/** kişinin seçilebilen bilgileri (zaman yalnız teknik yöneticide — onay anı) */
export const imzaAlanlari = (kim: ImzaKisisi): readonly ImzaAlani[] => (kim === "uzman" ? IMZA_ALANLARI.filter((x) => x !== "zaman") : kim === "teknik" ? IMZA_ALANLARI : []);
/** 2026-10-16 (sunum 595 madde 3, K2 "serbest; SGK ve İSG-KATİP kilitli kalsın" — reisim: "firma bilgileri kısmında da [satır eklemek istedim
    ekleyemedim]"): 1. bölümün (Firma bilgileri) SATIRLARI — adı, sırası, varlığı formatın; değeri plandan / kayıttan / sahadan. kaynak: hangi bilgi
    (serbest: formatın sabit yazısı). Zorunlu satırlar (SGK, İSG-KATİP, başlangıç) çıkarılmaz. Verilmemişse bugünkü satırlar (format/duzen.ts
    firmaSatirlari) — eski formatlar aynı çizilir. */
export const FIRMA_KAYNAKLARI = ["firma", "adres", "rapor_no", "rapor_tarihi", "isg", "sgk", "bas", "bit", "sonraki", "takip", "metot", "eposta", "tel",
  "plan_no", "serbest"] as const;
export type FirmaKaynagi = (typeof FIRMA_KAYNAKLARI)[number];
export const FIRMA_KAYNAK_ADI: Record<FirmaKaynagi, string> = {
  firma: "Firma adı", adres: "Periyodik kontrol adresi", rapor_no: "Rapor numarası", rapor_tarihi: "Rapor tarihi", isg: "İSG-KATİP sözleşme ID",
  sgk: "SGK sicil numarası", bas: "Başlangıç tarihi ve saati", bit: "Bitiş tarihi ve saati", sonraki: "Bir sonraki periyodik kontrol tarihi",
  takip: "Takip kontrol tarihi", metot: "Periyodik kontrol metodu ve kapsamı", eposta: "E-posta", tel: "Telefon", plan_no: "Proje no", serbest: "Yeni satır",
};
/** çıkarılamayan satırlar (Bakanlık: SGK ve İSG-KATİP kayıttan, kilitli; başlangıç rapor açılınca yazılır, zorunlu) */
export const FIRMA_ZORUNLU: readonly FirmaKaynagi[] = ["isg", "sgk", "bas"];
/** 595 (madde 5): ölçüm tablosu satırında hazır satırın adı (sıra sütununda yazar; sütun kimliği olamaz — "_" ile başlar, ELLE_SONUC gibi) */
export const HAZIR_AD = "_ad";
/** 2026-10-16 (sunum 595 madde 2, K3 "evet"): ölçüm cihazları tablosunun sütunları cihaz kaydından seçilir (satırlar türün cihazlarından); cihaz =
    türü + marka / model (bugünkü ilk sütun), kod_seri = kod / seri no (bugünkü ikinci sütun) */
export const CIHAZ_ALANLARI = ["cihaz", "tur", "kod_seri", "kod", "seri", "marka", "model", "kal_tarih", "kal_bitis", "sertifika"] as const;
export type CihazAlani = (typeof CIHAZ_ALANLARI)[number];
export const CIHAZ_ALAN_ADI: Record<CihazAlani, string> = {
  cihaz: "Cihaz", tur: "Cihaz türü", kod_seri: "Kod / seri no", kod: "Kod", seri: "Seri no", marka: "Marka", model: "Model",
  kal_tarih: "Kalibrasyon tarihi", kal_bitis: "Geçerlilik", sertifika: "Sertifika no",
};
/** 595 (madde 10): uygunsuzluklar tablosunun sütunları (verilmemişse bugünkü madde listesi) */
export const KUSUR_ALANLARI = ["sira", "bolum", "metin", "agir", "foto"] as const;
export type KusurAlani = (typeof KUSUR_ALANLARI)[number];
export const KUSUR_ALAN_ADI: Record<KusurAlani, string> = { sira: "No", bolum: "Bölüm", metin: "Uygunsuzluk", agir: "Ağırlık", foto: "Fotoğraf" };
/** ölçüm tablosunun adıyla seçilen hesabı (hesap.ts) */
export const HESAPLAR = ["nokta", "selektivite", "linye", "pd", "zi"] as const;
/** 495: "metin" — serbest metin (belgeye basılan sabit yazı; sahada okunur, doldurulmaz) */
export const BLOKLAR = ["bilgi", "liste", "olcum", "test", "cihaz", "foto", "kusur", "sonuc", "not", "imza", "metin"] as const;
/** sınır kuralı (426: kesin küçük / büyük eklendi — ZPKR05 "RB < 2 Ω"): en çok · en az · küçük · büyük */
export const SINIRLAR = ["<=", ">=", "<", ">"] as const;
export type Sinir = (typeof SINIRLAR)[number];
/** talimat (430): maddenin / grubun / genel muayenenin NASIL yapılacağı — saha ekranında ünlemle açılır, PDF'e basılmaz */
const talimat = z.string().max(4000);
export type Blok = (typeof BLOKLAR)[number];
/** 495 (hata listesi 29 + 46 maketi): firmanın KENDİ hesabı (src/format/formul.ts). 556 (sunum 556 · 2. tur — reisim: "hesaplama tuşu her kutucukta
    olmalı … kısıtlama olmamalı"): HER KUTUDA — bilgi alanı (her tür), sütun, test değeri, kontrol maddesinin cevabı; Excel işlevleri; sahada elle
    yazılan kalır, boşsa formül. */
const formul = z.string().trim().max(2000).optional();

const Alan = z.object({
  id: kimlik, ad, tur: z.enum(ALAN_TURLERI), zorunlu: z.boolean().default(false), kilit: z.boolean().default(false),
  secenekler: z.array(z.string().trim().min(1).max(200)).max(40).optional(), birim: kisa.optional(), kaynak: z.enum(KAYNAKLAR).optional(),
  ekipman: z.enum(EKIPMAN_ALANLARI).optional(), formul,
  /** 595 (madde 9): belgede tam satır (verilmemişse çoklu seçim / uzun seçenek listesi kendiliğinden tam) */
  tam: z.boolean().optional(),
});
const Madde = z.object({ id: kimlik, metin: ad, aciklama: metin.optional(), std: z.string().max(200).optional(), talimat: talimat.optional(), kilit: z.boolean().default(false), formul });
const Grup = z.object({ id: kimlik, ad: z.string().max(200), talimat: talimat.optional(), maddeler: z.array(Madde).max(200) });
/** seçmeli hücre / değerde "uygun değil" sayılan seçenekler (426; ör. ZPKR04 "UD", ZPKR05 "Not 2: Yetersiz") ve kusurun ağırlığı */
const secenekListesi = z.array(z.string().trim().min(1).max(60)).max(20);
const Sutun = z.object({
  id: kimlik, ad, birim: kisa.optional(), giris: z.enum(["sayi", "metin", "secim", "evet"]).default("sayi"),
  secenekler: secenekListesi.optional(), olumsuz: secenekListesi.optional(), agir: z.boolean().default(false), zorunlu: z.boolean().default(false),
  op: z.enum(SINIRLAR).optional(), sinir: z.number().finite().optional(), formul,
});
const Deger = z.object({
  id: kimlik, ad, birim: kisa.optional(), metin: z.boolean().default(false), zorunlu: z.boolean().default(true), kilit: z.boolean().default(false),
  /** seçmeli değer (426): değer bu seçeneklerden biri; olumsuz olanı kusur */
  secenekler: secenekListesi.optional(), olumsuz: secenekListesi.optional(), agir: z.boolean().default(false),
  op: z.enum(SINIRLAR).optional(), sinir: z.number().finite().optional(), not: z.string().max(120).optional(), formul,
});
/** tablo sütunu: adı formatın, değeri kayıttan (cihaz / uygunsuzluk) */
const CihazSutunu = z.object({ id: kimlik, ad, alan: z.enum(CIHAZ_ALANLARI) });
const KusurSutunu = z.object({ id: kimlik, ad, alan: z.enum(KUSUR_ALANLARI) });
export type CihazSutunu = z.output<typeof CihazSutunu>;
export type KusurSutunu = z.output<typeof KusurSutunu>;
const FirmaSatiri = z.object({
  id: kimlik, ad, kaynak: z.enum(FIRMA_KAYNAKLARI), metin: z.string().max(400).optional(), tam: z.boolean().optional(),
});
export type FirmaSatiri = z.output<typeof FirmaSatiri>;
const ImzaSatiri = z.object({
  id: kimlik, ad, kim: z.enum(IMZA_KISILERI), alan: z.enum(IMZA_ALANLARI).optional(), metin: z.string().max(400).optional(), tam: z.boolean().optional(),
});
export type ImzaSatiri = z.output<typeof ImzaSatiri>;
/** seçmeli uygunluk notu (ZPKR01 Not-1 … Not-11): kusur mu, ağır mı */
const Not = z.object({ metin: z.string().trim().min(1).max(400), kusur: z.boolean(), agir: z.boolean().default(false) });
/** 2026-10-16 (pkproje §9 "SONUÇ KURALI FORMAT YAPICIDA" — reisim: "kurala göre otomatik uygun uygun değil diyor, ama ilgili ayar buradan
    yapılamıyor … koda gömülmüş gibi … format yapıcıya koyalım"): ölçüm tablosunun SONUÇ KURALI — satırın kendiliğinden Uygun / Uygun değil
    sonucu (src/format/sonuc.ts). kosul: formül (DOĞRU → sağlandı, YANLIŞ → Uygun değil; "Uygun" / "Uygun değil: neden" yazısı da olur; boş /
    hesaplanamaz → değerlendirilmez); neden: satırda ve kusurlarda yazan neden (yazı ya da "=" ile başlayan formül); aciklama: sahada "Sonuç neye göre
    çıkar?"da; agir: sağlanmazsa ağır kusur. Kurucuda yeni eklenen kural boş olabilir (değerlendirilmez, yayında uyarı). */
export const SonucKurali = z.object({
  kosul: z.string().trim().max(2000), neden: z.string().trim().max(2000).optional(), aciklama: z.string().trim().max(400).optional(),
  agir: z.boolean().optional(),
});
export type SonucKurali = z.output<typeof SonucKurali>;
/** bir tabloda en çok sonuç kuralı */
export const KURAL_EN_COK = 20;

/* ust (427): ardışık bölümlerin ortak üst başlığı — belgede ve ekranda N.1, N.2 numarasıyla tek başlık altında (ZPKR04 "5. Tespit ve
   değerlendirmeler" › 5.1 / 5.2); numarasiz: bölüm numara almaz (ZPKR04 "Fotoğraflar"); alt (461; reisim 2026-10-09: "alt başlık ekleme olsun"):
   bölüm üstündeki ana bölümün ALT BAŞLIĞIDIR — ana bölüm 5 ise 5.1, 5.2 … (ana bölümün kendi içeriği kalır) — src/format/duzen.ts */
/* doldur (484; reisim 2026-10-10: "test tablosu olarak kullanılan yerlere excelden yükle ve fotoğraf ekleme özelliği olsun fotoğraf eklenince
   belgede gözükmeyecek yapay zeka buradan okuma yapıp tabloyu dolduracak, aynı şekilde ekipman bilgilerinde de olsun bunu istediğim başlığa da
   ekleyebiliyim rapor tasarımcısında da olsun"): bölümün sahada fotoğraftan (yapay zekâ okur, öneri) ve Excel'den doldurulması — kâğıtta bölüm
   ayarı; yalnız bilgi / ölçüm tablosu / test bölümünde anlamlı. Verilmemişse doldurma() varsayılanı. */
/* 2026-10-16 (sunum 595 madde 4, 6, 7, 11–15 — reisim: "format yapıcıda bu ve benzeri kısımlarda değişiklik yapamıyorum, tıklayıp değiştiremiyorum"):
   kâğıtta görünen sabit başlıklar ve sözcükler de formatın — boş / verilmemiş = bugünkü yazı (format/duzen.ts …Basliklari) */
const baslik = z.string().trim().max(60).optional();
const ortak = {
  id: kimlik, ad, kilit: z.boolean().default(false), ust: z.string().max(200).optional(), numarasiz: z.boolean().optional(), alt: z.boolean().optional(),
  doldur: z.object({ foto: z.boolean(), excel: z.boolean() }).optional(),
};
export const Bolum = z.discriminatedUnion("blok", [
  /* tam (460; reisim 2026-10-09: "ekipman bilgileri kısmıda değiştirilebilir olsun zira yangın dolabı gibi ekipmanlarda farklı girdiler
     olabiliyor"): raporun 2. bölümü YALNIZ bu bölümün alanlarıdır — ekipman kodu ve türü dışında sabit satır yok; marka, model … ekipman
     kaydına bağlı alan olarak eklenir, çıkarılır, adı değişir. Tam bölümsüz (eski) formatlar eskisi gibi çizilir (format/duzen.ts). */
  /* 595 (madde 9): dizilis — belgede bir satırda kaç bilgi (1 · 2 · 3; verilmemişse 2) */
  z.object({ ...ortak, blok: z.literal("bilgi"), alanlar: z.array(Alan).max(60), tam: z.boolean().optional(), dizilis: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional() }),
  z.object({ ...ortak, blok: z.literal("liste"), cevaplar: z.array(z.string().trim().min(1).max(40)).min(2).max(6), gruplar: z.array(Grup).max(40),
    basliklar: z.object({ no: baslik, madde: baslik, sonuc: baslik }).optional() }),
  z.object({
    ...ortak, blok: z.literal("olcum"), satir: z.enum(["sabit", "ekle"]).default("ekle"), sutunlar: z.array(Sutun).max(20),
    hesap: z.enum(HESAPLAR).optional(), notlar: z.array(Not).max(20).optional(), enAz: z.number().int().min(0).max(200).default(0),
    /* 2026-10-16: sonuç kuralı — verilmemişse hesabın Bakanlık kuralı (sonuc.ts varsayilanKurallar: eski sürümler ve hazır şablonlar aynı sonucu
       verir); boş liste: kendiliğinden sonuç yok (denetçi seçer; sütun sınırları ve olumsuz seçenekler yine geçerli) */
    sonucKurali: z.array(SonucKurali).max(KURAL_EN_COK).optional(),
    /* 595 (madde 4): sabit sütunların başlıkları; sonucYeri belgede Sonuç sütununun yeri (son · baş · gizli — sonuç kuralı yine çalışır; saha
       ekranında Sonuç sütunu hep sonda, elle sonuç orada) */
    basliklar: z.object({ sira: baslik, not: baslik, sonuc: baslik }).optional(), sonucYeri: z.enum(["son", "bas", "gizli"]).optional(),
    /* 595 (madde 5): hazır satırlar — adları (ör. L1-N, 1. kat) yeni raporda satır olarak gelir, sıra sütununda yazar (satırın HAZIR_AD değeri);
       "sabit" satırda denetçi satır eklemez / çıkarmaz */
    hazir: z.array(z.string().trim().min(1).max(120)).max(100).optional(),
  }),
  z.object({ ...ortak, blok: z.literal("test"), degerler: z.array(Deger).max(40),
    basliklar: z.object({ olcum: baslik, deger: baslik, sinir: baslik, sonuc: baslik }).optional() }),
  /* 595 (madde 2): sutunlar — verilmemişse bugünkü 5 sütun (format/duzen.ts cihazSutunlari) */
  z.object({ ...ortak, blok: z.literal("cihaz"), sutunlar: z.array(CihazSutunu).max(10).optional() }),
  z.object({ ...ortak, blok: z.literal("foto"), enAz: z.number().int().min(0).max(50).default(0), enCok: z.number().int().min(1).max(50).default(20) }),
  /* 595 (madde 10): sutunlar — verilirse uygunsuzluklar tablo olarak (yoksa bugünkü madde listesi) */
  z.object({ ...ortak, blok: z.literal("kusur"), sutunlar: z.array(KusurSutunu).max(6).optional() }),
  /* aciklama (426): sonuç bölümünün sabit metni — Bakanlık formatlarındaki "Ağır kusurlar tanımı", "Açıklamalar" (PDF'e basılır) */
  /* 595 (madde 12): sonuç cümlesinin bitişi — "uygundur" / "uygun değildir" yerine (ör. "KULLANIMA UYGUNDUR") */
  z.object({ ...ortak, blok: z.literal("sonuc"), cumle: z.string().max(400).default(""), aciklama: z.string().max(4000).default(""),
    uygunMetin: z.string().trim().max(120).optional(), uygunDegilMetin: z.string().trim().max(120).optional() }),
  /* 595 (madde 11): yönlendirme — sahada yorum kutusunun üstünde, belgede yorum boşsa; satir: belgede yorumun en az satırı (boşluk) */
  z.object({ ...ortak, blok: z.literal("not"), zorunlu: z.boolean().default(false), yonlendirme: z.string().trim().max(400).optional(),
    satir: z.number().int().min(1).max(30).optional() }),
  /* satirlar (595): verilmemişse imzalar'dan bugünkü satırlar (format/duzen.ts imzaSatirlari) — eski formatlar aynı çizilir; verilmişse imzalar
     satırlardaki kişilerin özetidir (kurucu.ts yazar) */
  z.object({ ...ortak, blok: z.literal("imza"), imzalar: z.array(z.enum(["uzman", "teknik"])).min(1).max(2).default(["uzman"]), satirlar: z.array(ImzaSatiri).max(40).optional() }),
  /* 495 (hata listesi 29 + 46 maketi): serbest metin — belgeye basılan sabit yazı (açıklama, yöntem notu …); sahada okunur */
  z.object({ ...ortak, blok: z.literal("metin"), metin: z.string().max(4000).default("") }),
]);
export type Bolum = z.output<typeof Bolum>;
export type BolumOf<B extends Blok> = Extract<Bolum, { blok: B }>;

/** 484: fotoğraftan / Excel'den doldurulabilen bölümler */
export const DOLDURULUR: readonly Blok[] = ["bilgi", "olcum", "test"];
/** 484: bölümün doldurma ayarı — kâğıtta seçilmemişse ölçüm tablosunda ve ekipman bölümünde açık (351 / 385'te hep açıktı), ötekilerde kapalı */
export function doldurma(b: Bolum): { foto: boolean; excel: boolean } {
  if (!DOLDURULUR.includes(b.blok)) return { foto: false, excel: false };
  if (b.doldur) return b.doldur;
  const acik = b.blok === "olcum" || (b.blok === "bilgi" && !!b.tam);
  return { foto: acik, excel: acik };
}

export const Kurallar = z.object({
  /** "Uygun değil" maddede fotoğraf zorunlu (AA9: başlangıçta kapalı) */
  foto: z.boolean().default(false),
  /** kusur derecesi (hafif / ağır) sorulur (AA9: başlangıçta kapalı) */
  derece: z.boolean().default(false),
  /** herhangi Uygun değil / sınır dışı → sonuç önerisi "Uygun değil" */
  oneri: z.boolean().default(true),
});

export const Gorunum = z.object({
  formKodu: z.string().max(20).default(""), baslik: z.string().max(200).default(""), dayanak: z.array(z.string().max(300)).max(20).default([]),
  /** genel muayene talimatı (431): rapor ekranının sağ üstündeki ünlemden açılır; PDF'e basılmaz */
  talimat: z.string().max(8000).default(""),
  /** 472 (reisim 2026-10-10, maket kararı k2: "format başına"): saha ekranında madde cevabının biçimi — açılır liste ya da yan yana tuşlar
      (tuşta bir dokunuş). Belgeye (PDF) etkisi yok. */
  cevap: z.enum(["acilir", "tus"]).default("acilir"),
  /** 486 (reisim 2026-10-10, hata listesi 38: "silinemiyor hala ekipman bilgileri tablosu"): 2. bölüm (ekipman bilgileri) var mı — false: bölüm
      belgede ve saha ekranında yok, ekipman kodu ve türü 1. bölümde (Firma bilgileri) yazar, sonraki numaralar bir kayar. Verilmemişse var. */
  ekipman: z.boolean().optional(),
  /** 492: sahada denetçinin DEĞİŞTİREMEDİĞİ künye bilgileri (öteki künye bilgisi raporun kendi kopyasında değişir). Verilmemişse SGK ve İSG-KATİP
      (VARSAYILAN_KILITLI); boş liste: hepsi değişir. */
  kilitli: z.array(z.enum(KUNYE_ALANLARI)).max(KUNYE_ALANLARI.length).optional(),
  /** 2026-10-16 (sunum 595 madde 25 — reisim: "format yapıcıda e imza yeri de seçilebilsin e imza seçilen yere işlesin"; K7 "ikisi"): imzaya
      hazırlanan PDF'teki boş imza alanının yeri — hucre: imza bölümünün İmza hücresi (verilmemişse bu) · kutu: son sayfada (mm, sayfanın sol
      üstünden; A4 210 × 297) · gorunmez: alan yok (araç görünmez imza atar). src/belge/eimza.ts */
  /** 595 (madde 13–15): başlık tablosunun etiketleri, sayfa altı yazısı ({firma}, {kod} yer tutucularıyla), ekipman kodu / türü satırlarının adı */
  bas: z.object({ kod: baslik, surum: baslik, no: baslik, tarih: baslik }).optional(),
  altYazi: z.string().trim().max(300).optional(),
  ekipmanAd: z.object({ kod: baslik, tur: baslik }).optional(),
  /** 595 (madde 3): 1. bölümün satırları (FirmaSatiri); verilmemişse bugünkü satırlar */
  firma: z.object({ satirlar: z.array(FirmaSatiri).max(40) }).optional(),
  eimza: z.object({
    yer: z.enum(["hucre", "kutu", "gorunmez"]),
    x: z.number().min(0).max(200).optional(), y: z.number().min(0).max(287).optional(),
    en: z.number().min(20).max(210).optional(), boy: z.number().min(10).max(100).optional(),
  }).optional(),
});

export const FormatTanimi = z.object({
  sema: z.literal(SEMA_SURUMU),
  bolumler: z.array(Bolum).max(40),
  kurallar: Kurallar.default({ foto: false, derece: false, oneri: true }),
  gorunum: Gorunum.default({ formKodu: "", baslik: "", dayanak: [], talimat: "", cevap: "acilir" }),
}).superRefine((t, bag) => {
  const gorulen = new Set<string>();
  const tek = (id: string, yol: (string | number)[]) => {
    if (gorulen.has(id)) bag.addIssue({ code: "custom", path: yol, message: `Kimlik iki kez kullanılmış: ${id}` });
    gorulen.add(id);
  };
  const bagli = new Set<string>();
  let tamSayisi = 0;
  /* 595 (madde 3): firma bilgileri satırları — kimlik tekil, kayıt bilgisi iki kez yok, zorunlular var */
  const fs = t.gorunum.firma?.satirlar;
  if (fs) {
    const gorulenK = new Set<string>();
    fs.forEach((s, j) => {
      tek(s.id, ["gorunum", "firma", "satirlar", j, "id"]);
      if (s.kaynak !== "serbest" && gorulenK.has(s.kaynak)) bag.addIssue({ code: "custom", path: ["gorunum", "firma", "satirlar", j], message: `Firma bilgisi iki kez: ${FIRMA_KAYNAK_ADI[s.kaynak]}` });
      gorulenK.add(s.kaynak);
    });
    for (const z0 of FIRMA_ZORUNLU) if (!gorulenK.has(z0)) bag.addIssue({ code: "custom", path: ["gorunum", "firma"], message: `Firma bilgilerinde zorunlu satır yok: ${FIRMA_KAYNAK_ADI[z0]}` });
  }
  t.bolumler.forEach((b, i) => {
    tek(b.id, ["bolumler", i, "id"]);
    if (b.blok === "bilgi" && b.tam && ++tamSayisi > 1) bag.addIssue({ code: "custom", path: ["bolumler", i, "tam"], message: "Ekipman bölümü bir tane olur." });
    if (b.blok === "bilgi") b.alanlar.forEach((a, j) => {
      tek(a.id, ["bolumler", i, "alanlar", j, "id"]);
      if ((a.tur === "secim" || a.tur === "coklu") && !a.secenekler?.length) bag.addIssue({ code: "custom", path: ["bolumler", i, "alanlar", j], message: "Seçim alanının seçenekleri yok." });
      if (a.ekipman) {
        if (!b.tam) bag.addIssue({ code: "custom", path: ["bolumler", i, "alanlar", j, "ekipman"], message: "Ekipman kaydına bağlı alan yalnız ekipman bölümünde olur." });
        if (a.kaynak || a.tur !== "metin") bag.addIssue({ code: "custom", path: ["bolumler", i, "alanlar", j, "ekipman"], message: `Ekipman kaydına bağlı alan yazı alanıdır: ${a.ad}` });
        if (bagli.has(a.ekipman)) bag.addIssue({ code: "custom", path: ["bolumler", i, "alanlar", j, "ekipman"], message: `Ekipman alanı iki kez: ${EKIPMAN_ALAN_ADI[a.ekipman]}` });
        bagli.add(a.ekipman);
      }
    });
    if (b.blok === "liste") b.gruplar.forEach((g, j) => { tek(g.id, ["bolumler", i, "gruplar", j, "id"]); g.maddeler.forEach((m, k) => tek(m.id, ["bolumler", i, "gruplar", j, "maddeler", k, "id"])); });
    if (b.blok === "olcum") {
      const s = new Set<string>();
      b.sutunlar.forEach((c, j) => {
        if (s.has(c.id)) bag.addIssue({ code: "custom", path: ["bolumler", i, "sutunlar", j, "id"], message: `Sütun iki kez: ${c.id}` }); s.add(c.id);
        if (c.giris === "secim" && !c.secenekler?.length) bag.addIssue({ code: "custom", path: ["bolumler", i, "sutunlar", j], message: `Seçmeli sütunun seçenekleri yok: ${c.ad}` });
        if (c.olumsuz?.some((o) => !(c.giris === "evet" ? ["evet", "hayir"] : c.secenekler ?? []).includes(o))) bag.addIssue({ code: "custom", path: ["bolumler", i, "sutunlar", j, "olumsuz"], message: `Olumsuz seçenek sütunun seçeneklerinde yok: ${c.ad}` });
      });
    }
    if (b.blok === "test") b.degerler.forEach((d, j) => {
      tek(d.id, ["bolumler", i, "degerler", j, "id"]);
      if (d.olumsuz?.some((o) => !(d.secenekler ?? []).includes(o))) bag.addIssue({ code: "custom", path: ["bolumler", i, "degerler", j, "olumsuz"], message: `Olumsuz seçenek değerin seçeneklerinde yok: ${d.ad}` });
    });
    if (b.blok === "imza") b.satirlar?.forEach((s, j) => {
      tek(s.id, ["bolumler", i, "satirlar", j, "id"]);
      const yol = ["bolumler", i, "satirlar", j, "alan"];
      if (s.kim === "diger" ? s.alan !== undefined : s.alan === undefined || !imzaAlanlari(s.kim).includes(s.alan)) {
        bag.addIssue({ code: "custom", path: yol, message: `İmza satırının bilgisi kişiye uymuyor: ${s.ad}` });
      }
    });
    if ((b.blok === "cihaz" || b.blok === "kusur") && b.sutunlar) {
      const al = new Set<string>();
      b.sutunlar.forEach((s, j) => {
        tek(s.id, ["bolumler", i, "sutunlar", j, "id"]);
        if (al.has(s.alan)) bag.addIssue({ code: "custom", path: ["bolumler", i, "sutunlar", j, "alan"], message: `Sütun iki kez: ${s.ad}` });
        al.add(s.alan);
      });
    }
    if (b.blok === "foto" && b.enAz > b.enCok) bag.addIssue({ code: "custom", path: ["bolumler", i, "enAz"], message: "En az, en çoktan büyük olamaz." });
  });
});
export type FormatTanimi = z.output<typeof FormatTanimi>;
export type FormatGirdisi = z.input<typeof FormatTanimi>;
/** e-imza kutusunun başlangıç yeri (son sayfa, sağ alt — şeridin üstünde) */
export const EIMZA_KUTU = { x: 120, y: 240, en: 80, boy: 25 } as const;

/* ── CEVAPLAR (raporun içeriği; kimliklerle) ── */
/** ölçüm tablosunda en çok satır — raporun kendi sınırı (Cevaplar.tablo); S.A.Y'ın rapora yazması da bununla (raporlar/say-doldur.ts — 2026-10-16:
    S.A.Y 300'ün üstüne çıkarınca rapor kaydedilemiyordu; tek kaynak) */
export const TABLO_SATIR_EN_COK = 300;
/** madde cevabı; foto: bu maddeye eklenen fotoğraf sayısı (sunucu raporun kendi listesinden sayar, istemciden alınmaz) */
export const MaddeCevabi = z.object({
  c: z.string().max(40), not: z.string().max(1000).optional(), derece: z.enum(["hafif", "agir"]).optional(), foto: z.number().int().min(0).max(50).optional(),
});
export const Cevaplar = z.object({
  alan: z.record(z.string(), z.union([z.string().max(2000), z.array(z.string().max(200)).max(40)])).default({}),
  madde: z.record(z.string(), MaddeCevabi).default({}),
  /** ölçüm tablosu → satırlar (sütun kimliği → değer; "not" seçilen uygunluk notunun sırası, 1'den) */
  tablo: z.record(z.string(), z.array(z.record(z.string(), z.string().max(200))).max(TABLO_SATIR_EN_COK)).default({}),
  deger: z.record(z.string(), z.string().max(200)).default({}),
  /** fotoğraf bölümü başına fotoğraf sayısı (2026-10-05, C18: tek sayı iki fotoğraf bölümünü — termal ve fotoğraflar — ayırt edemiyordu);
      sunucu raporun kendi listesinden sayar */
  /* 2026-10-05 (313-314 çapraz inceleme): 312'den önce açılan raporda tek sayı yazılıydı — sayı gelirse boş kayıt sayılır (sunucu sayıları
     raporun kendi fotoğraf listesinden yeniden hesaplar, bilgi kaybı yok); yoksa eski satır şemadan geçmez, cevaplar boş görünürdü */
  foto: z.preprocess((x) => (typeof x === "number" ? {} : x), z.record(z.string(), z.number().int().min(0).max(200))).default({}),
  cihaz: z.number().int().min(0).max(50).default(0),
  sonuc: z.enum(["", "uygun", "uygun_degil"]).default(""),
  yorum: z.string().max(4000).default(""),
  /** 492: denetçinin raporda değiştirdiği künye bilgileri (anahtar varsa değer o; yoksa raporun künye kopyası). Firma adı boş olamaz; kilitli
      olanlar sunucuda reddedilir (format/kunye.ts kunyeKilitHatalari) */
  kunye: z.object({
    firma: z.string().trim().min(1, "Firma adı boş olamaz.").max(KUNYE_EN_COK.firma).optional(),
    adres: z.string().trim().max(KUNYE_EN_COK.adres).optional(), sgk: z.string().trim().max(KUNYE_EN_COK.sgk).optional(),
    isg: z.string().trim().max(KUNYE_EN_COK.isg).optional(), eposta: z.string().trim().max(KUNYE_EN_COK.eposta).optional(),
    tel: z.string().trim().max(KUNYE_EN_COK.tel).optional(), metot: z.string().trim().max(KUNYE_EN_COK.metot).optional(),
  }).default({}),
});
export type Cevaplar = z.output<typeof Cevaplar>;
