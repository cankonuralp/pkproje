"use client";
/* Araç sayfasının istemci parçaları (maket araclar.html aracCiz): Düzenle (yalnız "değiştirir") · Teslim tutanağı (değiştiren ve aracın sürücüsü). */
import { useState } from "react";
import { Tus } from "../../../components/tus/Tus";
import type { AracSatiri } from "../server/araclar";
import { AracPenceresi, TutanakPenceresi, type AracDegeri } from "./Pencereler";

export function AracTuslari({ arac, deger, yaz, araclar, kisiler }: { arac: AracSatiri; deger: AracDegeri; yaz: boolean; araclar: AracSatiri[]; kisiler: { id: string; ad: string }[] }) {
  const [p, setP] = useState<null | "duzenle" | "tutanak">(null);
  return (
    <>
      {yaz && <Tus tur="ikincil" ikon="pencil" onClick={() => setP("duzenle")}>Düzenle</Tus>}
      <Tus ikon="clipboard-check" onClick={() => setP("tutanak")}>{yaz ? "Teslim tutanağı" : "Teslim et"}</Tus>
      {p === "duzenle" && <AracPenceresi kapat={() => setP(null)} arac={deger} />}
      {p === "tutanak" && <TutanakPenceresi kapat={() => setP(null)} araclar={araclar} kisiler={kisiler} arac={arac.id} surucu={!yaz} />}
    </>
  );
}
