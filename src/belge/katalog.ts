/* BELGE KATALOĞU (2026-10-25, belge formatları; reisim: "herhangi bir form ekleme mekaniği bu şekilde çalışmalı aynı araca bağlamalıyız"): programın
   ürettiği belgeler — zimmet teslim formu, araç teslim tutanağı, eğitim katılım formu, izin talep formu, masraf formu, teklif, fatura özeti, saha formu,
   ön bilgilendirme formu; 2026-10-25 belge doldurma: sözleşme — rapor şablonunun aracına (basılı PDF → şablon → Format kurucu → belge o formattan) bağlanır. Her belgenin BİLGİLERİ:
   alan (tek değer) ve liste (çoğalan satırın kolonları), belgenin verisinden (src/belge/<belge>.ts …Verisi) — serbest tablonun kayıt hücresi
   veri = "alan" ya da çoğalan satırda "liste.kolon" ile okur (format/tanim.ts Hucre.veri; çizim belge.ts belgeFormu). <belge>Degerleri(v):
   verinin belgede görünen değerleri (tarih GG.AA.YYYY, tutar "1.234,56 TL"; yok olan bilgi boş). Firmanın formatı yoksa temel format aynen
   (belgeCizimi). 2026-10-25 (belge doldurma; reisim: "sözleşme vb işleri de yüklediğimde, el ile değiştirilebilir ve doldurulabilir olmalı"):
   formatın elle doldurulan yerlerinin değerleri (v.elle — ./doldurma.ts) belgeFormu'na geçer. SAF (veritabanısız; kurucunun önizlemesi
   tarayıcıda da koşar). Kilit tests/belge-katalog.test.ts, tests/belge-doldurma.test.ts. */
import type { ReactNode } from "react";
import type { FormatTanimi } from "../format/tanim.ts";
import { aracTutanakFormKodu, TAAHHUT as ARAC_TAAHHUT, type AracTutanagiVerisi } from "./arac.ts";
import { belgeFormu, tarihNo, zamanNo } from "./belge.ts";
import { EGITIM_BEYAN, egitimFormKodu, type EgitimFormuVerisi } from "./egitim.ts";
import { faturaOzetiFormKodu, type FaturaBelgesiVerisi } from "./fatura.ts";
import { ON_BILGI_METIN, onBilgiFormKodu, onBilgiTarihi, type OnBilgiVerisi } from "./onbilgi.ts";
import { SAHA_ONAY, sahaFormKodu, type SahaFormuVerisi } from "./saha.ts";
import { ilIlce, sozlesmeFormKodu, YENILEME_AD, type SozlesmeBelgesiVerisi } from "./sozlesme.ts";
import { TALEP_FORMAT, talepFormKodu, type TalepFormuVerisi, type TalepTipi } from "./talep.ts";
import { para, teklifFormKodu, teklifKosullari, type TeklifBelgesiVerisi } from "./teklif.ts";
import { ZIMMET_TAAHHUT, zimmetFormKodu, type ZimmetFormuVerisi } from "./zimmet.ts";

/** göçün belge listesiyle aynı sırada (en son göç 0105 — tests/belge-format-saf.test.ts) */
export const BELGE_TURLERI = ["zimmet", "arac", "egitim", "izin", "masraf", "teklif", "fatura", "saha", "onbilgi", "sozlesme"] as const;
export type BelgeTuru = (typeof BELGE_TURLERI)[number];
export interface BelgeAlani { anahtar: string; ad: string }
export interface BelgeListesi { anahtar: string; ad: string; kolonlar: BelgeAlani[] }
export interface BelgeKatalogu { anahtar: BelgeTuru; ad: string; alanlar: BelgeAlani[]; listeler: BelgeListesi[] }
export interface BelgeDegerleri { alanlar: Record<string, string>; listeler: Record<string, Record<string, string>[]> }
export const belgeTuruMu = (x: unknown): x is BelgeTuru => typeof x === "string" && (BELGE_TURLERI as readonly string[]).includes(x);

