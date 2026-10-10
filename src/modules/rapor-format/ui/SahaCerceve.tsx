"use client";
/* SAHA ÇERÇEVESİ (472; 483). Çerçeve sayfasında (src/app/(cerceve)/…/saha) gerçek saha ekranını örnek raporla çizer — denetçinin sahada
   göreceği gibi; format kurucusu (SahaGorunumu.tsx) ile iletiyle konuşur:
   · gelen  { tur: "probata-format", tanim, tema, temizle? } — kurucunun canlı taslağı (şemadan geçmeyen tanım alınmaz), tema;
   · giden  { tur: "probata-hazir" } açılınca · { tur: "probata-durum", eksik, kusur } denemenin canlı sayıları (kullanım kutusu).
   483 (reisim 2026-10-10: "rapor düzenlemede sadece saha ekranı gözüksün o ekranda düzenleme yapılamasın belliki beceremiyeceğiz bu işi istediğim
   gibi yapamamışsın çünkü sadece sahada personelin nasıl göreceği gözüksün"): 473'ün yerinde düzenlemesi (ad yaz, ekle, çıkar, taşı, alt başlık)
   ve "probata-degis" iletisi KALKTI — format yalnız kâğıtta düzenlenir; burası salt önizleme (denetçi gibi denenir, hiçbir şey kaydedilmez).
   İletiler YALNIZ aynı kökenden ve yalnız üst pencereden alınır / üst pencereye gönderilir. */
import { useCallback, useEffect, useMemo, useState } from "react";
import { FormatTanimi } from "../../../format/tanim";
import { SahaRaporu } from "../../raporlar/ui/SahaRaporu";
import type { SahaRaporu as SahaRaporuVerisi } from "../../raporlar/server/raporlar";
import { ilkCevaplar } from "../../raporlar/ornek";

export interface FormatIletisi { tur: "probata-format"; tanim: unknown; tema?: string; temizle?: number }

export function SahaCerceve({ v }: { v: SahaRaporuVerisi }) {
  const [tanim, setTanim] = useState(v.tanim);
  const [temiz, setTemiz] = useState(0);
  useEffect(() => {
    if (window.parent === window) return;
    const al = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.source !== window.parent) return;
      const m = e.data as Partial<FormatIletisi> | null;
      if (!m || typeof m !== "object" || m.tur !== "probata-format") return;
      const t = FormatTanimi.safeParse(m.tanim);
      if (!t.success) return;
      setTanim(t.data);
      if (m.tema === "acik" || m.tema === "koyu") document.documentElement.setAttribute("data-tema", m.tema);
      if (typeof m.temizle === "number") setTemiz(m.temizle);
    };
    window.addEventListener("message", al);
    window.parent.postMessage({ tur: "probata-hazir" }, location.origin);
    return () => window.removeEventListener("message", al);
  }, []);
  const durum = useCallback((x: { eksik: number; kusur: number }) => {
    if (window.parent !== window) window.parent.postMessage({ tur: "probata-durum", ...x }, location.origin);
  }, []);
  /* başlangıç cevapları güncel tanımdan ("Denemeyi temizle" ekranı yeniden kurar — kâğıtta eklenen maddeler de "Uygun" gelir) */
  const gorunum = useMemo(() => ({ ...v, tanim, cevaplar: ilkCevaplar(tanim) }), [v, tanim]);
  return <SahaRaporu key={temiz} v={gorunum} deneme={{ durum }} />;
}
