import type { Metadata } from "next";
import { anaSayfa } from "../../modules/anasayfa/server/anasayfa";
import { AnaSayfaGorunumu } from "../../modules/anasayfa/ui/AnaSayfa";
import { ANA_SAYFA } from "../../modules/moduller";
import { hazirKurulum } from "../../modules/rapor-format/server/kurulum";
import { depo } from "../../server/dosya/depo";
import { duyuruBolumuMerkezden, duyuruTazeleSonra } from "../../server/duyuru/sonra";
import { oturumGerekli, oturumHavuzu, oturumIslemi } from "../../server/kimlik/istek";

/* başlık kalıbı ("%s · probata") düzenin KENDİ bölümündeki sayfaya uygulanmaz (Next) → tam başlık burada */
export const metadata: Metadata = { title: { absolute: `${ANA_SAYFA.ad} · probata` } };

/* Ana sayfa (maket anasayfa.html M1 2. tur; 332): girişten sonra herkes buraya gelir; içerik kişinin rollerine göre (bugünün işleri, bekleyenler,
   iş listesi), duyurular. Her sayı ilgili modülün yetkiye duyarlı işlevinden. Duyurular eskiyse (379: son okuma 6 saatten eski) okuma yanıttan
   SONRA arka planda başlar — sayfa beklemez. 437: firmanın ilk açılışında Bakanlık türleri kurulur (rapor-format/server/kurulum.ts; sonra yalnız
   kayıt okunur). FIRMA-VT FV3: kurulum kiracının veritabanında (oturumHavuzu). FV6 (§5.9, 2026-10-16): duyurular MERKEZDE okunur ve yazılır —
   bölüm merkezden (duyuruBolumuMerkezden), kiracının işleminden değil; böylece "tazele" her firmada aynı kayda bakar (önce kendi veritabanlı firmada
   hep doğru çıkıyordu, okumayı yalnız ortak firmanın sayfası tetikliyordu). */
export default async function AnaSayfa() {
  const o = await oturumGerekli();
  await hazirKurulum(oturumHavuzu(o), depo(), o.kiraci.firmaId);
  const v = await oturumIslemi(o, (db) => anaSayfa(db, o));
  const duyuru = await duyuruBolumuMerkezden();
  if (duyuru.tazele) duyuruTazeleSonra();
  return <AnaSayfaGorunumu v={{ ...v, duyuru }} />;
}
