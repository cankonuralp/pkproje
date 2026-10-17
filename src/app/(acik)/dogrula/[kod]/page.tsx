/* RAPOR DOĞRULAMA (595 K8 — reisim: "Kanun cümlesi + rapor no + sayfa + doğrulama karekodu"): e-imzalı raporun alt şeridindeki karekod buraya
   gelir. Oturum istemez (kapı HMAC'li koddur, firma adresten); arama motoruna kapalı; imzalı sürümün kimliği (modül: raporlar/server/
   dogrula-sayfa.ts, ui/Dogrulama.tsx). 2026-10-17 (reisim: "rapor doğrulama ekranında raporun kendisi de gözüksün"): imzalı rapor kartın altında
   sayfanın içinde çizilir (kısa ömürlü jetonlu adresten — ./pdf/route.ts). */
import type { Metadata } from "next";
import { dogrulamaPdfAdresi, raporuDogrula } from "../../../../modules/raporlar/server/dogrula-sayfa";
import { DogrulamaKarti } from "../../../../modules/raporlar/ui/Dogrulama";
import { istekKiracisi } from "../../../../server/kiraci/istek";

export const metadata: Metadata = { title: { absolute: "Rapor doğrulama · probata" }, robots: { index: false, follow: false } };

export default async function DogrulamaSayfasi({ params }: { params: Promise<{ kod: string }> }) {
  const { kod } = await params;
  const kiraci = await istekKiracisi(), k = decodeURIComponent(kod);
  const d = await raporuDogrula(kiraci, k);
  const pdf = (d.durum === "gecerli" || d.durum === "yenisi_var") && !d.saklamaBitti ? dogrulamaPdfAdresi(kiraci, k) : null;
  return <DogrulamaKarti d={d} pdf={pdf} />;
}
