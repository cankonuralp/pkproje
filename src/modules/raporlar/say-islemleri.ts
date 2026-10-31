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
import {
  EKRAN_KAYDEDILMEMIS, ekranRaporuKirli, GORUNMEZ, islem, metinSayfasi, sayfaBilgisi, yazmaCevabi, type Islem, type IslemBaglami, type IslemCevabi,
} from "../../server/yz/islem.ts";
import { komutDenetle } from "../../server/yz/say.ts";
import { raporHaritasi } from "../say/rapor-haritasi.ts";
import { fotoKopyasiOku } from "../../server/yz/konusma.ts";
import { turKarti } from "../ekipman-turleri/server/turler.ts";
import { planIci } from "../planlar/server/plan-ici.ts";
import { teklifAdetDurumu } from "../teklifler/server/rapor-bagi.ts";
import { raporSorunlari } from "./denetle.ts";
import { cakismalar, saatGirisleri, saatPlani, type SaatRaporu, type SaatSatiri } from "./saat-plani.ts";
import { isBildirimi, raporTamamla, type RaporOzeti, type Tamamlama } from "./tamamla.ts";
import { mesaiBaslangici } from "./server/plan-baglanti.ts";
import { komutlariUygula, sonucOzeti, type Durum, type GirisSonucu } from "./say-doldur.ts";
import { KopyaGirdisi, OlusturIslemGirdisi, RAPOR_DURUM, RevizeGirdisi } from "./sema.ts";
import { raporSayfasi } from "./server/liste.ts";
import {
  cihazAdaylari, cihazEkle, cihazKaldir, fotoEkle, fotoSil, onayaGonder, raporEksikleri, raporFormatGuncelle, raporKaydet, raporKopyala, raporFormatHami, raporOlustur, raporSayDurumu, takipAc, raporSil, revizeIste, revizeIstegiGeriCek, sahaRaporu,
  type SahaRaporu,
} from "./server/raporlar.ts";

import { EK_NO as EK_NUMARASI, ekBelgesi as ekinBelgesi } from "../../server/yz/islem.ts";
import { imzaliEslestirYukle, imzaliYukle, teknikImzaliEslestirYukle, teknikImzaliYukle } from "./server/raporlar.ts";

const MODUL = 14;
const RAPOR_SURUM = z.object({ rapor: kimlik, surum });
/** ekranda açık rapor — işlem yerine ekranın aracı (kaydedilmemiş değişiklikler ezilmesin) */
const EKRANDA = "Bu rapor ekranda açık: ona rapora_yaz ile yaz, raporu_kaydet ile kaydet, onaya_gonder ile gönder (ekrandaki kaydedilmemiş değişiklikler korunur).";
const durumAdi = (d: keyof typeof RAPOR_DURUM) => RAPOR_DURUM[d][0];
const metinle = <T extends Record<string, string | null>>(o: T) => Object.fromEntries(Object.entries(o).map(([k, x]) => [k, x ?? ""])) as Record<string, string>;

/** 2026-10-31 (reisim: "standart olarak 15 dakika açsın, tablolu ekipmanlarda 15 dakika + satır başı süre sistemi kuracağız kurana kadar şimdilik
    böyle"): türün süresi boşsa ve kullanıcı vermediyse */
export const VARSAYILAN_SURE_DK = 15;
const bugunGun = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
/** türün süresi (dakika) — tür kartını göremeyen kişide ya da tanımsızsa null */
async function turSuresi(b: IslemBaglami, turId: string): Promise<number | null> {
  return (await turKarti(b.db, b.kim, turId))?.sure ?? null;
}
/** saha raporunun kayıttaki hâli — ekranın Durum'u (komutlariUygula) ve haritanın canlı hâli (ekranın gönderdiğiyle aynı biçim) */
function kayittakiHal(s: SahaRaporu): { durum: Durum; cihazlar: { turId: string; turAd: string; secili: string | null; secenekler: { id: string; kod: string; ad: string }[] }[] } {
  const cihazlar = s.cihazlar.map((x) => ({ turId: x.turId, turAd: x.turAd, secili: x.cihaz?.id ?? null,
    secenekler: (s.secilebilir[x.turId] ?? s.secilebilir["*"] ?? []).map((c) => ({ id: c.id, kod: c.kod, ad: [c.marka, c.model].filter(Boolean).join(" ") })) }));
  return { durum: { ekipman: metinle(s.ekipmanBilgi), cevaplar: s.cevaplar, tarih: metinle(s.tarih) }, cihazlar };
}

