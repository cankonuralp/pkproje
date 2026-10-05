/* MÜŞTERİ PANELİ (modül 17; maket musteri.html M11; pkproje §1 reisim: "müşteriye bir id parola verilecek ve girdiğinde kendi raporlarına oradan
   erişebilecek ama sadece kendi raporlarını görüp indirecek"; 193 yalnız son sürüm; 09-E5 ikinci katman). Bu modülün işlevleri YALNIZ müşteri
   işleminde çağrılır (src/server/kimlik/istek.ts musteriIslemi → probata_musteri): hangi satırın döneceğine veritabanının kısıtlayıcı politikaları
   karar verir (kendi müşterisi, tesis kapsamı, imzalı son sürüm). Panel öteki modüllerin tablolarına dokunmaz; Raporlar ve Müşteriler'in dışa
   açtığı işlevlerden okur. 319: Raporlar ve rapor sayfası (imzalı PDF); 320: Uygunsuzluklar + Excel (tarayıcıda, panelin aldığı veriden);
   321: Planlanan kontroller (Planlar'ın musteri-baglanti.ts'i, 0032) + toplu indirme (ZIP, tarayıcıda); 322: Sözleşmeler (Sözleşmeler'in
   musteri-baglanti.ts'i, 0034; panelden imza atılmaz — karar 134); 323: Muayene personeli (Personel'in musteri-baglanti.ts'i — veritabanı
   işlevleri, firmanın müşteriye açtığı belgeler, 0035). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { firmaKunyesi } from "../../../server/ayar/ayar.ts";
import { musteriOzetleri } from "../../musteriler/server/musteriler.ts";
import { musteriPersoneli, type MusteriPersoneli } from "../../personel/server/musteri-baglanti.ts";
import { musteriPlanlari, type MusteriPlani } from "../../planlar/server/musteri-baglanti.ts";
import { musteriSozlesmeleri, type MusteriSozlesmesi } from "../../sozlesmeler/server/musteri-baglanti.ts";

const GUN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" });
import {
  musteriAcikUygunsuzluk, musteriRaporlari, musteriRaporu, musteriUygunsuzluklari, type MusteriRaporu, type MusteriUygunsuzlugu, type MusteriUygunsuzlukSatiri,
} from "../../raporlar/server/musteri-baglanti.ts";

/** acikUygunsuz: sekmedeki açık uygunsuzluk sayısı */
export interface PanelBasligi { firma: string; musteri: { kisa: string; unvan: string } | null; tesisler: { id: string; ad: string; yer: string | null }[]; acikUygunsuz: number }
export interface PanelRaporlari extends PanelBasligi { raporlar: MusteriRaporu[] }
export interface PanelUygunsuzluklari extends PanelBasligi { uygunsuzluklar: MusteriUygunsuzlukSatiri[] }

/** kabuğun ve listenin başlığı: firma adı, müşterinin kendisi ve görebildiği tesisler (müşteri rolünde yalnız kendisi döner) */
export async function panelBasligi(db: Sorgulayici): Promise<PanelBasligi> {
  const m = (await musteriOzetleri(db))[0] ?? null;
  return { firma: (await firmaKunyesi(db)).ad, musteri: m ? { kisa: m.kisa, unvan: m.unvan } : null,
    tesisler: m ? m.tesisler.map((t) => ({ id: t.id, ad: t.ad, yer: [t.ilce, t.il].filter(Boolean).join(" / ") || null })) : [],
    acikUygunsuz: await musteriAcikUygunsuzluk(db) };
}

/** Raporlarınız: görebildiği imzalı raporların son sürümleri, en yeni imza üstte */
export async function panelRaporlari(db: Sorgulayici): Promise<PanelRaporlari> {
  return { ...(await panelBasligi(db)), raporlar: await musteriRaporlari(db) };
}

/** Uygunsuzluklar (320): görebildiği uygunsuzluklar, en yeni tespit üstte */
export async function panelUygunsuzluklari(db: Sorgulayici): Promise<PanelUygunsuzluklari> {
  return { ...(await panelBasligi(db)), uygunsuzluklar: await musteriUygunsuzluklari(db) };
}

