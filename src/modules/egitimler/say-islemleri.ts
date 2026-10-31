/* EĞİTİMLER — S.A.Y'IN ÇAĞIRABİLDİĞİ İŞLEMLER (2026-10-16; pkproje §9 "S.A.Y CLAUDE GİBİ" 2. adım b; çekirdek src/server/yz/islem.ts; ekranı
   Dökümanlar'ın sekmesi — dizinde Dökümanlar altında). Her işlem modülün VAR OLAN işlevini oturumdaki kişiyle çağırır — aynı yetki ve kural (liste:
   görebilen, denetçi yalnız kendi kayıtlarını; tür / kayıt: "yaz" düzeyi; eğitim tarihi ileri olamaz, aynı kişi × eğitimde yeni kayıt öncekini
   "önceki" yapar, tekrar tarihi türün süresinden; sil: kullanılmamış tür / sertifikasız, imzaya gitmemiş kayıt, yönetici). Girdi modülün şemasından
   (EgitimTuruGirdisi, EgitimKaydiGirdisi). Sertifika PDF'i isteğe bağlı (ekrandan); katılım formu imzaya ekrandan gönderilir (PDF üretilir). */
import { kimlik, surum, z } from "../../sema/ortak.ts";
import { SuzgecDurumuSemasi } from "../../server/liste/liste.ts";
import { EK_NO, ekBelgesi, islem, sayfala, trIcerir, yazmaCevabi, type Islem } from "../../server/yz/islem.ts";
import { EgitimKaydiGirdisi, EgitimTuruGirdisi } from "./sema.ts";
import { egitimKaydet, egitimKaydiSil, egitimListesi, egitimTuruKaydet, egitimTuruSil, sertifikaYukle } from "./server/egitimler.ts";

const MODUL = 4;

export const SAY_ISLEMLERI: readonly Islem[] = [
  islem({
    ad: "egitim_ara", modul: MODUL, tur: "oku", islev: egitimListesi, kaynak: [SuzgecDurumuSemasi],
    girdi: z.object({ ara: SuzgecDurumuSemasi.shape.ara, sayfa: SuzgecDurumuSemasi.shape.sayfa }),
    tarif: "Eğitim kayıtlarını arar (20'şer): ara — kişi, eğitim; tarih, tekrar tarihi, durumu (geçerli / yaklaşıyor / geçmiş); eğitim türleri ve kişiler de döner.",
    calistir: async (b, v) => {
      const l = await egitimListesi(b.db, b.kim);
      if (!l) return { tamam: false, neden: "Bu kullanıcı Eğitimler'i göremiyor." };
      const s = sayfala(l.kayitlar.filter((x) => trIcerir(JSON.stringify(x), v.ara)), v.sayfa);
      return { tamam: true, sonuc: { ...s.bilgi, esik_gun: l.esik, kayitlar: s.satirlar, turler: l.turler, kisiler: l.kisiler } };
    },
  }),
  islem({
    ad: "egitim_turu_kaydet", modul: MODUL, tur: "yaz", islev: egitimTuruKaydet, kaynak: [EgitimTuruGirdisi, kimlik, surum],
    girdi: z.object({ tur: kimlik.nullable().default(null), surum: surum.default(0), ad: EgitimTuruGirdisi.shape.ad,
      tekrar: z.union([z.number().int(), EgitimTuruGirdisi.shape.tekrar]) }),
    tarif: "Eğitim türü ekler (tur boş) ya da değiştirir (tur + surum — egitim_ara'daki türler): ad, tekrar (1–120 ay).",
    calistir: async (b, v, ham) => yazmaCevabi(await egitimTuruKaydet(b.db, b.kim, v.tur, v.surum, { ad: ham.ad, tekrar: String(ham.tekrar) }),
      { bildirim: v.tur ? "Eğitim türü güncellendi." : "Eğitim türü eklendi." }),
  }),
  islem({
    ad: "egitim_kaydet", modul: MODUL, tur: "yaz", girdi: z.object(EgitimKaydiGirdisi.shape), kaynak: [EgitimKaydiGirdisi], islev: egitimKaydet,
    tarif: "Eğitim kaydı ekler ya da tekrarını kaydeder: personel, tur (eğitim türü), tarih (YYYY-AA-GG; ileri olamaz), kurum (Firma içi | Dış eğitim kurumu).",
    calistir: async (b, _v, ham) => yazmaCevabi(await egitimKaydet(b.db, b.depo(), b.kim, b.firmaId, ham), { bildirim: "Eğitim kaydı yazıldı." }),
  }),
  islem({
    ad: "egitim_turu_sil", modul: MODUL, tur: "yaz", girdi: z.object({ tur: kimlik }), kaynak: [kimlik], islev: egitimTuruSil,
    tarif: "Hiç kaydı olmayan eğitim türünü siler (yönetici).",
    calistir: async (b, v) => yazmaCevabi(await egitimTuruSil(b.db, b.kim, v.tur), { bildirim: "Eğitim türü silindi." }),
  }),
  islem({
    ad: "egitim_kaydi_sil", modul: MODUL, tur: "yaz", girdi: z.object({ kayit: kimlik }), kaynak: [kimlik], islev: egitimKaydiSil,
    tarif: "Sertifikasız, katılım formu imzaya gitmemiş eğitim kaydını siler (yönetici; güncel kayıt silinince öncekisi güncel olur).",
    calistir: async (b, v) => yazmaCevabi(await egitimKaydiSil(b.db, b.kim, v.kayit), { bildirim: "Eğitim kaydı silindi." }),
  }),
  /* 2026-10-31 (kalem 9 — M1 + M2; beceri B11): konuşmadaki ekin (M / F numarası) depodaki kopyası kaydın belge yuvasına — ekranın yükleme işleviyle */
  islem({
    ad: "egitim_sertifika_ekle", modul: MODUL, tur: "yaz", islev: sertifikaYukle, kaynak: [kimlik, surum],
    girdi: z.object({ kayit: kimlik, surum, ek: EK_NO }),
    tarif: "Konuşmadaki sertifika PDF'ini (ek: M03) eğitim kaydına ekler: kayit (egitim_ara), surum.",
    calistir: async (b, v) => {
      const belge = await ekBelgesi(b, v.ek, ["pdf"]);
      if (typeof belge === "string") return { tamam: false, neden: belge };
      return yazmaCevabi(await sertifikaYukle(b.db, b.depo(), b.kim, b.firmaId, v.kayit, v.surum, belge), { bildirim: `${belge.ad} eğitim kaydına eklendi.` });
    },
  }),
];
