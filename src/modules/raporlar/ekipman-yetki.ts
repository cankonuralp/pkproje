/* RAPORLAR › EKİPMANLAR SEKMESİ — YETKİ (saf; 2026-11-16, reisim: "teknik yönetici tarafında gözüksün, o silebilsin sadece", "herkesinkini raporlar
   ekranında bir sekme de görsün"). Sekmeyi yalnız TEKNİK YÖNETİCİ görür (mekanik yönetici mekanik türlerin, elektrik yönetici elektrik türlerin
   ekipmanını); firma yöneticisi, planlama, denetçi görmez. Silme de yalnız onun, yalnız kendi branşında. Kilit tests/ekipman-yetki.test.ts. */
import { ROL_BRANS, type Rol } from "../../server/yetki/tanim.ts";

export type Brans = "m" | "e";

/** kişinin teknik yöneticisi olduğu branşlar (rollerinden; sıra mekanik · elektrik, tekrar yok) */
export function yonetilenBranslar(roller: readonly Rol[]): Brans[] {
  const l = new Set(roller.map((r) => ROL_BRANS[r]).filter((b): b is Brans => !!b));
  return (["m", "e"] as const).filter((b) => l.has(b));
}

/** bu branştaki ekipmanı yönetir mi (görür ve kullanılmamışsa siler) */
export const bransiYonetir = (roller: readonly Rol[], brans: Brans): boolean => yonetilenBranslar(roller).includes(brans);
