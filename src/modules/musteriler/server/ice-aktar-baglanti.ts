/* MÜŞTERİLER ↔ FİRMA AYARLARI (TOPLU İÇE AKTARMA) BAĞLANTISI (337; maket firma-ayarlari "Toplu içe aktarma (ilk kurulum)" — müşteriler ve tesisler).
   Firma ayarları müşteri ve tesis tablolarına dokunmaz: kayıtlı müşterileri / tesisleri ve kullanılan e-postaları buradan okur, yeni kayıtları
   buradan açar (güvenli yazıcı: denetim izi). Değerler çağıranda veritabanı biçimine göre doğrulanmış (firma-ayarlari/ice-aktar.ts). Yetki
   ÇAĞIRANDA (Firma ayarları "değiştirir"). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ekle, tablo, type Iz } from "../../../server/db/yazici.ts";
import { kisaAd } from "../sema.ts";

const MUSTERI = tablo({ ad: "musteri", sutunlar: ["unvan", "kisa", "vd", "vno", "eposta"] });
const TESIS = tablo({ ad: "tesis", sutunlar: ["musteri_id", "ad", "adres", "il", "ilce", "sgk"] });

/** kayıtlı müşteriler ve tesisler (pasifler işaretli) + firmada kullanılan e-postalar (müşteri, personel girişi, müşteri girişi — 0030 / 0033) */
export async function musteriIceAktarimBilgisi(db: Sorgulayici): Promise<{
  musteriler: { id: string; unvan: string; kisa: string; vno: string | null; pasif: boolean }[];
  tesisler: { id: string; musteriId: string; ad: string; pasif: boolean }[]; epostalar: string[];
}> {
  const musteriler = (await db.sorgu<{ id: string; unvan: string; kisa: string; vno: string | null; pasif: boolean }>(
    "SELECT id::text, unvan, kisa, vno, pasif IS NOT NULL AS pasif FROM musteri")).rows;
  const tesisler = (await db.sorgu<{ id: string; musteri_id: string; ad: string; pasif: boolean }>(
    "SELECT id::text, musteri_id::text, ad, pasif IS NOT NULL AS pasif FROM tesis")).rows.map((t) => ({ id: t.id, musteriId: t.musteri_id, ad: t.ad, pasif: t.pasif }));
  const epostalar = (await db.sorgu<{ e: string }>(
    "SELECT lower(eposta) AS e FROM musteri WHERE eposta IS NOT NULL UNION SELECT lower(eposta) FROM hesap WHERE eposta IS NOT NULL UNION SELECT lower(eposta) FROM musteri_hesap")).rows.map((x) => x.e);
  return { musteriler, tesisler, epostalar };
}

/** yeni müşteri (kısa ad ünvanın ilk iki sözcüğü — müşteri formuyla aynı) */
export async function musteriIceAktar(db: Sorgulayici, iz: Iz, m: { unvan: string; vd: string | null; vno: string | null; eposta: string | null }): Promise<string> {
  return (await ekle(db, MUSTERI, { unvan: m.unvan, kisa: kisaAd({ unvan: m.unvan, kisa: null }), vd: m.vd, vno: m.vno, eposta: m.eposta }, iz)).id;
}

/** müşterinin altına yeni tesis */
export async function tesisIceAktar(db: Sorgulayici, iz: Iz, musteriId: string, t: { ad: string; adres: string; il: string; ilce: string | null; sgk: string | null }): Promise<string> {
  return (await ekle(db, TESIS, { musteri_id: musteriId, ad: t.ad, adres: t.adres, il: t.il, ilce: t.ilce, sgk: t.sgk }, iz)).id;
}
