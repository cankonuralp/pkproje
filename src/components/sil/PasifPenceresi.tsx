"use client";
/* PASİFE AL / ETKİNLEŞTİR PENCERESİ — tek üretici (358; §9 elli üçüncü tur: kullanılmış kayıt silinmez, pasife alınır; musteriler/ui/Pencereler.tsx
   PasifPenceresi deseni — müşteri kalemi gelince oraya da bu geçer). İlk satır kaydın adı; varsa NEDEN (neden silinemediği: "3 raporda kullanıldı;
   silinemez"); sonra kayda göre koşullar ("Silinmez: geçmişi kalır" · "Listelerden kalkar" · "Etkinleştir ile geri gelir"). Etkinleştirmede tek cümle.
   Sunucu reddederse (ENGEL: zimmette, kalibrasyonda …) ileti pencerede kalır; başarıda pencere kapanır, bildirim, sayfa yenilenir. */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Kosullar } from "../bilgi/Bilgi";
import { useBildir } from "../bildirim/Bildirim";
import { Pencere, pencereMetinSinifi } from "../pencere/Pencere";
import { Serit } from "../serit/Serit";
import { Tus } from "../tus/Tus";

export function PasifPenceresi({ acik, kapat, ad, pasif, neden, kosullar, geriMetni, uygula }: {
  acik: boolean; kapat: () => void;
  /** kaydın adı ya da kodu */
  ad: string;
  /** kayıt şu an pasif mi (pencere Etkinleştir için açılır) */
  pasif: boolean;
  /** neden silinemediği ("3 raporda, 1 zimmet hareketinde kullanıldı; silinemez.") */
  neden?: string | null;
  /** pasife almanın sonuçları */
  kosullar: string[];
  /** etkinleştirmenin sonucu */
  geriMetni: string;
  uygula: () => Promise<{ tamam?: boolean; genel?: string }>;
}) {
  const router = useRouter();
  const bildir = useBildir();
  const [bekliyor, baslat] = useTransition();
  const [hata, setHata] = useState<string | null>(null);
  const kapa = () => { setHata(null); kapat(); };
  const tamam = () => baslat(async () => {
    const r = await uygula();
    if (!r.tamam) { setHata(r.genel ?? "Kaydedilemedi."); return; }
    kapa(); bildir(pasif ? `${ad} yeniden etkinleştirildi.` : `${ad} pasife alındı; geçmişi duruyor.`); router.refresh();
  });
  return (
    <Pencere acik={acik} baslik={pasif ? "Yeniden etkinleştir" : "Pasife al"} onKapat={kapa}
      alt={<>
        <Tus tur="ikincil" onClick={kapa}>Vazgeç</Tus>
        <Tus ikon={pasif ? "undo-2" : "ban"} disabled={bekliyor} aria-busy={bekliyor || undefined} data-ilk-odak="" onClick={tamam}>{pasif ? "Etkinleştir" : "Pasife al"}</Tus>
      </>}>
      <p className={pencereMetinSinifi}><b>{ad}</b>{!pasif && neden ? ` ${neden}` : ""}</p>
      {hata && <Serit tur="hata" ikon="circle-alert">{hata}</Serit>}
      {pasif
        ? <p className={pencereMetinSinifi}>{geriMetni}</p>
        : <Kosullar ogeler={kosullar.map((metin) => ({ tur: "tamam" as const, metin }))} />}
    </Pencere>
  );
}