/** C: kapalı rapora girişler — ekranın denetimiyle uygulanır, raporKaydet ile yazılır; ölçüm cihazı seçimi cihazEkle / cihazKaldir ile */
/** tamamlayıcının bu rapordaki girdisi (raporlar/tamamla.ts): işin günü ve raporun saat planı satırı */
interface TamamlaEki { gun: string; saat: SaatSatiri | null }
async function kapaliRaporaYaz(b: IslemBaglami, id: string, surumGirdi: number | null, girisler: unknown, satirlar: unknown, tam: TamamlaEki | null = null): Promise<IslemCevabi> {
  if (b.ekrandakiRapor === id) return { tamam: false, neden: EKRANDA };
  const s = await sahaRaporu(b.db, b.kim, id);
  if (!s) return { tamam: false, neden: GORUNMEZ };
  const surumu = surumGirdi ?? s.surum;
  if (!s.izin.duzenle) {
    const d = await raporSayDurumu(b.db, b.kim, id);
    return { tamam: false, neden: `${s.no} rapora yazılamaz: ${d?.neden ?? "rapor düzenlenemez"}.` };
  }
  /* sürüm kilidi her yazmada (raporKaydet'e gitmeyen yalnız-cihaz yazmasında da): yapay zekânın gördüğü hâl değiştiyse yazılmaz */
  if (s.surum !== surumu) return yazmaCevabi({ durum: "cakisma" });
  const h = kayittakiHal(s), komutEki = { kunyeKilit: kilitliKunye(s.tanim), kunyeKayit: kayitKunyesi(s.kunye, metotMetni(s.tanim, s.tur.kontrolStd)), cihazlar: h.cihazlar };
  /* 2026-10-31 (L1 — "önce yap, sonra kısaca bildir"): verilenler uygulandıktan sonraki hâlden boş yerler tamamlanır; hepsi TEK kayıtta */
  let tamamlama: Tamamlama | null = null, verilenGiris = Array.isArray(girisler) ? girisler : [];
  if (tam) {
    const k0 = komutDenetle({ tur: "yaz", girisler: verilenGiris, satirlar });
    const once = k0 && k0.tur === "yaz" ? komutlariUygula(h.durum, s.tanim, k0.girisler, komutEki, k0.satirlar ?? []).durum : h.durum;
    const adaylar = (await cihazAdaylari(b.db, b.kim, id)) ?? {};
    tamamlama = raporTamamla({ tanim: s.tanim, durum: once, gun: tam.gun, saat: tam.saat,
      verilen: new Set(verilenGiris.flatMap((x) => (x && typeof x === "object" && typeof (x as { yer?: unknown }).yer === "string" ? [(x as { yer: string }).yer.trim()] : []))),
      cihazlar: h.cihazlar.map((c) => ({ turId: c.turId, turAd: c.turAd, secili: !!c.secili, adaylar: adaylar[c.turId] ?? adaylar["*"] ?? [] })) });
    verilenGiris = [...verilenGiris, ...tamamlama.girisler];
  }
  const k = komutDenetle({ tur: "yaz", girisler: verilenGiris, satirlar });
  if (!k || k.tur !== "yaz") return { tamam: false, neden: "Yazılacak giriş yok (girisler ya da satir_ekle)." };
  const u = komutlariUygula(h.durum, s.tanim, k.girisler, komutEki, k.satirlar ?? []);
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
    yazilamayan: o.yazilamadi.slice(0, 100), ...(o.yazilamadi.length > 100 ? { yazilamayan_daha: o.yazilamadi.length - 100 } : {}),
    ...(tamamlama ? { varsayim: tamamlama.varsayim, tire: tamamlama.tire, engel: tamamlama.engel } : {}) };
  if (!o.yazildi && !u.satir) {
    return o.yazilamadi.length ? { tamam: false, neden: `Yazılamadı: ${o.yazilamadi.slice(0, 20).map((x) => `${x.ad}: ${x.neden}`).join("; ")}` }
      : { tamam: true, bildirim: `${s.no}: değişiklik yok (girişler zaten öyleydi).`, sonuc, degisiklik: false };
  }
  return { tamam: true, bildirim: `${s.no}: ${o.yazildi} giriş yazıldı${u.satir ? `, ${u.satir} satır eklendi` : ""}; rapor kaydedildi.`, sonuc };
}

