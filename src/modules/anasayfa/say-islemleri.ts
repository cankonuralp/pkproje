/* ANA SAYFA — S.A.Y'IN ÇAĞIRABİLDİĞİ OKUMA (2026-10-16; pkproje §9 "S.A.Y CLAUDE GİBİ" 2. adım b; çekirdek src/server/yz/islem.ts). Kişinin ana
   sayfasının VAR OLAN işlevi (anaSayfa — rolüne göre bugünün işleri, bekleyenler, duyurular; modüllerin yetkiye duyarlı okuyucularıyla) ve yan
   menünün balon sayıları (menuTakip). Yalnız okuma; dizinde "Ana sayfa" (modül numarası yok — 0). */
import { z } from "../../sema/ortak.ts";
import { SuzgecDurumuSemasi } from "../../server/liste/liste.ts";
import { islem, type Islem } from "../../server/yz/islem.ts";
import { MODULLER } from "../moduller.ts";
import { anaSayfa } from "./server/anasayfa.ts";
import { menuTakip } from "./server/takip.ts";

/** dizinde "Ana sayfa" (islem-katalogu.ts modulAdi) */
export const ANA_SAYFA_MODULU = 0;

export const SAY_ISLEMLERI: readonly Islem[] = [
  islem({
    ad: "ana_sayfa", modul: ANA_SAYFA_MODULU, tur: "oku", girdi: z.object({ sayfa: SuzgecDurumuSemasi.shape.sayfa }), kaynak: [SuzgecDurumuSemasi], islev: anaSayfa,
    tarif: "Kullanıcının ana sayfası: rolüne göre bugünün işleri ve bekleyenleri (bölüm bölüm), imza bekleyen belgeler, Bakanlık duyuruları.",
    calistir: async (b) => ({ tamam: true, sonuc: { ...(await anaSayfa(b.db, b.kim)) } }),
  }),
  islem({
    ad: "bekleyen_isler", modul: ANA_SAYFA_MODULU, tur: "oku", girdi: z.object({ sayfa: SuzgecDurumuSemasi.shape.sayfa }), kaynak: [SuzgecDurumuSemasi], islev: menuTakip,
    tarif: "Yan menünün balonları: modül başına kırmızı (gecikmiş / acil) ve sarı (yaklaşan) iş sayıları ve ne oldukları.",
    calistir: async (b) => {
      const t = await menuTakip(b.db, b.kim);
      return { tamam: true, sonuc: { moduller: MODULLER.filter((m) => t[m.no]).map((m) => ({ modul: m.ad, kirmizi: t[m.no].kirmizi, kirmizi_ne: t[m.no].ad.kirmizi,
        sari: t[m.no].sari, sari_ne: t[m.no].ad.sari })) } };
    },
  }),
];
