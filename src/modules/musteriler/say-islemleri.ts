/* MÜŞTERİLER — S.A.Y'IN ÇAĞIRABİLDİĞİ İŞLEMLER (2026-10-16; pkproje §9 "S.A.Y CLAUDE GİBİ" 2. adım a; çekirdek src/server/yz/islem.ts). Her işlem
   modülün VAR OLAN işlevini oturumdaki kişiyle çağırır: liste / kart (görme "gör" ve üstü), kaydet (yalnız "yaz"; aynı vergi / SGK no UYARIDIR —
   "Yine de kaydet" gibi onay: true; e-posta değişince müşteri girişi sıfırlanır — modülün kuralı). Girdi modülün şemasından (MusteriGirdisi,
   TesisGirdisi alanları); güncellemede verilmeyen alan kartın şimdiki değeriyle gider (pencere de kartın değeriyle açılır), yeni kayıtta boş. */
import { kimlik, surum, z } from "../../sema/ortak.ts";
import { SuzgecDurumuSemasi } from "../../server/liste/liste.ts";
import { GORUNMEZ, islem, sayfala, trIcerir, yazmaCevabi, type Islem, type SayfaTanimi } from "../../server/yz/islem.ts";
import { MusteriGirdisi, TesisGirdisi } from "./sema.ts";
import { musteriKarti, musteriKaydet, musteriListesi, musteriPasif, musteriSil, tesisKarti, tesisKaydet, tesisPasif, tesisSil } from "./server/musteriler.ts";

const MODUL = 3;
const MUSTERI_ALAN = ["unvan", "kisa", "vd", "vno", "eposta", "tel", "ilgili"] as const;
const TESIS_ALAN = ["ad", "adres", "il", "ilce", "sgk"] as const;
/** pencerenin gönderdiği gibi: her alan metin ("" boş) — verilmeyen alan mevcut değerle (güncellemede) ya da boş (yeni kayıtta) */
function alanlar(alan: readonly string[], mevcut: object | null, verilen: Record<string, unknown>): Record<string, unknown> {
  const m = mevcut as Record<string, unknown> | null;
  return Object.fromEntries(alan.map((k) => [k, Object.hasOwn(verilen, k) ? verilen[k] ?? "" : m?.[k] ?? ""]));
}

