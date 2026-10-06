/* FİRMA AYARLARI (334; modül 22; maket firma-ayarlari.html — R1 "ayrı bir modül olsun", Z1 bölüm başına Kaydet, 202 dağınık ayarlar tek yerde).
   Görür: Firma ayarları "gör"; değiştirir: "yaz" (başlangıçta firma yöneticisi — SABIT, kendini kilitleyemez). Değerler çekirdeğin ayar
   bölümlerinde (src/server/ayar/ayar.ts: sürüm kilidi, denetim izi); firma kodu firma kaydında (0045 sütun yetkisi); logo / ön bilgilendirme
   formu / bordro formatı tek dosya yolundan (kayıt = firma). Geçersiz değer kaydedilmez, alanın altında söylenir. Öteki modüllerin tablolarına
   dokunmaz: kişi seçenekleri Personel'den. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { dosyaCope, dosyaYukle } from "../../../server/dosya/dosya.ts";
import { AYAR_DOSYA, ayarOku, ayarYaz, firmaKoduYaz, firmaKunyesi, type AyarBolumu } from "../../../server/ayar/ayar.ts";
import { duzey, type YetkiHesabi } from "../../../server/yetki/canDo.ts";
import { dogrula, type DogrulamaHatalari } from "../../../sema/ortak.ts";
import { personelSecenekleri } from "../../personel/server/personel.ts";
import {
  AYAR_DOSYASI, EsikGirdisi, FirmaBilgiGirdisi, ImzaGirdisi, KodGirdisi, MesaiGirdisi, SabitGiderGirdisi, SaklamaGirdisi, ZimmetGirdisi, type AyarDosyasi,
} from "../sema.ts";

const MODUL = 22;
export interface Kisi extends YetkiHesabi { ad: string }
export const ayarlarGorur = (kim: YetkiHesabi) => duzey(kim, MODUL) !== "yok";
export const ayarlarYazar = (kim: YetkiHesabi) => duzey(kim, MODUL) === "yaz";

type Surumlu<T> = { deger: T; surum: number };
export interface FirmaAyarlari {
  yaz: boolean;
  kod: string;
  firma: Surumlu<{ ad: string; adres: string; eposta: string; akr: string; nusha: number }> & { kayitAd: string };
  imza: Surumlu<{ yontem: "mobil" | "e_imza" }>;
  zimmet: Surumlu<{ teslim_eden: string | null }>;
  saklama: Surumlu<{ yil: number }>;
  mesai: Surumlu<{ acik: boolean; normal_dk: number; mesai_dk: number; yillik_fazla_saat: number }>;
  esik: Surumlu<{ kalibrasyon: number; kontrolu_yaklasan_tesis: number; plan_kontrolu_geliyor: number; egitim: number }>;
  sabit: Surumlu<{ kalemler: { ad: string; aylik: number; not: string }[] }>;
  /** dosya ayarları: kimlik ve görünen ad (yoksa null) ve bölümün sürümü */
  dosyalar: Record<AyarDosyasi, { id: string; ad: string } | null> & { surum: { firma: number; sablon: number } };
  kisiler: { id: string; ad: string }[];
}

async function dosyaAdi(db: Sorgulayici, id: string | null): Promise<{ id: string; ad: string } | null> {
  if (!id) return null;
  const d = (await db.sorgu<{ ad: string }>("SELECT ad FROM dosya WHERE id = $1 AND modul = $2 AND cop IS NULL", [id, AYAR_DOSYA])).rows[0];
  return d ? { id, ad: d.ad } : null;
}

