"use client";
/* GÜNLÜK ÇİZELGE — EKRAN (2026-11-12; maket yerel/maket/turkak-modeli.html 5. bölüm; ../gunluk.ts): üstte kişi başına saat çubukları (gözle bakış;
   ekran okuyucuya kapalı — aynı bilgi tabloda), altta tablo: kişi · müşteri · ekipman · başlangıç · bitiş · süre · durum. Elle yazılan saat ve
   sapmalı kontrol işaretli. Telefonda da tablo (yana kayar); 20'den uzun liste ortak sayfalamayla; "Excel'e aktar" tarayıcıda. Veri ve görme
   yetkisi sunucuda (raporlar.ts gunlukKontroller). */
import Link from "next/link";
import { baytIndir } from "../../../components/disa/indir";
import { xlsxBayt, XLSX_TURU } from "../../../components/disa/xlsx";
import { TabloSayfalari, useSayfa } from "../../../components/liste/Sayfalayici";
import { Rozet } from "../../../components/sayfa/Sayfa";
import { Tus } from "../../../components/tus/Tus";
import { cubuk, gunlukCizelge, gunlukTablo, type GunlukKontrol } from "../gunluk";
import stil from "./raporlar.module.css";

const iki = (n: number) => String(n).padStart(2, "0");

export function GunlukCizelge({ gun, kontroller }: { gun: string; kontroller: readonly GunlukKontrol[] }) {
  const c = gunlukCizelge(kontroller, gun);
  const satirlar = c.kisiler.flatMap((k) => k.satirlar);
  const sayfa = useSayfa(satirlar.length, { anahtar: gun });
  if (!satirlar.length) return <p className={stil.bosSatir}>Bu gün için ölçülmüş kontrol yok.</p>;
  const saatler = Array.from({ length: c.aralik.bit - c.aralik.bas + 1 }, (_, i) => c.aralik.bas + i);
  const aktar = () => baytIndir(`gunluk-cizelge-${gun}.xlsx`, xlsxBayt("Günlük çizelge", gunlukTablo(c)), XLSX_TURU);
  return (
    <>
      <div className={stil.cizelgeTus}><Tus tur="ikincil" ikon="file-spreadsheet" onClick={aktar}>Excel&apos;e aktar</Tus></div>
      <div className={stil.gunlukKap} aria-hidden="true">
        <div className={stil.gunlukIc}>
          <div className={stil.gunlukSatir}><span />
            <div className={stil.gunlukSaat}>{saatler.map((s, i) => <span key={s} style={{ left: `${(i / Math.max(1, saatler.length - 1)) * 100}%` }}>{iki(s)}</span>)}</div>
          </div>
          {c.kisiler.map((k) => (
            <div key={k.kisiId} className={stil.gunlukSatir}>
              <span className={stil.gunlukKisi}>{k.kisi}</span>
              <div className={stil.gunlukYol}>
                {k.satirlar.map((s) => { const y = cubuk(s, c.aralik, gun); return <b key={s.raporId} data-dikkat={s.dikkat || undefined} style={{ left: `${y.sol}%`, width: `${y.en}%` }} />; })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={stil.cizelgeKap}>
        <table className={stil.cizelge}>
          <caption className="gizli">Günlük çizelge</caption>
          <thead><tr><th scope="col">Kişi</th><th scope="col">Müşteri</th><th scope="col">Ekipman</th><th scope="col">Başlangıç</th><th scope="col">Bitiş</th>
            <th scope="col">Süre</th><th scope="col">Durum</th></tr></thead>
          <tbody>
            {sayfa.dilim(satirlar).map((s) => (
              <tr key={s.raporId} data-dikkat={s.dikkat || undefined}>
                <td>{s.kisi}</td>
                <td>{s.musteri}</td>
                <td><Link href={`/raporlar/${s.raporId}/cizelge`}>{s.ekipman}</Link>{` · ${s.tur}`}</td>
                <td className={stil.cizelgeSaat}>{s.bas.slice(11, 16)}</td>
                <td className={stil.cizelgeSaat}>{s.bit ? s.bit.slice(11, 16) : ""}</td>
                <td className={stil.cizelgeSaat}>{s.sure === null ? "" : `${s.sure} dk`}</td>
                <td>{s.dikkat && <><Rozet tur="bekliyor">Dikkat</Rozet>{" "}</>}{s.durum}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TabloSayfalari s={sayfa} ad="kontrol" />
    </>
  );
}
