"use client";
/* SİL TUŞU — tek üretici (357; reisim 2026-10-07): yalnız KESİN silmede "Sil" (kayıt saklanıyorsa "Kaldır", geri alınabiliyorsa "Pasife al" — ayrı
   işlemler). Çağıran yalnız silebilen kişiye (yönetici) ve hiç kullanılmamış kayda çizer (ANAYASA 7.4: yapamayacağı tuş görünmez). Onay penceresi
   tehlike türünde, odak "Vazgeç"te: "<ad> kalıcı olarak silinir[; yan etki]. Geri alınamaz." Başarıda "<ad> silindi." ve listeye dönülür; sunucu
   "kullanıldı" derse (bu arada rapora girmiş olabilir) nedeni söylenir. */
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useBildir } from "../bildirim/Bildirim";
import { useOnayla } from "../pencere/Onay";
import { Tus } from "../tus/Tus";

export function SilTusu({ ad, baslik, yanEtki, sil, donus }: {
  /** kaydın ekrandaki adı ya da kodu */
  ad: string;
  /** onay penceresinin başlığı ("Ölçüm cihazını sil") */
  baslik: string;
  /** kayıtla birlikte gidenler ("kalibrasyon kayıtları ve sertifikaları da silinir") */
  yanEtki?: string;
  sil: () => Promise<{ tamam?: boolean; genel?: string }>;
  /** silinince dönülecek liste */
  donus: string;
}) {
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const [bekliyor, baslat] = useTransition();
  return (
    <Tus tur="ikincil" ikon="trash-2" disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={async () => {
      if (!(await onayla({ baslik, metin: `${ad} kalıcı olarak silinir${yanEtki ? `; ${yanEtki}` : ""}. Geri alınamaz.`, tus: "Sil", tehlike: true }))) return;
      baslat(async () => {
        const r = await sil();
        if (r.tamam) { bildir(`${ad} silindi.`); router.push(donus); return; }
        bildir(r.genel ?? "Silinemedi.");
        router.refresh();
      });
    }}>Sil</Tus>
  );
}
