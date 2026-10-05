/* MÜŞTERİ PANELİNİN MUAYENE PERSONELİNE BAKTIĞI YER (modül 17 → 2; 0035). Müşteri paneli personel, özlük, eğitim ve atama tablolarına
   dokunmaz — müşteri rolünün bu tablolara hakkı da yok: iki veritabanı işlevi yalnız gerekeni döndürür (müşterinin tesislerine giden kişinin adı,
   mesleği, son gidişi; firmanın müşteriye açtığı belgeleri — firma ayarı "musteri_belge"). YALNIZ müşteri işleminde çağrılır
   (src/server/kimlik/istek.ts musteriIslemi → veritabanında probata_musteri). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { meslek, ozlukTurAd } from "../sema.ts";

/** yuklendi: açıklamasız özlük belgesi — ekranda tarihi yükleme tarihi olarak gösterilir (aynı adlı iki belge ayırt edilsin) */
export interface MusteriPersonelBelgesi { ad: string; dosya: string; tarih: string | null; gecerli: string | null; yuklendi: boolean }
export interface MusteriPersoneli { id: string; ad: string; meslek: string; son: string | null; tesisler: string[]; belgeler: MusteriPersonelBelgesi[] }

/** müşterinin tesislerine giden muayene personeli ve müşteriye açık belgeleri, en son giden üstte */
export async function musteriPersoneli(db: Sorgulayici): Promise<MusteriPersoneli[]> {
  const k = (await db.sorgu<{ personel_id: string; ad: string; meslek: string; son: string | null; tesisler: string[] }>(
    "SELECT personel_id::text, ad, meslek, son::text, tesisler::text[] AS tesisler FROM musteri_personeli()")).rows;
  if (!k.length) return [];
  const b = (await db.sorgu<{ personel_id: string; kaynak: "ozluk" | "egitim" | "atama"; tur: string; ad: string | null; dosya_id: string; tarih: string | null; gecerli: string | null }>(
    "SELECT personel_id::text, kaynak, tur, ad, dosya_id::text, tarih::text, gecerli::text FROM musteri_personel_belgeleri()")).rows;
  /* özlük: tür · açıklama (maket musteriyeAcikBelgeler) — aynı türden iki belge ayırt edilir; açıklamasız olanın alt satırında yükleme tarihi */
  const adi = (x: (typeof b)[number]) => x.kaynak === "ozluk" ? [ozlukTurAd(x.tur), x.ad?.trim()].filter(Boolean).join(" · ")
    : x.kaynak === "egitim" ? `${x.ad ?? "Eğitim"} sertifikası` : `Ekipman atama belgesi · ${x.ad ?? "—"}`;
  return k.map((p) => ({
    id: p.personel_id, ad: p.ad, meslek: meslek(p.meslek)?.ad ?? "—", son: p.son, tesisler: p.tesisler,
    belgeler: b.filter((x) => x.personel_id === p.personel_id)
      .map((x) => ({ ad: adi(x), dosya: x.dosya_id, tarih: x.tarih, gecerli: x.gecerli, yuklendi: x.kaynak === "ozluk" && !x.ad?.trim() }))
      .sort((x, y) => x.ad.localeCompare(y.ad, "tr") || (y.tarih ?? "").localeCompare(x.tarih ?? "") || x.dosya.localeCompare(y.dosya)),
  })).sort((x, y) => (y.son ?? "").localeCompare(x.son ?? "") || x.ad.localeCompare(y.ad, "tr"));
}
