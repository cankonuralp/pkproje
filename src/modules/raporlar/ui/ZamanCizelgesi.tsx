"use client";
/* RAPORUN ZAMAN ÇİZELGESİ — EKRAN (2026-11-12; maket yerel/maket/turkak-modeli.html 4. bölüm; ../cizelge.ts): saat · olay · kim · saatin kaynağı;
   dikkat isteyen satır işaretli. Telefonda da tablo (yana kayar). 20'den uzun liste ortak sayfalamayla. "Excel'e aktar" tarayıcıda üretir
   (components/disa). Veri ve görme yetkisi sunucuda (raporlar.ts raporZamanCizelgesi). */
import { baytIndir } from "../../../components/disa/indir";
import { xlsxBayt, XLSX_TURU } from "../../../components/disa/xlsx";
import { TabloSayfalari, useSayfa } from "../../../components/liste/Sayfalayici";
import { Rozet } from "../../../components/sayfa/Sayfa";
import { Tus } from "../../../components/tus/Tus";
import { cizelgeTablosu, cizelgeZamani, type CizelgeSatiri } from "../cizelge";
import stil from "./raporlar.module.css";

export function ZamanCizelgesi({ no, satirlar }: { no: string; satirlar: readonly CizelgeSatiri[] }) {
  const sayfa = useSayfa(satirlar.length);
  const aktar = () => baytIndir(`${no}-zaman-cizelgesi.xlsx`, xlsxBayt("Zaman çizelgesi", cizelgeTablosu(satirlar)), XLSX_TURU);
  if (!satirlar.length) return <p className={stil.bosSatir}>Kayıt yok.</p>;
  return (
    <>
      <div className={stil.cizelgeTus}><Tus tur="ikincil" ikon="file-spreadsheet" onClick={aktar}>Excel&apos;e aktar</Tus></div>
      <div className={stil.cizelgeKap}>
        <table className={stil.cizelge}>
          <caption className="gizli">Raporun zaman çizelgesi</caption>
          <thead><tr><th scope="col">Saat</th><th scope="col">Olay</th><th scope="col">Kim</th><th scope="col">Saatin kaynağı</th></tr></thead>
          <tbody>
            {sayfa.dilim(satirlar).map((s, i) => (
              <tr key={`${s.zaman}-${i}`} data-dikkat={s.dikkat || undefined}>
                <td className={stil.cizelgeSaat}>{cizelgeZamani(new Date(s.zaman))}</td>
                <td>{s.olay}{s.dikkat && <> <Rozet tur="bekliyor">Dikkat</Rozet></>}</td>
                <td>{s.kim}</td>
                <td>{s.kaynak}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TabloSayfalari s={sayfa} ad="kayıt" />
    </>
  );
}
