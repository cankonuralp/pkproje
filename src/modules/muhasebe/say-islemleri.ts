/* MUHASEBE — S.A.Y'IN ÇAĞIRABİLDİĞİ İŞLEMLER (2026-10-16; pkproje §9 "S.A.Y CLAUDE GİBİ" 2. adım b; çekirdek src/server/yz/islem.ts). Her işlem modülün
   VAR OLAN işlevini oturumdaki kişiyle çağırır — Muhasebe ekranıyla aynı yetki ve kural (işler / faturalar / giderler / gelir-gider: Muhasebe'yi
   gören; fatura / tahsilat / gider: "yaz" düzeyi; fatura son imzadan önce olamaz, tahsilat kalanı aşmaz, ileri tarih yok, fatura ve tahsilat
   değişmez — veritabanında da; masraf formunun içeriğini Muhasebe değiştirmez, yalnız Ödendi). Tutarlar KURUŞ döner; girdide "1.250,00" ya da sayı
   (TL). Girdi modülün şemasından (FaturaGirdisi, TahsilatGirdisi, GiderGirdisi). Gider belgesi (fiş fotoğrafı / PDF) ve bordro gönderimi dosya /
   PDF ister — ekrandan. */
import { kimlik, surum, z } from "../../sema/ortak.ts";
import { SuzgecDurumuSemasi } from "../../server/liste/liste.ts";
import { EK_NO, ekBelgesi, GORUNMEZ, islem, sayfaBilgisi, yazmaCevabi, type Islem, type SayfaTanimi } from "../../server/yz/islem.ts";
import { DonemSecimi, FaturaGirdisi, GiderGirdisi, TahsilatGirdisi } from "./sema.ts";
import { giderKaydet, giderOdendi, giderSayfasi } from "./server/giderler.ts";
import { faturaKarti, faturaKaydet, faturaSayfasi, gelirGider, isKarti, isSayfasi, tahsilatKaydet } from "./server/muhasebe.ts";

import { doldurmaCevabi, doldurmaHazirla } from "../../server/yz/doldurma.ts";
import { ElleDegerGirdisi } from "../rapor-format/sema.ts";
import { faturaDoldur, faturaDoldurmaVerisi } from "./server/muhasebe.ts";

const MODUL = 18;
const YETKISIZ = "Bu kullanıcı Muhasebe'yi göremiyor.";

