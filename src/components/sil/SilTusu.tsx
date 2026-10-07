"use client";
/* SİL TUŞU — tek üretici (357; reisim 2026-10-07): yalnız KESİN silmede "Sil" (kayıt saklanıyorsa "Kaldır", geri alınabiliyorsa "Pasife al" — ayrı
   işlemler). Çağıran yalnız silebilen kişiye (yönetici) ve hiç kullanılmamış kayda çizer (ANAYASA 7.4: yapamayacağı tuş görünmez). Onay penceresi
   tehlike türünde, odak "Vazgeç"te: "<ad> kalıcı olarak silinir[; yan etki]. Geri alınamaz." Başarıda "<ad> silindi." ve listeye dönülür; sunucu
   "kullanıldı" derse (bu arada rapora girmiş olabilir) nedeni söylenir. 359: `donus` yoksa sayfa yenilenir (pencere içindeki liste); `kucuk`: liste
   satırında yalnız simge (maket "a-ikon-tus" x; erişilebilir ad "<ad> sil", `erisimAdi` ile maketteki ad). 365: başarıdan sonra odak korunur
   (odak.ts — `odak` seçicisi, yoksa sayfa başlığı). */
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useBildir } from "../bildirim/Bildirim";
import { useOnayla } from "../pencere/Onay";
import { Tus } from "../tus/Tus";
import { odakKoru } from "./odak";

export function SilTusu({ ad, baslik, yanEtki, sil, donus, kucuk = false, ikon, className, erisimAdi, odak }: {
  /** kaydın ekrandaki adı ya da kodu */
  ad: string;
  /** onay penceresinin başlığı ("Ölçüm cihazını sil") */
  baslik: string;
  /** kayıtla birlikte gidenler ("kalibrasyon kayıtları ve sertifikaları da silinir") */
  yanEtki?: string;
  sil: () => Promise<{ tamam?: boolean; genel?: string }>;
  /** silinince dönülecek liste (yoksa sayfa yenilenir) */
  donus?: string;
  /** yalnız simge (liste satırı) */
  kucuk?: boolean;
  /** simge (varsayılan: küçükte "x", büyükte "trash-2") ve satırın tuş sınıfı */
  ikon?: string;
  className?: string;
  /** küçük tuşun erişilebilir adı (varsayılan "<ad> sil") */
  erisimAdi?: string;
  /** silindikten sonra odaklanacak öğe (seçici; verilmezse sayfa başlığı) */
  odak?: string;
}) {
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const [bekliyor, baslat] = useTransition();
  return (
    <Tus tur="ikincil" ikon={ikon ?? (kucuk ? "x" : "trash-2")} className={className} title={kucuk ? "Sil" : undefined} aria-label={kucuk ? erisimAdi ?? `${ad} sil` : undefined} disabled={bekliyor} aria-busy={bekliyor || undefined} onClick={async () => {
      if (!(await onayla({ baslik, metin: `${ad} kalıcı olarak silinir${yanEtki ? `; ${yanEtki}` : ""}. Geri alınamaz.`, tus: "Sil", tehlike: true }))) return;
      baslat(async () => {
        const r = await sil();
        if (r.tamam) { bildir(`${ad} silindi.`); if (donus) router.push(donus); else router.refresh(); odakKoru(odak); return; }
        bildir(r.genel ?? "Silinemedi.");
        router.refresh();
      });
    }}>{kucuk ? <span className="gizli">Sil</span> : "Sil"}</Tus>
  );
}
