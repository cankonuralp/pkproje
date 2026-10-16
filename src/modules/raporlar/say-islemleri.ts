/* RAPORLAR — S.A.Y'IN ÇAĞIRABİLDİĞİ İŞLEMLER (2026-10-16; pkproje §9 "S.A.Y CLAUDE GİBİ" 2. adım a, C; çekirdek src/server/yz/islem.ts). Her işlem
   modülün VAR OLAN işlevini oturumdaki kişiyle çağırır: rapor oluştur (raporOlustur — yalnız plandaki denetçi, plan günü, mesai …), saha raporu
   okuma (sahaRaporu), kaydet (raporKaydet — sürüm kilidi, şema, kilitli künye, gün değişimi), onaya gönder (onayaGonder — ENGEL 2 / 5), cihaz
   (cihazEkle / cihazKaldir). Yeni kural yok.
   · C — EKRANDA AÇIK OLMAYAN RAPORA YAZMA (rapor_yaz): raporun kayıttaki hâli okunur, girişler EKRANIN kullandığı saf işlevle uygulanır
     (raporlar/say-doldur.ts komutlariUygula — aynı yer kimlikleri, aynı değer denetimi; harita rapor_getir'de), sonra raporKaydet ile yazılır.
     Ekranda açık (yazılabilir) rapora işlemle yazılmaz — ekranın kaydedilmemiş değişikliği ezilmesin: S.A.Y orada rapora_yaz / raporu_kaydet /
     onaya_gonder araçlarını kullanır (sunucunun bu turda doğruladığı açık rapor — IslemBaglami.ekrandakiRapor).
   · E-imza bu katalogda yok: kullanıcının cihazında atılır.
   · 2026-10-16 (2. adım a incelemesi): rapor_yaz yapay zekânın verdiği sürümü her durumda denetler (yalnız ölçüm cihazı değişse de — ekranın
     "Cihaz ekle"si de gördüğü sürümle gider); hiçbir şey değişmediyse "değişiklik yok" iş sayılmaz (degisiklik: false). rapor_getir'in haritası
     kısaltılmaz: bütün satırlar, sayfa sayfa ("sonraki"). */
import { kilitliKunye, kayitKunyesi, metotMetni } from "../../format/kunye.ts";
import { kimlik, surum, z } from "../../sema/ortak.ts";
import { SuzgecDurumuSemasi } from "../../server/liste/liste.ts";
import { GORUNMEZ, islem, metinSayfasi, sayfaBilgisi, yazmaCevabi, type Islem, type IslemBaglami, type IslemCevabi } from "../../server/yz/islem.ts";
import { komutDenetle } from "../../server/yz/say.ts";
import { raporHaritasi } from "../say/rapor-haritasi.ts";
import { komutlariUygula, sonucOzeti, type Durum, type GirisSonucu } from "./say-doldur.ts";
import { OlusturIslemGirdisi, RAPOR_DURUM } from "./sema.ts";
import { raporSayfasi } from "./server/liste.ts";
import { cihazEkle, cihazKaldir, onayaGonder, raporKaydet, raporOlustur, raporSayDurumu, sahaRaporu, type SahaRaporu } from "./server/raporlar.ts";

const MODUL = 14;
const RAPOR_SURUM = z.object({ rapor: kimlik, surum });
/** ekranda açık rapor — işlem yerine ekranın aracı (kaydedilmemiş değişiklikler ezilmesin) */
const EKRANDA = "Bu rapor ekranda açık: ona rapora_yaz ile yaz, raporu_kaydet ile kaydet, onaya_gonder ile gönder (ekrandaki kaydedilmemiş değişiklikler korunur).";
const durumAdi = (d: keyof typeof RAPOR_DURUM) => RAPOR_DURUM[d][0];
const metinle = <T extends Record<string, string | null>>(o: T) => Object.fromEntries(Object.entries(o).map(([k, x]) => [k, x ?? ""])) as Record<string, string>;

/** saha raporunun kayıttaki hâli — ekranın Durum'u (komutlariUygula) ve haritanın canlı hâli (ekranın gönderdiğiyle aynı biçim) */
function kayittakiHal(s: SahaRaporu): { durum: Durum; cihazlar: { turId: string; turAd: string; secili: string | null; secenekler: { id: string; kod: string; ad: string }[] }[] } {
  const cihazlar = s.cihazlar.map((x) => ({ turId: x.turId, turAd: x.turAd, secili: x.cihaz?.id ?? null,
    secenekler: (s.secilebilir[x.turId] ?? s.secilebilir["*"] ?? []).map((c) => ({ id: c.id, kod: c.kod, ad: [c.marka, c.model].filter(Boolean).join(" ") })) }));
  return { durum: { ekipman: metinle(s.ekipmanBilgi), cevaplar: s.cevaplar, tarih: metinle(s.tarih) }, cihazlar };
}