export const SAY_ISLEMLERI: readonly Islem[] = [
  islem({
    ad: "muhasebe_is_ara", modul: MODUL, tur: "oku", girdi: SuzgecDurumuSemasi, kaynak: [SuzgecDurumuSemasi], islev: isSayfasi,
    tarif: "Muhasebe işlerini (planlar) arar (20'şer): ara — proje no, müşteri, tesis; durum (Vadesi geçti / Faturaya hazır / Tahsilat bekliyor / Rapor sürüyor / "
      + "Kapandı), imzalı / faturalı rapor sayıları, raporlanan tutar (kuruş); üstte uyarı özeti.",
    calistir: async (b, _v, ham) => {
      const r = await isSayfasi(b.db, b.kim, ham);
      return r ? { tamam: true, sonuc: { ...sayfaBilgisi(r.liste), uyari: r.uyari, isler: r.liste.gorunen } } : { tamam: false, neden: YETKISIZ };
    },
  }),
  islem({
    ad: "muhasebe_is_getir", modul: MODUL, tur: "oku", girdi: z.object({ is: kimlik }), kaynak: [kimlik], islev: isKarti,
    tarif: "İşin muhasebe kartı: raporlar ve birim fiyatları, faturalar, teklif, sözleşme (vade), geçmiş, faturalanacak tutarın ön izlemesi (tek / toplu).",
    calistir: async (b, v) => {
      const k = await isKarti(b.db, b.kim, v.is);
      return k ? { tamam: true, sonuc: { ...k } } : { tamam: false, neden: GORUNMEZ };
    },
  }),
  islem({
    ad: "fatura_kaydet", modul: MODUL, tur: "yaz", girdi: z.object({ is: kimlik, fatura: z.object(FaturaGirdisi.shape) }), kaynak: [FaturaGirdisi, kimlik], islev: faturaKaydet,
    tarif: "İşin imzalı, faturalanmamış raporlarını faturalar: fatura { no (firmanın muhasebe programındaki no: 3 harf / rakam + yıl + 9 hane), tarih (YYYY-AA-GG), "
      + "toplu (true: müşterinin faturaya hazır bütün işleri) }. Fatura değişmez.",
    calistir: async (b, v, ham) => yazmaCevabi(await faturaKaydet(b.db, b.kim, v.is, ham.fatura), { bildirim: "Fatura kaydedildi." }),
  }),
  islem({
    ad: "fatura_ara", modul: MODUL, tur: "oku", girdi: SuzgecDurumuSemasi, kaynak: [SuzgecDurumuSemasi], islev: faturaSayfasi,
    tarif: "Faturaları arar (20'şer): ara — fatura no, müşteri; vade, toplam / tahsil / kalan (kuruş), durum.",
    calistir: async (b, _v, ham) => {
      const r = await faturaSayfasi(b.db, b.kim, ham);
      return r ? { tamam: true, sonuc: { ...sayfaBilgisi(r.liste), uyari: r.uyari, faturalar: r.liste.gorunen } } : { tamam: false, neden: YETKISIZ };
    },
  }),
  islem({
    ad: "fatura_getir", modul: MODUL, tur: "oku", girdi: z.object({ fatura: kimlik }), kaynak: [kimlik], islev: faturaKarti,
    tarif: "Fatura kartı: kalemler (raporlar), tahsilatlar, kalan, vade.",
    calistir: async (b, v) => {
      const f = await faturaKarti(b.db, b.kim, v.fatura);
      return f ? { tamam: true, sonuc: { ...f } } : { tamam: false, neden: GORUNMEZ };
    },
  }),
  islem({
    ad: "tahsilat_kaydet", modul: MODUL, tur: "yaz", girdi: z.object({ fatura: kimlik, tahsilat: z.object(TahsilatGirdisi.shape) }), kaynak: [TahsilatGirdisi, kimlik],
    islev: tahsilatKaydet,
    tarif: "Faturaya tahsilat yazar: tahsilat { tarih, tutar (TL: \"1.250,00\" ya da sayı; kalanı aşmaz), yontem (havale | cek | kart | nakit), aciklama }. Değişmez.",
    calistir: async (b, v, ham) => yazmaCevabi(await tahsilatKaydet(b.db, b.kim, v.fatura, ham.tahsilat), { bildirim: "Tahsilat kaydedildi." }),
  }),
  islem({
    ad: "gider_ara", modul: MODUL, tur: "oku", girdi: SuzgecDurumuSemasi, kaynak: [SuzgecDurumuSemasi], islev: giderSayfasi,
    tarif: "Giderleri arar (20'şer): ara — no, açıklama, kişi; durum (Onay bekliyor / Onaylandı (ödenecek) / Ödendi / Reddedildi), tutar (kuruş).",
    calistir: async (b, _v, ham) => {
      const l = await giderSayfasi(b.db, b.kim, ham);
      return l ? { tamam: true, sonuc: { ...sayfaBilgisi(l), giderler: l.gorunen } } : { tamam: false, neden: YETKISIZ };
    },
  }),
  islem({
    ad: "gider_kaydet", modul: MODUL, tur: "yaz", islev: giderKaydet, kaynak: [GiderGirdisi, kimlik, surum],
    girdi: z.object({ gider: kimlik.nullable().default(null), surum: surum.default(0), kayit: z.object(GiderGirdisi.shape), ek: EK_NO.optional() }),
    tarif: "Elle gider ekler (gider boş — odeme: odendi | onaylandi (ödenecek)) ya da düzenler (gider + surum; masraf formu ve reddedilen değişmez): kayit { tarih, "
      + "tur (yakit | konaklama | yol | kalibrasyon | sarf | diger), tutar (KDV dahil TL), oran (20 | 10 | 1 | 0), aciklama, is (plan kimliği ya da boş — genel), "
      + "personel }. ek (M03 / F02): konuşmadaki fiş / fatura kayda konur (2026-10-31, kalem 9).",
    calistir: async (b, v, ham) => {
      const belge = v.ek ? await ekBelgesi(b, v.ek, ["pdf", "foto"]) : null;
      if (typeof belge === "string") return { tamam: false, neden: belge };
      return yazmaCevabi(await giderKaydet(b.db, b.depo(), b.kim, b.firmaId, v.gider, v.surum, ham.kayit, belge));
    },
  }),
  islem({
    ad: "gider_odendi", modul: MODUL, tur: "yaz", girdi: z.object({ gider: kimlik, surum }), kaynak: [kimlik, surum], islev: giderOdendi,
    tarif: "Onaylanmış (ödenecek) gideri — masraf formu da — ödendi işaretler (içerik değişmez).",
    calistir: async (b, v) => yazmaCevabi(await giderOdendi(b.db, b.kim, v.gider, v.surum)),
  }),
  islem({
    ad: "gelir_gider", modul: MODUL, tur: "oku", girdi: z.object({ donem: DonemSecimi.default("toplam") }), kaynak: [DonemSecimi],
    islev: gelirGider,
    tarif: "Gelir-gider ve kârlılık: donem — \"toplam\" (son 13 ay) ya da ay (YYYY-AA); gelir (raporlanan), gider, kâr, iş başına kâr (kuruş).",
    calistir: async (b, v) => {
      const g = await gelirGider(b.db, b.kim, v.donem);
      return g ? { tamam: true, sonuc: { ...g } } : { tamam: false, neden: YETKISIZ };
    },
  }),
  /* 2026-10-31 (S.A.Y belge doldurma): ekranın "Belgeyi doldur"u — yerler ve kayıt modülün işlevleriyle (src/server/yz/doldurma.ts) */
  islem({
    ad: "fatura_belge_doldur", modul: MODUL, tur: "yaz", islev: faturaDoldur, kaynak: [kimlik, ElleDegerGirdisi], girdi: z.object({ fatura: kimlik, degerler: ElleDegerGirdisi }),
    tarif: "Fatura özeti belgesi: elle doldurulan yerlerine yazar — fatura, degerler (yerin kimliği ya da adı → değer; \"\" boşaltır). degerler boşsa yazmadan yerleri listeler (ad, tür, zorunlu, dolu mu).",
    calistir: async (b, v) => {
      const h = doldurmaHazirla(await faturaDoldurmaVerisi(b.db, b.kim, v.fatura), v.degerler);
      return "cevap" in h ? h.cevap : doldurmaCevabi(await faturaDoldur(b.db, b.kim, v.fatura, h.degerler, h.surum), "Fatura özeti");
    },
  }),
];

/** 2026-10-31 (K2 + M4): S.A.Y'ın açık kaydı bildiği ayrıntı sayfaları (src/server/yz/islem.ts acikKayit) */
export const SAY_SAYFALARI: readonly SayfaTanimi[] = [
  { desen: /^\/muhasebe\/f\/([0-9a-f-]{36})(?:\/|$)/, tur: "Fatura", islem: "fatura_getir", girdi: (id) => ({ fatura: id }) },
  { desen: /^\/muhasebe\/is\/([0-9a-f-]{36})(?:\/|$)/, tur: "Muhasebe işi", islem: "muhasebe_is_getir", girdi: (id) => ({ is: id }) },
];
