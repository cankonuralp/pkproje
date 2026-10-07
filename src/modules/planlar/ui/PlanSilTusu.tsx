"use client";
/* PLANI SİL (372): raporu, faturası, gideri olmayan, tamamlanmamış planda yalnız yöneticiye (sunucu söyler). Ortak Sil tuşu; silinince Planlar'a. */
import { SilTusu } from "../../../components/sil/SilTusu";
import { planSilEylemi } from "./eylemler";

export function PlanSilTusu({ id, no }: { id: string; no: string }) {
  return <SilTusu ad={no} baslik="Planı sil" yanEtki="ekip, ekipman satırları ve proje notları da silinir; ekipmanlar tesiste kalır" sil={() => planSilEylemi(id)} donus="/planlar" />;
}
