/* UYARILAR (maket uyarilar.html M10; 331; modül 20): kalibrasyon bitişi, eğitim tekrarı, araç belgesi — kayıtlardan türetilir, yalnız ekranda.
   Denetçi yalnız kendisininkileri görür. Görmeyen: yetkisiz ekranı. Adres ?tur=kalibrasyon|egitim|arac ilgili çiple açar. */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../components/hata/Hata";
import { modulBul } from "../../../modules/moduller";
import { uyariListesi } from "../../../modules/uyarilar/server/uyarilar";
import { ADRES_TUR } from "../../../modules/uyarilar/sema";
import { UyariListesi } from "../../../modules/uyarilar/ui/Uyarilar";
import { modulOturumu, oturumIslemi } from "../../../server/kimlik/istek";

const MODUL = modulBul("uyarilar")!;
export const metadata: Metadata = { title: MODUL.ad };

export default async function Sayfa({ searchParams }: { searchParams: Promise<{ tur?: string | string[] }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const l = await oturumIslemi(o, (db) => uyariListesi(db, o));
  if (!l) return <Yetkisiz />;
  const { tur } = await searchParams;
  return <UyariListesi l={l} tur={typeof tur === "string" && Object.hasOwn(ADRES_TUR, tur) ? ADRES_TUR[tur] : undefined} />;
}