/** talep formunun kendi alanları: anahtar · talepler sunucusunun (talepFormuVerisi) satır adı · katalogdaki adı. Kilit testi adların sunucuda
    aynı olduğunu denetler (ad değişirse değer boş kalmasın). */
export const TALEP_ALANLARI: Record<TalepTipi, readonly (readonly [anahtar: string, etiket: string, ad: string])[]> = {
  izin: [["izin_turu", "İzin türü", "İzin türü"], ["baslangic", "Başlangıç", "Başlangıç"], ["bitis", "Bitiş", "Bitiş"], ["sure", "Süre", "Süre"],
    ["aciklama", "Açıklama", "Açıklama"], ["ek_belge", "Ek belge", "Ek belge"]],
  masraf: [["is", "İş", "İş (proje no)"], ["masraf_tarihi", "Masraf tarihi", "Masraf tarihi"], ["masraf_turu", "Tür", "Masraf türü"],
    ["tutar", "Tutar (KDV dahil)", "Tutar (KDV dahil)"], ["kdv", "KDV", "KDV"], ["aciklama", "Açıklama", "Açıklama"], ["fis", "Fiş", "Fiş"], ["odendi", "Ödendi", "Ödendi"]],
};

const a = (anahtar: string, ad: string): BelgeAlani => ({ anahtar, ad });
const l = (anahtar: string, ad: string, ...kolonlar: BelgeAlani[]): BelgeListesi => ({ anahtar, ad, kolonlar });
/** her belgede: firma, doküman kodu, belge numarası, tarih */
const ortak = (no: string, tarih: string): BelgeAlani[] => [a("firma_ad", "Firma adı"), a("firma_adres", "Firma adresi"), a("form_kod", "Doküman kodu"), a("belge_no", no), a("tarih", tarih)];
const talepKatalogu = (tip: TalepTipi, ad: string): BelgeKatalogu => ({
  anahtar: tip, ad,
  alanlar: [...ortak("Form no", "Gönderildiği gün"), a("gonderildi", "Gönderildi (gün ve saat)"), a("personel_ad", "Personel"), a("personel_meslek", "Personelin mesleği"),
    a("durum", "Durum"), a("konu", "Konu"), ...TALEP_ALANLARI[tip].map(([k, , ad_]) => a(k, ad_)), a("red", "Red gerekçesi"), a("onaylayan", "Onaylayan"),
    a("karar", "Karar"), a("karar_zamani", "Karar zamanı"), a("beyan", "Beyan metni")],
  listeler: [l("satir", "Talep satırları", a("etiket", "Bilgi"), a("deger", "Değer"))],
});