/** konuşmadaki fotoğrafı (F numarası) raporun fotoğraf bölümüne — ekranın "Fotoğraf ekle"siyle aynı işlev (fotoEkle) */
async function fotoKoy(b: IslemBaglami, rapor: string, surumu: number | null, foto: string, bolumGirdi?: string): Promise<IslemCevabi> {
  if (ekranRaporuKirli(b, [rapor])) return { tamam: false, neden: EKRAN_KAYDEDILMEMIS };
  const s = await sahaRaporu(b.db, b.kim, rapor);
  if (!s) return { tamam: false, neden: GORUNMEZ };
  const bolum = bolumGirdi ?? s.tanim.bolumler.find((x) => x.blok === "foto")?.id;
  if (!bolum) return { tamam: false, neden: "Bu raporun formatında fotoğraf bölümü yok." };
  const f = await fotoKopyasiOku(b.db, b.depo(), foto);
  if (!f) return { tamam: false, neden: `${foto} bu konuşmada yok ya da kopyası yok; kullanıcı fotoğrafı yeniden eklemeli.` };
  return yazmaCevabi(await fotoEkle(b.db, b.depo(), b.kim, b.firmaId, rapor, surumu ?? s.surum, { bolum, madde: null }, f));
}
const GIRISLER = z.array(z.object({ yer: z.string(), deger: z.union([z.string(), z.number()]), supheli: z.boolean().optional() }));
const FOTO_NO = z.string().regex(/^F?\d{1,4}$/i);
const GUN = z.string().regex(/^\d{4}-\d{2}-\d{2}$/), SAAT = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
/** girişlerdeki "şüpheli" işaretli yerlerin adları (bildirim) */
const supheliler = (l: readonly unknown[]): string[] => l.flatMap((x) => (x && typeof x === "object" && (x as { supheli?: unknown }).supheli === true
  && typeof (x as { yer?: unknown }).yer === "string" ? [(x as { yer: string }).yer.replace(/^[a-z]+:/, "")] : []));

