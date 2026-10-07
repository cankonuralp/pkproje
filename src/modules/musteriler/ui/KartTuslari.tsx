"use client";
/* Müşteri ve tesis sayfasının işlem tuşları (maket musteriler.html: Pasif yap / Yeniden etkinleştir · Düzenle · Tesis ekle). Pencere yalnız açıkken
   çizilir (her açılışta kaydın güncel değeriyle başlar). Tuşlar yalnız "değiştirir" düzeyine çizilir; karar yine sunucuda.
   364 (§9 elli üçüncü tur, ekran dili): kesin silme "Sil" — yalnız yöneticiye ve hiç kullanılmamış kayda; kullanılmış kayıtta "Pasife al" (ortak
   pencere, neden silinemediğini söyler), pasifte "Etkinleştir". */
import { useState } from "react";
import { PasifPenceresi } from "../../../components/sil/PasifPenceresi";
import { SilTusu } from "../../../components/sil/SilTusu";
import { Tus } from "../../../components/tus/Tus";
import { musteriPasifEylemi, musteriSilEylemi, tesisPasifEylemi, tesisSilEylemi } from "./eylemler";
import { MusteriPenceresi, TesisPenceresi, type MusteriDegeri, type TesisDegeri } from "./Pencereler";

const KOSUL = ["Silinmez: raporları, planları ve arşivi olduğu gibi kalır.", "Listelerden kalkar; yeni plan ve teklif açılmaz."];

export function MusteriTuslari({ musteri, pasif, sil = false, kullanim = null }: { musteri: MusteriDegeri; pasif: boolean; sil?: boolean; kullanim?: string | null }) {
  const [p, setP] = useState<null | "duzenle" | "pasif">(null);
  return (
    <>
      {pasif
        ? <Tus tur="ikincil" ikon="undo-2" onClick={() => setP("pasif")}>Etkinleştir</Tus>
        : sil
          ? <SilTusu ad={musteri.unvan} baslik="Müşteriyi sil" yanEtki="tesisleri ve hiç girilmemiş müşteri girişleri de silinir" sil={() => musteriSilEylemi(musteri.id)} donus="/musteriler" />
          : <Tus tur="ikincil" ikon="ban" onClick={() => setP("pasif")}>Pasife al</Tus>}
      <Tus tur="ikincil" ikon="pencil" onClick={() => setP("duzenle")}>Düzenle</Tus>
      {p === "duzenle" && <MusteriPenceresi acik kapat={() => setP(null)} musteri={musteri} />}
      <PasifPenceresi acik={p === "pasif"} kapat={() => setP(null)} ad={musteri.unvan} pasif={pasif} neden={kullanim ? `${kullanim} kullanıldı; silinemez.` : null}
        kosullar={[...KOSUL, "Müşteri girişi kapanır; bütün tesisleri de pasif olur.", "Etkinleştir ile geri gelir."]}
        geriMetni="Kayıt listelere geri döner; yeniden plan ve teklif açılabilir. Müşteriyle birlikte pasif olan tesisler de döner."
        uygula={() => musteriPasifEylemi(musteri.id, musteri.surum, !pasif)} />
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

export function TesisTuslari({ tesis, musteriId, unvan, ad, pasif, sil = false, kullanim = null }:
  { tesis: TesisDegeri; musteriId: string; unvan: string; ad: string; pasif: boolean; sil?: boolean; kullanim?: string | null }) {
  const [p, setP] = useState<null | "duzenle" | "pasif">(null);
  return (
    <>
      {pasif
        ? <Tus tur="ikincil" ikon="undo-2" onClick={() => setP("pasif")}>Etkinleştir</Tus>
        : sil
          ? <SilTusu ad={ad} baslik="Tesisi sil" sil={() => tesisSilEylemi(tesis.id)} donus={`/musteriler/${musteriId}`} />
          : <Tus tur="ikincil" ikon="ban" onClick={() => setP("pasif")}>Pasife al</Tus>}
      <Tus tur="ikincil" ikon="pencil" onClick={() => setP("duzenle")}>Düzenle</Tus>
      {p === "duzenle" && <TesisPenceresi acik kapat={() => setP(null)} musteriId={musteriId} unvan={unvan} tesis={tesis} />}
      <PasifPenceresi acik={p === "pasif"} kapat={() => setP(null)} ad={ad} pasif={pasif} neden={kullanim ? `${kullanim} kullanıldı; silinemez.` : null}
        kosullar={[...KOSUL, "Etkinleştir ile geri gelir."]} geriMetni="Tesis listelere geri döner; yeniden plan ve teklif açılabilir."
        uygula={() => tesisPasifEylemi(tesis.id, tesis.surum, !pasif)} />
    </>
  );
}