export const BELGE_KATALOGU: Record<BelgeTuru, BelgeKatalogu> = {
  zimmet: {
    anahtar: "zimmet", ad: "Zimmet teslim formu",
    alanlar: [...ortak("Form no", "Tarih"), a("alan_ad", "Teslim alan"), a("alan_meslek", "Teslim alanın mesleği"), a("eden_ad", "Teslim eden"),
      a("eden_meslek", "Teslim edenin mesleği"), a("taahhut", "Taahhüt metni")],
    listeler: [l("varlik", "Zimmetlenen varlıklar", a("kod", "Kod"), a("ad", "Varlık"), a("tur", "Tür"), a("teslim", "Teslim tarihi"), a("not", "Not"))],
  },
  arac: {
    anahtar: "arac", ad: "Araç teslim tutanağı",
    alanlar: [...ortak("Tutanak no", "Teslim günü"), a("saat", "Teslim saati"), a("plaka", "Plaka"), a("arac", "Araç"), a("eden_ad", "Teslim eden"),
      a("eden_meslek", "Teslim edenin mesleği"), a("alan_ad", "Teslim alan"), a("alan_meslek", "Teslim alanın mesleği"), a("km", "Kilometre"),
      a("yakit", "Yakıt seviyesi"), a("hasar", "Hasar ve notlar"), a("taahhut", "Taahhüt metni")],
    listeler: [l("kontrol", "Araçta olanlar", a("kalem", "Kalem"), a("var", "Var (X)"), a("yok", "Yok (X)"), a("durum", "Var / Yok")),
      l("foto", "Fotoğraflar", a("aci", "Açı"), a("durum", "Çekildi / çekilmedi"))],
  },
  egitim: {
    anahtar: "egitim", ad: "Eğitim katılım formu",
    alanlar: [...ortak("Form no", "Eğitim tarihi"), a("katilan_ad", "Katılan"), a("katilan_meslek", "Katılanın mesleği"), a("egitim", "Eğitim"),
      a("kurum", "Eğitimi veren"), a("tekrar", "Tekrar tarihi"), a("beyan", "Beyan metni")],
    listeler: [],
  },
  izin: talepKatalogu("izin", "İzin talep formu"),
  masraf: talepKatalogu("masraf", "Masraf formu"),
  teklif: {
    anahtar: "teklif", ad: "Fiyat teklifi",
    alanlar: [...ortak("Teklif no", "Teklif tarihi"), a("gecerlilik", "Geçerlilik (gün)"), a("bitis", "Geçerlilik bitişi"), a("musteri_unvan", "Müşteri ünvanı"),
      a("musteri_vergi", "Vergi dairesi / no"), a("musteri_adres", "Müşteri adresi / tesisler"), a("musteri_ilgili", "İlgili kişi"), a("musteri_eposta", "E-posta"),
      a("musteri_tel", "Telefon"), a("ara_toplam", "Ara toplam (KDV hariç)"), a("kdv_orani", "KDV oranı"), a("kdv_tutari", "KDV tutarı"), a("genel_toplam", "Genel toplam"),
      a("kosullar", "Koşullar metni"), a("notlar", "Not"), a("hazirlayan", "Hazırlayan"), a("durum", "Durum")],
    listeler: [l("kalem", "Teklif kalemleri", a("tur", "Ekipman türü"), a("brans", "Branş"), a("periyot", "Periyot"), a("adet", "Adet"), a("birim_fiyat", "Birim fiyat"),
      a("tutar", "Tutar")), l("tesis", "Tesisler", a("ad", "Tesis"), a("adres", "Adres"))],
  },
  fatura: {
    anahtar: "fatura", ad: "Fatura özeti",
    alanlar: [...ortak("Fatura no", "Fatura tarihi"), a("vade", "Vade"), a("vade_gun", "Vade (gün)"), a("alici_unvan", "Alıcı ünvanı"), a("alici_vd", "Vergi dairesi"),
      a("alici_vno", "Vergi no"), a("rapor_sayisi", "Rapor sayısı"), a("ara_toplam", "Ara toplam (KDV hariç)"), a("kdv_orani", "KDV oranı"), a("kdv_tutari", "KDV tutarı"),
      a("genel_toplam", "Genel toplam"), a("tahsil", "Tahsil edilen"), a("kalan", "Kalan"), a("kaydeden", "Kaydeden")],
    listeler: [l("kalem", "Kalemler", a("tur", "Ekipman türü"), a("adet", "Adet"), a("birim_fiyat", "Birim fiyat"), a("tutar", "Tutar"), a("teklif_disi", "Teklif dışı")),
      l("is", "İşler", a("no", "İş no"), a("tesis", "Tesis")),
      l("tahsilat", "Tahsilatlar", a("tarih", "Tarih"), a("yontem", "Yöntem"), a("aciklama", "Açıklama"), a("tutar", "Tutar"))],
  },
  saha: {
    anahtar: "saha", ad: "Saha formu",
    alanlar: [...ortak("Form no", "Tarih (plan günleri)"), a("proje_no", "Proje no"), a("baslangic", "Başlangıç"), a("bitis", "Bitiş"), a("musteri", "Müşteri"),
      a("tesis", "Tesis"), a("adres", "Adres"), a("uzmanlar", "Muayene uzmanları"), a("onay", "Firma onayı metni")],
    listeler: [l("ekipman", "Kontrolü yapılan ekipmanlar", a("kod", "Kod"), a("tur", "Ekipman"), a("konum", "Konum")), l("uzman", "Muayene uzmanları", a("ad", "Ad soyad"))],
  },
  onbilgi: {
    anahtar: "onbilgi", ad: "Ön bilgilendirme formu",
    alanlar: [...ortak("Proje no", "Tarih"), a("musteri", "Müşteri"), a("tesis", "Tesis"), a("adres", "Adres"), a("planlanan", "Planlanan tarih"),
      a("baslangic", "Başlangıç"), a("bitis", "Bitiş"), a("uzmanlar", "Muayene uzmanları"), a("metin", "Bilgilendirme metni")],
    listeler: [l("ekipman", "Kontrol edilecek ekipmanlar", a("kod", "Kod"), a("tur", "Ekipman"), a("konum", "Konum")),
      l("uzman", "Muayene uzmanları", a("ad", "Ad soyad"), a("meslek", "Meslek"))],
  },
  /* 2026-10-25 (belge doldurma): iş sözleşmesi — kayıttaki bilgiler; sözleşmenin metni ve elle doldurulan yerleri firmanın formatında */
  sozlesme: {
    anahtar: "sozlesme", ad: "Sözleşme",
    alanlar: [...ortak("Sözleşme no", "Sözleşme tarihi"), a("musteri_unvan", "Müşteri ünvanı"), a("musteri_vd", "Vergi dairesi"), a("musteri_vno", "Vergi no"),
      a("musteri_adres", "Müşteri adresi"), a("tesisler", "Tesisler (hepsi)"), a("baslangic", "Başlangıç"), a("bitis", "Bitiş"), a("vade", "Ödeme vadesi"),
      a("yenileme", "Yenileme"), a("teklif_no", "Dayanak teklif"), a("firma_imza", "Firmanın imza tarihi"), a("musteri_imza", "Müşterinin imza tarihi")],
    listeler: [l("tesis", "Tesisler", a("ad", "Tesis"), a("il", "İl"), a("ilce", "İlçe"), a("il_ilce", "İlçe / il"), a("sgk", "SGK sicil no"))],
  },
};

