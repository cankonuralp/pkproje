/* ONAYLAR › TALEPLER (477; reisim 2026-10-10, Talepler–Onaylar kararları T1 · T2): kişinin karar verebildiği bekleyen izin talepleri ve masraf
   formları; ?sec=<izin|masraf>-<kimlik> ayrıntıyı açar. Kapı Onaylar düzeyi; karar veremeyen Onaylar'ın kendi sayfasına döner. Liste ve karar
   yetkisi sunucuda (talepler/server/talepler.ts onayTalepleri, talepKarar). */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { modulBul } from "../../../../modules/moduller";
import { onayListeleri } from "../../../../modules/onaylar/server/onaylar";
import { TalepOnaylari } from "../../../../modules/onaylar/ui/TalepOnaylari";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("onaylar")!;
export const metadata: Metadata = { title: "Talepler · Onaylar" };

export default async function Sayfa({ searchParams }: { searchParams: Promise<{ sec?: string | string[] }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const v = await oturumIslemi(o, (db) => onayListeleri(db, o));
  if (!v) return <Yetkisiz />;
  if (!v.talepOnaylar) redirect("/onaylar");
  const { sec } = await searchParams;
  return <TalepOnaylari v={v} sec={typeof sec === "string" ? sec.slice(0, 80) : null} />;
}
