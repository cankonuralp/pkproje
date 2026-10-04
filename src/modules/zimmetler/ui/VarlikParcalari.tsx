"use client";
/* Varlık sayfasının istemci parçaları (maket zimmetler.html varlikCiz): "Teslim et" tuşu (varlık önceden seçili) ve teslim geçmişi (fotoğraflar
   GizliResim ile — adres <img src>'ye yazılmaz). */
import { useState } from "react";
import { GizliResim } from "../../../components/gizli-resim/GizliResim";
import { AltSatir } from "../../../components/sayfa/Sayfa";
import { Tus } from "../../../components/tus/Tus";
import type { HareketSatiri, VarlikSatiri } from "../server/zimmet";
import { TeslimPenceresi } from "./Pencereler";
import { zamanYaz } from "./ortak";
import stil from "./zimmet.module.css";

export function TeslimTusu({ varlik, varliklar, kisiler, bugun }: { varlik: string; varliklar: VarlikSatiri[]; kisiler: { id: string; ad: string }[]; bugun: string }) {
  const [acik, setAcik] = useState(false);
  return (
    <>
      <Tus ikon="arrow-right-left" onClick={() => setAcik(true)}>Teslim et</Tus>
      {acik && <TeslimPenceresi kapat={() => setAcik(false)} varliklar={varliklar} kisiler={kisiler} bugun={bugun} varlik={varlik} />}
    </>
  );
}

export function TeslimGecmisi({ hareketler, ad }: { hareketler: HareketSatiri[]; ad: string }) {
  if (!hareketler.length) return <p className={stil.bosSatir}>Bu varlığın hareketi yok; depoda.</p>;
  return (
    <ol className={stil.gecmis}>
      {hareketler.map((h) => (
        <li key={h.id}>
          <span className={stil.zaman}>{zamanYaz(h.zaman)}</span>
          <b>{h.eden} → {h.alan}</b>
          <span className={stil.not}>{h.notu ?? "Not yok"}</span>
          {h.fotolar.length > 0
            ? <span className={stil.fotolar}>{h.fotolar.map((f, i) => <GizliResim key={f} dosyaId={f} alt={`${ad} teslim fotoğrafı ${i + 1}`} className={stil.foto} />)}</span>
            : <AltSatir>Fotoğraf yok</AltSatir>}
        </li>
      ))}
    </ol>
  );
}