/** Planlanan kontroller (321; maket planCiz): görebildiği her tesis — açık planı (en yakını; başkaları da varsa sayısı) ve sonraki kontrol
    (tesisteki her ETKİN ekipmanın SON raporunun sonraki kontrol tarihlerinin en yakını — pasife alınan ekipmanın eski tarihi sayılmaz; firma
    tarafındaki kapsam hesabı gibi, 320–323 incelemesi) */
export interface PanelPlanSatiri { tesisId: string; tesis: string; yer: string | null; plan: MusteriPlani | null; digerPlan: number; sonraki: string | null }
export interface PanelPlanlari extends PanelBasligi { satirlar: PanelPlanSatiri[] }
export async function panelPlanlari(db: Sorgulayici): Promise<PanelPlanlari> {
  const b = await panelBasligi(db);
  const planlar = await musteriPlanlari(db), raporlar = await musteriRaporlari(db);
  /* ekipmanın son raporu: en geç kontrol (yoksa imza) */
  const son = new Map<string, MusteriRaporu>();
  for (const r of raporlar) {
    if (r.ekipmanPasif) continue;
    const o = son.get(r.ekipmanId), k = (x: MusteriRaporu) => `${x.kontrol ?? ""}|${x.imzalandi}`;
    if (!o || k(r) > k(o)) son.set(r.ekipmanId, r);
  }
  return { ...b, satirlar: b.tesisler.map((t) => {
    const p = planlar.filter((x) => x.tesisId === t.id);
    const sonraki = [...son.values()].filter((r) => r.tesisId === t.id && r.sonraki).map((r) => r.sonraki!).sort()[0] ?? null;
    return { tesisId: t.id, tesis: t.ad, yer: t.yer, plan: p[0] ?? null, digerPlan: Math.max(0, p.length - 1), sonraki };
  }) };
}

/** Sözleşmeler (322; maket sozCiz): görebildiği sözleşmeler — kapsamdaki tesislerin adları (yalnız görebildikleri), dönem, durum */
export interface PanelSozlesmesi extends MusteriSozlesmesi { tesisAdlari: string[] }
export interface PanelSozlesmeleri extends PanelBasligi { sozlesmeler: PanelSozlesmesi[] }
export async function panelSozlesmeleri(db: Sorgulayici, s: { id?: string } = {}): Promise<PanelSozlesmeleri> {
  const b = await panelBasligi(db);
  const ad = new Map(b.tesisler.map((t) => [t.id, t.ad]));
  const l = await musteriSozlesmeleri(db, GUN.format(new Date()), s);
  return { ...b, sozlesmeler: l.map((x) => ({ ...x, tesisAdlari: x.tesisler.map((t) => ad.get(t) ?? "—") })) };
}
/** sözleşme sayfası; göremeyene null (başka müşterinin sözleşmesi: var olduğu da söylenmez) */
export async function panelSozlesmesi(db: Sorgulayici, id: string): Promise<{ b: PanelBasligi; s: PanelSozlesmesi } | null> {
  const v = await panelSozlesmeleri(db, { id });
  const s = v.sozlesmeler[0];
  return s ? { b: v, s } : null;
}

/** Muayene personeli (323; maket personelCiz): müşterinin tesislerine giden kişiler, son gidiş, gittiği tesislerin adları, müşteriye açık belgeler */
export interface PanelPersonelSatiri extends MusteriPersoneli { tesisAdlari: string[] }
export interface PanelPersoneli extends PanelBasligi { kisiler: PanelPersonelSatiri[] }
export async function panelPersoneli(db: Sorgulayici): Promise<PanelPersoneli> {
  const b = await panelBasligi(db);
  const ad = new Map(b.tesisler.map((t) => [t.id, t.ad]));
  return { ...b, kisiler: (await musteriPersoneli(db)).map((p) => ({ ...p, tesisAdlari: p.tesisler.map((t) => ad.get(t) ?? "—") })) };
}

/** rapor sayfası; göremeyene null (başka müşterinin ya da imzasız rapor: var olduğu bile söylenmez) */
export async function panelRaporu(db: Sorgulayici, id: string): Promise<{ r: MusteriRaporu; uygunsuzluklar: MusteriUygunsuzlugu[] } | null> {
  return musteriRaporu(db, id);
}
