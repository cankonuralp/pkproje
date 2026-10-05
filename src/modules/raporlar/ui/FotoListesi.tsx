"use client";
/* SAHA RAPORU · FOTOĞRAFLAR (312; maket fotoMenu / fotolar / fotoSil; pkproje §3.8-5 "fotoğraf en az 1", O2 "Uygun değil maddenin fotoğrafı Kusur
   açıklamalarına düşer", AA9 maddede fotoğraf kural açıksa zorunlu): fotoğraf bölümünde ya da "Uygun değil" maddede liste + "Fotoğraf ekle"
   (kamera ya da galeri). Ekranda küçük resim yok: ad · Görüntüle · İndir · Sil (maket). Yüklemeden önce cihazda 1600 px JPEG'e küçültülür;
   tür, boyut, EXIF silme ve yetki sunucuda. Yazma üst ekranın işleminde (SahaRaporu: o sürerken Kaydet / Onaya gönder kapalı). */
import { useRef, type TransitionStartFunction } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { fotografiKucult } from "../../../components/foto/kucult";
import { DosyaAcTusu } from "../../../components/gizli-resim/GizliResim";
import { useOnayla } from "../../../components/pencere/Onay";
import { Tus, tusSinifi } from "../../../components/tus/Tus";
import type { SahaRaporu } from "../server/raporlar";
import { alanId } from "./Bloklar";
import { fotoEkleEylemi, fotoSilEylemi } from "./eylemler";
import stil from "./raporlar.module.css";

export function FotoListesi({ v, bolumId, madde, oku, gecersiz, mesgul, baslat, yenile }: {
  v: SahaRaporu; bolumId: string; madde: string | null; oku: boolean; gecersiz: boolean; mesgul: boolean;
  baslat: TransitionStartFunction; yenile: () => void;
}) {
  const bildir = useBildir();
  const onayla = useOnayla();
  const girdi = useRef<HTMLInputElement>(null);
  const liste = v.fotolar.filter((f) => f.bolum === bolumId && (madde ? f.madde === madde : !f.madde));
  const id = alanId(madde ? `${madde}.foto` : bolumId);

  const yukle = (dosya: File) => baslat(async () => {
    const f = new FormData();
    f.set("id", v.id); f.set("surum", String(v.surum)); f.set("bolum", bolumId); if (madde) f.set("madde", madde);
    f.set("dosya", await fotografiKucult(dosya));
    const r = await fotoEkleEylemi(f);
    if (girdi.current) girdi.current.value = "";
    bildir(r.tamam ? r.bildirim ?? "Fotoğraf eklendi." : r.hatalar?.foto ?? r.genel ?? "Fotoğraf eklenemedi.");
    if (r.tamam) yenile();
  });
  const sil = async (dosya: string, ad: string) => {
    if (!(await onayla({ baslik: "Fotoğrafı sil", metin: `${ad} rapordan çıkarılır.`, tus: "Sil", tehlike: true }))) return;
    baslat(async () => {
      const r = await fotoSilEylemi(v.id, v.surum, dosya);
      bildir(r.tamam ? r.bildirim ?? "Fotoğraf silindi." : r.genel ?? "Fotoğraf silinemedi.");
      if (r.tamam) yenile();
    });
  };

  return (
    <div className={gecersiz ? `${stil.fotolar} ${stil.gecersiz}` : stil.fotolar} id={id} tabIndex={-1}>
      {liste.length > 0 ? (
        <ul className={stil.fotoListe}>
          {liste.map((f) => (
            <li key={f.dosya}>
              <span className={stil.fotoAd}>{f.ad}</span>
              <span className={stil.fotoTuslar}>
                <DosyaAcTusu dosyaId={f.dosya}>Görüntüle</DosyaAcTusu>
                <DosyaAcTusu dosyaId={f.dosya} ikon="download" indir>İndir</DosyaAcTusu>
                {!oku && <Tus tur="ikincil" ikon="trash-2" disabled={mesgul} aria-label={`${f.ad} sil`} onClick={() => sil(f.dosya, f.ad)}>Sil</Tus>}
              </span>
            </li>
          ))}
        </ul>
      ) : <p className={stil.bosSatir}>{madde ? "Fotoğraf yok." : "Fotoğraf eklenmedi."}</p>}
      {!oku && (
        <label className={`${tusSinifi("ikincil")} ${stil.fotoEkle}`} aria-disabled={mesgul || undefined}>
          <input ref={girdi} type="file" accept="image/jpeg,image/png" className="gizli" disabled={mesgul}
            aria-label={madde ? "Maddeye fotoğraf ekle" : "Fotoğraf ekle"} onChange={(e) => { const d = e.target.files?.[0]; if (d) yukle(d); }} />
          Fotoğraf ekle
        </label>
      )}
    </div>
  );
}
