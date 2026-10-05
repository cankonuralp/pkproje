"use client";
/* SON İMZA — indir, imzala, yükle (317; maket raporlar.html imza penceresi "İndir, imzala, yükle"; karar 99 her rapor ayrı PDF): yazanın onaylanmış
   raporunda 1) İmzala → kesin imzasız PDF sunucuda bir kez üretilir, 2) indirilir, e-imza aracıyla imzalanır, 3) imzalı PDF yüklenir. Sunucu
   imzalı PDF'in ilk baytlarının hazırlanan PDF'in kendisi olduğuna ve imza taşıdığına bakar; tutarsa rapor Tamamlandı, müşteriye açılır.
   Tamamlanan raporda imzalı PDF. Mobil imza ve imza aracı sonraki fazda. Yetki ve kural sunucuda. */
import { useRef, type TransitionStartFunction } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { DosyaAcTusu } from "../../../components/gizli-resim/GizliResim";
import { Serit } from "../../../components/serit/Serit";
import { Tus, tusSinifi } from "../../../components/tus/Tus";
import type { SahaRaporu } from "../server/raporlar";
import { imzaHazirlaEylemi, imzaliYukleEylemi } from "./eylemler";
import stil from "./raporlar.module.css";

const TR = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function ImzaBolumu({ v, mesgul, baslat, yenile, hata }: {
  v: SahaRaporu; mesgul: boolean; baslat: TransitionStartFunction; yenile: () => void; hata: (m: string | null) => void;
}) {
  const bildir = useBildir();
  const girdi = useRef<HTMLInputElement>(null);
  if (v.imzali) {
    return (
      <Serit tur="onay" ikon="circle-check" eylem={<DosyaAcTusu dosyaId={v.imzali.dosya} ikon="file-check">İmzalı PDF</DosyaAcTusu>}>
        Tamamlandı · son imza {TR.format(new Date(v.imzali.zaman)).replace(",", "")} · müşteriye açık
      </Serit>
    );
  }
  if (!v.imza) return null;
  /* bağlantı ya da sunucu hatası (ör. gövde sınırı) bütün ekranı düşürmez: şeritte */
  const AG = "Bağlantı ya da sunucu hatası; yeniden deneyin.";
  const hazirla = () => baslat(async () => {
    try {
      const r = await imzaHazirlaEylemi(v.id);
      if (r.tamam) { hata(null); bildir(r.bildirim ?? "İmzasız PDF hazır."); yenile(); } else hata(r.genel ?? "İmzasız PDF hazırlanamadı.");
    } catch { hata(AG); }
  });
  const yukle = (dosya: File) => baslat(async () => {
    const f = new FormData();
    f.set("id", v.id); f.set("surum", String(v.surum)); f.set("dosya", dosya);
    try {
      const r = await imzaliYukleEylemi(f);
      if (r.tamam) { hata(null); bildir(r.bildirim ?? "Rapor imzalandı."); yenile(); window.scrollTo({ top: 0 }); } else hata(r.hatalar?.dosya ?? r.genel ?? "İmzalı PDF yüklenemedi.");
    } catch { hata(AG); } finally { if (girdi.current) girdi.current.value = ""; }
  });
  return (
    <Serit tur="uyari" ikon="file-signature" eylem={v.imza.pdf ? <>
      <DosyaAcTusu dosyaId={v.imza.pdf} ikon="download" indir>İmzasız PDF&apos;i indir</DosyaAcTusu>
      <label className={`${tusSinifi("birincil")} ${stil.fotoEkle}`} aria-disabled={mesgul || undefined}>
        <input ref={girdi} type="file" accept="application/pdf" className="gizli" disabled={mesgul} aria-label="İmzalı PDF'i yükle"
          onChange={(e) => { const d = e.target.files?.[0]; if (d) yukle(d); }} />
        İmzalı PDF&apos;i yükle
      </label>
    </> : <Tus ikon="file-signature" disabled={mesgul} onClick={hazirla}>İmzala</Tus>}>
      {v.imza.pdf
        ? <>Muayene uzmanı imzası · imzasız PDF&apos;i indirin, e-imza aracınızla imzalayın, imzalı PDF&apos;i yükleyin. Her rapor ayrı imzalanır.</>
        : <>Muayene uzmanı imzası · imzanız bekleniyor.</>}
    </Serit>
  );
}
