/* PERFORMANS — S.A.Y'IN ÇAĞIRABİLDİĞİ OKUMA (2026-10-16; pkproje §9 "S.A.Y CLAUDE GİBİ" 2. adım b; çekirdek src/server/yz/islem.ts). Modülün VAR OLAN
   işlevleri (performansPanosu, performansKisi — görünürlük modülün kuralıyla: kendi / branş / hepsi; kazanç yalnız görebilene). Yalnız okuma. Dönem
   ekrandaki süzgeçle aynı (donem: ay | onceki | yil | aralik …, aralıkta bas / bit). */
import { kimlik, tarih, z } from "../../sema/ortak.ts";
import { GORUNMEZ, islem, type Islem, type SayfaTanimi } from "../../server/yz/islem.ts";
import { performansKisi, performansPanosu, type DonemSecimi } from "./server/performans.ts";

const MODUL = 19;
const DONEM = { donem: z.string().max(20).optional(), bas: tarih.optional(), bit: tarih.optional(), brans: z.enum(["tumu", "m", "e"]).optional() };
const secim = (v: { donem?: string; bas?: string; bit?: string; brans?: string }): DonemSecimi => ({ donem: v.donem, bas: v.bas, bit: v.bit, brans: v.brans });

export const SAY_ISLEMLERI: readonly Islem[] = [
  islem({
    ad: "performans_panosu", modul: MODUL, tur: "oku", girdi: z.object(DONEM), kaynak: [tarih], islev: performansPanosu,
    tarif: "Performans panosu: dönem (donem: ay, onceki, yil, aralik — aralıkta bas / bit), brans (tumu / m / e); özet (rapor sayıları, tamamlanma süresi), "
      + "zaman dilimleri, kişi başı özet (kazanç yalnız görebilene).",
    calistir: async (b, v) => {
      const p = await performansPanosu(b.db, b.kim, secim(v));
      if (!p) return { tamam: false, neden: "Bu kullanıcı Performans'ı göremiyor." };
      return { tamam: true, sonuc: "kendi" in p ? { kendi_personel: p.kendi, not: "Yalnız kendi performansı görülür — performans_kisi ile." } : { ...p } };
    },
  }),
  islem({
    ad: "performans_kisi", modul: MODUL, tur: "oku", girdi: z.object({ personel: kimlik, ...DONEM }), kaynak: [kimlik, tarih], islev: performansKisi,
    tarif: "Bir kişinin performansı (dönemle): özet, süreç adımları, günlük işler.",
    calistir: async (b, v) => {
      const p = await performansKisi(b.db, b.kim, v.personel, secim(v));
      return p ? { tamam: true, sonuc: { ...p } } : { tamam: false, neden: GORUNMEZ };
    },
  }),
];

/** 2026-10-31 (K2 + M4): S.A.Y'ın açık kaydı bildiği ayrıntı sayfaları (src/server/yz/islem.ts acikKayit) */
export const SAY_SAYFALARI: readonly SayfaTanimi[] = [
  { desen: /^\/performans\/([0-9a-f-]{36})(?:\/|$)/, tur: "Kişi performansı", islem: "performans_kisi", girdi: (id) => ({ personel: id }) },
];
