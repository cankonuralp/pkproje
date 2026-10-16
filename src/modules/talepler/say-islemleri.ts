/* TALEPLER — S.A.Y'IN ÇAĞIRABİLDİĞİ İŞLEMLER (2026-10-16; pkproje §9 "S.A.Y CLAUDE GİBİ" 2. adım b; çekirdek src/server/yz/islem.ts). Her işlem
   modülün VAR OLAN işlevini oturumdaki kişiyle çağırır — Talepler ve Onaylar › Talepler ekranlarıyla aynı yetki ve kural (talep yalnız KENDİ adına;
   izin: iş günü sayılır, hafta sonu ve resmî tatil sayılmaz, bir yıldan uzun olamaz; masraf: ileri tarih yok, iş verilirse kişinin ekibinde olduğu
   plan; bekleyen talep geri çekilir, "düzeltme"deki talep düzeltilip yeniden gönderilir; karar: izinde firma yöneticisi, masrafta Muhasebe'yi
   değiştiren — onaylayan talebi değiştirmez, geri gönderme ve red gerekçe ister). Girdi modülün şemasından (IzinGirdisi, GerekceGirdisi; masraf için
   Muhasebe'nin GiderGirdisi). Belge / fiş ekrandan eklenir (isteğe bağlı). */
import { kimlik, surum, z } from "../../sema/ortak.ts";
import { SuzgecDurumuSemasi } from "../../server/liste/liste.ts";
import { islem, sayfala, trIcerir, yazmaCevabi, type Islem } from "../../server/yz/islem.ts";
import { GiderGirdisi } from "../muhasebe/sema.ts";
import { GerekceGirdisi, IzinGirdisi, TALEP_KARARLARI } from "./sema.ts";
import {
  izinDuzelt, izinGeriCek, izinGonder, izinTalepleri, masrafFormuDuzelt, masrafFormuGeriCek, masrafFormuGonder, onayTalepleri, talepKarar, taleplerim,
} from "./server/talepler.ts";

const MODUL = 21;
const MASRAF = z.object(GiderGirdisi.shape).omit({ personel: true, odeme: true });

