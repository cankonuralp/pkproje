/* TEKLİFLER — S.A.Y'IN ÇAĞIRABİLDİĞİ İŞLEMLER (2026-10-16; pkproje §9 "S.A.Y CLAUDE GİBİ" 2. adım a; çekirdek src/server/yz/islem.ts). Her işlem
   modülün VAR OLAN işlevini oturumdaki kişiyle çağırır: liste / kart (görme "gör"), formun seçenekleri, kaydet (yalnız taslak düzenlenir — teklifKaydet,
   yaz düzeyi), gönder / kabul / red (durum kuralları modülde ve veritabanı tetiğinde, 0037). Girdi modülün şemasından (TeklifGirdisi, RedGirdisi);
   tutarlar formdaki gibi TL ("1.250,00"), saklanan kuruş. */
import { kimlik, surum, z } from "../../sema/ortak.ts";
import { SuzgecDurumuSemasi } from "../../server/liste/liste.ts";
import { GORUNMEZ, islem, kirp, sayfaBilgisi, sayfala, trIcerir, yazmaCevabi, type Islem, type SayfaTanimi } from "../../server/yz/islem.ts";
import { para, RedGirdisi, TEKLIF_DURUM, TeklifGirdisi } from "./sema.ts";
import {
  teklifGonder, teklifKabul, teklifKarti, teklifKaydet, teklifMusteriBagla, teklifMusteriKaydet, teklifReddet, teklifSayfasi, teklifSecenekleri, teklifSil,
} from "./server/teklifler.ts";

const MODUL = 11;
const TEKLIF_SURUM = z.object({ teklif: kimlik, surum });
const durumAdi = (d: keyof typeof TEKLIF_DURUM) => TEKLIF_DURUM[d][0];

