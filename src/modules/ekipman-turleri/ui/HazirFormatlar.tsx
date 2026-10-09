"use client";
/* HAZIR RAPOR FORMATLARI (436; reisim 2026-10-09: "EKİPMAN TÜRLERİNDE BAKANLIK FORMATLARINI DA GÖREMEDİM") — Ekipman türleri sayfasında, branşın
   sekmesinde probata kitaplığı (src/format/sablonlar.ts): Bakanlık formatları (ZPKR…) ve genel şablonlar. Satırda form kodu ve başlık (önizleme
   sayfasına bağlantı), onu kullanan türler (yayında / taslak) ve "Tür olarak ekle" — tür + şablondan taslak tek işlemde, pencerede ad / kod /
   periyot önerilir, firma değiştirir. Yetki sunucuda (rapor-format sablondanTurEkle). */
import Link from "next/link";
import { useState } from "react";
import { KartEtiket, Liste, type Sutun } from "../../../components/liste/Liste";
import { AltSatir, Bolum, DegerYok, Rozet } from "../../../components/sayfa/Sayfa";
import { Tus } from "../../../components/tus/Tus";
import { TurPenceresi, type SablonOnerisi } from "./Pencereler";
import stil from "./turler.module.css";

export interface HazirFormat {
  anahtar: string; ad: string; formKodu: string; baslik: string; bakanlik: boolean; tur: SablonOnerisi["tur"];
  kullananlar: { id: string; ad: string; durum: "taslak" | "yayinda" }[];
}

export function HazirFormatlar({ formatlar, brans, ekleyebilir }: { formatlar: HazirFormat[]; brans: "m" | "e"; ekleyebilir: boolean }) {
  const [sec, setSec] = useState<HazirFormat | null>(null);
  if (!formatlar.length) return null;
  const sutunlar: Sutun<HazirFormat>[] = [
    { k: "format", genislik: "44%", baslik: "Format", kart: "ust", sira: 1, hucre: (f) => <>
      <Link className={stil.ad} href={`/ekipman-turleri/sablon/${f.anahtar}`}>{f.formKodu || f.ad}</Link>
      <AltSatir>{f.baslik || f.ad}</AltSatir>
    </> },
    { k: "tur", genislik: "30%", baslik: "Kullanan tür", kart: "govde", sira: 2, hucre: (f) => <><KartEtiket>Kullanan tür</KartEtiket>{f.kullananlar.length
      ? <span className={stil.hucreSatir}>{f.kullananlar.map((t) => <span key={t.id} className={stil.hucreSatir}>
        <Link href={`/ekipman-turleri/${t.id}`}>{t.ad}</Link><Rozet tur={t.durum === "yayinda" ? "tamam" : "bekliyor"}>{t.durum === "yayinda" ? "Yayında" : "Taslak"}</Rozet>
      </span>)}</span>
      : <DegerYok>Tür eklenmedi</DegerYok>}</> },
    { k: "eylem", genislik: "26%", baslik: "İşlem", gizliBaslik: true, kart: "eylem", sira: 9, hucre: (f) => ekleyebilir
      ? <Tus tur="ikincil" ikon="plus" aria-label={`${f.formKodu || f.ad} · Tür olarak ekle`} onClick={() => setSec(f)}>Tür olarak ekle</Tus> : null },
  ];
  const bakanlik = formatlar.some((f) => f.bakanlik);
  return (
    <Bolum id={`b-hazir-${brans}`} baslik={bakanlik ? "Bakanlık rapor formatları" : "Hazır rapor formatları"} sayac={<><b>{formatlar.length}</b> format</>}>
      <p className={stil.altMetin}>
        {bakanlik ? "Bakanlığın zorunlu formatları hazır: türü eklerken rapor şablonu bu formattan taslak olarak hazırlanır; önizleyip yayınlarsınız. Bakanlık alanları kilitli."
          : "probata'nın hazır şablonları: türü eklerken rapor şablonu bu formattan taslak olarak hazırlanır."}
      </p>
      <Liste baslik={bakanlik ? "Bakanlık rapor formatları" : "Hazır rapor formatları"} sutunlar={sutunlar} kayitlar={formatlar} anahtar={(f) => f.anahtar} />
      {sec && <TurPenceresi kapat={() => setSec(null)} sablon={{ anahtar: sec.anahtar, ad: sec.formKodu || sec.ad, tur: sec.tur }} />}
    </Bolum>
  );
}

/** şablonun önizleme sayfasındaki "Tür olarak ekle" (436) */
export function SablonTurEkleTusu({ sablon }: { sablon: SablonOnerisi }) {
  const [acik, setAcik] = useState(false);
  return (
    <>
      <Tus ikon="plus" onClick={() => setAcik(true)}>Tür olarak ekle</Tus>
      {acik && <TurPenceresi kapat={() => setAcik(false)} sablon={sablon} />}
    </>
  );
}
