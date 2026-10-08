/* ÇEVRİMDIŞI KUYRUKTAN GELEN RAPOR İŞLERİ (392; ARKA-UC §4.3, maket Z4: kuyruğa girenler rapor Kaydet ve Onaya gönder) — /api/islem buradan
   çağırır. İş modülün kendi işlevidir (yetki, ENGEL'ler, sürüm kilidi, denetim izi aynen; bağlantılıyken düğmenin yaptığıyla aynı): cihazın
   gördüğü sürüm başka yerde değiştiyse "cakisma" döner, sessiz ezme yok (09-D1). Girdi: cihazın gördüğü sürüm + formun o anki hâli.
   398: bağlantısız çekilen FOTOĞRAF (rapor.foto) — fotoğraf eklemek EKLER, hiçbir şeyi ezmez: raporun o anki sürümüyle eklenir (cihazın gördüğü
   sürüm aranmaz; sınır, yer, tür, EXIF, yetki fotoEkle'de aynen). Sonuçta önceki / sonraki sürüm döner: cihaz aynı raporun bekleyen Kaydet'ini
   yalnız sürüm KENDİ fotoğrafıyla değiştiyse yeni sürüme taşır — arada başkası değiştirdiyse çakışma yine görünür. */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import type { Depo } from "../../../server/dosya/depo.ts";
import { FotoIslemGirdisi } from "../sema.ts";
import { fotoEkle, onayaGonder, raporKaydet, type Kisi, type RaporYazma } from "./raporlar.ts";

export const RAPOR_ISLEM_TURLERI = ["rapor.kaydet", "rapor.gonder", "rapor.foto"] as const;
export type RaporIslemTuru = (typeof RAPOR_ISLEM_TURLERI)[number];
/** fotoğrafta: rapor hangi sürümden hangisine geçti (cihaz bekleyen işlerini buna göre taşır) */
export type RaporIslemSonucu = RaporYazma | (Extract<RaporYazma, { durum: "tamam" }> & { surum: { once: number; sonra: number } });

/** çakışmada cihaza raporun güncel sürümü: kullanıcı "benimkini yaz" derse iş bununla YENİ kimlikle gider (açık seçim). Çakışma yalnız raporu
    yazabilene döner (yetki işten önce denetlendi); silinmiş raporda null */
export async function raporGuncelSurum(db: Sorgulayici, rapor: string): Promise<number | null> {
  return (await db.sorgu<{ surum: number }>("SELECT surum FROM rapor WHERE id = $1 AND silindi IS NULL", [rapor])).rows[0]?.surum ?? null;
}

/** `dosya`: fotoğrafın yazılacağı depo ve oturumun firması (fotoğraf işi için) */
export async function raporIslemi(db: Sorgulayici, dosya: { depo: Depo; firmaId: string }, kim: Kisi, tur: RaporIslemTuru, rapor: string, surum: number,
  girdi: unknown): Promise<RaporIslemSonucu> {
  if (tur === "rapor.kaydet") return raporKaydet(db, kim, rapor, surum, girdi);
  if (tur === "rapor.gonder") return onayaGonder(db, kim, rapor, surum, girdi);
  const g = FotoIslemGirdisi.safeParse(girdi);
  if (!g.success) return { durum: "gecersiz", hatalar: { foto: "Fotoğraf okunamadı." } };
  const once = await raporGuncelSurum(db, rapor);
  if (once === null) return { durum: "yok" };
  const r = await fotoEkle(db, dosya.depo, kim, dosya.firmaId, rapor, once, { bolum: g.data.bolum, madde: g.data.madde },
    { ad: g.data.ad, bayt: new Uint8Array(Buffer.from(g.data.veri, "base64")) });
  if (r.durum !== "tamam") return r;
  return { ...r, surum: { once, sonra: (await raporGuncelSurum(db, rapor)) ?? once } };
}
