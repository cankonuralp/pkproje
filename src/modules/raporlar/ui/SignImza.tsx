"use client";
/* PROBATA SIGN İMZA ŞERİDİ (2026-11-05, göç 0122; tasarım 59EF1ZZAJZdg6BztvuiWbr — rapor ekranı 3): firmada probata sign açıkken imza buradan başlar.
   · İmzala → sign'ın imza ekranı yeni sekmede (sekme tıklama anında açılır, bağlantı gelince yönlenir — açılır pencere engeline takılmaz).
   · Bekliyor → İmza ekranını aç · Durumu yenile · İptal et. sign webhook'u gelince rapor kendiliğinden ilerler; gecikirse "Durumu yenile".
   · Reddedildi / iptal / denetimden geçmedi → nedeni şeritte, "İmzala" yeniden.
   · K2: "PDF ile imzala" yedek yolu (bugünkü indir / yükle) — elle verilirse görünür. Muayene uzmanı (uzman) ve teknik yönetici (teknik) aynı şerit. */
import type { TransitionStartFunction } from "react";
import { useBildir } from "../../../components/bildirim/Bildirim";
import { Serit } from "../../../components/serit/Serit";
import { Tus } from "../../../components/tus/Tus";
import type { SignEkrani } from "../server/sign";
import { signImzalaEylemi, signIptalEylemi, signYenileEylemi } from "./eylemler";

const AG = "Bağlantı ya da sunucu hatası; yeniden deneyin.";

export function SignImzaSeridi({ raporId, asama, sign, baslik, mesgul, baslat, yenile, hata, elle }: {
  raporId: string; asama: "uzman" | "teknik"; sign: SignEkrani; baslik: string; mesgul: boolean; baslat: TransitionStartFunction;
  yenile: () => void; hata: (m: string | null) => void; elle?: () => void;
}) {
  const bildir = useBildir();
  const imzala = () => {
    /* sekme tıklama anında açılır (sonradan açılan sekmeyi tarayıcı engeller); bağlantı gelince oraya gider */
    const sekme = window.open("about:blank", "_blank");
    baslat(async () => {
      try {
        const r = await signImzalaEylemi(raporId, asama);
        if (r.tamam && r.baglanti) {
          hata(null);
          if (sekme) { sekme.opener = null; sekme.location.href = r.baglanti; } else window.location.assign(r.baglanti);
          if (r.bildirim) bildir(r.bildirim);
          yenile();
        } else { sekme?.close(); hata(r.genel ?? "probata sign'da imza başlatılamadı."); }
      } catch { sekme?.close(); hata(AG); }
    });
  };
  const yenileSor = () => baslat(async () => {
    try {
      const r = await signYenileEylemi(raporId, asama);
      if (r.tamam) { hata(null); bildir(r.bildirim ?? "Güncellendi."); yenile(); } else { hata(r.genel ?? "Durum alınamadı."); yenile(); }
    } catch { hata(AG); }
  });
  const iptal = () => baslat(async () => {
    try {
      const r = await signIptalEylemi(raporId, asama);
      if (r.tamam) { hata(null); bildir(r.bildirim ?? "İptal edildi."); yenile(); } else hata(r.genel ?? "İptal edilemedi.");
    } catch { hata(AG); }
  });
  if (sign.durum === "bekliyor") {
    return (
      <Serit tur="bilgi" ikon="clock" eylem={<>
        <Tus ikon="file-signature" disabled={mesgul} onClick={imzala}>İmza ekranını aç</Tus>
        <Tus tur="ikincil" ikon="refresh-cw" disabled={mesgul} onClick={yenileSor}>Durumu yenile</Tus>
        <Tus tur="ikincil" ikon="circle-x" disabled={mesgul} onClick={iptal}>İptal et</Tus>
      </>}>
        {baslik} · probata sign&apos;da imza bekliyor
      </Serit>
    );
  }
  return (
    <Serit tur="uyari" ikon="file-signature" eylem={<>
      <Tus ikon="file-signature" disabled={mesgul} onClick={imzala}>İmzala</Tus>
      {elle && <Tus tur="ikincil" disabled={mesgul} onClick={elle}>PDF ile imzala</Tus>}
    </>}>
      {baslik} · probata sign · e-imza{sign.neden ? <> · {sign.neden}</> : null}
    </Serit>
  );
}