/** ekranın bütün verisi; göremeyene null */
export async function firmaAyarlari(db: Sorgulayici, kim: Kisi): Promise<FirmaAyarlari | null> {
  if (!ayarlarGorur(kim)) return null;
  const k = await firmaKunyesi(db);
  const [f, im, zi, sa, me, es, sg, bs] = [await ayarOku(db, "firma_bilgileri"), await ayarOku(db, "imza"), await ayarOku(db, "zimmet"), await ayarOku(db, "saklama"),
    await ayarOku(db, "mesai"), await ayarOku(db, "uyari_esikleri"), await ayarOku(db, "sabit_gider"), await ayarOku(db, "belge_sablon")];
  return {
    yaz: ayarlarYazar(kim), kod: k.kod,
    firma: { deger: { ad: f.deger.ad, adres: f.deger.adres, eposta: f.deger.eposta, akr: f.deger.akr, nusha: f.deger.nusha }, surum: f.surum, kayitAd: k.ad },
    imza: { deger: im.deger, surum: im.surum }, zimmet: { deger: zi.deger, surum: zi.surum }, saklama: { deger: sa.deger, surum: sa.surum },
    mesai: { deger: { acik: me.deger.acik, normal_dk: me.deger.normal_dk, mesai_dk: me.deger.mesai_dk, yillik_fazla_saat: me.deger.yillik_fazla_saat }, surum: me.surum },
    esik: { deger: es.deger, surum: es.surum }, sabit: { deger: sg.deger, surum: sg.surum },
    dosyalar: { logo: await dosyaAdi(db, f.deger.logo), on_bilgi: await dosyaAdi(db, bs.deger.on_bilgi), bordro_format: await dosyaAdi(db, bs.deger.bordro_format),
      surum: { firma: f.surum, sablon: bs.surum } },
    kisiler: (await personelSecenekleri(db)).map(({ id, ad }) => ({ id, ad })),
  };
}

export type AyarYazma = { durum: "tamam"; bildirim: string } | { durum: "gecersiz"; hatalar: DogrulamaHatalari } | { durum: "cakisma" } | { durum: "yetkisiz" };
const SONUC = (r: { durum: string; hatalar?: DogrulamaHatalari }, bildirim: string): AyarYazma =>
  r.durum === "tamam" || r.durum === "degisiklik_yok" ? { durum: "tamam", bildirim } : r.durum === "gecersiz" ? { durum: "gecersiz", hatalar: r.hatalar ?? {} }
    : { durum: "cakisma" };

/** bölüm kaydet (maket Z1 "Kaydet"): girdi şemadan geçer; kaydedilmemiş alan bölümün öteki alanlarıyla birlikte kalır (dosya alanları korunur) */
export async function ayarKaydet(db: Sorgulayici, kim: Kisi, kesim: string, surum: number, girdi: unknown): Promise<AyarYazma> {
  if (!ayarlarYazar(kim)) return { durum: "yetkisiz" };
  if (!Number.isSafeInteger(surum) || surum < -1) return { durum: "cakisma" };
  const iz = { kim: kim.ad, ne: `firma_ayar.${kesim}` };
  const yaz = async <B extends AyarBolumu>(b: B, yeni: unknown, bildirim: string) => SONUC(await ayarYaz(db, b, surum, yeni, iz), bildirim);
  switch (kesim) {
    case "firma": {
      const g = dogrula(FirmaBilgiGirdisi, girdi);
      if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
      const eski = (await ayarOku(db, "firma_bilgileri")).deger;
      return yaz("firma_bilgileri", { ...eski, ...g.veri }, "Firma bilgileri kaydedildi; yeni raporların ve belgelerin başlığına gelir.");
    }
    case "imza": {
      const g = dogrula(ImzaGirdisi, girdi);
      return g.tamam ? yaz("imza", g.veri, "İmza yöntemi kaydedildi; raporlar ve iç belgeler bu yöntemle imzalanır.") : { durum: "gecersiz", hatalar: g.hatalar };
    }
    case "zimmet": {
      const g = dogrula(ZimmetGirdisi, girdi);
      if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
      if (g.veri.teslim_eden && !(await personelSecenekleri(db)).some((p) => p.id === g.veri.teslim_eden)) return { durum: "gecersiz", hatalar: { teslim_eden: "Çalışan bir kişi seçin." } };
      return yaz("zimmet", g.veri, "Zimmet formunda teslim edenin başlangıç değeri kaydedildi.");
    }
    case "saklama": {
      const g = dogrula(SaklamaGirdisi, girdi);
      return g.tamam ? yaz("saklama", g.veri, `Saklama süresi ${g.veri.yil} yıl.`) : { durum: "gecersiz", hatalar: g.hatalar };
    }
    case "mesai": {
      const g = dogrula(MesaiGirdisi, girdi);
      if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
      const eski = (await ayarOku(db, "mesai")).deger;
      return yaz("mesai", { ...eski, ...g.veri }, g.veri.acik ? "Mesai takibi kaydedildi (açık)." : "Mesai takibi kapalı; günlük süre sınırı yok.");
    }
    case "esik": {
      const g = dogrula(EsikGirdisi, girdi);
      return g.tamam ? yaz("uyari_esikleri", g.veri, "Uyarı eşikleri kaydedildi; uyarılar bu eşiklerle.") : { durum: "gecersiz", hatalar: g.hatalar };
    }
    case "sabit": {
      const g = dogrula(SabitGiderGirdisi, girdi);
      if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
      const h: DogrulamaHatalari = {};
      g.veri.kalemler.forEach((x, i) => { if (x.ad.length < 2) h[`kalemler.${i}.ad`] = "Gider adı en az 2 harf."; if (x.aylik > 100_000_000_000) h[`kalemler.${i}.aylik`] = "Tutar çok büyük."; });
      if (Object.keys(h).length) return { durum: "gecersiz", hatalar: h };
      return yaz("sabit_gider", g.veri, "Sabit giderler kaydedildi; gelir-gider özetinde her ay gider olarak düşer.");
    }
  }
  return { durum: "gecersiz", hatalar: { genel: "Bilinmeyen ayar bölümü." } };
}

