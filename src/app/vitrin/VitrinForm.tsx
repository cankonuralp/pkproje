"use client";
/* Vitrinin form alanları: seçim alanı (kısa ve 8'den uzun liste, geçersiz hâl) ve tarih / saat alanı. Değerler ekranda yazılır
   (data-deger-*), e2e/secim.spec.ts okur. Veriler uydurma. */
import { useState } from "react";
import { SecimAlani } from "../../components/secim/SecimAlani";
import { TarihAlani } from "../../components/secim/TarihAlani";
import stil from "./vitrin.module.css";

const BRANS = [["m", "Mekanik"], ["e", "Elektrik"]] as const;
const TUR = ["Asansör", "Basınçlı kap", "Forklift", "Hava tankı", "Kaldırma makinesi", "Kompresör", "Paratoner", "Topraklama", "Vinç", "Yangın tesisatı"]
  .map((x, i) => [`t${i + 1}`, x, i % 3 === 0 ? "Mekanik" : "Elektrik"] as const);

export function VitrinForm() {
  const [brans, setBrans] = useState("");
  const [tur, setTur] = useState("t3");
  const [tarih, setTarih] = useState("");
  const [zaman, setZaman] = useState("2026-10-03T09:30");
  return (
    <section className={stil.bolum} aria-labelledby="v-form">
      <h2 id="v-form">Form alanları</h2>
      <div className={stil.form}>
        <div className={stil.alanGrup}>
          <label className={stil.etiket} htmlFor="v-brans">Branş</label>
          <SecimAlani id="v-brans" ad="Branş" deger={brans} secenekler={BRANS} degistir={setBrans} gecersiz={!brans} tanim="v-brans-ipucu" />
          {!brans && <p className={stil.hata} id="v-brans-ipucu">Branş seçilmeli.</p>}
        </div>
        <div className={stil.alanGrup}>
          <label className={stil.etiket} htmlFor="v-tur">Ekipman türü</label>
          <SecimAlani id="v-tur" ad="Ekipman türü" deger={tur} secenekler={TUR} degistir={setTur} />
        </div>
        <div className={stil.alanGrup}>
          <label className={stil.etiket} htmlFor="v-tarih">Plan tarihi</label>
          <TarihAlani id="v-tarih" ad="Plan tarihi" deger={tarih} degistir={setTarih} />
        </div>
        <div className={stil.alanGrup}>
          <label className={stil.etiket} htmlFor="v-zaman">Başlangıç</label>
          <TarihAlani id="v-zaman" ad="Başlangıç" deger={zaman} degistir={setZaman} saat />
        </div>
      </div>
      <p className={stil.degerler}>
        Değerler: <output data-deger-brans={brans}>{brans || "—"}</output> · <output data-deger-tur={tur}>{tur}</output> ·{" "}
        <output data-deger-tarih={tarih}>{tarih || "—"}</output> · <output data-deger-zaman={zaman}>{zaman}</output>
      </p>
    </section>
  );
}
