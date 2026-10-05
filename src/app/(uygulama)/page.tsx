import type { Metadata } from "next";
import { anaSayfa } from "../../modules/anasayfa/server/anasayfa";
import { AnaSayfaGorunumu } from "../../modules/anasayfa/ui/AnaSayfa";
import { ANA_SAYFA } from "../../modules/moduller";
import { oturumGerekli, oturumIslemi } from "../../server/kimlik/istek";

/* başlık kalıbı ("%s · probata") düzenin KENDİ bölümündeki sayfaya uygulanmaz (Next) → tam başlık burada */
export const metadata: Metadata = { title: { absolute: `${ANA_SAYFA.ad} · probata` } };

/* Ana sayfa (maket anasayfa.html M1 2. tur; 332): girişten sonra herkes buraya gelir; içerik kişinin rollerine göre (bugünün işleri, bekleyenler,
   iş listesi), duyuru kaynakları. Her sayı ilgili modülün yetkiye duyarlı işlevinden. */
export default async function AnaSayfa() {
  const o = await oturumGerekli();
  const v = await oturumIslemi(o, (db) => anaSayfa(db, o));
  return <AnaSayfaGorunumu v={v} />;
}
