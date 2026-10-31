/* S.A.Y CHAT — S.A.Y'IN ÇAĞIRABİLDİĞİ İŞLEMLER (2026-10-31, kapsam eksiği; reisim: "önerdiklerini kabul ediyorum"). Ekipman türünün S.A.Y Chat ayarı
   (/ekipman-turleri/<tür>/say-chat ekranı): satırlar (mesajın satır adları → formatın alanı, hazır değer) ve okunacak başlıklar — ekranın işlevleriyle,
   aynı yetki (görmek tür görebilen, kaydetmek türü değiştirebilen); tanım sunucuda formata göre denetlenir (sema.ts tanimDenetle). */
import { kimlik, surum, z } from "../../sema/ortak.ts";
import { GORUNMEZ, islem, yazmaCevabi, type Islem } from "../../server/yz/islem.ts";
import { sayChatAyari, sayChatAyarKaydet } from "./server/ayar.ts";

/** Ekipman türleri (sayfa orada) */
const MODUL = 5;

export const SAY_ISLEMLERI: readonly Islem[] = [
  islem({
    ad: "say_chat_ayari", modul: MODUL, tur: "oku", girdi: z.object({ tur: kimlik }), kaynak: [kimlik], islev: sayChatAyari,
    tarif: "Ekipman türünün S.A.Y Chat ayarı: satırlar (ad, alan — formatın alanı, hazır değer), okunacak başlıklar (k, açık), seçilebilen alanlar ve başlıklar, kayıtlı sürüm.",
    calistir: async (b, v) => {
      const a = await sayChatAyari(b.db, b.kim, v.tur);
      return a ? { tamam: true, sonuc: { tanim: a.tanim, surum: a.kayitli?.surum ?? null, formatVar: a.formatVar, alanlar: a.alanlar, basliklar: a.basliklar, yaz: a.yaz } }
        : { tamam: false, neden: GORUNMEZ };
    },
  }),
  islem({
    ad: "say_chat_ayar_kaydet", modul: MODUL, tur: "yaz", kaynak: [kimlik, surum], islev: sayChatAyarKaydet,
    girdi: z.object({ tur: kimlik, surum: surum.nullable(), tanim: z.object({ satirlar: z.array(z.object({ ad: z.string(), alan: z.string(), hazir: z.string() })),
      okunacak: z.array(z.object({ k: z.string(), acik: z.boolean() })) }) }),
    tarif: "S.A.Y Chat ayarını kaydeder (tanımın tamamı): tur, surum (say_chat_ayari; kayıt yoksa null), tanim { satirlar [{ ad, alan, hazir }], okunacak [{ k, acik }] }.",
    calistir: async (b, v) => {
      const r = await sayChatAyarKaydet(b.db, b.kim, v.tur, v.surum, v.tanim);
      if (r.durum === "hata") return { tamam: false, neden: `${r.hata.i >= 0 ? `${r.hata.i + 1}. satır (${r.hata.ne})` : r.hata.ne}: ${r.hata.neden}` };
      if (r.durum === "degisiklik_yok") return { tamam: true, degisiklik: false, bildirim: "Ayar zaten böyle." };
      return yazmaCevabi(r, { bildirim: "S.A.Y Chat ayarı kaydedildi." });
    },
  }),
];
