/* EKİPMAN TÜRLERİ (maket ekipman-turleri.html #/ · #/elektrik) — katalog, branş sekmesi adresten (?brans=e). Kapı sunucuda (modül 5). */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../components/hata/Hata";
import { turDegistirir, turListesi } from "../../../modules/ekipman-turleri/server/turler";
import { TurListesi } from "../../../modules/ekipman-turleri/ui/TurListesi";
import { modulBul } from "../../../modules/moduller";
import { modulOturumu, oturumIslemi } from "../../../server/kimlik/istek";

const MODUL = modulBul("ekipman-turleri")!;
export const metadata: Metadata = { title: MODUL.ad };

export default async function Sayfa({ searchParams }: { searchParams: Promise<{ brans?: string }> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const brans = (await searchParams).brans === "e" ? "e" : "m";
  const liste = (await oturumIslemi(o, (db) => turListesi(db, o))) ?? [];
  const sayilar = { m: liste.filter((t) => t.brans === "m").length, e: liste.filter((t) => t.brans === "e").length };
  return <TurListesi key={brans} kayitlar={liste.filter((t) => t.brans === brans)} brans={brans} sayilar={sayilar} ekleyebilir={turDegistirir(o)} />;
}
