/* PERSONEL (maket personel.html #/) — liste. Kapı sunucuda (modül 2); veri modül işlevinden (yetki ve kiracı içeride). */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../components/hata/Hata";
import { TusBaglanti } from "../../../components/tus/Tus";
import { modulBul } from "../../../modules/moduller";
import { eksikBilgi, personelListesi } from "../../../modules/personel/server/personel";
import { PersonelListesi } from "../../../modules/personel/ui/PersonelListesi";
import { modulOturumu, oturumIslemi } from "../../../server/kimlik/istek";
import { duzey } from "../../../server/yetki/canDo";
import type { ModulAnahtari } from "../../../server/yetki/tanim";

const MODUL = modulBul("personel")!;
export const metadata: Metadata = { title: MODUL.ad };

export default async function Sayfa() {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const liste = (await oturumIslemi(o, (db) => personelListesi(db, o))) ?? [];
  return (
    <>
      <PersonelListesi kayitlar={liste.map((p) => ({ ...p, eksik: eksikBilgi(p) }))}
        tuslar={duzey(o, MODUL.no as ModulAnahtari) === "yaz" && <TusBaglanti tur="birincil" href="/personel/yeni" ikon="plus">Personel ekle</TusBaglanti>} />
    </>
  );
}
