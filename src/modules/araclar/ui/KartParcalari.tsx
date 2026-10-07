"use client";
/* Araç sayfasının istemci parçaları (maket araclar.html aracCiz): Düzenle (yalnız "değiştirir") · Teslim tutanağı (değiştiren ve aracın sürücüsü).
   363: Sil — yalnız yöneticiye ve hiç kullanılmamış araca; kullanılmış araçta Pasife al, pasif araçta yalnız Etkinleştir (ölçüm cihazı 357–358 deseni;
   karar sunucuda). */
import { useState } from "react";
import { PasifPenceresi } from "../../../components/sil/PasifPenceresi";
import { SilTusu } from "../../../components/sil/SilTusu";
import { Tus } from "../../../components/tus/Tus";
import type { AracSatiri } from "../server/araclar";
import { aracPasifEylemi, aracSilEylemi } from "./eylemler";
import { AracPenceresi, TutanakPenceresi, type AracDegeri } from "./Pencereler";

export function AracTuslari({ arac, deger, yaz, araclar, kisiler, sil = false, kullanim = null }: {
  arac: AracSatiri; deger: AracDegeri; yaz: boolean; araclar: AracSatiri[]; kisiler: { id: string; ad: string }[];
  /** Sil çizilir mi (yönetici + kullanılmamış araç; sunucu söyler) */
  sil?: boolean;
  /** kullanıldığı yerler ("2 zimmet hareketinde") — Pasife al penceresi nedeni söyler */
  kullanim?: string | null;
}) {
  const [p, setP] = useState<null | "duzenle" | "tutanak" | "pasif">(null);
  const pasif = !!arac.pasif;
  return (
    <>
      {yaz && !pasif && <Tus tur="ikincil" ikon="pencil" onClick={() => setP("duzenle")}>Düzenle</Tus>}
      {yaz && (pasif
        ? <Tus tur="ikincil" ikon="undo-2" onClick={() => setP("pasif")}>Etkinleştir</Tus>
        : sil
          ? <SilTusu ad={arac.plaka} baslik="Aracı sil" yanEtki="plakası yeniden kullanılabilir" sil={() => aracSilEylemi(arac.id)} donus="/araclar" />
          : <Tus tur="ikincil" ikon="ban" onClick={() => setP("pasif")}>Pasife al</Tus>)}
      {!pasif && <Tus ikon="clipboard-check" onClick={() => setP("tutanak")}>{yaz ? "Teslim tutanağı" : "Teslim et"}</Tus>}
      {p === "duzenle" && <AracPenceresi kapat={() => setP(null)} arac={deger} />}
      {p === "tutanak" && <TutanakPenceresi kapat={() => setP(null)} araclar={araclar.filter((v) => !v.pasif)} kisiler={kisiler} arac={arac.id} surucu={!yaz} />}
      {yaz && <PasifPenceresi acik={p === "pasif"} kapat={() => setP(null)} ad={arac.plaka} pasif={pasif}
        neden={kullanim ? `${kullanim} kullanıldı; silinemez.` : null}
        engel={arac.kimde.tip === "kisi" ? `${arac.plaka} bir kişinin zimmetinde; önce teslim tutanağıyla depoya alın.` : null}
        kosullar={["Silinmez: teslim tutanakları ve kilometre geçmişi durur.", "Araç listesinden, teslimden, kilometreden ve uyarılardan kalkar (Görünüm: Pasif araçlar).", "Etkinleştir ile geri gelir."]}
        geriMetni="Araç listeye, teslime ve uyarılara geri döner." uygula={() => aracPasifEylemi(arac.id, deger.surum, !pasif)} />}
    </>
  );
}
