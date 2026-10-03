import type { Metadata } from "next";
import { ModulSayfasi } from "../components/modul/ModulSayfasi";
import { ANA_SAYFA } from "../modules/moduller";

/* başlık kalıbı ("%s · probata") düzenin KENDİ bölümündeki sayfaya uygulanmaz (Next) → tam başlık burada */
export const metadata: Metadata = { title: { absolute: `${ANA_SAYFA.ad} · probata` } };

/* Ana sayfa (maket anasayfa.html): role göre bugünün işleri, bekleyenler, duyurular — K4'te. */
export default function AnaSayfa() {
  return <ModulSayfasi modul={ANA_SAYFA} />;
}
