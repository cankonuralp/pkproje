/* ÖLÇÜM CİHAZLARI — S.A.Y'IN ÇAĞIRABİLDİĞİ İŞLEMLER (2026-10-16; pkproje §9 "S.A.Y CLAUDE GİBİ" 2. adım b; çekirdek src/server/yz/islem.ts). Her
   işlem modülün VAR OLAN işlevini oturumdaki kişiyle çağırır — Ölçüm cihazları ekranının tuşlarıyla aynı yetki ve kural (liste / kart: görebilen,
   denetçi yalnız zimmetindekileri; ekle / düzenle / kalibrasyon / konum / pasif: "yaz" düzeyi; kod firmada eşsiz; pasife alınacak cihaz depoda
   olmalı; sil: yalnız hiç kullanılmamış cihaz, yönetici). Girdi modülün şemasından (CihazGirdisi, KalibrasyonGirdisi, CihazTuruGirdisi). Kalibrasyon
   sertifikasının PDF'i dosya ister — S.A.Y kaydı PDF'siz yazar (ekrandaki gibi isteğe bağlı), PDF ekrandan eklenir. */
import { kimlik, surum, z } from "../../sema/ortak.ts";
import { SuzgecDurumuSemasi } from "../../server/liste/liste.ts";
import { GORUNMEZ, islem, sayfala, trIcerir, yazmaCevabi, type Islem, type SayfaTanimi } from "../../server/yz/islem.ts";
import { CihazGirdisi, CihazTuruGirdisi, KalibrasyonGirdisi } from "./sema.ts";
import {
  cihazKarti, cihazKaydet, cihazKonum, cihazListesi, cihazPasif, cihazSil, cihazTuruKaydet, cihazTuruListesi, cihazTuruSil, kalibrasyonEkle,
} from "./server/cihazlar.ts";

const MODUL = 8;
const DURUM = { gecerli: "kalibrasyon geçerli", yakin: "kalibrasyonu yaklaşıyor", gecti: "kalibrasyonu geçmiş", lab: "kalibrasyonda" } as const;
const ALAN = ["kod", "tur", "yeniTur", "marka", "model", "seri", "aralik"] as const;
function alanlar(mevcut: Record<string, unknown> | null, verilen: Record<string, unknown>): Record<string, unknown> {
  const m: Record<string, unknown> | null = mevcut ? { ...mevcut, tur: mevcut.turId } : null;
  return Object.fromEntries(ALAN.map((k) => [k, Object.hasOwn(verilen, k) ? verilen[k] ?? "" : m?.[k] ?? ""]));
}

