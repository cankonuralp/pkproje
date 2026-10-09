"use client";
/* Vitrinin içeriği: her ortak bileşenin bütün türleri + bildirim / onay / pencere tetikleyicileri. Sonuç ekranda yazılır
   (data-sonuc), e2e onu okur. Veri yok; metinler örnek. */
import { useState } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { useOnayla } from "../../../components/pencere/Onay";
import { Pencere } from "../../../components/pencere/Pencere";
import { SecimAlani } from "../../../components/secim/SecimAlani";
import { TarihAlani } from "../../../components/secim/TarihAlani";
import { Serit } from "../../../components/serit/Serit";
import { Tus, TusBaglanti } from "../../../components/tus/Tus";
import stil from "./vitrin.module.css";
import { VitrinBilgi } from "./VitrinBilgi";
import { VitrinForm } from "./VitrinForm";
import { VitrinListe } from "./VitrinListe";

export function VitrinIcerik() {
  const bildir = useBildir();
  const onayla = useOnayla();
  const [sonuc, setSonuc] = useState("—");
  const [pencere, setPencere] = useState(false);
  const [notTur, setNotTur] = useState("genel");
  const [notGun, setNotGun] = useState("");
  return (
    <>
      <div className={stil.sayfaBas}><h1>Vitrin</h1></div>

      <section className={stil.bolum} aria-labelledby="v-tus">
        <h2 id="v-tus">Tuşlar</h2>
        <div className={stil.sira}>
          <Tus ikon="plus" data-v="birincil">Rapor oluştur</Tus>
          <Tus tur="ikincil" data-v="ikincil">Vazgeç</Tus>
          <Tus tur="tehlike" ikon="trash-2" data-v="tehlike">Sil</Tus>
          <Tus disabled data-v="kapali">Kapalı</Tus>
          <TusBaglanti href="/planlar" ikon="calendar-check">Planlara git</TusBaglanti>
        </div>
      </section>

      <section className={stil.bolum} aria-labelledby="v-serit">
        <h2 id="v-serit">Şeritler</h2>
        <Serit tur="bilgi">Plan tarihi geçmiş; rapor yine oluşturulabilir.</Serit>
        <Serit tur="uyari" eylem={<Tus tur="ikincil">Güncelle</Tus>}>Ölçüm cihazının kalibrasyonu 12 gün sonra bitiyor.</Serit>
        <Serit tur="onay">Rapor onaya gönderildi.</Serit>
        <Serit tur="hata">Kaydedilemedi: bağlantı yok.</Serit>
      </section>

      <section className={stil.bolum} aria-labelledby="v-eylem">
        <h2 id="v-eylem">Bildirim ve pencereler</h2>
        <div className={stil.sira}>
          <Tus tur="ikincil" onClick={() => bildir("Kaydedildi.")} data-v="bildir">Bildirim göster</Tus>
          <Tus tur="ikincil" data-v="onayla" onClick={async () => {
            const evet = await onayla({ baslik: "Rapor silinsin mi?", metin: "Bu işlem geri alınamaz.", tus: "Sil", tehlike: true });
            setSonuc(evet ? "evet" : "hayır");
          }}>Onay sor</Tus>
          <Tus tur="ikincil" onClick={() => setPencere(true)} data-v="pencere">Pencere aç</Tus>
        </div>
        <p>Onay sonucu: <output data-sonuc="">{sonuc}</output></p>
      </section>

      <VitrinForm />

      <VitrinBilgi />

      <VitrinListe />

      <Pencere acik={pencere} baslik="Not ekle" onKapat={() => setPencere(false)}
        alt={<><Tus tur="ikincil" onClick={() => setPencere(false)}>Vazgeç</Tus><Tus onClick={() => { setPencere(false); bildir("Not eklendi."); }}>Kaydet</Tus></>}>
        <label className={stil.alan}>Not<textarea rows={3} data-ilk-odak="" /></label>
        <div className={stil.alanGrup}>
          <label className={stil.etiket} htmlFor="v-not-tur">Not türü</label>
          <SecimAlani id="v-not-tur" ad="Not türü" deger={notTur} secenekler={[["genel", "Genel"], ["eksik", "Eksik belge"], ["randevu", "Randevu"]]} degistir={setNotTur} />
        </div>
        {/* 452: pencerenin en altındaki tarih — takvim pencereyi itmez, pencerenin kenarında kesilmez */}
        <div className={stil.alanGrup} data-v="not-gun">
          <label className={stil.etiket} htmlFor="v-not-gun">Not tarihi</label>
          <TarihAlani id="v-not-gun" ad="Not tarihi" deger={notGun} degistir={setNotGun} />
        </div>
      </Pencere>
    </>
  );
}
