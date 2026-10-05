/* MÜŞTERİ PANELİ DÜZENİ (0030; modül 17; maket musteri.html) — müşteri oturumu ister (yoksa girişe). Firmanın menüsü yok; üst çubukta muayene
   firmasının adı (logo yeri), tema ve kullanıcı (Çıkış yap). Veri her sayfada MÜŞTERİ işleminde okunur (veritabanında müşteri rolü). */
import type { ReactNode } from "react";
import { MusteriKabugu } from "../../components/kabuk/MusteriKabugu";
import { panelBasligi } from "../../modules/musteri-paneli/server/panel";
import { musteriIslemi, musteriOturumGerekli } from "../../server/kimlik/istek";

export default async function MusteriDuzeni({ children }: { children: ReactNode }) {
  const o = await musteriOturumGerekli();
  const b = await musteriIslemi(o, (db) => panelBasligi(db));
  return <MusteriKabugu firma={b.firma} kullanici={{ ad: o.ad, rol: o.musteriAd }}>{children}</MusteriKabugu>;
}