/* ── EŞLEME: verinin görünen değerleri ── */
type Firma = { ad: string; kod: string; adres?: string | null; logo?: string | null };
const gun = (s: string | null | undefined) => (s ? tarihNo(s) : "");
const ortakDeger = (f: Firma, formKod: string, no: string | null, tarih: string) =>
  ({ firma_ad: f.ad, firma_adres: f.adres ?? "", form_kod: formKod, belge_no: no ?? "", tarih });

export function zimmetDegerleri(v: ZimmetFormuVerisi): BelgeDegerleri {
  return {
    alanlar: { ...ortakDeger(v.firma, zimmetFormKodu(v.firma.kod), v.no, gun(v.tarih)), alan_ad: v.alan.ad, alan_meslek: v.alan.meslek,
      eden_ad: v.eden?.ad ?? "Firma adına", eden_meslek: v.eden?.meslek ?? "", taahhut: ZIMMET_TAAHHUT },
    listeler: { varlik: v.varliklar.map((x) => ({ kod: x.kod, ad: x.ad, tur: x.tur, teslim: gun(x.teslim), not: x.not ?? "" })) },
  };
}

export function aracDegerleri(v: AracTutanagiVerisi): BelgeDegerleri {
  const z = zamanNo(v.zaman);
  return {
    alanlar: { ...ortakDeger(v.firma, aracTutanakFormKodu(v.firma.kod), v.no, z.slice(0, 10)), saat: z.slice(11), plaka: v.plaka, arac: v.arac,
      eden_ad: v.eden?.ad ?? "Depo · firma adına", eden_meslek: v.eden?.meslek ?? "", alan_ad: v.alan?.ad ?? "Depo · firma adına", alan_meslek: v.alan?.meslek ?? "",
      km: v.km ?? "", yakit: v.yakit ?? "", hasar: v.hasar ?? "", taahhut: ARAC_TAAHHUT },
    listeler: {
      kontrol: (v.kontrol ?? []).map(([kalem, var_]) => ({ kalem, var: var_ ? "X" : "", yok: var_ ? "" : "X", durum: var_ ? "Var" : "Yok" })),
      foto: v.fotolar.map(([aci, var_]) => ({ aci, durum: var_ ? "çekildi" : "çekilmedi" })),
    },
  };
}

