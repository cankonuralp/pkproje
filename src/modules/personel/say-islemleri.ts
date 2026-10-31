/* PERSONEL — S.A.Y'IN ÇAĞIRABİLDİĞİ İŞLEMLER (2026-10-16; pkproje §9 "S.A.Y CLAUDE GİBİ" 2. adım b; çekirdek src/server/yz/islem.ts). Her işlem
   modülün VAR OLAN işlevini oturumdaki kişiyle çağırır — Personel ekranının tuşlarıyla aynı işlev, aynı yetki ve kural (liste / kart: Personel'i
   gören, denetçi yalnız kendi kaydını; ekle / güncelle / ayrıldı / geri al: "yaz" düzeyi — firma yöneticisi; sil: yalnız hiç kullanılmamış kayıt,
   kişi kendini silemez). Girdi modülün şemasından (PersonelGirdisi alanları, ortak tarih / kimlik / surum); güncellemede verilmeyen alan kartın
   şimdiki değeriyle gider (form da kartın değeriyle açılır). Belge yükleme (özlük, bordro, zimmet formu) dosya ister — S.A.Y'da yok (pkproje §9). */
import { kimlik, surum, tarih, z } from "../../sema/ortak.ts";
import { SuzgecDurumuSemasi } from "../../server/liste/liste.ts";
import { EK_NO, ekBelgesi, GORUNMEZ, islem, sayfala, trIcerir, yazmaCevabi, type Islem, type SayfaTanimi } from "../../server/yz/islem.ts";
import { PersonelGirdisi } from "./sema.ts";
import { atamaEkle, bordroOnayaGonder, bordroYukle, ozlukEkle, zimmetFormuYukle } from "./server/dosyalar.ts";
import { personelAyrildi, personelEkle, personelGeriAl, personelGuncelle, personelKarti, personelListesi, personelSil } from "./server/personel.ts";

import { doldurmaCevabi, doldurmaHazirla } from "../../server/yz/doldurma.ts";
import { ElleDegerGirdisi } from "../rapor-format/sema.ts";
import { zimmetDoldur, zimmetDoldurmaVerisi } from "./server/dosyalar.ts";

import { atamaBelgeDegistir, atamaKaldir, bordroKaldir, ozlukBelgeDegistir, ozlukKaldir, zimmetFormuKaldir } from "./server/dosyalar.ts";

const MODUL = 2;
const ALAN = ["ad", "eposta", "imzaTel", "basla", "meslek", "meslekMetin", "diploma", "oda", "ekipnet"] as const;
/** formun gönderdiği gibi — verilmeyen alan kartın değeriyle (güncellemede) ya da boş (yeni kayıtta) */
function alanlar(mevcut: object | null, verilen: Record<string, unknown>): Record<string, unknown> {
  const m = mevcut as Record<string, unknown> | null;
  return Object.fromEntries(ALAN.map((k) => [k, Object.hasOwn(verilen, k) ? verilen[k] ?? "" : m?.[k] ?? ""]));
}