export const SAY_ISLEMLERI: readonly Islem[] = [
  islem({
    ad: "rapor_ara", modul: MODUL, tur: "oku", girdi: SuzgecDurumuSemasi, kaynak: [SuzgecDurumuSemasi], islev: raporSayfasi,
    tarif: "Görebildiğin raporları arar (20'şer, en yeni üstte): ara (rapor no, ekipman kodu, tür, tesis, müşteri), secili (taslak | onayda | onaylandi | "
      + "imzada | imzali | geri), sec.sonuc (uygun | uygun_degil | sartli | yok), sec.yil, sayfa.",
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
        { tumu: true, ham: (await raporFormatHami(b.db, b.kim, v.rapor)) ?? undefined }) ?? "", v.sayfa);
      return { tamam: true, sonuc: {
        id: s.id, no: s.no, durum: durumAdi(s.durum), surum: s.surum, plan: { id: s.plan.id, no: s.plan.no }, ekipman: s.ekipman, tur: { id: s.tur.id, ad: s.tur.ad },
        yazilabilir: s.izin.duzenle, ...(d?.neden ? { neden: d.neden } : {}), ekranda_acik: b.ekrandakiRapor === s.id,
        /* 2. adım b: geri gönderme / revize bilgisi, yeni format sürümü (rapor_format_guncelle), revize isteği (revize_iste / revize_istegi_geri_cek) */
        ...(s.geri ? { geri: s.geri } : {}), ...(s.revize ? { revize: s.revize } : {}), ...(s.guncelFormat ? { guncel_format_sira: s.guncelFormat } : {}),
        harita: harita.metin, harita_sayfa: harita.bilgi.sayfa, harita_sayfa_sayisi: harita.bilgi.sayfa_sayisi, sonraki: harita.bilgi.sonraki,
        /* 2026-10-31 (kalem 3 — E4): raporun fotoğrafları ve fotoğraf bölümleri (rapor_foto_ekle / rapor_foto_kaldir) */
        fotolar: s.fotolar.map((f) => ({ dosya: f.dosya, ad: f.ad, bolum: f.bolum, ...(f.madde ? { madde: f.madde } : {}), ...(f.okuma ? { okuma: true } : {}) })),
        foto_bolumleri: s.tanim.bolumler.filter((x) => x.blok === "foto").map((x) => ({ id: x.id, ad: x.ad, en_cok: x.blok === "foto" ? x.enCok : 0 })),
      } };
    },
  }),
  islem({
    /* 2026-10-26 (S.A.Y eğitimi — sohbette dört ekipmanı tek çağrıda verdi, reddedildi): ekipman tek kimlik ya da kimlik dizisi */
    ad: "rapor_ac", modul: MODUL, tur: "yaz", kaynak: [OlusturIslemGirdisi, kimlik], islev: raporOlustur,
    girdi: z.object({ plan: OlusturIslemGirdisi.shape.plan, ekipman: z.union([kimlik, z.array(kimlik).min(1).max(100)]) }),
    tarif: "Plandaki ekipmanların raporunu oluşturur (yalnız plandaki denetçi; plan kabul edilmiş, plan günü gelmiş): plan, ekipman (bir kimlik ya da kimlik "
      + "dizisi — plan_getir); her ekipman için rapor kimliği ve numarası ya da açılamama nedeni.",
    calistir: async (b, v) => {
      if (typeof v.ekipman === "string") return yazmaCevabi(await raporOlustur(b.db, b.kim, v.plan, v.ekipman));
      const l: Record<string, unknown>[] = [];
      for (const e of v.ekipman) {
        const c = yazmaCevabi(await raporOlustur(b.db, b.kim, v.plan, e));
        l.push(c.tamam ? { ekipman: e, ...c.sonuc, bildirim: c.bildirim } : { ekipman: e, neden: c.neden });
      }
      const acilan = l.filter((x) => !x.neden).length;
      return acilan ? { tamam: true, bildirim: `${acilan} rapor açıldı.`, sonuc: { raporlar: l } } : { tamam: false, neden: `Rapor açılamadı: ${l.map((x) => x.neden).join(" · ")}` };
    },
  }),
  /* 2026-10-26 (göç 0108): takip muayenesi — açık uygunsuzluğu olan son imzalı rapora …-T1; içerik ana rapordan */
  islem({
    ad: "rapor_takip_ac", modul: MODUL, tur: "yaz", girdi: OlusturIslemGirdisi, kaynak: [OlusturIslemGirdisi], islev: takipAc,
    tarif: "Ekipmanın açık uygunsuzluğu olan son imzalı raporuna takip muayenesi açar (numara ana rapor + -T1; önceki metinler gelir; aynı planda da): plan, ekipman.",
    calistir: async (b, v) => yazmaCevabi(await takipAc(b.db, b.kim, v.plan, v.ekipman)),
  }),
  islem({
    ad: "rapor_yaz", modul: MODUL, tur: "yaz", islev: raporKaydet, kaynak: [kimlik, surum],
    /* 2026-10-26 (S.A.Y eğitimi): sürüm verilmezse raporun şu anki sürümü (yeni açılan raporda sürüm sorulmasın) */
    girdi: RAPOR_SURUM.extend({
      surum: surum.optional(),
      girisler: z.array(z.object({ yer: z.string(), deger: z.union([z.string(), z.number()]) })).default([]),
      satir_ekle: z.array(z.record(z.string(), z.unknown())).default([]),
      tamamla: z.boolean().default(true),
    }),
    tarif: "Ekranda açık OLMAYAN rapora yazar ve kaydeder: girisler [{ yer (rapor_getir haritasındaki kimlik), deger }], satir_ekle (rapora_yaz'daki gibi), "
      + "surum isteğe bağlı (verilmezse şu anki); tamamla (varsayılan açık): boş yerler kurala göre tamamlanır (cevapsız madde uygun, sonuç önerisi, rapor "
      + "tarihi, bilinemeyen metin \"-\", test değeri katsayıdan, ölçüm cihazı) — tamamla: false yalnız verilenleri yazar; "
      + "değerler ekrandaki gibi denetlenir, sonuç yazılan / yazılamayan ve nedeni + varsayim / tire / engel.",
    calistir: async (b, v, ham) => kapaliRaporaYaz(b, v.rapor, v.surum ?? null, ham.girisler ?? [], ham.satir_ekle ?? [], v.tamamla ? { gun: bugunGun(), saat: null } : null),
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
  /* 2026-10-16 (2. adım b): sil, kopyala, formatı güncelle, revize iste / geri çek — rapor ekranının tuşlarının işlevleri */
  islem({
    ad: "rapor_sil", modul: MODUL, tur: "yaz", girdi: RAPOR_SURUM, kaynak: [kimlik, surum], islev: raporSil,
    tarif: "Yeni raporu siler (yazan ya da teknik yönetici; \"silindi\" damgası, veri silinmez); gönderilmiş ya da revizyondaki rapor silinmez.",
    calistir: async (b, v) => yazmaCevabi(await raporSil(b.db, b.kim, v.rapor, v.surum)),
  }),
  islem({
    ad: "rapor_kopyala", modul: MODUL, tur: "yaz", girdi: RAPOR_SURUM.extend({ kopya: z.object(KopyaGirdisi.shape) }), kaynak: [KopyaGirdisi, kimlik, surum], islev: raporKopyala,
    tarif: "Raporun kayıttaki bilgileriyle aynı plana YENİ ekipmanın raporunu açar (kopya): kopya { kod (yeni ekipmanın kodu — plan günü, günlük süre denetlenir), konum }.",
    calistir: async (b, v, ham) => (ekranRaporuKirli(b, [v.rapor]) ? { tamam: false, neden: EKRAN_KAYDEDILMEMIS }
      : yazmaCevabi(await raporKopyala(b.db, b.kim, v.rapor, v.surum, ham.kopya, null))),
  }),
  islem({
    ad: "rapor_format_guncelle", modul: MODUL, tur: "yaz", girdi: RAPOR_SURUM, kaynak: [kimlik, surum], islev: raporFormatGuncelle,
    tarif: "Ekranda açık OLMAYAN Yeni raporu türün yayındaki (yeni) format sürümüne geçirir; cevaplar kimlikle taşınır, yeni madde ilk cevapla.",
    calistir: async (b, v) => {
      if (b.ekrandakiRapor === v.rapor) return { tamam: false, neden: EKRANDA };
      const s = await sahaRaporu(b.db, b.kim, v.rapor);
      if (!s) return { tamam: false, neden: GORUNMEZ };
      return yazmaCevabi(await raporFormatGuncelle(b.db, b.kim, v.rapor, v.surum, { ekipman: s.ekipmanBilgi, tarih: s.tarih, cevaplar: s.cevaplar }));
    },
  }),
  islem({
    ad: "revize_iste", modul: MODUL, tur: "yaz", girdi: RevizeGirdisi.extend({ rapor: kimlik }), kaynak: [RevizeGirdisi, kimlik], islev: revizeIste,
    tarif: "Kendi tamamlanan raporu için teknik yöneticiden revize ister: rapor, gerekce (en az 10 karakter: neyin düzeltileceği).",
    calistir: async (b, v, ham) => yazmaCevabi(await revizeIste(b.db, b.kim, v.rapor, { gerekce: ham.gerekce })),
  }),
  islem({
    ad: "revize_istegi_geri_cek", modul: MODUL, tur: "yaz", girdi: z.object({ rapor: kimlik, istek: kimlik, istek_surum: surum }), kaynak: [kimlik, surum],
    islev: revizeIstegiGeriCek,
    tarif: "Kendi bekleyen revize isteğini geri çeker: rapor, istek, istek_surum (rapor_getir'deki revize isteği).",
    calistir: async (b, v) => yazmaCevabi(await revizeIstegiGeriCek(b.db, b.kim, v.rapor, v.istek, v.istek_surum)),
  }),
  /* 2026-10-31 (kalem 6 — E7, B06): saatleri sunucu hesaplar — sırayla, süre + ara; sonraki kontrol türün periyodundan; yazma rapor_yaz'ın yoluyla */
  islem({
    ad: "rapor_saat_plani", modul: MODUL, tur: "yaz", islev: raporKaydet, kaynak: [kimlik],
    girdi: z.object({ gun: GUN.optional(), baslangic: SAAT.optional(), ara_dk: z.number().int().min(0).default(0),
      raporlar: z.array(z.object({ rapor: kimlik, sure_dk: z.number().int().min(1).optional() })).min(1) }),
    tarif: "Raporların başlangıç / bitiş saatini ve sonraki kontrol tarihini yazar: gun (YYYY-AA-GG; verilmezse bugün), baslangic (SS:DD; verilmezse Firma "
      + "ayarları › Mesai başlangıcı), ara_dk, raporlar [{ rapor, sure_dk? }] gezi sırasıyla (sure_dk yoksa türün süresi; o da yoksa 15). Hesabı sunucu yapar.",
    calistir: async (b, v) => {
      const l: SaatRaporu[] = [];
      for (const x of v.raporlar) {
        const s = await sahaRaporu(b.db, b.kim, x.rapor);
        if (!s) return { tamam: false, neden: `${x.rapor}: ${GORUNMEZ}` };
        l.push({ id: x.rapor, sure: x.sure_dk ?? (await turSuresi(b, s.tur.id)) ?? VARSAYILAN_SURE_DK, periyot: s.tur.periyot });
      }
      const plan = saatPlani({ gun: v.gun ?? bugunGun(), baslangic: v.baslangic ?? await mesaiBaslangici(b.db), ara: v.ara_dk, raporlar: l });
      const sonuc: Record<string, unknown>[] = [];
      for (const p of plan) {
        const c = await kapaliRaporaYaz(b, p.id, null, saatGirisleri(p), []);
        sonuc.push({ rapor: p.id, bas: p.bas, bit: p.bit, sonraki: p.sonraki, ...(p.tasma ? { uyari: "gün dışına taşıyor" } : {}), ...(c.tamam ? {} : { yazilamadi: c.neden }) });
      }
      const yazilan = sonuc.filter((x) => !x.yazilamadi).length;
      return yazilan ? { tamam: true, bildirim: `${yazilan} raporun saati yazıldı.`, sonuc: { saatler: sonuc } }
        : { tamam: false, neden: `Saat yazılamadı: ${sonuc.map((x) => x.yazilamadi).join("; ")}` };
    },
  }),
  /* 2026-10-31 (kalem 6): aynı girişler çok rapora. L2 (reisim: "Tek çağrıda rapor yazma: raporlara_yaz alanları, fotoğrafı, cihazı ve tarih-saati
     birlikte yazar … hedef rapor başına 1 kayıt"): rapor başına girişler + fotoğraf + süre; bitişi yazılmamış raporlar mesai başlangıcından sırayla,
     çakışmasız; tamamlayıcı (tamamla.ts) boşları doldurur; sonuç dört satırlık bildirim (isBildirimi) */
  islem({
    ad: "raporlara_yaz", modul: MODUL, tur: "yaz", islev: raporKaydet, kaynak: [kimlik],
    girdi: z.object({
      raporlar: z.array(z.union([kimlik, z.object({ rapor: kimlik, girisler: GIRISLER.default([]), satir_ekle: z.array(z.record(z.string(), z.unknown())).default([]),
        foto: FOTO_NO.optional(), sure_dk: z.number().int().min(1).max(600).optional() })])).min(1).max(200),
      girisler: GIRISLER.default([]),
      tamamla: z.boolean().default(true), gun: GUN.optional(), baslangic: SAAT.optional(), ara_dk: z.number().int().min(0).max(240).default(0),
    }),
    tarif: "Çok rapora TEK çağrıda yazar ve her raporu BİR kez kaydeder: raporlar [rapor kimliği | { rapor, girisler [{ yer, deger, supheli? }], satir_ekle, foto "
      + "(\"F03\" — ekipmanın kendi genel görünüş fotoğrafı), sure_dk }] gezi sırasıyla; girisler (her rapora ortak); tamamla (varsayılan açık: cevapsız madde "
      + "uygun, sonuç önerisi, rapor tarihi, bitişi yazılmamış raporda saatler — gun (verilmezse bugün), baslangic (verilmezse Firma ayarları › Mesai "
      + "başlangıcı), ara_dk, süre türden ya da 15 dk —, bilinemeyen metin \"-\", test değeri katsayıdan, ölçüm cihazı). Sonuç rapor rapor + bildirim (dört satır).",
    calistir: async (b, v, ham) => {
      const hamRaporlar = Array.isArray(ham.raporlar) ? ham.raporlar as unknown[] : [];
      const liste = v.raporlar.map((x, i) => {
        const h = hamRaporlar[i] && typeof hamRaporlar[i] === "object" ? hamRaporlar[i] as { girisler?: unknown[]; satir_ekle?: unknown[] } : {};
        return typeof x === "string" ? { rapor: x, girisler: [] as unknown[], satirlar: [] as unknown[], foto: undefined as string | undefined, sure: undefined as number | undefined }
          : { rapor: x.rapor, girisler: h.girisler ?? [], satirlar: h.satir_ekle ?? [], foto: x.foto, sure: x.sure_dk };
      });
      const ortak = Array.isArray(ham.girisler) ? ham.girisler as unknown[] : [];
      const gun = v.gun ?? bugunGun(), saat = new Map<string, SaatSatiri>();
      if (v.tamamla) {
        const l: SaatRaporu[] = [];
        for (const x of liste) {
          const s = await sahaRaporu(b.db, b.kim, x.rapor);
          if (s && s.izin.duzenle && !s.tarih.bit) l.push({ id: x.rapor, sure: x.sure ?? (await turSuresi(b, s.tur.id)) ?? VARSAYILAN_SURE_DK, periyot: s.tur.periyot });
        }
        if (l.length) for (const p of saatPlani({ gun, baslangic: v.baslangic ?? await mesaiBaslangici(b.db), ara: v.ara_dk, raporlar: l })) saat.set(p.id, p);
      }
      const sonuc: Record<string, unknown>[] = [], ozet: RaporOzeti[] = [];
      for (const x of liste) {
        const girisler = [...ortak, ...x.girisler];
        const c = await kapaliRaporaYaz(b, x.rapor, null, girisler, x.satirlar, v.tamamla ? { gun, saat: saat.get(x.rapor) ?? null } : null);
        const s = c.tamam ? c.sonuc as { varsayim?: string[]; tire?: string[]; engel?: string[] } | undefined : undefined;
        const f = c.tamam && x.foto ? await fotoKoy(b, x.rapor, null, x.foto) : null;
        const r = await sahaRaporu(b.db, b.kim, x.rapor);
        const ad = r ? `${r.no} · ${r.ekipman.kod}` : x.rapor;
        sonuc.push(c.tamam ? { rapor: x.rapor, ...(c.sonuc ?? {}), ...(f ? { foto: f.tamam ? "eklendi" : f.neden } : {}) } : { rapor: x.rapor, yazilamadi: c.neden });
        ozet.push({ ad, yazildi: c.tamam, neden: c.tamam ? undefined : c.neden, varsayim: s?.varsayim ?? [], tire: s?.tire ?? [],
          engel: [...(s?.engel ?? []), ...(f && !f.tamam ? [`fotoğraf eklenemedi (${f.neden})`] : [])], supheli: supheliler(girisler) });
      }
      const yazilan = ozet.filter((x) => x.yazildi).length, ps = [...saat.values()];
      const bildirim = isBildirimi(ozet, ps.length ? { gun, bas: ps[0]!.bas.slice(11), bit: ps[ps.length - 1]!.bit.slice(11) } : null).join("\n");
      return yazilan ? { tamam: true, bildirim, sonuc: { raporlar: sonuc } } : { tamam: false, neden: `Hiçbir rapora yazılamadı: ${sonuc.map((x) => x.yazilamadi).join("; ")}` };
    },
  }),
  /* 2026-10-31 (kalem 6 — E8, B07): gönderim öncesi denetim — yazmaz; Onaya gönder'in zorunlu alan / cihaz kuralı, fotoğraf, tablo boş hücre, künye boş
     (değer göstermeden), saat çakışması, durum */
  islem({
    ad: "plan_denetle", modul: MODUL, tur: "oku", islev: raporEksikleri, kaynak: [kimlik],
    girdi: z.object({ plan: kimlik.optional(), raporlar: z.array(kimlik).optional() }),
    tarif: "Planın (ya da verilen raporların) raporlarını gönderim öncesi denetler: zorunlu alan / ölçüm cihazı eksiği, fotoğraf yok ya da birden çok, tablo boş "
      + "hücre, künye boş, saat çakışması, gönderilmiş rapor, sonuç maddelerle çelişiyor, teklif adedini aşıyor / teklifte yok (teklifleri görene). Yazmaz; sorunlar rapor rapor.",
    calistir: async (b, v) => {
      let idler = v.raporlar ?? [];
      let tesis: string | null = null;
      if (v.plan) {
        const p = await planIci(b.db, b.kim, v.plan);
        if (!p) return { tamam: false, neden: GORUNMEZ };
        idler = [...new Set([...idler, ...p.raporlar.map((r) => r.id)])];
        tesis = p.kart.tesis.id;
      }
      if (!idler.length) return { tamam: false, neden: "Denetlenecek rapor yok (plan ya da raporlar)." };
      const sonuc: { rapor: string; no: string; sorunlar: string[] }[] = [], zaman: { id: string; bas: string | null; bit: string | null }[] = [];
      for (const id of idler) {
        const s = await sahaRaporu(b.db, b.kim, id);
        if (!s) { sonuc.push({ rapor: id, no: "—", sorunlar: [GORUNMEZ] }); continue; }
        zaman.push({ id, bas: s.tarih.bas, bit: s.tarih.bit });
        sonuc.push({ rapor: id, no: s.no, sorunlar: raporSorunlari(s, (await raporEksikleri(b.db, b.kim, id)) ?? []) });
      }
      /* teklif adedi: raporun bağlandığı teklifte türünün kalemi yok ya da adet aşıldı (Muhasebe'nin "teklif dışı" fiyatı) — teklifleri görebilene */
      const bag = tesis ? await teklifAdetDurumu(b.db, b.kim, [tesis]) : null;
      if (bag) {
        for (const r of sonuc) {
          const x = bag.get(r.rapor);
          if (x?.kaynak === "disi") r.sorunlar.push(`teklif${x.teklifNo ? ` ${x.teklifNo}` : ""} adedini aşıyor ya da teklifte bu tür yok (teklif dışı)`);
          else if (x?.kaynak === "liste") r.sorunlar.push("kabul edilmiş teklif yok (fiyat listesinden)");
        }
      }
      for (const [x, y] of cakismalar(zaman)) {
        const a = sonuc.find((r) => r.rapor === x)!, c = sonuc.find((r) => r.rapor === y)!;
        a.sorunlar.push(`saati ${c.no} ile çakışıyor`); c.sorunlar.push(`saati ${a.no} ile çakışıyor`);
      }
      const sorunlu = sonuc.filter((r) => r.sorunlar.length);
      return { tamam: true, bildirim: sorunlu.length ? `${sorunlu.length} / ${sonuc.length} raporda sorun var.` : `${sonuc.length} rapor denetlendi; sorun yok.`,
        sonuc: { raporlar: sonuc } };
    },
  }),
  /* 2026-10-31 (kalem 6b — B07): toplu onaya gönderme — ikinci onaylı (IKINCI_ONAY); önce denetim (Onaya gönder'in kuralı), eksikli rapor gönderilmez */
  islem({
    ad: "raporlari_onaya_gonder", modul: MODUL, tur: "yaz", islev: onayaGonder, kaynak: [kimlik],
    girdi: z.object({ raporlar: z.array(kimlik).min(1) }),
    tarif: "Raporları kayıttaki hâlleriyle teknik yöneticinin onayına gönderir; zorunlu alan / cihaz eksiği olan gönderilmez, nedeniyle listelenir. Yalnız "
      + "kullanıcının açık \"gönder\" isteğiyle; ekranda onay ister. Sonuç gönderilen / gönderilemeyen.",
    calistir: async (b, v) => {
      const gonderilen: string[] = [], gonderilemeyen: { rapor: string; neden: string }[] = [];
      for (const id of v.raporlar) {
        if (b.ekrandakiRapor === id) { gonderilemeyen.push({ rapor: id, neden: EKRANDA }); continue; }
        const s = await sahaRaporu(b.db, b.kim, id);
        if (!s) { gonderilemeyen.push({ rapor: id, neden: GORUNMEZ }); continue; }
        const eksik = (await raporEksikleri(b.db, b.kim, id)) ?? [];
        if (eksik.length) { gonderilemeyen.push({ rapor: s.no, neden: `eksik: ${eksik.slice(0, 5).map((x) => x.ad).join(", ")}` }); continue; }
        const c = yazmaCevabi(await onayaGonder(b.db, b.kim, id, s.surum, { ekipman: s.ekipmanBilgi, tarih: s.tarih, cevaplar: s.cevaplar }));
        if (c.tamam) gonderilen.push(s.no); else gonderilemeyen.push({ rapor: s.no, neden: c.neden });
      }
      return gonderilen.length ? { tamam: true, bildirim: `${gonderilen.length} rapor onaya gönderildi.`, sonuc: { gonderilen, gonderilemeyen } }
        : { tamam: false, neden: `Hiçbir rapor gönderilemedi: ${gonderilemeyen.map((x) => `${x.rapor}: ${x.neden}`).join("; ")}` };
    },
  }),
  /* 2026-10-31 (kalem 3 — E4; sunum "S.A.Y'a tam yetenek"): konuşmadaki fotoğraf (F numarası — ekin firmanın deposundaki kopyası) rapora, ekranın
     "Fotoğraf ekle"siyle aynı işlevle (fotoEkle: yalnız yazan, Yeni rapor, bölümün sınırı, tür ve boy denetimi, sürüm kilidi) */
  islem({
    ad: "rapor_foto_ekle", modul: MODUL, tur: "yaz", girdi: RAPOR_SURUM.extend({ foto: z.string().regex(/^F?\d{1,4}$/i), bolum: z.string().min(1).max(40).optional() }),
    kaynak: [kimlik, surum], islev: fotoEkle,
    tarif: "Konuşmadaki fotoğrafı (foto: \"F03\") raporun fotoğraf bölümüne ekler: rapor, surum, bolum (rapor_getir foto_bolumleri; boşsa ilk fotoğraf bölümü). "
      + "Her rapora ekipmanın kendi genel görünüş fotoğrafından bir tane; etiket fotoğrafı eklenmez.",
    calistir: async (b, v) => {
      return fotoKoy(b, v.rapor, v.surum, v.foto, v.bolum);
    },
  }),
  islem({
    ad: "rapor_foto_kaldir", modul: MODUL, tur: "yaz", girdi: RAPOR_SURUM.extend({ dosya: kimlik }), kaynak: [kimlik, surum], islev: fotoSil,
    tarif: "Raporun bir fotoğrafını kaldırır (dosya: rapor_getir fotolar[].dosya; yalnız yazan, Yeni rapor). Kullanıcının elle eklediğine istemedikçe dokunma.",
    calistir: async (b, v) => (ekranRaporuKirli(b, [v.rapor]) ? { tamam: false, neden: EKRAN_KAYDEDILMEMIS }
      : yazmaCevabi(await fotoSil(b.db, b.kim, v.rapor, v.surum, v.dosya))),
  }),
  /* 2026-10-31 (S.A.Y yükleme yuvaları — reisim: "önerdiklerini kabul ediyorum"): ekranın yükleme işlevi, belge konuşmadaki ekin depodaki kopyasından (ekBelgesi) */
  islem({
    ad: "rapor_imzali_yukle", modul: MODUL, tur: "yaz", islev: imzaliYukle, kaynak: [kimlik, surum],
    girdi: z.object({ rapor: kimlik.optional(), surum: surum.optional(), ek: EK_NUMARASI, teknik: z.boolean().optional() }),
    tarif: "Raporun imzalı PDF'i (ekrandaki İmzalı PDF yükle): ek (PDF'in M numarası — değiştirilmeden), rapor + surum ya da yalnız ek (hangi rapora ait olduğu içerikten); teknik: teknik yöneticinin imzası. İmza denetimi sunucuda.",
    calistir: async (b, v) => {
      const belge = await ekinBelgesi(b, v.ek, ["pdf"]);
      if (typeof belge === "string") return { tamam: false, neden: belge };
      if (v.rapor && v.surum !== undefined) {
        const r = v.teknik ? await teknikImzaliYukle(b.db, b.depo(), b.kim, b.firmaId, v.rapor, v.surum, belge) : await imzaliYukle(b.db, b.depo(), b.kim, b.firmaId, v.rapor, v.surum, belge);
        return yazmaCevabi(r, { bildirim: "İmzalı PDF yüklendi." });
      }
      const s = v.teknik ? await teknikImzaliEslestirYukle(b.db, b.depo(), b.kim, b.firmaId, belge) : await imzaliEslestirYukle(b.db, b.depo(), b.kim, b.firmaId, belge);
      return yazmaCevabi(s.sonuc, { bildirim: `İmzalı PDF ${s.no ?? "rapora"} yüklendi.`, sonuc: { rapor: s.id, no: s.no } });
    },
  }),
];