export const SAY_ISLEMLERI: readonly Islem[] = [
  islem({
    ad: "cihaz_ara", modul: MODUL, tur: "oku", islev: cihazListesi, kaynak: [SuzgecDurumuSemasi],
    girdi: z.object({ ara: SuzgecDurumuSemasi.shape.ara, sayfa: SuzgecDurumuSemasi.shape.sayfa, pasif: z.boolean().default(false) }),
    tarif: "Ölçüm cihazlarını arar (20'şer): ara — kod, tür, marka, model, seri; kalibrasyon bitişi ve durumu; pasif: true pasifleri listeler.",
    calistir: async (b, v) => {
      const l = await cihazListesi(b.db, b.kim);
      if (!l) return { tamam: false, neden: "Bu kullanıcı Ölçüm cihazları'nı göremiyor." };
      const s = sayfala(l.cihazlar.filter((c) => !!c.pasif === v.pasif && trIcerir([c.kod, c.tur, c.marka ?? "", c.model ?? "", c.seri ?? ""].join(" "), v.ara)), v.sayfa);
      return { tamam: true, sonuc: { ...s.bilgi, esik_gun: l.esik, cihazlar: s.satirlar.map((c) => ({ id: c.id, kod: c.kod, tur: c.tur, turId: c.turId, marka: c.marka,
        model: c.model, seri: c.seri, konum: c.konum, bitis: c.bitis, durum: DURUM[c.durum], pasif: c.pasif })) } };
    },
  }),
  islem({
    ad: "cihaz_getir", modul: MODUL, tur: "oku", girdi: z.object({ cihaz: kimlik }), kaynak: [kimlik], islev: cihazKarti,
    tarif: "Cihaz kartı: bilgileri, sürümü (surum), konumu, kalibrasyon kayıtları.",
    calistir: async (b, v) => {
      const c = await cihazKarti(b.db, b.kim, v.cihaz);
      return c ? { tamam: true, sonuc: { ...c, durum: DURUM[c.durum] } } : { tamam: false, neden: GORUNMEZ };
    },
  }),
  islem({
    ad: "cihaz_kaydet", modul: MODUL, tur: "yaz", islev: cihazKaydet, kaynak: [CihazGirdisi, kimlik, surum],
    girdi: z.object({ cihaz: kimlik.nullable().default(null), surum: surum.default(0), alanlar: z.object(CihazGirdisi.shape).partial() }),
    tarif: "Cihaz ekler (cihaz boş) ya da düzenler (cihaz + surum): alanlar { kod (firmanın etiketi), tur (cihaz türü kimliği — cihaz_turleri — ya da \"yeni\" ve "
      + "yeniTur: ad), marka, model, seri, aralik }.",
    calistir: async (b, v, ham) => {
      const mevcut = v.cihaz ? await cihazKarti(b.db, b.kim, v.cihaz) : null;
      if (v.cihaz && !mevcut) return { tamam: false, neden: GORUNMEZ };
      const g = alanlar(mevcut as Record<string, unknown> | null, (ham.alanlar ?? {}) as Record<string, unknown>);
      return yazmaCevabi(await cihazKaydet(b.db, b.kim, v.cihaz, v.surum, g), { bildirim: v.cihaz ? "Cihaz güncellendi." : "Cihaz eklendi." });
    },
  }),
  islem({
    ad: "kalibrasyon_ekle", modul: MODUL, tur: "yaz", islev: kalibrasyonEkle, kaynak: [KalibrasyonGirdisi, kimlik],
    girdi: z.object({ cihaz: kimlik, kalibrasyon: z.object(KalibrasyonGirdisi.shape) }),
    tarif: "Cihaza kalibrasyon kaydı ekler: kalibrasyon { tarih, bitis (YYYY-AA-GG; tarihten önce olamaz), lab, sertifika (no), sonuc: uygun | uygun_degil }; "
      + "kalibrasyondaki cihaz depoya döner. Sertifika PDF'i ekrandan eklenir.",
    calistir: async (b, v, ham) => yazmaCevabi(await kalibrasyonEkle(b.db, b.depo(), b.kim, b.firmaId, v.cihaz, ham.kalibrasyon), { bildirim: "Kalibrasyon kaydı eklendi." }),
  }),
  islem({
    ad: "cihaz_konum", modul: MODUL, tur: "yaz", girdi: z.object({ cihaz: kimlik, surum, konum: z.enum(["depo", "lab"]) }), kaynak: [kimlik, surum], islev: cihazKonum,
    tarif: "Cihazı kalibrasyona gönderir (konum: lab) ya da depoya alır (konum: depo).",
    calistir: async (b, v) => yazmaCevabi(await cihazKonum(b.db, b.kim, v.cihaz, v.surum, v.konum), { bildirim: v.konum === "lab" ? "Kalibrasyona gönderildi." : "Depoya alındı." }),
  }),
  islem({
    ad: "cihaz_pasif", modul: MODUL, tur: "yaz", girdi: z.object({ cihaz: kimlik, surum, pasif: z.boolean() }), kaynak: [kimlik, surum], islev: cihazPasif,
    tarif: "Cihazı kullanımdan çeker (pasif: true — depoda olmalı) ya da yeniden etkinleştirir (pasif: false).",
    calistir: async (b, v) => yazmaCevabi(await cihazPasif(b.db, b.kim, v.cihaz, v.surum, v.pasif), { bildirim: v.pasif ? "Cihaz pasife alındı." : "Cihaz etkinleştirildi." }),
  }),
  islem({
    ad: "cihaz_sil", modul: MODUL, tur: "yaz", girdi: z.object({ cihaz: kimlik }), kaynak: [kimlik], islev: cihazSil,
    tarif: "Hiç kullanılmamış cihazı kesin siler (yönetici); kullanılmışsa nedeni döner (pasife alınır).",
    calistir: async (b, v) => {
      const r = await cihazSil(b.db, b.kim, v.cihaz);
      return yazmaCevabi(r, { bildirim: r.durum === "tamam" ? `${r.ad} silindi.` : undefined });
    },
  }),
  islem({
    ad: "cihaz_turleri", modul: MODUL, tur: "oku", girdi: z.object({ sayfa: SuzgecDurumuSemasi.shape.sayfa }), kaynak: [SuzgecDurumuSemasi], islev: cihazTuruListesi,
    tarif: "Cihaz türleri (20'şer): kimlik, ad, sürüm, kullanımı.",
    calistir: async (b, v) => { const s = sayfala(await cihazTuruListesi(b.db, b.kim), v.sayfa); return { tamam: true, sonuc: { ...s.bilgi, turler: s.satirlar } }; },
  }),
  islem({
    ad: "cihaz_turu_kaydet", modul: MODUL, tur: "yaz", islev: cihazTuruKaydet, kaynak: [CihazTuruGirdisi, kimlik, surum],
    girdi: z.object({ tur: kimlik.nullable().default(null), surum: surum.default(0), ad: CihazTuruGirdisi.shape.ad }),
    tarif: "Cihaz türü ekler (tur boş) ya da adını değiştirir (tur + surum).",
    calistir: async (b, v, ham) => yazmaCevabi(await cihazTuruKaydet(b.db, b.kim, v.tur, v.surum, { ad: ham.ad }), { bildirim: v.tur ? "Tür adı değişti." : "Tür eklendi." }),
  }),
  islem({
    ad: "cihaz_turu_sil", modul: MODUL, tur: "yaz", girdi: z.object({ tur: kimlik }), kaynak: [kimlik], islev: cihazTuruSil,
    tarif: "Hiç kullanılmamış cihaz türünü siler (ekipman türlerinden de çıkar).",
    calistir: async (b, v) => {
      const r = await cihazTuruSil(b.db, b.kim, v.tur);
      return yazmaCevabi(r, { bildirim: r.durum === "tamam" ? `${r.ad} silindi.` : undefined });
    },
  }),
];

/** 2026-10-31 (K2 + M4): S.A.Y'ın açık kaydı bildiği ayrıntı sayfaları (src/server/yz/islem.ts acikKayit) */
export const SAY_SAYFALARI: readonly SayfaTanimi[] = [
  { desen: /^\/olcum-cihazlari\/([0-9a-f-]{36})(?:\/|$)/, tur: "Ölçüm cihazı", islem: "cihaz_getir", girdi: (id) => ({ cihaz: id }) },
];