export const SAY_ISLEMLERI: readonly Islem[] = [
  islem({
    ad: "personel_ara", modul: MODUL, tur: "oku", islev: personelListesi, kaynak: [SuzgecDurumuSemasi],
    girdi: z.object({ ara: SuzgecDurumuSemasi.shape.ara, sayfa: SuzgecDurumuSemasi.shape.sayfa }),
    tarif: "Personeli arar (20'şer): ara — ad, e-posta, meslek, EKİPNET; durum (çalışıyor / ayrıldı), giriş hesabı ve rolleri.",
    calistir: async (b, v) => {
      const l = await personelListesi(b.db, b.kim);
      if (!l) return { tamam: false, neden: "Bu kullanıcı Personel'i göremiyor." };
      const s = sayfala(l.filter((p) => trIcerir([p.ad, p.eposta ?? "", p.meslekMetin ?? p.meslek, p.ekipnet ?? ""].join(" "), v.ara)), v.sayfa);
      return { tamam: true, sonuc: { ...s.bilgi, personel: s.satirlar.map((p) => ({ id: p.id, ad: p.ad, eposta: p.eposta, meslek: p.meslekMetin ?? p.meslek, ekipnet: p.ekipnet,
        durum: p.durum === "etkin" ? "çalışıyor" : "ayrıldı", ayrildi: p.ayrildi, hesap: p.hesap ? { durum: p.hesap.durum, roller: p.hesap.roller } : null })) } };
    },
  }),
  islem({
    ad: "personel_getir", modul: MODUL, tur: "oku", girdi: z.object({ personel: kimlik }), kaynak: [kimlik], islev: personelKarti,
    tarif: "Personel kartı: bilgileri, sürümü (surum), durumu, giriş hesabı.",
    calistir: async (b, v) => {
      const p = await personelKarti(b.db, b.kim, v.personel);
      if (!p) return { tamam: false, neden: GORUNMEZ };
      const { hesapAyrinti, ...k } = p;
      return { tamam: true, sonuc: { ...k, hesap: hesapAyrinti ? { durum: hesapAyrinti.durum, roller: hesapAyrinti.roller } : null } };
    },
  }),
  islem({
    ad: "personel_kaydet", modul: MODUL, tur: "yaz", islev: personelEkle, kaynak: [PersonelGirdisi, kimlik, surum],
    girdi: z.object({ personel: kimlik.nullable().default(null), surum: surum.default(0), alanlar: z.object(PersonelGirdisi.shape).partial() }),
    tarif: "Personel ekler (personel boş) ya da günceller (personel + surum — personel_getir): alanlar { ad (ad soyad), eposta, imzaTel (05XXXXXXXXX), basla "
      + "(YYYY-AA-GG), meslek (anahtar), meslekMetin, diploma, oda, ekipnet }.",
    calistir: async (b, v, ham) => {
      const mevcut = v.personel ? await personelKarti(b.db, b.kim, v.personel) : null;
      if (v.personel && !mevcut) return { tamam: false, neden: GORUNMEZ };
      const g = alanlar(mevcut, (ham.alanlar ?? {}) as Record<string, unknown>);
      return yazmaCevabi(v.personel ? await personelGuncelle(b.db, b.kim, v.personel, v.surum, g) : await personelEkle(b.db, b.kim, g),
        { bildirim: v.personel ? "Personel güncellendi." : "Personel eklendi." });
    },
  }),
  islem({
    ad: "personel_ayrildi", modul: MODUL, tur: "yaz", girdi: z.object({ personel: kimlik, surum, tarih }), kaynak: [kimlik, surum, tarih], islev: personelAyrildi,
    tarif: "Personeli ayrıldı yapar (silinmez; giriş hesabı kapanır): personel, surum, tarih (YYYY-AA-GG; işe başlamadan önce olamaz).",
    calistir: async (b, v) => yazmaCevabi(await personelAyrildi(b.db, b.kim, v.personel, v.surum, v.tarih), { bildirim: "Personel ayrıldı olarak işaretlendi." }),
  }),
  islem({
    ad: "personel_ayrilis_geri_al", modul: MODUL, tur: "yaz", girdi: z.object({ personel: kimlik, surum }), kaynak: [kimlik, surum], islev: personelGeriAl,
    tarif: "Ayrılışı geri alır (çalışıyor olur; giriş hesabı kapalı kalır).",
    calistir: async (b, v) => yazmaCevabi(await personelGeriAl(b.db, b.kim, v.personel, v.surum), { bildirim: "Ayrılış geri alındı." }),
  }),
  islem({
    ad: "personel_sil", modul: MODUL, tur: "yaz", girdi: z.object({ personel: kimlik }), kaynak: [kimlik], islev: personelSil,
    tarif: "Hiç kullanılmamış (yanlış girilmiş) personeli kesin siler; kullanılmışsa nedeni döner (ayrıldı yapılır).",
    calistir: async (b, v) => {
      const r = await personelSil(b.db, b.kim, v.personel);
      return yazmaCevabi(r, { bildirim: r.durum === "tamam" ? `${r.ad} silindi.` : undefined });
    },
  }),
  /* 2026-10-31 (kalem 9 — M1 + M2; beceri B11): konuşmadaki ekin (M / F numarası) depodaki kopyası kaydın belge yuvasına — ekranın yükleme işleviyle */
  islem({
    ad: "personel_belge_ekle", modul: MODUL, tur: "yaz", islev: ozlukEkle, kaynak: [kimlik],
    girdi: z.object({ personel: kimlik, ne: z.enum(["ozluk", "atama", "bordro", "zimmet"]), alanlar: z.record(z.string(), z.string()).default({}), ek: EK_NO }),
    tarif: "Konuşmadaki belgeyi (ek: M03 / F02) personelin dosyasına ekler: ne ozluk (alanlar { tur, aciklama }) | atama (alanlar { tur, tarih }) | bordro "
      + "(alanlar { ay YYYY-AA, brut, net, maliyet }) | zimmet (imzalı zimmet formu). Özlük ve bordroyu yalnız Personel'de yazan görür.",
    calistir: async (b, v) => {
      const belge = await ekBelgesi(b, v.ek, ["pdf","foto"]);
      if (typeof belge === "string") return { tamam: false, neden: belge };
      const r = v.ne === "ozluk" ? await ozlukEkle(b.db, b.depo(), b.kim, b.firmaId, v.personel, v.alanlar, belge)
        : v.ne === "atama" ? await atamaEkle(b.db, b.depo(), b.kim, b.firmaId, v.personel, v.alanlar, belge)
        : v.ne === "bordro" ? await bordroYukle(b.db, b.depo(), b.kim, b.firmaId, v.personel, v.alanlar, belge)
        : await zimmetFormuYukle(b.db, b.depo(), b.kim, b.firmaId, v.personel, belge);
      return yazmaCevabi(r, { bildirim: `${belge.ad} personelin dosyasına eklendi.` });
    },
  }),
  /* 2026-10-31 (kalem 10 — M3): dışarıya giden iş — bordroyu kişinin imzasına (Onaylar › Diğer belgeler); onay kapısından (IKINCI_ONAY) */
  islem({
    ad: "bordro_onaya_gonder", modul: MODUL, tur: "yaz", islev: bordroOnayaGonder, kaynak: [kimlik], girdi: z.object({ bordro: kimlik }),
    tarif: "Personelin bordrosunu kişinin imzasına gönderir (Onaylar › Diğer belgeler): bordro (personel_getir bordro kimliği). Kullanıcının ekrandaki onayıyla.",
    calistir: async (b, v) => yazmaCevabi(await bordroOnayaGonder(b.db, b.depo(), b.kim, b.firmaId, v.bordro), { bildirim: "Bordro imzaya gönderildi." }),
  }),
  /* 2026-10-31 (S.A.Y belge doldurma): ekranın "Belgeyi doldur"u — yerler ve kayıt modülün işlevleriyle (src/server/yz/doldurma.ts) */
  islem({
    ad: "zimmet_formu_doldur", modul: MODUL, tur: "yaz", islev: zimmetDoldur, kaynak: [kimlik, ElleDegerGirdisi], girdi: z.object({ personel: kimlik, degerler: ElleDegerGirdisi }),
    tarif: "Kişinin zimmet teslim formu: elle doldurulan yerlerine yazar — personel, degerler (yerin kimliği ya da adı → değer; \"\" boşaltır). degerler boşsa yazmadan yerleri listeler (ad, tür, zorunlu, dolu mu).",
    calistir: async (b, v) => {
      const h = doldurmaHazirla(await zimmetDoldurmaVerisi(b.db, b.kim, v.personel), v.degerler);
      return "cevap" in h ? h.cevap : doldurmaCevabi(await zimmetDoldur(b.db, b.kim, v.personel, h.degerler, h.surum), "Zimmet formu");
    },
  }),
  /* 2026-10-31 (S.A.Y yükleme yuvaları — reisim: "önerdiklerini kabul ediyorum"): ekranın yükleme işlevi, belge konuşmadaki ekin depodaki kopyasından (ekBelgesi) */
  islem({
    ad: "personel_belge_degistir", modul: MODUL, tur: "yaz", islev: ozlukBelgeDegistir, kaynak: [kimlik, surum], girdi: z.object({ ne: z.enum(["ozluk", "atama"]), kayit: kimlik, surum, ek: EK_NO }),
    tarif: "Özlük ya da atama satırının PDF'ini değiştirir (satır aynı kalır): ne, kayit + surum (personel_getir belgeleri), ek (PDF'in M numarası).",
    calistir: async (b, v) => {
      const belge = await ekBelgesi(b, v.ek, ["pdf"]);
      if (typeof belge === "string") return { tamam: false, neden: belge };
      const r = v.ne === "ozluk" ? await ozlukBelgeDegistir(b.db, b.depo(), b.kim, b.firmaId, v.kayit, v.surum, belge) : await atamaBelgeDegistir(b.db, b.depo(), b.kim, b.firmaId, v.kayit, v.surum, belge);
      return yazmaCevabi(r, { bildirim: "Belge değiştirildi." });
    },
  }),
  islem({
    ad: "personel_belge_kaldir", modul: MODUL, tur: "yaz", islev: ozlukKaldir, kaynak: [kimlik, surum], girdi: z.object({ ne: z.enum(["ozluk", "atama", "bordro", "zimmet"]), kayit: kimlik, surum }),
    tarif: "Personelin belge satırını kaldırır (silinmez; saklanır): ne (ozluk | atama | bordro | zimmet), kayit + surum (personel_getir belgeleri).",
    calistir: async (b, v) => {
      const r = v.ne === "ozluk" ? await ozlukKaldir(b.db, b.kim, v.kayit, v.surum) : v.ne === "atama" ? await atamaKaldir(b.db, b.kim, v.kayit, v.surum)
        : v.ne === "bordro" ? await bordroKaldir(b.db, b.kim, v.kayit, v.surum) : await zimmetFormuKaldir(b.db, b.kim, v.kayit, v.surum);
      return yazmaCevabi(r, { bildirim: "Belge kaldırıldı." });
    },
  }),
];

/** 2026-10-31 (K2 + M4): S.A.Y'ın açık kaydı bildiği ayrıntı sayfaları (src/server/yz/islem.ts acikKayit) */
export const SAY_SAYFALARI: readonly SayfaTanimi[] = [
  { desen: /^\/personel\/([0-9a-f-]{36})(?:\/|$)/, tur: "Personel", islem: "personel_getir", girdi: (id) => ({ personel: id }) },
];
