"use client";
/* Cihaz sayfasının istemci parçaları (maket olcum-cihazlari.html cihazCiz): işlem tuşları (Düzenle · Kalibrasyona gönder / Depoya al ·
   Kalibrasyon kaydı ekle · Sil — 357: yalnız yöneticiye ve hiç kullanılmamış cihaza; kullanılmış cihazda Pasife al, pasif cihazda Etkinleştir — 358)
   ve kalibrasyon kayıtları tablosu (sertifikayı aç, kaldır). Tuşlar yalnız "değiştirir" düzeyine; karar sunucuda. 365: kalibrasyondaki cihazda
   Pasife al çizilmez (önce Depoya al); kişinin zimmetindeyse pencere engeli söyler, tuş kapalı. */
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

export function CihazTuslari({ cihaz, turler, konum, baslik, sil = false, pasif = false, kullanim = null, zimmette = false }: {
  cihaz: CihazDegeri; turler: CihazTuru[]; konum: "depo" | "lab"; baslik: string; sil?: boolean; pasif?: boolean;
  /** cihaz bir kişinin zimmetinde (pasife alınamaz) */
  zimmette?: boolean;
  /** kullanıldığı yerler ("3 raporda, 1 zimmet hareketinde") — Pasife al penceresi nedeni söyler */
  kullanim?: string | null;
}) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [p, setP] = useState<null | "duzenle" | "kal" | "ara" | "pasif">(null);
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
          <Tus tur="ikincil" ikon="plus" onClick={() => setP("ara")}>Ara kontrol ekle</Tus>
          {sil
            ? <SilTusu ad={cihaz.kod} baslik="Ölçüm cihazını sil" yanEtki="kalibrasyon kayıtları ve sertifikaları da silinir, kodu yeniden kullanılabilir"
              sil={() => cihazSilEylemi(cihaz.id)} donus="/olcum-cihazlari" />
            : konum !== "lab" && <Tus tur="ikincil" ikon="ban" onClick={() => setP("pasif")}>Pasife al</Tus>}
        </>}
      <PasifPenceresi acik={p === "pasif"} kapat={() => setP(null)} ad={cihaz.kod} pasif={pasif}
        neden={kullanim ? `${kullanim} kullanıldı; silinemez.` : null}
        engel={zimmette ? `${cihaz.kod} bir kişinin zimmetinde; önce Zimmetler'den depoya teslim alın.` : null}
        kosullar={["Silinmez: kalibrasyon geçmişi, raporları ve belgeleri kalır.", "Listeden, rapor seçiminden, Zimmetler'den ve uyarılardan kalkar.",
          "Etkinleştir ile geri gelir."]}
        geriMetni="Cihaz listeye, rapor seçimine ve Zimmetler'e geri döner." uygula={() => cihazPasifEylemi(cihaz.id, cihaz.surum, !pasif)} />
      {p === "duzenle" && <CihazPenceresi kapat={() => setP(null)} turler={turler} cihaz={cihaz} />}
      {p === "kal" && <KalibrasyonPenceresi kapat={() => setP(null)} cihazId={cihaz.id} baslik={baslik} />}
      {p === "ara" && <KalibrasyonPenceresi kapat={() => setP(null)} cihazId={cihaz.id} baslik={baslik} tur="ara" />}
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
      if (!(await onayla(k.tur === "ara"
        ? { baslik: "Ara kontrol kaldırılsın mı?", metin: `${k.sertifika} kayıtlı ara kontrol listeden kalkar.`, tus: "Kaldır" }
        : { baslik: "Kalibrasyon kaydı kaldırılsın mı?", metin: `${k.sertifika} sertifikalı kayıt listeden kalkar; geçerlilik bitişi kalan kayıtlardan yeniden hesaplanır.`, tus: "Kaldır" }))) return;
      baslat(async () => { const r = await kalibrasyonKaldirEylemi(k.id, k.surum); bildir(r.tamam ? "Kayıt kaldırıldı." : r.genel ?? "Kaldırılamadı."); router.refresh(); });
    }}>Kaldır</Tus>
  );
}

export function KalibrasyonTablosu({ kayitlar, kaldirabilir, ara = false }: { kayitlar: KalibrasyonKaydi[]; kaldirabilir: boolean; ara?: boolean }) {
  /* 2026-11-05: ara kontrol tablosu aynı düzende, başlıkları kendi */
  const B = ara ? { tarih: "Ara kontrol", bitis: "Sonraki", lab: "Yapan", sertifika: "Yöntem / kayıt no", ac: "Kaydı aç", yok: "Kayıt yok", liste: "Ara kontroller" }
    : { tarih: "Kalibrasyon", bitis: "Geçerlilik bitişi", lab: "Laboratuvar", sertifika: "Sertifika no", ac: "Sertifikayı aç", yok: "Sertifika yok", liste: "Kalibrasyon kayıtları" };
  const sutunlar: Sutun<KalibrasyonKaydi>[] = [
    { k: "tarih", genislik: "14%", baslik: B.tarih, kart: "ust", sira: 1, hucre: (x) => <span className={stil.tarih}>{tarihYaz(x.tarih)}</span> },
    { k: "bitis", genislik: "14%", baslik: B.bitis, kart: "govde", sira: 2, hucre: (x) => <><KartEtiket>{B.bitis}</KartEtiket>{tarihYaz(x.bitis)}</> },
    { k: "lab", genislik: "22%", baslik: B.lab, kart: "govde", sira: 3, hucre: (x) => <><KartEtiket>{B.lab}</KartEtiket><Kirp>{x.lab}</Kirp></> },
    { k: "sertifika", genislik: "14%", baslik: B.sertifika, kart: "govde", sira: 4, hucre: (x) => <><KartEtiket>{B.sertifika}</KartEtiket><Kod>{x.sertifika}</Kod></> },
    { k: "sonuc", genislik: "12%", baslik: "Sonuç", kart: "rozet", sira: 1, hucre: (x) => x.sonuc === "uygun" ? <Rozet tur="tamam">Uygun</Rozet> : <Rozet tur="red">Uygun değil</Rozet> },
    { k: "eylem", genislik: "24%", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: (x) => (
      <span className={stil.tuslar}>
        {x.dosyaId ? <DosyaAcTusu dosyaId={x.dosyaId}>{B.ac}</DosyaAcTusu> : <DegerYok>{B.yok}</DegerYok>}
        {kaldirabilir && <KaldirTusu k={x} />}
      </span>
    ) },
  ];
  return <Liste baslik={B.liste} sutunlar={sutunlar} kayitlar={kayitlar} anahtar={(x) => x.id} />;
}