/** C: kapalı rapora girişler — ekranın denetimiyle uygulanır, raporKaydet ile yazılır; ölçüm cihazı seçimi cihazEkle / cihazKaldir ile */
async function kapaliRaporaYaz(b: IslemBaglami, id: string, surumu: number, girisler: unknown, satirlar: unknown): Promise<IslemCevabi> {
  if (b.ekrandakiRapor === id) return { tamam: false, neden: EKRANDA };
  const s = await sahaRaporu(b.db, b.kim, id);
  if (!s) return { tamam: false, neden: GORUNMEZ };
  if (!s.izin.duzenle) {
    const d = await raporSayDurumu(b.db, b.kim, id);
    return { tamam: false, neden: `${s.no} rapora yazılamaz: ${d?.neden ?? "rapor düzenlenemez"}.` };
  }
  /* sürüm kilidi her yazmada (raporKaydet'e gitmeyen yalnız-cihaz yazmasında da): yapay zekânın gördüğü hâl değiştiyse yazılmaz */
  if (s.surum !== surumu) return yazmaCevabi({ durum: "cakisma" });
  const k = komutDenetle({ tur: "yaz", girisler, satirlar });
  if (!k || k.tur !== "yaz") return { tamam: false, neden: "Yazılacak giriş yok (girisler ya da satir_ekle)." };
  const h = kayittakiHal(s);
  const u = komutlariUygula(h.durum, s.tanim, k.girisler,
    { kunyeKilit: kilitliKunye(s.tanim), kunyeKayit: kayitKunyesi(s.kunye, metotMetni(s.tanim, s.tur.kontrolStd)), cihazlar: h.cihazlar }, k.satirlar ?? []);
  const sonuclar: GirisSonucu[] = [...u.sonuclar];
  if (u.geri.length) {
    const r = await raporKaydet(b.db, b.kim, id, surumu, { ekipman: u.durum.ekipman, tarih: u.durum.tarih, cevaplar: u.durum.cevaplar });
    if (r.durum !== "tamam") return yazmaCevabi(r);
  }
  /* ölçüm cihazı: ekranın "Cihaz ekle / kaldır"ı gibi, her biri raporun güncel sürümüyle (aynı veritabanı işleminde) */
  for (const c of u.cihaz) {
    const j = sonuclar.findIndex((x) => x.yer === c.yer);
    const guncel = await sahaRaporu(b.db, b.kim, id);
    const r = !guncel ? { durum: "yok" as const } : c.cihazId ? await cihazEkle(b.db, b.kim, id, guncel.surum, c.turId, c.cihazId)
      : await cihazKaldir(b.db, b.kim, id, guncel.surum, c.turId);
    const cv = yazmaCevabi(r);
    if (j >= 0) sonuclar[j] = cv.tamam ? { ...sonuclar[j], durum: "yazildi" } : { ...sonuclar[j], durum: "yazilamadi", neden: cv.neden };
  }
  const o = sonucOzeti(sonuclar);
  const sonraki = await sahaRaporu(b.db, b.kim, id);
  const sonuc = { rapor: id, no: s.no, surum: sonraki?.surum ?? surumu, yazilan: o.yazildi, zaten_oyle: o.ayni, eklenen_satir: u.satir,
    yazilamayan: o.yazilamadi.slice(0, 100), ...(o.yazilamadi.length > 100 ? { yazilamayan_daha: o.yazilamadi.length - 100 } : {}) };
  if (!o.yazildi && !u.satir) {
    return o.yazilamadi.length ? { tamam: false, neden: `Yazılamadı: ${o.yazilamadi.slice(0, 20).map((x) => `${x.ad}: ${x.neden}`).join("; ")}` }
      : { tamam: true, bildirim: `${s.no}: değişiklik yok (girişler zaten öyleydi).`, sonuc, degisiklik: false };
  }
  return { tamam: true, bildirim: `${s.no}: ${o.yazildi} giriş yazıldı${u.satir ? `, ${u.satir} satır eklendi` : ""}; rapor kaydedildi.`, sonuc };
}

