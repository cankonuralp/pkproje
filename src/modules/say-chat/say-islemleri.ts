/* S.A.Y CHAT — S.A.Y'IN ÇAĞIRABİLDİĞİ İŞLEMLER (2026-10-31, kapsam eksiği; reisim: "önerdiklerini kabul ediyorum"). Ekipman türünün S.A.Y Chat ayarı
   (/ekipman-turleri/<tür>/say-chat ekranı): satırlar (mesajın satır adları → formatın alanı, hazır değer) ve okunacak başlıklar — ekranın işlevleriyle,
   aynı yetki (görmek tür görebilen, kaydetmek türü değiştirebilen); tanım sunucuda formata göre denetlenir (sema.ts tanimDenetle). */
import { kimlik, surum, z } from "../../sema/ortak.ts";
import { GORUNMEZ, islem, yazmaCevabi, type Islem } from "../../server/yz/islem.ts";
import { sayChatAyari, sayChatAyarKaydet } from "./server/ayar.ts";
import { sayChatPaneli } from "./server/kayitlar.ts";
import { chatRaporYaz } from "./server/rapor-yaz.ts";
import { SayEkipmanGirdisi } from "../planlar/sema.ts";

/** Ekipman türleri (sayfa orada) */
const MODUL = 5;

/** plan içi (S.A.Y Chat paneli orada) */
const PLANLAR = 13;

export const SAY_ISLEMLERI: readonly Islem[] = [
  /* 2026-10-31 (K4 — reisim'in kabulü: "S.A.Y Chat kayıtları malzeme"): kişinin plandaki S.A.Y Chat kayıtları (ekranın paneliyle aynı işlev ve yetki) —
     sahada yazılan satırlar ve fotoğraf sayısı; kayıtlardan rapor ekranın "Bekleyenler için rapor yaz"ıyla */
  islem({
    ad: "say_chat_kayitlari", modul: PLANLAR, tur: "oku", girdi: z.object({ plan: kimlik }), kaynak: [kimlik], islev: sayChatPaneli,
    tarif: "Kişinin bu plandaki S.A.Y Chat kayıtları (sahada yazılan satırlar — malzeme): kayit (kimlik), ekipman (plandaki kod ya da yeni tür), mesaj satırları, "
      + "fotoğraf sayısı; raporun yazılabilirliği (engel / günlük süre). Kayıtlardan rapor: say_chat_rapor_yaz.",
    calistir: async (b, v) => {
      const p = await sayChatPaneli(b.db, b.kim, v.plan);
      if (!p) return { tamam: false, neden: "S.A.Y Chat bu planda kapalı ya da plan görünmüyor." };
      return { tamam: true, sonuc: { plan: p.plan.no, rapor: p.rapor, kayitlar: p.kayitlar.map((k) => ({ kayit: k.id, zaman: k.zaman,
        ekipman: k.ekipman?.tip === "plan" ? { kod: k.ekipman.kod } : k.ekipman?.tip === "yeni" ? { yeni_tur: p.turler[k.ekipman.turId]?.ad ?? k.ekipman.turId } : null,
        mesaj: k.mesaj, foto: k.fotolar.length })) } };
    },
  }),
  islem({
    ad: "say_chat_rapor_yaz", modul: PLANLAR, tur: "yaz", islev: chatRaporYaz, kaynak: [kimlik, SayEkipmanGirdisi],
    girdi: z.object({ plan: kimlik, kayitlar: z.array(z.object({ kayit: kimlik, kod: SayEkipmanGirdisi.shape.kod })).min(1).max(100) }),
    tarif: "S.A.Y Chat kayıtlarından rapor yazar (ekrandaki \"Bekleyenler için rapor yaz\"): plan, kayitlar [{ kayit, kod (yeni ekipman için; verilmezse firmanın "
      + "düzeniyle) }]; kayıt başına açılan rapor (kimlik, no) ya da nedeni. Okuma fotoğrafları raporda bekler.",
    calistir: async (b, v) => {
      const l = [];
      for (const k of v.kayitlar) l.push(await chatRaporYaz(b.db, b.depo(), b.kim, b.firmaId, v.plan, { kayit: k.kayit, kod: k.kod ?? null }));
      const acilan = l.filter((x) => x.durum === "tamam").length;
      return acilan ? { tamam: true, bildirim: `${acilan} / ${l.length} kayıttan rapor yazıldı.`, sonuc: { sonuclar: l.map((x) => (x.durum === "tamam" ? { kayit: x.kayit, rapor: x.rapor } : x)) } }
        : { tamam: false, neden: `Rapor yazılamadı: ${l.map((x) => (x.durum === "hata" ? x.neden : "")).join(" · ")}` };
    },
  }),
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
