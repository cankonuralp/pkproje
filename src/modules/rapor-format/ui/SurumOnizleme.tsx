"use client";
/* SÜRÜM ÖNİZLEMESİ (471; reisim 2026-10-10, maket kararı k5): sürüm sayfasında formatın iki yüzü — Belge (kesin belgenin çizicisi, PDF'le aynı;
   sunucu çizer) · Saha ekranı (denetçinin tablette / telefonda göreceği gerçek ekran, örnek raporla; salt — SahaGorunumu, düzenleme kurucuda). */
import { useState, type ReactNode } from "react";
import { Tus } from "../../../components/tus/Tus";
import type { FormatTanimi } from "../../../format/tanim";
import { SahaGorunumu } from "./SahaGorunumu";
import stil from "./format.module.css";

export function SurumOnizleme({ turId, formatId, t, belge }: { turId: string; formatId: string; t: FormatTanimi; belge: ReactNode }) {
  const [g, setG] = useState<"belge" | "saha">("belge");
  return (
    <>
      <span className={stil.onizlemeSecici} role="group" aria-label="Önizleme">
        <Tus tur={g === "belge" ? "birincil" : "ikincil"} ikon="file-text" aria-pressed={g === "belge"} onClick={() => setG("belge")}>Belge</Tus>
        <Tus tur={g === "saha" ? "birincil" : "ikincil"} ikon="tablet-smartphone" aria-pressed={g === "saha"} onClick={() => setG("saha")}>Saha ekranı</Tus>
      </span>
      {g === "belge"
        ? <div className={stil.belgeKap} aria-label="Belge önizlemesi" role="region" tabIndex={0}><div className="rb-onizleme">{belge}</div></div>
        : <SahaGorunumu turId={turId} formatId={formatId} t={t} />}
    </>
  );
}