export const SAY_ISLEMLERI: readonly Islem[] = [
  islem({
    ad: "musteri_ara", modul: MODUL, tur: "oku", islev: musteriListesi, kaynak: [SuzgecDurumuSemasi],
    girdi: z.object({ ara: SuzgecDurumuSemasi.shape.ara, sayfa: SuzgecDurumuSemasi.shape.sayfa }),
    tarif: "Müşterileri ve tesislerini arar (20'şer): ara — ünvan, kısa ad, vergi no, e-posta, tesis adı, il / ilçe; pasifler işaretli.",
    calistir: async (b, v) => {
      const l = await musteriListesi(b.db, b.kim);
      if (!l) return { tamam: false, neden: "Bu kullanıcı Müşteriler'i göremiyor." };
      const s = sayfala(l.filter((m) => trIcerir([m.unvan, m.kisa, m.vno ?? "", m.eposta ?? "", ...m.tesisler.flatMap((t) => [t.ad, t.il ?? "", t.ilce ?? ""])].join(" "), v.ara)), v.sayfa);
      return { tamam: true, sonuc: { ...s.bilgi, musteriler: s.satirlar.map((m) => ({ id: m.id, unvan: m.unvan, kisa: m.kisa, vno: m.vno, eposta: m.eposta, pasif: m.pasif,
        tesisler: m.tesisler.map((t) => ({ id: t.id, ad: t.ad, il: t.il, ilce: t.ilce, sgk: t.sgk, pasif: t.pasif })) })) } };
    },
  }),
  islem({
    ad: "musteri_getir", modul: MODUL, tur: "oku", girdi: z.object({ musteri: kimlik }), kaynak: [kimlik], islev: musteriKarti,
    tarif: "Müşteri kartı: bilgileri, sürümü (surum) ve tesisleri.",
    calistir: async (b, v) => {
      const m = await musteriKarti(b.db, b.kim, v.musteri);
      return m ? { tamam: true, sonuc: { ...m } } : { tamam: false, neden: GORUNMEZ };
    },
  }),
  islem({
    ad: "tesis_getir", modul: MODUL, tur: "oku", girdi: z.object({ tesis: kimlik }), kaynak: [kimlik], islev: tesisKarti,
    tarif: "Tesis kartı: bilgileri, sürümü (surum) ve müşterisi.",
    calistir: async (b, v) => {
      const t = await tesisKarti(b.db, b.kim, v.tesis);
      return t ? { tamam: true, sonuc: { ...t } } : { tamam: false, neden: GORUNMEZ };
    },
  }),
  islem({
    ad: "musteri_kaydet", modul: MODUL, tur: "yaz", islev: musteriKaydet, kaynak: [MusteriGirdisi, kimlik, surum],
    girdi: z.object({ musteri: kimlik.nullable().default(null), surum: surum.default(0), alanlar: MusteriGirdisi.partial(), onay: z.boolean().default(false) }),
    tarif: "Müşteri ekler (musteri boş) ya da günceller (musteri + surum — musteri_getir): alanlar { unvan, kisa, vd, vno, eposta, tel, ilgili }; aynı vergi "
      + "no başka müşterideyse uyarı döner (engel değil; onay: true ile kaydedilir).",
    calistir: async (b, v, ham) => {
      const mevcut = v.musteri ? await musteriKarti(b.db, b.kim, v.musteri) : null;
      if (v.musteri && !mevcut) return { tamam: false, neden: GORUNMEZ };
      const g = alanlar(MUSTERI_ALAN, mevcut, (ham.alanlar ?? {}) as Record<string, unknown>);
      return yazmaCevabi(await musteriKaydet(b.db, b.kim, v.musteri, v.surum, g, v.onay));
    },
  }),
  islem({
    ad: "tesis_kaydet", modul: MODUL, tur: "yaz", islev: tesisKaydet, kaynak: [TesisGirdisi, kimlik, surum],
    girdi: z.object({ musteri: kimlik, tesis: kimlik.nullable().default(null), surum: surum.default(0), alanlar: z.object(TesisGirdisi.shape).partial(),
      onay: z.boolean().default(false) }),
    tarif: "Müşteriye tesis ekler (tesis boş) ya da tesisi günceller (tesis + surum — tesis_getir): alanlar { ad, adres, il, ilce (listeden), sgk (26 hane) }; "
      + "aynı SGK başka tesisteyse uyarı döner (engel değil; onay: true ile kaydedilir).",
    calistir: async (b, v, ham) => {
      const mevcut = v.tesis ? await tesisKarti(b.db, b.kim, v.tesis) : null;
      if (v.tesis && !mevcut) return { tamam: false, neden: GORUNMEZ };
      const g = alanlar(TESIS_ALAN, mevcut, (ham.alanlar ?? {}) as Record<string, unknown>);
      return yazmaCevabi(await tesisKaydet(b.db, b.kim, v.musteri, v.tesis, v.surum, g, v.onay));
    },
  }),
  /* 2026-10-16 (2. adım b): pasif / etkin ve kesin sil — müşteri ve tesis kartının tuşlarının işlevleri */
  islem({
    ad: "musteri_pasif", modul: MODUL, tur: "yaz", girdi: z.object({ musteri: kimlik, surum, pasif: z.boolean() }), kaynak: [kimlik, surum], islev: musteriPasif,
    tarif: "Müşteriyi pasife alır (pasif: true — etkin tesisleri de pasif olur) ya da etkinleştirir (pasif: false — onunla pasif olan tesisler döner).",
    calistir: async (b, v) => yazmaCevabi(await musteriPasif(b.db, b.kim, v.musteri, v.surum, v.pasif), { bildirim: v.pasif ? "Müşteri pasife alındı." : "Müşteri etkinleştirildi." }),
  }),
  islem({
    ad: "tesis_pasif", modul: MODUL, tur: "yaz", girdi: z.object({ tesis: kimlik, surum, pasif: z.boolean() }), kaynak: [kimlik, surum], islev: tesisPasif,
    tarif: "Tesisi pasife alır ya da etkinleştirir (müşterisi pasifse önce müşteri etkinleştirilir).",
    calistir: async (b, v) => yazmaCevabi(await tesisPasif(b.db, b.kim, v.tesis, v.surum, v.pasif), { bildirim: v.pasif ? "Tesis pasife alındı." : "Tesis etkinleştirildi." }),
  }),
  islem({
    ad: "musteri_sil", modul: MODUL, tur: "yaz", girdi: z.object({ musteri: kimlik }), kaynak: [kimlik], islev: musteriSil,
    tarif: "Hiç kullanılmamış müşteriyi (tesisleriyle) kesin siler (firma yöneticisi); kullanılmışsa nedeni döner (pasife alınır).",
    calistir: async (b, v) => { const r = await musteriSil(b.db, b.kim, v.musteri); return yazmaCevabi(r, { bildirim: r.durum === "tamam" ? `${r.ad} silindi.` : undefined }); },
  }),
  islem({
    ad: "tesis_sil", modul: MODUL, tur: "yaz", girdi: z.object({ tesis: kimlik }), kaynak: [kimlik], islev: tesisSil,
    tarif: "Hiç kullanılmamış tesisi kesin siler (firma yöneticisi); kullanılmışsa nedeni döner.",
    calistir: async (b, v) => { const r = await tesisSil(b.db, b.kim, v.tesis); return yazmaCevabi(r, { bildirim: r.durum === "tamam" ? `${r.ad} silindi.` : undefined }); },
  }),
];

/** 2026-10-31 (K2 + M4): S.A.Y'ın açık kaydı bildiği ayrıntı sayfaları (src/server/yz/islem.ts acikKayit) */
export const SAY_SAYFALARI: readonly SayfaTanimi[] = [
  { desen: /^\/musteriler\/tesis\/([0-9a-f-]{36})(?:\/|$)/, tur: "Tesis", islem: "tesis_getir", girdi: (id) => ({ tesis: id }) },
  { desen: /^\/musteriler\/([0-9a-f-]{36})(?:\/|$)/, tur: "Müşteri", islem: "musteri_getir", girdi: (id) => ({ musteri: id }) },
];
