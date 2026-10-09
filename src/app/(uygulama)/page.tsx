import type { Metadata } from "next";
import { anaSayfa } from "../../modules/anasayfa/server/anasayfa";
import { AnaSayfaGorunumu } from "../../modules/anasayfa/ui/AnaSayfa";
import { ANA_SAYFA } from "../../modules/moduller";
import { hazirKurulum } from "../../modules/rapor-format/server/kurulum";
import { havuz } from "../../server/db/havuz";
import { depo } from "../../server/dosya/depo";
import { duyuruTazeleSonra } from "../../server/duyuru/sonra";
import { oturumGerekli, oturumIslemi } from "../../server/kimlik/istek";

/* başlık kalıbı ("%s · probata") düzenin KENDİ bölümündeki sayfaya uygulanmaz (Next) → tam başlık burada */
export const metadata: Metadata = { title: { absolute: `${ANA_SAYFA.ad} · probata` } };

/* Ana sayfa (maket anasayfa.html M1 2. tur; 332): girişten sonra herkes buraya gelir; içerik kişinin rollerine göre (bugünün işleri, bekleyenler,
   iş listesi), duyurular. Her sayı ilgili modülün yetkiye duyarlı işlevinden. Duyurular eskiyse (379: son okuma 6 saatten eski) okuma yanıttan
   SONRA arka planda başlar — sayfa beklemez. 437: firmanın ilk açılışında Bakanlık türleri kurulur (rapor-format/server/kurulum.ts; sonra yalnız
   kayıt okunur). */
export default async function AnaSayfa() {
  const o = await oturumGerekli();
  await hazirKurulum(havuz(), depo(), o.kiraci.firmaId);
  const v = await oturumIslemi(o, (db) => anaSayfa(db, o));
  if (v.duyuru.tazele) duyuruTazeleSonra();
  return <AnaSayfaGorunumu v={v} />;
}