/** firma kodu (rapor numarasının başı); açılmış raporların numarası değişmez */
export async function firmaKoduKaydet(db: Sorgulayici, kim: Kisi, girdi: unknown): Promise<AyarYazma> {
  if (!ayarlarYazar(kim)) return { durum: "yetkisiz" };
  const g = dogrula(KodGirdisi, girdi);
  if (!g.tamam) return { durum: "gecersiz", hatalar: g.hatalar };
  await firmaKoduYaz(db, g.veri.kod, { kim: kim.ad, ne: "firma.rapor_kodu" });
  return { durum: "tamam", bildirim: `Firma kodu ${g.veri.kod}; yeni raporlar bu kodla numaralanır.` };
}

const DOSYA_TURU = { png: "PNG", jpeg: "JPEG", pdf: "PDF", xlsx: "Excel (.xlsx)" } as const;
/** logo / ön bilgilendirme formu / bordro formatı: yükle (eskisi çöpe) ya da kaldır (belge null) */
export async function ayarDosyasiYaz(db: Sorgulayici, depo: Depo, kim: Kisi, firmaId: string, ne: string, surum: number,
  belge: { ad: string; bayt: Uint8Array } | null): Promise<AyarYazma> {
  if (!ayarlarYazar(kim)) return { durum: "yetkisiz" };
  if (!Object.hasOwn(AYAR_DOSYASI, ne)) return { durum: "gecersiz", hatalar: { dosya: "Bilinmeyen dosya." } };
  const t = AYAR_DOSYASI[ne as AyarDosyasi];
  if (!Number.isSafeInteger(surum) || surum < -1) return { durum: "cakisma" };
  if (belge && belge.bayt.length > t.mb << 20) return { durum: "gecersiz", hatalar: { dosya: `En çok ${t.mb} MB.` } };
  const bolum = t.bolum as "firma_bilgileri" | "belge_sablon";
  const o = await ayarOku(db, bolum);
  const eski = (o.deger as Record<string, unknown>)[t.alan] as string | null;
  let yeni: string | null = null;
  if (belge) {
    const y = await dosyaYukle(db, depo, { firmaId, modul: AYAR_DOSYA, kayitId: firmaId, ad: belge.ad, bayt: belge.bayt, izinli: [...t.turler], kim: kim.ad, yukleyen: kim.id });
    if (!y.tamam) return { durum: "gecersiz", hatalar: { dosya: y.neden === "buyuk" ? `En çok ${t.mb} MB.` : `Dosya ${t.turler.map((x) => DOSYA_TURU[x]).join(" ya da ")} olmalı.` } };
    yeni = y.id;
  }
  const r = await ayarYaz(db, bolum, surum, { ...o.deger, [t.alan]: yeni }, { kim: kim.ad, ne: `firma_ayar.${ne}` });
  if (r.durum !== "tamam" && r.durum !== "degisiklik_yok") return SONUC(r, "");
  if (eski && eski !== yeni) await dosyaCope(db, eski, { kim: kim.ad, ne: `firma_ayar.${ne}.cope` });
  return { durum: "tamam", bildirim: belge ? `${t.ad} kaydedildi.` : `${t.ad} kaldırıldı.` };
}

/** dosya erişimi (src/server/dosya/erisim.ts): firma ayarı dosyası (kayıt = firma) — firmanın her kullanıcısı (logo belgelerde, şablonlar işte) */
export async function ayarDosyasiGorulur(db: Sorgulayici, _kisi: YetkiHesabi, kayitId: string): Promise<boolean> {
  return (await db.sorgu("SELECT 1 FROM firma WHERE id = $1", [kayitId])).rowCount === 1;
}
