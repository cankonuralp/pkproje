/* PLAN AÇ (maket plan-ac.html, M6) — yalnız plan açma yetkisi olan (Planlar "değiştirir"); öteki kişi yetkisiz ekranı görür. ?musteri= / ?tesis=
   ile müşteri ya da tesis sayfasından seçili gelir (yalnız ön seçim; tesisin bu firmada olduğu sunucuda denetlenir).
   2026-10-25 (belge doldurma): plan açılınca ön bilgilendirme formu yanıttan sonra bu sayfanın işlevinde basılır — Chromium ve maxDuration 60
   (next.config.ts, tests/pdf-paket.test.ts). */
import type { Metadata } from "next";
import { Yetkisiz } from "../../../../components/hata/Hata";
import { modulBul } from "../../../../modules/moduller";
import { planAcVerisi } from "../../../../modules/planlar/server/planlar";
import { PlanAcFormu } from "../../../../modules/planlar/ui/PlanAcFormu";
import { modulOturumu, oturumIslemi } from "../../../../server/kimlik/istek";

const MODUL = modulBul("planlar")!;
export const metadata: Metadata = { title: "Plan aç" };
export const maxDuration = 60;
const tek = (x: string | string[] | undefined) => (typeof x === "string" && /^[0-9a-f-]{36}$/.test(x) ? x : undefined);

export default async function Sayfa({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const o = await modulOturumu(MODUL.no);
  if (!o) return <Yetkisiz />;
  const v = await oturumIslemi(o, (db) => planAcVerisi(db, o));
  if (!v) return <Yetkisiz />;
  const q = await searchParams;
  return <PlanAcFormu veri={v} baslangic={{ musteri: tek(q.musteri), tesis: tek(q.tesis) }} />;
}
