/* MÜŞTERİ PANELİ (modül 17; maket musteri.html M11; pkproje §1 reisim: "müşteriye bir id parola verilecek ve girdiğinde kendi raporlarına oradan
   erişebilecek ama sadece kendi raporlarını görüp indirecek"; 193 yalnız son sürüm; 09-E5 ikinci katman). Bu modülün işlevleri YALNIZ müşteri
   işleminde çağrılır (src/server/kimlik/istek.ts musteriIslemi → probata_musteri): hangi satırın döneceğine veritabanının kısıtlayıcı politikaları
   karar verir (kendi müşterisi, tesis kapsamı, imzalı son sürüm). Panel öteki modüllerin tablolarına dokunmaz; Raporlar ve Müşteriler'in dışa
   açtığı işlevlerden okur. 319: Raporlar ve rapor sayfası (imzalı PDF); 320: Uygunsuzluklar + Excel (tarayıcıda, panelin aldığı veriden);
   planlanan kontroller, sözleşmeler, personel belgeleri ve toplu indirme sonraki kalemde. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { firmaKunyesi } from "../../../server/ayar/ayar.ts";
import { musteriOzetleri } from "../../musteriler/server/musteriler.ts";
import {
  musteriAcikUygunsuzluk, musteriRaporlari, musteriRaporu, musteriUygunsuzluklari, type MusteriRaporu, type MusteriUygunsuzlugu, type MusteriUygunsuzlukSatiri,
} from "../../raporlar/server/musteri-baglanti.ts";

/** acikUygunsuz: sekmedeki açık uygunsuzluk sayısı */
export interface PanelBasligi { firma: string; musteri: { kisa: string; unvan: string } | null; tesisler: { id: string; ad: string }[]; acikUygunsuz: number }
export interface PanelRaporlari extends PanelBasligi { raporlar: MusteriRaporu[] }
export interface PanelUygunsuzluklari extends PanelBasligi { uygunsuzluklar: MusteriUygunsuzlukSatiri[] }

/** kabuğun ve listenin başlığı: firma adı, müşterinin kendisi ve görebildiği tesisler (müşteri rolünde yalnız kendisi döner) */
export async function panelBasligi(db: Sorgulayici): Promise<PanelBasligi> {
  const m = (await musteriOzetleri(db))[0] ?? null;
  return { firma: (await firmaKunyesi(db)).ad, musteri: m ? { kisa: m.kisa, unvan: m.unvan } : null, tesisler: m ? m.tesisler.map((t) => ({ id: t.id, ad: t.ad })) : [],
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

/** rapor sayfası; göremeyene null (başka müşterinin ya da imzasız rapor: var olduğu bile söylenmez) */
export async function panelRaporu(db: Sorgulayici, id: string): Promise<{ r: MusteriRaporu; uygunsuzluklar: MusteriUygunsuzlugu[] } | null> {
  return musteriRaporu(db, id);
}
