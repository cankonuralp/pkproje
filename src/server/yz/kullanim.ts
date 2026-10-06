/* YAPAY ZEKÂ KULLANIMI (351; 0052, 0053) — kişi başı aylık maliyet (sınır firma ayarı "kişi başı aylık $"), okuma kaydı, firmada açık mı. Çekirdek: ham
   yazma burada (modül buradan çağırır). Hesap veritabanında işlemin bağlamından damgalanır (yz_koru); okuma / maliyet yalnız artar.
   AYIRMA (354, 350–351 incelemesi — sınır yarışı): çağrıdan önce kişinin ay satırı kilitlenir (FOR UPDATE), sınır maliyet + bekleyen ayırmalarla
   denetlenir, geçerse en kötü maliyet ayrılır; kayıtta gerçek maliyetle kapanır, ücretsiz biten çağrıda bırakılır, sonucu bilinmeyende harcamaya
   yazılır. Böylece eşzamanlı okumalar (iki sekme, iki cihaz, doğrudan istek) aynı eski maliyeti okuyup sınırı aşamaz. Ödenen çağrının maliyeti
   rapor artık yazılamaz olsa da (okuma sürerken silindi / gönderildi) kişinin kullanımına yazılır. */
import { ayarOku } from "../ayar/ayar.ts";
import { sirDurumu } from "../ayar/sir.ts";
import type { Sorgulayici } from "../db/kiraci.ts";
import type { OkunanSatir, YzModel } from "./okuma.ts";

const AY = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit" });
/** Türkiye saatiyle "YYYY-AA" */
export const yzAyi = (t = new Date()) => AY.format(t).slice(0, 7);
/** oturumdaki kişinin satırı (tetik de hesabı buradan damgalar) */
const BEN = "hesap_id = NULLIF(current_setting('app.hesap_id', true), '')::uuid";

/** fotoğraftan okuma bu firmada kullanılabilir mi: firma ayarında açık VE API anahtarı girilmiş */
export async function yzHazirMi(db: Sorgulayici): Promise<boolean> {
  return (await ayarOku(db, "yapay_zeka")).deger.acik && (await sirDurumu(db, "yapay_zeka_anahtari")).tanimli;
}

/** sınır (dolar; null ya da 0 = sınırsız — maket Y1 "sinirli = sinir > 0") var mı */
export const sinirli = (sinir: number | null): sinir is number => sinir !== null && sinir > 0;

/** oturumdaki kişi için ayırma: satır kilitlenir; sınır doluysa (maliyet + bekleyen ayırmalar ≥ sınır) false, değilse `ust` ayrılır */
export async function yzAyir(db: Sorgulayici, ay: string, sinir: number | null, ust: number): Promise<boolean> {
  /* satır kilidi: eşzamanlı ikinci ayırma birincinin işlemi bitene kadar bekler, sonra onun ayırmasını görür; ayın ilk okumasında satır önce açılır */
  const SATIR = `SELECT maliyet::text AS m, ayrilan::text AS a FROM yz_kullanim WHERE ${BEN} AND ay = $1 FOR UPDATE`;
  let r = (await db.sorgu<{ m: string; a: string }>(SATIR, [ay])).rows[0];
  if (!r) {
    await db.sorgu("INSERT INTO yz_kullanim (ay) VALUES ($1) ON CONFLICT (firma_id, hesap_id, ay) DO NOTHING", [ay]);
    r = (await db.sorgu<{ m: string; a: string }>(SATIR, [ay])).rows[0];
  }
  if (!r) throw new Error("yapay zekâ kullanım satırı bulunamadı");
  if (sinirli(sinir) && Number(r.m) + Number(r.a) >= sinir * 1e6) return false;
  await db.sorgu(`UPDATE yz_kullanim SET ayrilan = ayrilan + $2 WHERE ${BEN} AND ay = $1`, [ay, ust]);
  return true;
}

/** ayırmayı kapat (çağrı cevapsız bitti): `ucretli` — sonucu bilinmiyor (zaman aşımı), ayrılan tutar harcamaya ve bir okuma sayılır; değilse bırakılır */
export async function yzAyirmaBirak(db: Sorgulayici, ay: string, ust: number, ucretli: boolean): Promise<void> {
  await db.sorgu(`UPDATE yz_kullanim SET ayrilan = greatest(ayrilan - $2, 0), maliyet = maliyet + $3, okuma = okuma + $4 WHERE ${BEN} AND ay = $1`,
    [ay, ust, ucretli ? ust : 0, ucretli ? 1 : 0]);
}

/** bir okuma: ayırma gerçek maliyetle kapanır (kişinin aylık kullanımı artar), okuma kaydedilir (aynı işlemde) */
export async function yzOkumaYaz(db: Sorgulayici, o: { ay: string; ust: number; raporId: string; bolum: string; model: YzModel; oneri: OkunanSatir[]; giris: number; cikis: number; maliyet: number }): Promise<void> {
  await db.sorgu(
    `INSERT INTO yz_kullanim (ay, okuma, maliyet) VALUES ($1, 1, $2)
     ON CONFLICT (firma_id, hesap_id, ay) DO UPDATE SET okuma = yz_kullanim.okuma + 1, maliyet = yz_kullanim.maliyet + EXCLUDED.maliyet,
       ayrilan = greatest(yz_kullanim.ayrilan - $3, 0)`, [o.ay, o.maliyet, o.ust]);
  await db.sorgu("INSERT INTO yz_okuma (rapor_id, bolum, model, oneri, giris, cikis, maliyet) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [o.raporId, o.bolum, o.model, JSON.stringify(o.oneri), o.giris, o.cikis, o.maliyet]);
}

export interface YzKisiKullanimi { id: string; ad: string; okuma: number; maliyet: number }
/** firmanın bu ayki kişi başı kullanımı (maket Y1 "Bu ay kullanım (kişi başına)"): harcaması çoktan aza; maliyet milyonda bir dolar */
export async function yzAyKullanimi(db: Sorgulayici, ay: string): Promise<YzKisiKullanimi[]> {
  return (await db.sorgu<{ id: string; ad: string; okuma: number; m: string }>(
    `SELECT h.id::text AS id, h.ad, k.okuma, k.maliyet::text AS m FROM yz_kullanim k JOIN hesap h ON h.id = k.hesap_id
     WHERE k.ay = $1 AND (k.okuma > 0 OR k.maliyet > 0) ORDER BY k.maliyet DESC, h.ad`, [ay])).rows.map((r) => ({ id: r.id, ad: r.ad, okuma: r.okuma, maliyet: Number(r.m) }));
}
