"use client";
/* Tür sayfasının işlem tuşları (maket: Düzenle · Rapor formatı yükle / Yeni format yükle · sürüm Kaldır). Pencere yalnız açıkken çizilir.
   Tuşlar yalnız "değiştirir" düzeyine çizilir; karar yine sunucuda. Format kurucu K4'te. 361: Sil — yalnız yöneticiye ve hiç kullanılmamış türe. */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { useOnayla } from "../../../components/pencere/Onay";
import { SilTusu } from "../../../components/sil/SilTusu";
import { Tus } from "../../../components/tus/Tus";
import { formatKaldirEylemi, turSilEylemi } from "./eylemler";
import { FormatPenceresi, TurPenceresi, type TurDegeri } from "./Pencereler";

export function TurTuslari({ tur, kullanimda, sil = false }: { tur: TurDegeri; kullanimda: number | null; sil?: boolean }) {
  const [p, setP] = useState<null | "duzenle" | "format">(null);
  return (
    <>
      <Tus tur="ikincil" ikon="pencil" onClick={() => setP("duzenle")}>Düzenle</Tus>
      <Tus ikon="file-plus" onClick={() => setP("format")}>{kullanimda ? "Yeni format yükle" : "Rapor formatı yükle"}</Tus>
      {sil && <SilTusu ad={`${tur.kod} · ${tur.ad}`} baslik="Ekipman türünü sil" yanEtki="rapor formatı, yüklenen PDF'ler ve fiyatı da silinir, kodu yeniden kullanılabilir"
        sil={() => turSilEylemi(tur.id)} donus={tur.brans === "e" ? "/ekipman-turleri?brans=e" : "/ekipman-turleri"} />}
      {p === "duzenle" && <TurPenceresi kapat={() => setP(null)} tur={tur} />}
      {p === "format" && <FormatPenceresi kapat={() => setP(null)} turId={tur.id} turAd={tur.ad} kod={tur.kod} kullanimda={kullanimda} />}
    </>
  );
}

export function FormatKaldirTusu({ id, surum, sira }: { id: string; surum: number; sira: number }) {
  const router = useRouter();
  const bildir = useBildir();
  const onayla = useOnayla();
  const [bekliyor, baslat] = useTransition();
  return (
    <Tus tur="ikincil" ikon="x" disabled={bekliyor} onClick={async () => {
      if (!(await onayla({ baslik: `Sürüm ${sira} kaldırılsın mı?`, metin: "Bu sürümle açılmış raporlar etkilenmez. Kullanımdaki sürüm kaldırılırsa bir önceki sürüm kullanıma girer.", tus: "Kaldır" }))) return;
      baslat(async () => { const r = await formatKaldirEylemi(id, surum); bildir(r.tamam ? `Sürüm ${sira} kaldırıldı.` : r.genel ?? "Kaldırılamadı."); router.refresh(); });
    }}>Kaldır</Tus>
  );
}
