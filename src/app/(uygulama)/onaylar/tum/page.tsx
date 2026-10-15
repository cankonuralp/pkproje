/* ONAYLAR › TÜM RAPORLAR (maket onaylar.html #/tum — 190): branşın bütün raporları; satır onay ekranını açar (Durumu değiştir, Onayı geri al).
   566: liste SUNUCUDA sayfalı (tumRaporlarSayfasi — ilk sayfa burada, sonrakiler eylemle). */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { modulBul } from "../../../../modules/moduller";
import { onayListeleri, tumRaporlarSayfasi } from "../../../../modules/onaylar/server/onaylar";
import { TumRaporlar } from "../../../../modules/onaylar/ui/OnayListesi";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("onaylar")!;
export const metadata: Metadata = { title: "Tüm raporlar" };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const x = await oturumIslemi(o, async (db) => ({ v: await onayListeleri(db, o), ilk: await tumRaporlarSayfasi(db, o, {}) }));
  if (!x.v) return <Yetkisiz />;
  if (!x.v.yonetici || !x.ilk) return <Yetkisiz />;   // tüm raporlar yöneticinin (C5: denetçi yalnız imzasını bekleyenleri)
  return <TumRaporlar v={x.v} ilk={x.ilk} />;
}
