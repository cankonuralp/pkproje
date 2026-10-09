/* RAPOR AŞAMA ÇİZGİSİ (431; reisim 2026-10-09, örnek görselle: "raporların hangi aşamada oldukları gözüksün"): Yeni → Teknik yönetici onayında →
   Muayene uzmanı imzası → İmzaya gönderildi → Tamamlandı (RAPOR_DURUM sırası — tek kaynak). Geçilen adımlar işaretli, şimdiki adım vurgulu
   (aria-current="step"), sonrakiler soluk. Telefonda yalnız şimdiki adımın adı görünür (ötekiler ekran okuyucuda). Kancasız: saha raporu ve onay
   ekranı aynı çizgiyi kullanır. */
import { Ikon } from "../../../components/ikon/Ikon";
import { RAPOR_DURUM, type RaporDurumu } from "../sema";
import stil from "./asama.module.css";

const SIRA = Object.keys(RAPOR_DURUM) as RaporDurumu[];

export function AsamaCizgisi({ durum }: { durum: RaporDurumu }) {
  const i = SIRA.indexOf(durum);
  return (
    <ol className={stil.asamalar} aria-label="Raporun aşaması">
      {SIRA.map((k, j) => {
        const hal = j < i ? "gecti" : j === i ? "simdi" : "sonra";
        return (
          <li key={k} className={hal === "sonra" ? stil.asama : `${stil.asama} ${stil[hal]}`} data-asama={hal} aria-current={hal === "simdi" ? "step" : undefined}>
            <span className={stil.nokta} aria-hidden="true">{hal === "gecti" || (hal === "simdi" && k === "imzali") ? <Ikon ad="check" kucuk /> : j + 1}</span>
            <span className={stil.ad}>{RAPOR_DURUM[k][0]}{hal === "gecti" && <span className="gizli"> (tamamlandı)</span>}</span>
          </li>
        );
      })}
    </ol>
  );
}