export function egitimDegerleri(v: EgitimFormuVerisi): BelgeDegerleri {
  return {
    alanlar: { ...ortakDeger(v.firma, egitimFormKodu(v.firma.kod), v.no, gun(v.tarih)), katilan_ad: v.katilan.ad, katilan_meslek: v.katilan.meslek, egitim: v.egitim,
      kurum: v.kurum, tekrar: gun(v.tekrar), beyan: EGITIM_BEYAN },
    listeler: {},
  };
}

/** izin talep formu ya da masraf formu (v.tip) */
export function talepDegerleri(v: TalepFormuVerisi): BelgeDegerleri {
  const F = TALEP_FORMAT[v.tip], deger = new Map(v.alanlar.map(([e, d]) => [e, d] as const)), z = zamanNo(v.gonderildi);
  return {
    alanlar: { ...ortakDeger(v.firma, talepFormKodu(v.firma.kod, v.tip), v.no, z.slice(0, 10)), gonderildi: z, personel_ad: v.personel.ad,
      personel_meslek: v.personel.meslek, durum: v.durum, konu: F.alt, ...Object.fromEntries(TALEP_ALANLARI[v.tip].map(([k, e]) => [k, deger.get(e) ?? ""])),
      red: v.red ?? "", onaylayan: v.karar?.ad ?? "", karar: v.karar ? (v.karar.sonuc === "onaylandi" ? "Onaylandı" : "Reddedildi") : "",
      karar_zamani: v.karar ? zamanNo(v.karar.zaman) : "", beyan: F.metin },
    listeler: { satir: v.alanlar.map(([etiket, d]) => ({ etiket, deger: d })) },
  };
}

const TEKLIF_DURUM: Record<TeklifBelgesiVerisi["durum"], string> = { taslak: "Taslak", gonderildi: "Gönderildi", kabul: "Kabul edildi", red: "Reddedildi", suresi: "Süresi doldu" };
export function teklifDegerleri(v: TeklifBelgesiVerisi): BelgeDegerleri {
  const ara = v.kalemler.reduce((n, k) => n + k.adet * k.fiyat, 0), genel = Math.round((ara * (100 + v.kdv)) / 100), m = v.musteri;
  return {
    alanlar: { ...ortakDeger(v.firma, teklifFormKodu(v.firma.kod), v.no, gun(v.tarih)), gecerlilik: `${v.gecerlilik} gün`, bitis: gun(v.bitis),
      musteri_unvan: m.unvan, musteri_vergi: m.vergi ?? "", musteri_adres: m.yerler.map((y) => [y.ad, y.adres].filter(Boolean).join(" — ")).filter(Boolean).join("\n"),
      musteri_ilgili: m.ilgili ?? "", musteri_eposta: m.eposta ?? "", musteri_tel: m.tel ?? "", ara_toplam: para(ara), kdv_orani: `%${v.kdv}`, kdv_tutari: para(genel - ara),
      genel_toplam: para(genel), kosullar: teklifKosullari(v), notlar: v.notlar ?? "", hazirlayan: v.hazirlayan, durum: TEKLIF_DURUM[v.durum] },
    listeler: {
      kalem: v.kalemler.map((k) => ({ tur: k.turAd, brans: k.brans === "m" ? "Mekanik" : k.brans === "e" ? "Elektrik" : "", periyot: k.periyot ? `${k.periyot} ay` : "",
        adet: String(k.adet), birim_fiyat: para(k.fiyat), tutar: para(k.adet * k.fiyat) })),
      tesis: m.yerler.map((y) => ({ ad: y.ad ?? "", adres: y.adres ?? "" })),
    },
  };
}