export const SAY_ISLEMLERI: readonly Islem[] = [
  islem({
    ad: "taleplerim", modul: MODUL, tur: "oku", girdi: z.object({ sayfa: SuzgecDurumuSemasi.shape.sayfa }), kaynak: [SuzgecDurumuSemasi], islev: taleplerim,
    tarif: "Kullanıcının kendi izin talepleri ve masraf formları (durum, gerekçe), izin hakkı özeti, masrafa bağlanabilecek işleri (planlar).",
    calistir: async (b, v) => {
      const t = await taleplerim(b.db, b.kim);
      if (!t) return { tamam: false, neden: "Bu kullanıcının talebi yok (Talepler'e girmiyor ya da personel kaydı yok)." };
      const s = sayfala(t.izinler, v.sayfa);
      return { tamam: true, sonuc: { ...t, ...s.bilgi, izinler: s.satirlar, masraflar: t.masraflar.slice(0, 50) } };
    },
  }),
  islem({
    ad: "izin_gonder", modul: MODUL, tur: "yaz", girdi: z.object(IzinGirdisi.shape), kaynak: [IzinGirdisi], islev: izinGonder,
    tarif: "Kendi adına izin talebi gönderir: tur (yillik | mazeret | rapor | ucretsiz), bas, bit (YYYY-AA-GG), aciklama. Firma yöneticisinin onayına gider.",
    calistir: async (b, _v, ham) => yazmaCevabi(await izinGonder(b.db, b.depo(), b.kim, b.firmaId, ham), { bildirim: "İzin talebi gönderildi." }),
  }),
  islem({
    ad: "izin_duzelt", modul: MODUL, tur: "yaz", girdi: z.object({ talep: kimlik, surum, izin: z.object(IzinGirdisi.shape) }), kaynak: [IzinGirdisi, kimlik, surum],
    islev: izinDuzelt,
    tarif: "Düzeltmeye geri gönderilen kendi izin talebini düzeltip yeniden gönderir: talep, surum, izin { tur, bas, bit, aciklama }.",
    calistir: async (b, v, ham) => yazmaCevabi(await izinDuzelt(b.db, b.depo(), b.kim, b.firmaId, v.talep, v.surum, ham.izin), { bildirim: "İzin talebi düzeltilip gönderildi." }),
  }),
  islem({
    ad: "izin_geri_cek", modul: MODUL, tur: "yaz", girdi: z.object({ talep: kimlik }), kaynak: [kimlik], islev: izinGeriCek,
    tarif: "Kararı verilmemiş kendi izin talebini geri çeker.",
    calistir: async (b, v) => yazmaCevabi(await izinGeriCek(b.db, b.kim, v.talep), { bildirim: "İzin talebi geri çekildi." }),
  }),
  islem({
    ad: "masraf_gonder", modul: MODUL, tur: "yaz", girdi: MASRAF, kaynak: [GiderGirdisi], islev: masrafFormuGonder,
    tarif: "Kendi adına masraf formu gönderir: tarih, tur (yakit | konaklama | yol | kalibrasyon | sarf | diger), tutar (KDV dahil TL), oran (20 | 10 | 1 | 0), "
      + "aciklama, is (kendi planı ya da boş — genel). Muhasebe'nin onayına gider; fiş ekrandan eklenir.",
    calistir: async (b, _v, ham) => yazmaCevabi(await masrafFormuGonder(b.db, b.depo(), b.kim, b.firmaId, ham)),
  }),
  islem({
    ad: "masraf_duzelt", modul: MODUL, tur: "yaz", girdi: z.object({ talep: kimlik, surum, masraf: MASRAF }), kaynak: [GiderGirdisi, kimlik, surum], islev: masrafFormuDuzelt,
    tarif: "Düzeltmeye geri gönderilen kendi masraf formunu düzeltip yeniden gönderir: talep, surum, masraf { tarih, tur, tutar, oran, aciklama, is }.",
    calistir: async (b, v, ham) => yazmaCevabi(await masrafFormuDuzelt(b.db, b.depo(), b.kim, b.firmaId, v.talep, v.surum, ham.masraf)),
  }),
  islem({
    ad: "masraf_geri_cek", modul: MODUL, tur: "yaz", girdi: z.object({ talep: kimlik }), kaynak: [kimlik], islev: masrafFormuGeriCek,
    tarif: "Kararı verilmemiş kendi masraf formunu geri çeker.",
    calistir: async (b, v) => yazmaCevabi(await masrafFormuGeriCek(b.db, b.kim, v.talep), { bildirim: "Masraf formu geri çekildi." }),
  }),
  islem({
    ad: "izin_talepleri", modul: MODUL, tur: "oku", islev: izinTalepleri, kaynak: [SuzgecDurumuSemasi],
    girdi: z.object({ ara: SuzgecDurumuSemasi.shape.ara, sayfa: SuzgecDurumuSemasi.shape.sayfa }),
    tarif: "Firmanın izin talepleri ve geçmişi (firma yöneticisi; Personel › İzin talepleri): ara — kişi, tür, durum; kişi başı izin özeti.",
    calistir: async (b, v) => {
      const l = await izinTalepleri(b.db, b.kim);
      if (!l) return { tamam: false, neden: "Bu kullanıcı izin taleplerini göremiyor." };
      const s = sayfala(l.filter((x) => trIcerir(JSON.stringify(x), v.ara)), v.sayfa);
      return { tamam: true, sonuc: { ...s.bilgi, talepler: s.satirlar } };
    },
  }),
  islem({
    ad: "onay_talepleri", modul: MODUL, tur: "oku", girdi: z.object({ sayfa: SuzgecDurumuSemasi.shape.sayfa }), kaynak: [SuzgecDurumuSemasi], islev: onayTalepleri,
    tarif: "Kullanıcının karar verebildiği bekleyen talepler (Onaylar › Talepler): izin talepleri (firma yöneticisi) ve masraf formları (Muhasebe) — tip, kimlik, sürüm.",
    calistir: async (b, v) => {
      const s = sayfala(await onayTalepleri(b.db, b.kim), v.sayfa);
      return { tamam: true, sonuc: { ...s.bilgi, talepler: s.satirlar } };
    },
  }),
  islem({
    ad: "talep_karar", modul: MODUL, tur: "yaz", islev: talepKarar, kaynak: [GerekceGirdisi, kimlik, surum],
    girdi: z.object({ tip: z.enum(["izin", "masraf"]), talep: kimlik, surum, karar: z.enum(TALEP_KARARLARI), gerekce: GerekceGirdisi.shape.gerekce.optional() }),
    tarif: "Bekleyen talebe karar verir: tip (izin | masraf), talep, surum (onay_talepleri), karar (onayla | geri — düzeltmeye geri gönder | red), gerekce (geri / red "
      + "için en az 10 karakter; talep edene görünür).",
    calistir: async (b, v, ham) => yazmaCevabi(await talepKarar(b.db, b.kim, v.tip, v.talep, v.surum, v.karar, { gerekce: ham.gerekce }),
      { bildirim: v.karar === "onayla" ? "Talep onaylandı." : v.karar === "geri" ? "Talep düzeltmeye geri gönderildi." : "Talep reddedildi." }),
  }),
];
