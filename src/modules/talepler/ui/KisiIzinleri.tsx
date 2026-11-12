"use client";
/* PERSONEL KARTI › İZİNLER (2026-11-12; reisim: "patron geçmişteki aldığı izinleri zaten personele tıklayınca görebiliyor değil mi ? göremiyorsa görsün.
   onun hesabını o yapsın"). Kişinin bütün izin talepleri (yeni üstte) ve yıl yıl ONAYLANAN iş günleri, türüne göre. Hak / kalan hesabı yok — sayılar
   gösterilir, hesabı firma yöneticisi yapar. Yalnız firma yöneticisine (sunucu: kisininIzinleri). */
import { KartEtiket, Kirp, Liste } from "../../../components/liste/Liste";
import { AltSatir, Bolum, Rozet } from "../../../components/sayfa/Sayfa";
import { tarihNo } from "../../../components/secim/tarih";
import { IZIN_DURUM, IZIN_TUR, type IzinTuru } from "../sema";
import type { KisiIzinleri as Veri } from "../server/talepler";
import stil from "./talepler.module.css";

const aralik = (x: { bas: string; bit: string }) => `${tarihNo(x.bas)}${x.bit !== x.bas ? ` – ${tarihNo(x.bit)}` : ""}`;
const TURLER = Object.keys(IZIN_TUR) as IzinTuru[];

export function KisiIzinleri({ v }: { v: Veri }) {
  return (
    <Bolum id="b-per-izin" baslik="İzinler" sayac={<><b>{v.izinler.length}</b> talep</>}>
      {v.yillar.length > 0 && (
        <Liste baslik="Yıl yıl kullanılan izin (onaylanan iş günü)" kayitlar={v.yillar} anahtar={(x) => x.yil} sutunlar={[
          { k: "yil", genislik: "20%", baslik: "Yıl", kart: "ust", sira: 1, siralanmaz: true, hucre: (x) => <b className={stil.sayi}>{x.yil}</b> },
          ...TURLER.map((t, i) => ({ k: t, genislik: "20%", baslik: IZIN_TUR[t], kart: "govde" as const, sira: i + 2, siralanmaz: true,
            hucre: (x: Veri["yillar"][number]) => <><KartEtiket>{IZIN_TUR[t]}</KartEtiket><span className={stil.sayi}>{x[t] ? `${x[t]} gün` : "—"}</span></> })),
        ]} />
      )}
      {v.izinler.length ? (
        <Liste baslik="İzin talepleri" kayitlar={v.izinler} anahtar={(x) => x.id} sutunlar={[
          { k: "no", genislik: "18%", baslik: "Talep no", kart: "ust", sira: 1, hucre: (x) => <span className={stil.sayi}>{x.no}</span> },
          { k: "tur", genislik: "30%", baslik: "İzin", kart: "govde", sira: 2, hucre: (x) => <span>{IZIN_TUR[x.tur]}{x.aciklama && <AltSatir><Kirp>{x.aciklama}</Kirp></AltSatir>}</span> },
          { k: "tarih", genislik: "28%", baslik: "Tarih", kart: "govde", sira: 3, hucre: (x) => <><KartEtiket>Tarih</KartEtiket><span>{aralik(x)}<AltSatir>{x.gun} iş günü</AltSatir></span></> },
          { k: "durum", genislik: "24%", baslik: "Durum", kart: "rozet", sira: 1, hucre: (x) => <Rozet tur={IZIN_DURUM[x.durum][1]}>{IZIN_DURUM[x.durum][0]}</Rozet> },
        ]} />
      ) : <p className={stil.bosIzin}>İzin talebi yok.</p>}
    </Bolum>
  );
}
