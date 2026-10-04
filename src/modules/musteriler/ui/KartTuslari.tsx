"use client";
/* Müşteri ve tesis sayfasının işlem tuşları (maket musteriler.html: Pasif yap / Yeniden etkinleştir · Düzenle · Tesis ekle). Pencere yalnız açıkken
   çizilir (her açılışta kaydın güncel değeriyle başlar). Tuşlar yalnız "değiştirir" düzeyine çizilir; karar yine sunucuda. */
import { useState } from "react";
import { Tus } from "../../../components/tus/Tus";
import { MusteriPenceresi, PasifPenceresi, TesisPenceresi, type MusteriDegeri, type TesisDegeri } from "./Pencereler";

export function MusteriTuslari({ musteri, pasif }: { musteri: MusteriDegeri; pasif: boolean }) {
  const [p, setP] = useState<null | "duzenle" | "pasif">(null);
  return (
    <>
      <Tus tur="ikincil" ikon={pasif ? "undo-2" : "ban"} onClick={() => setP("pasif")}>{pasif ? "Yeniden etkinleştir" : "Pasif yap"}</Tus>
      <Tus tur="ikincil" ikon="pencil" onClick={() => setP("duzenle")}>Düzenle</Tus>
      {p === "duzenle" && <MusteriPenceresi acik kapat={() => setP(null)} musteri={musteri} />}
      {p === "pasif" && <PasifPenceresi acik kapat={() => setP(null)} tur="musteri" id={musteri.id} surum={musteri.surum} ad={musteri.unvan} pasif={pasif} />}
    </>
  );
}

export function TesisEkleTusu({ musteriId, unvan }: { musteriId: string; unvan: string }) {
  const [acik, setAcik] = useState(false);
  return (
    <>
      <Tus tur="ikincil" ikon="plus" onClick={() => setAcik(true)}>Tesis ekle</Tus>
      {acik && <TesisPenceresi acik kapat={() => setAcik(false)} musteriId={musteriId} unvan={unvan} />}
    </>
  );
}

export function TesisTuslari({ tesis, musteriId, unvan, ad, pasif }: { tesis: TesisDegeri; musteriId: string; unvan: string; ad: string; pasif: boolean }) {
  const [p, setP] = useState<null | "duzenle" | "pasif">(null);
  return (
    <>
      <Tus tur="ikincil" ikon={pasif ? "undo-2" : "ban"} onClick={() => setP("pasif")}>{pasif ? "Yeniden etkinleştir" : "Pasif yap"}</Tus>
      <Tus tur="ikincil" ikon="pencil" onClick={() => setP("duzenle")}>Düzenle</Tus>
      {p === "duzenle" && <TesisPenceresi acik kapat={() => setP(null)} musteriId={musteriId} unvan={unvan} tesis={tesis} />}
      {p === "pasif" && <PasifPenceresi acik kapat={() => setP(null)} tur="tesis" id={tesis.id} surum={tesis.surum} ad={ad} pasif={pasif} />}
    </>
  );
}
