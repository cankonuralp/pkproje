"use client";
/* YAN MENÜ SAYISININ SEBEBİ — tek üretici (480; reisim 2026-10-10: "dökümanlarda 1 uyarı gözüküyor ama … tüm siteyi komple tara bir sürü böyle
   eksikler var"; anayasa 0.8 hata = sınıf, 2.8 sayaç dürüst). Yan menüdeki balon bir modülde sayı gösteriyorsa o modülün sayfa başlığının
   (SayfaBasi) altında sebebi yazar: "2 rapor onayınızı bekliyor · 1 talep kararınızı bekliyor" — her sebep listelendiği sayfaya bağlantı.
   Sebebin kendi sayfası onu zaten gösteriyorsa (Uyarılar, Ölçüm cihazları şeridi, Sözleşmeler şeridi, Onaylar'ın sekmeleri, Eğitimler şeridi)
   o sayfada çizilmez. Sayılar balonla aynı kaynaktan (anasayfa/server/takip.ts; kabuk sayfa açılınca ister). Kabuk dışında (vitrin, müşteri
   paneli) bağlam boştur, şerit çizilmez. Saf parçalar takip.ts'te. */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, Fragment, useContext } from "react";
import { Serit } from "../serit/Serit";
import { sayfaNedenleri, temizYol, yolunModulu, type KabukTakip } from "./takip";
import stil from "./TakipSeridi.module.css";

export type { KabukTakip, TakipNedeni } from "./takip";
export const TakipBaglami = createContext<KabukTakip>({});

export function TakipSeridi() {
  const balon = useContext(TakipBaglami);
  const yol = temizYol(usePathname() ?? "/");
  const m = yolunModulu(yol);
  const l = m ? sayfaNedenleri(balon[m.no]?.neden, yol) : [];
  if (!m || !l.length) return null;
  return (
    <div className={stil.kap}>
      <Serit tur={l.some((n) => n.tur === "kirmizi") ? "hata" : "uyari"}>
        <span className={stil.etiket}>Yan menüdeki {m.ad} sayısı:</span>{" "}
        {l.map((n, i) => (
          <Fragment key={`${n.yer}-${n.metin}`}>
            {i > 0 && " · "}
            {n.yer === yol ? <b>{n.sayi} {n.metin}</b> : <Link className={stil.baglanti} href={n.yer}>{n.sayi} {n.metin}</Link>}
          </Fragment>
        ))}
      </Serit>
    </div>
  );
}