export const SAY_ISLEMLERI: readonly Islem[] = [
  islem({
    ad: "teklif_ara", modul: MODUL, tur: "oku", girdi: SuzgecDurumuSemasi, kaynak: [SuzgecDurumuSemasi], islev: teklifSayfasi,
    tarif: "Teklifleri arar (20'şer): ara (teklif no, müşteri, tesis), secili (taslak | gonderildi | kabul | kapanan | yakin), sec.musteri (müşteri kimliği), sayfa.",
    calistir: async (b, _v, ham) => {
      const l = await teklifSayfasi(b.db, b.kim, ham);
      if (!l) return { tamam: false, neden: "Bu kullanıcı Teklifler'i göremiyor." };
      return { tamam: true, sonuc: { ...sayfaBilgisi(l), teklifler: l.gorunen.map((t) => ({ id: t.id, no: t.no, durum: durumAdi(t.durum), musteri: t.musteri,
        musteriId: t.musteriId, tesis: t.tesis, tutar_kdv_haric: para(t.tutar), tarih: t.tarih, gecerlilik_bitis: t.bitis })) } };
    },
  }),
  islem({
    ad: "teklif_getir", modul: MODUL, tur: "oku", girdi: z.object({ teklif: kimlik }), kaynak: [kimlik], islev: teklifKarti,
    tarif: "Teklifin bilgisi: durum, sürüm, müşteri / tesisler, kalemler (tür, adet, birim fiyat), KDV, geçerlilik, notlar, izinler.",
    calistir: async (b, v) => {
      const t = await teklifKarti(b.db, b.kim, v.teklif);
      if (!t) return { tamam: false, neden: GORUNMEZ };
      return { tamam: true, sonuc: {
        id: t.id, no: t.no, durum: durumAdi(t.durum), surum: t.surum, kayitli_musteri: t.musteriKart, aday: t.aday, tesisler: t.tesisler,
        kalemler: t.kalemler.map((k) => ({ tur: k.turId, tur_ad: k.turAd, adet: k.adet, birim_fiyat: para(k.fiyat), raporlanan: k.raporlanan })),
        tutar_kdv_haric: para(t.tutar), kdv: t.kdv, gecerlilik_gun: t.gecerlilik, gonderildi: t.gonderildi, gecerlilik_bitis: t.bitis, notlar: kirp(t.notlar),
        gerekce: t.gerekce, hazirlayan: t.hazirlayan, ekipman_sayisi: t.ekipmanlar.length, izin: t.izin,
      } };
    },
  }),
  islem({
    ad: "teklif_secenekleri", modul: MODUL, tur: "oku", islev: teklifSecenekleri, kaynak: [SuzgecDurumuSemasi],
    girdi: z.object({ ara: SuzgecDurumuSemasi.shape.ara, sayfa: SuzgecDurumuSemasi.shape.sayfa }),
    tarif: "Teklif formunun seçenekleri: etkin müşteriler ve tesisleri (tesisteki ekipman sayısı tür başına; ara, 20'şer), ekipman türleri ve fiyat listesi.",
    calistir: async (b, v) => {
      const s0 = await teklifSecenekleri(b.db, b.kim);
      if (!s0) return { tamam: false, neden: "Bu kullanıcının teklif hazırlama yetkisi yok." };
      const s = sayfala(s0.musteriler.filter((m) => trIcerir([m.kisa, m.unvan, ...m.tesisler.map((t) => t.ad)].join(" "), v.ara)), v.sayfa);
      return { tamam: true, sonuc: { ...s.bilgi, musteriler: s.satirlar,
        turler: s0.turler.map((t) => ({ id: t.id, ad: t.ad, kod: t.kod, brans: t.brans, fiyat: t.fiyat === null ? null : para(t.fiyat) })) } };
    },
  }),
  islem({
    ad: "teklif_kaydet", modul: MODUL, tur: "yaz", islev: teklifKaydet, kaynak: [TeklifGirdisi, kimlik, surum],
    girdi: z.object({ teklif: kimlik.nullable().default(null), surum: surum.default(0), alanlar: TeklifGirdisi, kopya_kaynak: kimlik.nullable().default(null) }),
    tarif: "Teklif taslağı hazırlar (teklif boş) ya da taslağı günceller (teklif + surum): alanlar — formun tamamı (tip kayitli: musteri, tesis | tip aday: aday; "
      + "gecerlilik gün \"30\", kdv \"20\", kalemler [{ tur, adet \"3\", fiyat \"1.250,00\" }], notlar).",
    calistir: async (b, v, ham) => yazmaCevabi(await teklifKaydet(b.db, b.kim, v.teklif, v.surum, ham.alanlar, v.kopya_kaynak)),
  }),
  islem({
    ad: "teklif_gonder", modul: MODUL, tur: "yaz", girdi: TEKLIF_SURUM, kaynak: [kimlik, surum], islev: teklifGonder,
    tarif: "Taslak teklifi gönderildi yapar (geçerlilik gönderilişten sayılır).",
    calistir: async (b, v) => yazmaCevabi(await teklifGonder(b.db, b.kim, v.teklif, v.surum)),
  }),
  islem({
    ad: "teklif_kabul", modul: MODUL, tur: "yaz", girdi: TEKLIF_SURUM, kaynak: [kimlik, surum], islev: teklifKabul,
    tarif: "Gönderilmiş teklifi müşteri kabul etti olarak işaretler.",
    calistir: async (b, v) => yazmaCevabi(await teklifKabul(b.db, b.kim, v.teklif, v.surum)),
  }),
  islem({
    ad: "teklif_reddet", modul: MODUL, tur: "yaz", girdi: RedGirdisi.extend({ teklif: kimlik, surum }), kaynak: [RedGirdisi, kimlik, surum], islev: teklifReddet,
    tarif: "Gönderilmiş teklifi müşteri reddetti olarak işaretler (müşterinin gerekçesi zorunlu).",
    calistir: async (b, v, ham) => yazmaCevabi(await teklifReddet(b.db, b.kim, v.teklif, v.surum, { gerekce: ham.gerekce })),
  }),
  /* 2026-10-16 (2. adım b): kabul edilen teklifin müşterisi ve taslak teklifin silinmesi — teklif kartının tuşlarının işlevleri */
  islem({
    ad: "teklif_musteri_kaydet", modul: MODUL, tur: "yaz", girdi: z.object({ teklif: kimlik, surum, onay: z.boolean().default(false) }), kaynak: [kimlik, surum],
    islev: teklifMusteriKaydet,
    tarif: "Kayıtlı olmayan müşterinin KABUL edilmiş teklifinden müşteriyi ve \"Merkez\" tesisini açar, teklifi bağlar; Müşteriler'in uyarısı (ör. aynı vergi no) "
      + "dönerse onay: true ile kaydedilir; e-posta başka müşterideyse teklif_musteri_bagla.",
    calistir: async (b, v) => yazmaCevabi(await teklifMusteriKaydet(b.db, b.kim, v.teklif, v.surum, v.onay)),
  }),
  islem({
    ad: "teklif_musteri_bagla", modul: MODUL, tur: "yaz", girdi: z.object({ teklif: kimlik, surum, musteri: kimlik, tesis: kimlik }), kaynak: [kimlik, surum],
    islev: teklifMusteriBagla,
    tarif: "Kayıtlı olmayan müşterinin kabul edilmiş teklifini VAR OLAN müşteriye ve onun etkin tesisine bağlar (bir kez).",
    calistir: async (b, v) => yazmaCevabi(await teklifMusteriBagla(b.db, b.kim, v.teklif, v.surum, { musteri: v.musteri, tesis: v.tesis }), { bildirim: "Teklif müşteriye bağlandı." }),
  }),
  islem({
    ad: "teklif_sil", modul: MODUL, tur: "yaz", girdi: z.object({ teklif: kimlik }), kaynak: [kimlik], islev: teklifSil,
    tarif: "Hiç gönderilmemiş taslak teklifi kesin siler (yönetici); gönderilmişse nedeni döner (kopyalanır).",
    calistir: async (b, v) => yazmaCevabi(await teklifSil(b.db, b.kim, v.teklif), { bildirim: "Teklif silindi." }),
  }),
];

/** 2026-10-31 (K2 + M4): S.A.Y'ın açık kaydı bildiği ayrıntı sayfaları (src/server/yz/islem.ts acikKayit) */
export const SAY_SAYFALARI: readonly SayfaTanimi[] = [
  { desen: /^\/teklifler\/([0-9a-f-]{36})(?:\/|$)/, tur: "Teklif", islem: "teklif_getir", girdi: (id) => ({ teklif: id }) },
];
