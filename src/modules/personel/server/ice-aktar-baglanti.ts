/* PERSONEL ↔ FİRMA AYARLARI (TOPLU İÇE AKTARMA) BAĞLANTISI (337; maket "Toplu içe aktarma (ilk kurulum)" — personel). Kayıtlı adlar (uyarı),
   e-postalar (iş e-postası firmada tek kişide) ve yeni personel buradan. Giriş hesabı açılmaz (Personel'den, karar 33). Yetki ÇAĞIRANDA (Firma
   ayarları "değiştirir"). */
import type { Sorgulayici } from "../../../server/db/kiraci.ts";
import { ekle, tablo, type Iz } from "../../../server/db/yazici.ts";

const PERSONEL = tablo({ ad: "personel", sutunlar: ["ad", "eposta", "basla", "meslek", "diploma", "oda", "ekipnet"] });

export async function personelIceAktarimBilgisi(db: Sorgulayici): Promise<{ adlar: string[]; epostalar: string[] }> {
  const l = (await db.sorgu<{ ad: string; eposta: string | null }>("SELECT ad, lower(eposta) AS eposta FROM personel")).rows;
  return { adlar: l.map((x) => x.ad), epostalar: l.flatMap((x) => (x.eposta ? [x.eposta] : [])) };
}

export async function personelIceAktar(db: Sorgulayici, iz: Iz, p: { ad: string; meslek: string; basla: string; eposta: string | null; diploma: string | null;
  oda: string | null; ekipnet: string | null }): Promise<string> {
  return (await ekle(db, PERSONEL, { ad: p.ad, eposta: p.eposta, basla: p.basla, meslek: p.meslek, diploma: p.diploma, oda: p.oda, ekipnet: p.ekipnet }, iz)).id;
}