export function faturaDegerleri(v: FaturaBelgesiVerisi): BelgeDegerleri {
  return {
    alanlar: { ...ortakDeger(v.firma, faturaOzetiFormKodu(v.firma.kod), v.no, gun(v.tarih)), vade: gun(v.vade), vade_gun: `${v.vadeGun} gün`, alici_unvan: v.alici.unvan,
      alici_vd: v.alici.vd ?? "", alici_vno: v.alici.vno ?? "", rapor_sayisi: String(v.raporSayisi), ara_toplam: para(v.ara), kdv_orani: `%${v.kdv}`,
      kdv_tutari: para(v.kdvTutar), genel_toplam: para(v.toplam), tahsil: para(v.tahsil), kalan: para(v.kalan), kaydeden: v.kaydeden },
    listeler: {
      kalem: v.kalemler.map((k) => ({ tur: k.turAd, adet: String(k.adet), birim_fiyat: k.fiyat === null ? "fiyatsız" : para(k.fiyat),
        tutar: k.fiyat === null ? "" : para(k.adet * k.fiyat), teklif_disi: k.disi ? "teklif dışı" : "" })),
      is: v.isler.map((x) => ({ no: x.no, tesis: x.tesis })),
      tahsilat: v.tahsilatlar.map((t) => ({ tarih: gun(t.tarih), yontem: t.yontem, aciklama: t.aciklama ?? "", tutar: para(t.tutar) })),
    },
  };
}

export function sahaDegerleri(v: SahaFormuVerisi): BelgeDegerleri {
  return {
    alanlar: { ...ortakDeger(v.firma, sahaFormKodu(v.firma.kod), v.no, onBilgiTarihi(v)), proje_no: v.projeNo, baslangic: gun(v.baslangic), bitis: gun(v.bitis),
      musteri: v.musteri, tesis: v.tesis, adres: v.adres ?? "", uzmanlar: v.uzmanlar.join(", "), onay: SAHA_ONAY },
    listeler: { ekipman: v.ekipmanlar.map((x) => ({ kod: x.kod, tur: x.tur, konum: x.konum ?? "" })), uzman: v.uzmanlar.map((ad) => ({ ad })) },
  };
}

export function onBilgiDegerleri(v: OnBilgiVerisi): BelgeDegerleri {
  return {
    alanlar: { ...ortakDeger(v.firma, onBilgiFormKodu(v.firma.kod), v.projeNo, gun(v.tarih)), musteri: v.musteri, tesis: v.tesis, adres: v.adres ?? "",
      planlanan: onBilgiTarihi(v), baslangic: gun(v.baslangic), bitis: gun(v.bitis), uzmanlar: v.uzmanlar.map((x) => x.ad).join(", "), metin: ON_BILGI_METIN },
    listeler: { ekipman: v.ekipmanlar.map((x) => ({ kod: x.kod, tur: x.tur, konum: x.konum ?? "" })), uzman: v.uzmanlar.map((x) => ({ ad: x.ad, meslek: x.meslek })) },
  };
}

export function sozlesmeDegerleri(v: SozlesmeBelgesiVerisi): BelgeDegerleri {
  const m = v.musteri;
  return {
    alanlar: { ...ortakDeger(v.firma, sozlesmeFormKodu(v.firma.kod), v.no, gun(v.tarih)), musteri_unvan: m.unvan, musteri_vd: m.vd ?? "", musteri_vno: m.vno ?? "",
      musteri_adres: m.adres ?? "", tesisler: v.tesisler.map((x) => [x.ad, ilIlce(x)].filter(Boolean).join(" — ")).join("\n"), baslangic: gun(v.baslangic),
      bitis: gun(v.bitis), vade: `${v.vade} gün`, yenileme: YENILEME_AD[v.yenileme], teklif_no: v.teklifNo ?? "", firma_imza: gun(v.firmaImza),
      musteri_imza: gun(v.musteriImza) },
    listeler: { tesis: v.tesisler.map((x) => ({ ad: x.ad, il: x.il ?? "", ilce: x.ilce ?? "", il_ilce: ilIlce(x), sgk: x.sgk ?? "" })) },
  };
}

