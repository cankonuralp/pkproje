/* UYARILAR — S.A.Y'IN ÇAĞIRABİLDİĞİ OKUMA (2026-10-16; pkproje §9 "S.A.Y CLAUDE GİBİ" 2. adım b; çekirdek src/server/yz/islem.ts). Modülün VAR OLAN
   işlevi (uyariListesi — kalibrasyon, eğitim tekrarı, araç belgesi; görünürlük modülün kuralıyla: kişi kendi uyarılarını, yönetici hepsini). Yalnız
   okuma; uyarının konusu ilgili modülde düzeltilir (ör. kalibrasyon_ekle, egitim_kaydet, arac_kaydet). */
import { z } from "../../sema/ortak.ts";
import { SuzgecDurumuSemasi } from "../../server/liste/liste.ts";
import { islem, sayfala, trIcerir, type Islem } from "../../server/yz/islem.ts";
import { uyariListesi } from "./server/uyarilar.ts";

const MODUL = 20;

export const SAY_ISLEMLERI: readonly Islem[] = [
  islem({
    ad: "uyari_ara", modul: MODUL, tur: "oku", islev: uyariListesi, kaynak: [SuzgecDurumuSemasi],
    girdi: z.object({ ara: SuzgecDurumuSemasi.shape.ara, sayfa: SuzgecDurumuSemasi.shape.sayfa, gecmis: z.boolean().optional() }),
    tarif: "Süresi geçen ve yaklaşan işleri arar (20'şer): kalibrasyon, eğitim tekrarı, araç belgesi; ara — konu, kişi; gecmis: true yalnız geçmişler; tarih, durum, sonuç.",
    calistir: async (b, v) => {
      const l = await uyariListesi(b.db, b.kim);
      if (!l) return { tamam: false, neden: "Bu kullanıcı Uyarılar'ı göremiyor." };
      const s = sayfala(l.filter((u) => (!v.gecmis || u.durum === "gecti") && trIcerir(`${u.konu} ${u.alt} ${u.kisi?.ad ?? ""}`, v.ara)), v.sayfa);
      return { tamam: true, sonuc: { ...s.bilgi, uyarilar: s.satirlar.map((u) => ({ tur: u.tur, konu: u.konu, alt: u.alt, kisi: u.kisi, tarih: u.tarih,
        durum: u.durum === "gecti" ? "geçti" : "yaklaşıyor", sonuc: u.sonuc })) } };
    },
  }),
];
