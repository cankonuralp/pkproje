import type { Metadata } from "next";
import { ModulSayfasi } from "../components/modul/ModulSayfasi";
import { modulBul } from "../modules/moduller";

const PLANLAR = modulBul("")!;

/* başlık kalıbı ("%s · probata") düzenin KENDİ bölümündeki sayfaya uygulanmaz (Next) → tam başlık burada */
export const metadata: Metadata = { title: { absolute: `${PLANLAR.ad} · probata` } };

/* Ana sayfa = Planlar (referans ekran). Ekranı Planlama modülü kaleminde yapılır (faz 1 sırası, pkproje.md §3.3). */
export default function AnaSayfa() {
  return <ModulSayfasi modul={PLANLAR} />;
}