export const SAY_ISLEMLERI: readonly Islem[] = [
  islem({
    ad: "rapor_ara", modul: MODUL, tur: "oku", girdi: SuzgecDurumuSemasi, kaynak: [SuzgecDurumuSemasi], islev: raporSayfasi,
    tarif: "Görebildiğin raporları arar (20'şer, en yeni üstte): ara (rapor no, ekipman kodu, tür, tesis, müşteri), secili (taslak | onayda | onaylandi | "
      + "imzada | imzali | geri), sec.sonuc (uygun | uygun_degil | yok), sec.yil, sayfa.",
    calistir: async (b, _v, ham) => {
      const l = await raporSayfasi(b.db, b.kim, ham);
      if (!l) return { tamam: false, neden: "Bu kullanıcı Raporlar'ı göremiyor." };
      return { tamam: true, sonuc: { ...sayfaBilgisi(l), raporlar: l.gorunen.map((r) => ({ id: r.id, no: r.no, durum: durumAdi(r.durum), surum: r.surum, plan: r.planId,
        ekipman: r.ekipmanKod, tur: r.turAd, musteri: r.musteri, tesis: r.tesis, denetci: r.denetci, sonuc: r.sonuc, benim: r.benim, geri_gonderildi: r.geri })) } };
    },
  }),
  islem({
    ad: "rapor_getir", modul: MODUL, tur: "oku", girdi: z.object({ rapor: kimlik, sayfa: SuzgecDurumuSemasi.shape.sayfa }), kaynak: [kimlik, SuzgecDurumuSemasi],
    islev: sahaRaporu,
    tarif: "Raporun durumu, sürümü, yazılabilir mi (neden), ve haritası: yazılabilen yerlerin kimlikleri ve şu anki değerleri (rapor_yaz bu kimliklerle yazar); "
      + "uzun raporun haritası sayfa sayfa (sayfa, sonraki).",
    calistir: async (b, v) => {
      const s = await sahaRaporu(b.db, b.kim, v.rapor);
      if (!s) return { tamam: false, neden: GORUNMEZ };
      const d = await raporSayDurumu(b.db, b.kim, v.rapor), h = kayittakiHal(s);
      const harita = metinSayfasi(raporHaritasi(s.tanim, s.tur.ad, { cevaplar: s.cevaplar, ekipman: h.durum.ekipman, tarih: h.durum.tarih, cihazlar: h.cihazlar },
        { tumu: true }) ?? "", v.sayfa);
      return { tamam: true, sonuc: {
        id: s.id, no: s.no, durum: durumAdi(s.durum), surum: s.surum, plan: { id: s.plan.id, no: s.plan.no }, ekipman: s.ekipman, tur: { id: s.tur.id, ad: s.tur.ad },
        yazilabilir: s.izin.duzenle, ...(d?.neden ? { neden: d.neden } : {}), ekranda_acik: b.ekrandakiRapor === s.id,
        harita: harita.metin, harita_sayfa: harita.bilgi.sayfa, harita_sayfa_sayisi: harita.bilgi.sayfa_sayisi, sonraki: harita.bilgi.sonraki,
      } };
    },
  }),
  islem({
    ad: "rapor_ac", modul: MODUL, tur: "yaz", girdi: OlusturIslemGirdisi, kaynak: [OlusturIslemGirdisi], islev: raporOlustur,
    tarif: "Plandaki ekipmanın raporunu oluşturur (yalnız plandaki denetçi; plan kabul edilmiş, plan günü gelmiş): plan, ekipman (kimlikler — plan_getir).",
    calistir: async (b, v) => yazmaCevabi(await raporOlustur(b.db, b.kim, v.plan, v.ekipman)),
  }),
  islem({
    ad: "rapor_yaz", modul: MODUL, tur: "yaz", islev: raporKaydet, kaynak: [kimlik, surum],
    girdi: RAPOR_SURUM.extend({
      girisler: z.array(z.object({ yer: z.string(), deger: z.union([z.string(), z.number()]) })).default([]),
      satir_ekle: z.array(z.record(z.string(), z.unknown())).default([]),
    }),
    tarif: "Ekranda açık OLMAYAN rapora yazar ve kaydeder: girisler [{ yer (rapor_getir haritasındaki kimlik), deger }], satir_ekle (rapora_yaz'daki gibi); "
      + "değerler ekrandaki gibi denetlenir, sonuç yazılan / yazılamayan ve nedeni.",
    calistir: async (b, v, ham) => kapaliRaporaYaz(b, v.rapor, v.surum, ham.girisler ?? [], ham.satir_ekle ?? []),
  }),
  islem({
    ad: "rapor_onaya_gonder", modul: MODUL, tur: "yaz", girdi: RAPOR_SURUM, kaynak: [kimlik, surum], islev: onayaGonder,
    tarif: "Ekranda açık OLMAYAN raporu kayıttaki hâliyle onaya gönderir; zorunlu alan / cihaz eksikse gönderilmez, eksikler döner.",
    calistir: async (b, v) => {
      if (b.ekrandakiRapor === v.rapor) return { tamam: false, neden: EKRANDA };
      const s = await sahaRaporu(b.db, b.kim, v.rapor);
      if (!s) return { tamam: false, neden: GORUNMEZ };
      return yazmaCevabi(await onayaGonder(b.db, b.kim, v.rapor, v.surum, { ekipman: s.ekipmanBilgi, tarih: s.tarih, cevaplar: s.cevaplar }));
    },
  }),
];
