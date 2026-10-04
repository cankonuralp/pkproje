/* personel düzenle (maket personel.html #/p/<id>/duzenle) — yalnız "değiştirir" düzeyi; kayıt bulunamazsa / göremiyorsa bulunamadı */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Yetkisiz } from "../../../../../components/hata/Hata";
import { modulBul } from "../../../../../modules/moduller";
import { personelKarti } from "../../../../../modules/personel/server/personel";
import { PersonelFormu } from "../../../../../modules/personel/ui/PersonelFormu";
import { modulOturumu, oturumIslemi } from "../../../../../server/kimlik/istek";
import { duzey } from "../../../../../server/yetki/canDo";
import { ROL_ADI, type ModulAnahtari } from "../../../../../server/yetki/tanim";

const MODUL = modulBul("personel")!;
export const metadata: Metadata = { title: "Personel düzenle" };

export default async function Sayfa({ params }: { params: Promise<{ id: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  if (duzey(o, MODUL.no as ModulAnahtari) !== "yaz") return <Yetkisiz />;
  const { id } = await params;
  const p = await oturumIslemi(o, (db) => personelKarti(db, o, id));
  if (!p) notFound();
  return <PersonelFormu d={{
    id: p.id, surum: p.surum, ad: p.ad, eposta: p.eposta ?? "", imzaTel: p.imzaTel ?? "", basla: p.basla, meslek: p.meslek, meslekMetin: p.meslekMetin ?? "",
    diploma: p.diploma ?? "", oda: p.oda ?? "", ekipnet: p.ekipnet ?? "", roller: p.hesap ? p.hesap.roller.map((r) => ROL_ADI[r]).join(", ") : null,
  }} />;
}
