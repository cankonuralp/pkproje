"use client";
/* Cihaz sayfasının istemci parçaları (maket olcum-cihazlari.html cihazCiz): işlem tuşları (Düzenle · Kalibrasyona gönder / Depoya al ·
   Kalibrasyon kaydı ekle · Sil — 357: yalnız yöneticiye ve hiç kullanılmamış cihaza; kullanılmış cihazda Pasife al, pasif cihazda Etkinleştir — 358)
   ve kalibrasyon kayıtları tablosu (sertifikayı aç, kaldır). Tuşlar yalnız "değiştirir" düzeyine; karar sunucuda. */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { DosyaAcTusu } from "../../../components/gizli-resim/GizliResim";
import { KartEtiket, Kirp, Liste, type Sutun } from "../../../components/liste/Liste";
import { useOnayla } from "../../../components/pencere/Onay";
import { DegerYok, Kod, Rozet } from "../../../components/sayfa/Sayfa";
import { PasifPenceresi } from "../../../components/sil/PasifPenceresi";
import { SilTusu } from "../../../components/sil/SilTusu";
import { Tus } from "../../../components/tus/Tus";
import type { CihazTuru, KalibrasyonKaydi } from "../server/cihazlar";
import { cihazKonumEylemi, cihazPasifEylemi, cihazSilEylemi, kalibrasyonKaldirEylemi } from "./eylemler";
import { CihazPenceresi, KalibrasyonPenceresi, type CihazDegeri } from "./Pencereler";
import { tarihYaz } from "./ortak";
import stil from "./cihazlar.module.css";

export function CihazTuslari({ cihaz, turler, konum, baslik, sil = false, pasif = false, kullanim = null }: {
  cihaz: CihazDegeri; turler: CihazTuru[]; konum: "depo" | "lab"; baslik: string; sil?: boolean; pasif?: boolean;
  /** kullanıldığı yerler ("3 raporda, 1 zimmet hareketinde") — Pasife al penceresi nedeni söyler */
  kullanim?: string | null;
}) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [p, setP] = useState<null | "duzenle" | "kal" | "pasif">(null);
  const konumla = (k: "depo" | "lab") => baslat(async () => {
    const r = await cihazKonumEylemi(cihaz.id, cihaz.surum, k);
    bildir(r.tamam ? (k === "lab" ? "Cihaz kalibrasyona gönderildi." : "Cihaz depoya alındı.") : r.genel ?? "Kaydedilemedi.");
    router.refresh();
  });
  return (
    <>
      <Tus tur="ikincil" ikon="pencil" onClick={() => setP("duzenle")}>Düzenle</Tus>
      {pasif
        ? <Tus ikon="undo-2" onClick={() => setP("pasif")}>Etkinleştir</Tus>
        : <>
          {konum === "lab"
            ? <Tus tur="ikincil" ikon="warehouse" disabled={bekliyor} onClick={() => konumla("depo")}>Depoya al</Tus>
            : <Tus tur="ikincil" ikon="flask-conical" disabled={bekliyor} onClick={() => konumla("lab")}>Kalibrasyona gönder</Tus>}
          <Tus ikon="plus" onClick={() => setP("kal")}>Kalibrasyon kaydı ekle</Tus>
          {sil
            ? <SilTusu ad={cihaz.kod} baslik="Ölçüm cihazını sil" yanEtki="kalibrasyon kayıtları ve sertifikaları da silinir, kodu yeniden kullanılabilir"
              sil={() => cihazSilEylemi(cihaz.id)} donus="/olcum-cihazlari" />
            : <Tus tur="ikincil" ikon="ban" onClick={() => setP("pasif")}>Pasife al</Tus>}
        </>}
      <PasifPenceresi acik={p === "pasif"} kapat={() => setP(null)} ad={cihaz.kod} pasif={pasif}
        neden={kullanim ? `${kullanim} kullanıldı; silinemez.` : null}
        kosullar={["Silinmez: kalibrasyon geçmişi, raporları ve belgeleri kalır.", "Listeden, rapor seçiminden, Zimmetler'den ve uyarılardan kalkar.",
          "Önce depoda olmalı (kişide ya da kalibrasyonda değil).", "Etkinleştir ile geri gelir."]}
        geriMetni="Cihaz listeye, rapor seçimine ve Zimmetler'e geri döner." uygula={() => cihazPasifEylemi(cihaz.id, cihaz.surum, !pasif)} />
      {p === "duzenle" && <CihazPenceresi kapat={() => setP(null)} turler={turler} cihaz={cihaz} />}
      {p === "kal" && <KalibrasyonPenceresi kapat={() => setP(null)} cihazId={cihaz.id} baslik={baslik} />}
    </>
  );
}

function KaldirTusu({ k }: { k: KalibrasyonKaydi }) {
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const [bekliyor, baslat] = useTransition();
  return (
    <Tus tur="ikincil" ikon="x" disabled={bekliyor} onClick={async () => {
      if (!(await onayla({ baslik: "Kalibrasyon kaydı kaldırılsın mı?", metin: `${k.sertifika} sertifikalı kayıt listeden kalkar; geçerlilik bitişi kalan kayıtlardan yeniden hesaplanır.`, tus: "Kaldır" }))) return;
      baslat(async () => { const r = await kalibrasyonKaldirEylemi(k.id, k.surum); bildir(r.tamam ? "Kayıt kaldırıldı." : r.genel ?? "Kaldırılamadı."); router.refresh(); });
    }}>Kaldır</Tus>
  );
}

export function KalibrasyonTablosu({ kayitlar, kaldirabilir }: { kayitlar: KalibrasyonKaydi[]; kaldirabilir: boolean }) {
  const sutunlar: Sutun<KalibrasyonKaydi>[] = [
    { k: "tarih", genislik: "14%", baslik: "Kalibrasyon", kart: "ust", sira: 1, hucre: (x) => <span className={stil.tarih}>{tarihYaz(x.tarih)}</span> },
    { k: "bitis", genislik: "14%", baslik: "Geçerlilik bitişi", kart: "govde", sira: 2, hucre: (x) => <><KartEtiket>Geçerlilik bitişi</KartEtiket>{tarihYaz(x.bitis)}</> },
    { k: "lab", genislik: "22%", baslik: "Laboratuvar", kart: "govde", sira: 3, hucre: (x) => <><KartEtiket>Laboratuvar</KartEtiket><Kirp>{x.lab}</Kirp></> },
    { k: "sertifika", genislik: "14%", baslik: "Sertifika no", kart: "govde", sira: 4, hucre: (x) => <><KartEtiket>Sertifika no</KartEtiket><Kod>{x.sertifika}</Kod></> },
    { k: "sonuc", genislik: "12%", baslik: "Sonuç", kart: "rozet", sira: 1, hucre: (x) => x.sonuc === "uygun" ? <Rozet tur="tamam">Uygun</Rozet> : <Rozet tur="red">Uygun değil</Rozet> },
    { k: "eylem", genislik: "24%", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: (x) => (
      <span className={stil.tuslar}>
        {x.dosyaId ? <DosyaAcTusu dosyaId={x.dosyaId}>Sertifikayı aç</DosyaAcTusu> : <DegerYok>Sertifika yok</DegerYok>}
        {kaldirabilir && <KaldirTusu k={x} />}
      </span>
    ) },
  ];
  return <Liste baslik="Kalibrasyon kayıtları" sutunlar={sutunlar} kayitlar={kayitlar} anahtar={(x) => x.id} />;
}
