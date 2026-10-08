/* BAĞLANTISIZ YENİ RAPOR (405; ARKA-UC §4.1): plan başına önceden inen sayfa — planın raporu olmayan ekipmanları ve formatları; ekipman adres
   işaretinden (#<ekipman>) tarayıcıda seçilir. Kapı modül 14 (Raporlar); rapor açabilme (plandaki denetçi, rapor_olustur) sunucuda —
   yeniRaporPaketi açamayana null döner. Burada hiçbir şey yazılmaz: rapor bağlantı gelince kuyruktan açılır. */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Yetkisiz } from "../../../../../components/hata/Hata";
import { modulBul } from "../../../../../modules/moduller";
import { yeniRaporPaketi } from "../../../../../modules/raporlar/server/raporlar";
import { YeniRaporEkrani } from "../../../../../modules/raporlar/ui/YeniRaporEkrani";
import { modulOturumu, oturumIslemi } from "../../../../../server/kimlik/istek";

const MODUL = modulBul("raporlar")!;
export const metadata: Metadata = { title: "Yeni rapor" };

export default async function Sayfa({ params }: { params: Promise<{ plan: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const { plan } = await params;
  const p = await oturumIslemi(o, (db) => yeniRaporPaketi(db, o, plan));
  if (!p) notFound();
  return <YeniRaporEkrani p={p} />;
}