/** belgenin ağacı: firmanın o belge için yayınladığı format varsa ondan (belge.ts belgeFormu — elle doldurulan yerleriyle), yoksa temel format aynen */
export function belgeCizimi<V extends { firma: Firma; format?: FormatTanimi | null; elle?: Readonly<Record<string, string>> | null }>(belge: BelgeTuru, v: V,
  degerler: (v: V) => BelgeDegerleri, temel: (v: V) => ReactNode): ReactNode {
  return v.format ? belgeFormu(v.format, v.firma, degerler(v), BELGE_KATALOGU[belge].ad, v.elle) : temel(v);
}

/* ── ÖRNEK DEĞERLER (kurucunun önizlemesi; uydurma) ── */
const F: Firma = { ad: "Deneme Muayene A.Ş.", kod: "DA", adres: "Deneme Cad. 1, Çankaya / Ankara" };
const KISI = { ad: "Deneme Denetçi", meslek: "Makine mühendisi" };
const talepOrnegi = (tip: TalepTipi): TalepFormuVerisi => ({
  firma: F, tip, no: tip === "izin" ? "IZ-1026-001" : "G-1026-001", gonderildi: "2026-10-05T06:30:00.000Z", personel: KISI, durum: "Onaylandı",
  alanlar: tip === "izin"
    ? [["İzin türü", "Yıllık izin"], ["Başlangıç", "12.10.2026"], ["Bitiş", "16.10.2026"], ["Süre", "5 iş günü"], ["Açıklama", "Deneme açıklama"], ["Ek belge", "-"]]
    : [["İş", "P-1026-001"], ["Masraf tarihi", "05.10.2026"], ["Tür", "Yakıt"], ["Tutar (KDV dahil)", "250,00 TL"], ["KDV", "%20 · 41,67 TL (KDV hariç 208,33 TL)"],
      ["Açıklama", "Deneme açıklama"], ["Fiş", "fis.pdf"], ["Ödendi", "07.10.2026"]],
  red: null, karar: { ad: "Deneme Yönetici", zaman: "2026-10-05T09:00:00.000Z", sonuc: "onaylandi" },
});
const ORNEK: { [K in BelgeTuru]: () => BelgeDegerleri } = {
  zimmet: () => zimmetDegerleri({ firma: F, no: "ZF-1026-001", tarih: "2026-10-06", alan: KISI, eden: { ad: "Deneme Yönetici", meslek: "İşletme" },
    varliklar: [{ kod: "OC-201", ad: "Topraklama ölçer", tur: "Ölçüm cihazı", teslim: "2026-09-01", not: "kalibrasyon 15.03.2027" },
      { kod: "34 DNM 001", ad: "Kamyonet · Deneme", tur: "Araç", teslim: "2026-09-02", not: null }, { kod: "DM-7", ad: "Dizüstü bilgisayar", tur: "Demirbaş", teslim: "2026-09-03", not: null }] }),
  arac: () => aracDegerleri({ firma: F, no: "AT-1026-001", zaman: "2026-10-06T06:30:00.000Z", plaka: "34 DNM 001", arac: "Binek · Deneme Model · 2022",
    eden: null, alan: KISI, km: "12.400 km", yakit: "1/2", kontrol: [["Ruhsat", true], ["Trafik sigortası poliçesi", true], ["Yangın söndürücü", false]],
    hasar: "Sol arka çizik", fotolar: [["Ön", true], ["Arka", true], ["Sol", false]] }),
  egitim: () => egitimDegerleri({ firma: F, no: "EF-1026-001", katilan: KISI, egitim: "Yüksekte çalışma", kurum: "Deneme Eğitim Kurumu", tarih: "2026-09-15", tekrar: "2027-09-15" }),
  izin: () => talepDegerleri(talepOrnegi("izin")),
  masraf: () => talepDegerleri(talepOrnegi("masraf")),
  teklif: () => teklifDegerleri({ firma: F, no: "T-1026-001", tarih: "2026-10-05", gecerlilik: 30, bitis: "2026-11-04", kdv: 20, notlar: "Ulaşım dahildir.",
    hazirlayan: "Deneme Planlama", durum: "gonderildi",
    musteri: { unvan: "Deneme Bir Sanayi A.Ş.", vergi: "Merkez · 1234567890", eposta: "satin@deneme-bir.example", tel: "0000 000 00 00", ilgili: "Deneme Yetkili",
      yerler: [{ ad: "Merkez", adres: "Deneme Cad. 1, Gebze / Kocaeli" }, { ad: "Depo", adres: "Deneme Sk. 2, Gebze / Kocaeli" }] },
    kalemler: [{ turAd: "Hava tankı", brans: "m", periyot: 12, adet: 2, fiyat: 125000 }, { turAd: "Elektrik iç tesisatı", brans: "e", periyot: 12, adet: 1, fiyat: 90050 },
      { turAd: "Forklift", brans: "m", periyot: 12, adet: 3, fiyat: 150000 }] }),
  fatura: () => faturaDegerleri({ firma: F, no: "DEN2026000000001", tarih: "2026-10-05", vade: "2026-11-04", vadeGun: 30, kaydeden: "Deneme Muhasebe",
    alici: { unvan: "Deneme Bir Sanayi A.Ş.", vd: "Merkez", vno: "1234567890" }, isler: [{ no: "P-1026-001", tesis: "Merkez" }], raporSayisi: 3,
    kalemler: [{ turAd: "Hava tankı", adet: 2, fiyat: 125000, disi: false }, { turAd: "Kompresör", adet: 1, fiyat: 90000, disi: true }],
    ara: 340000, kdv: 20, kdvTutar: 68000, toplam: 408000, tahsilatlar: [{ tarih: "2026-10-10", yontem: "Havale / EFT", tutar: 200000, aciklama: "Deneme ödeme" }],
    tahsil: 200000, kalan: 208000 }),
  saha: () => sahaDegerleri({ firma: F, no: "P-1026-001-SF1", projeNo: "P-1026-001", baslangic: "2026-10-05", bitis: "2026-10-06", musteri: "Deneme Bir Sanayi A.Ş.",
    tesis: "Merkez", adres: "Deneme Cad. 1, Gebze / Kocaeli", ekipmanlar: [{ kod: "HT-1", tur: "Hava tankı", konum: "Kazan dairesi" },
      { kod: "HT-2", tur: "Hava tankı", konum: null }, { kod: "FK-1", tur: "Forklift", konum: "Depo" }], uzmanlar: ["Deneme Denetçi", "Deneme İkinci"] }),
  onbilgi: () => onBilgiDegerleri({ firma: F, projeNo: "P-1026-001", tarih: "2026-10-01", musteri: "Deneme Bir Sanayi A.Ş.", tesis: "Merkez",
    adres: "Deneme Cad. 1, Gebze / Kocaeli", baslangic: "2026-10-05", bitis: "2026-10-06", uzmanlar: [KISI, { ad: "Deneme İkinci", meslek: "Elektrik mühendisi" }],
    ekipmanlar: [{ kod: "HT-1", tur: "Hava tankı", konum: "Kazan dairesi" }, { kod: "HT-2", tur: "Hava tankı", konum: null }, { kod: "FK-1", tur: "Forklift", konum: "Depo" }] }),
  sozlesme: () => sozlesmeDegerleri({ firma: F, no: "S-1026-001", tarih: "2026-10-01",
    musteri: { unvan: "Deneme Bir Sanayi A.Ş.", vd: "Merkez", vno: "1234567890", adres: "Deneme Cad. 1, Gebze / Kocaeli" },
    tesisler: [{ ad: "Merkez", il: "Kocaeli", ilce: "Gebze", sgk: "0000000000000000000000000" }, { ad: "Depo", il: "Kocaeli", ilce: "Gebze", sgk: null }],
    baslangic: "2026-10-01", bitis: "2027-09-30", vade: 30, yenileme: "otomatik", teklifNo: "T-1026-001", firmaImza: "2026-10-01", musteriImza: "2026-10-03" }),
};
/** kurucunun önizlemesinde kayıt hücrelerinin uydurma değerleri (katalogla aynı anahtarlar) */
export const ornekDegerler = (belge: BelgeTuru): BelgeDegerleri => ORNEK[belge]();
