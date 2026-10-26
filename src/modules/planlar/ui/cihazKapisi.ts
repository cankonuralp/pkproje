"use client";
/* PLAN İÇİNDE RAPOR AÇMA KAPISI — CİHAZDA (2026-10-26; sema.ts raporKapisi). Sayfa cihaza inerken sunucunun gömdüğü izin, plan günü ve günlük
   süre bilgisi sahada bayatlar: bağlantısız kabulden sonra "Rapor oluştur" görünmüyor, ertesi gün "plan günü gelmedi" kalıyordu. Burada aynı
   karar o an verilir: cihazda bekleyen kabul "kabul edilmiş" sayılır, tarih cihazın bugünü; günlük süre (mesai) yalnız sayfanın indiği gün geçerli.
   Sunucu her işte aynı kuralı yeniden denetler. */
import { useSyncExternalStore } from "react";
import { kuyrukAbone, kuyrukAnlik, kuyrukSunucuAnlik } from "../../../components/cevrimdisi/kuyruk";
import { cihazBugunu, raporKapisi, type PlanDurumu } from "../sema";
import type { PlanIci } from "../server/plan-ici";

const gunAbone = (f: () => void) => { const t = window.setInterval(f, 60_000); return () => window.clearInterval(t); };

export function useCihazKapisi(v: PlanIci): { durum: PlanDurumu; olustur: boolean; erken: boolean; mesai: PlanIci["mesai"] } {
  const bugun = useSyncExternalStore(gunAbone, cihazBugunu, () => v.bugun);
  const k = useSyncExternalStore(kuyrukAbone, kuyrukAnlik, kuyrukSunucuAnlik);
  const kabulBekliyor = v.durum === "bekliyor" && k.isler.some((x) => x.kayit === v.kart.id && x.tur === "plan.kabul");
  const durum: PlanDurumu = kabulBekliyor ? "kabul" : v.durum;
  const erken = v.kart.baslangic > bugun;
  return {
    durum, erken,
    olustur: v.izin.raporYetkili && raporKapisi({ durum: v.durum, baslangic: v.kart.baslangic }, bugun, kabulBekliyor) === null,
    mesai: bugun === v.bugun ? v.mesai : null,
  };
}
